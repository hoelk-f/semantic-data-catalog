import requests
import os
import smtplib
from requests.auth import HTTPBasicAuth
from fastapi import FastAPI, Depends, File, UploadFile, Form, HTTPException, Request
from fastapi.responses import Response
from database import engine, Base
from models import Dataset, Catalog
from sqlalchemy.orm import Session
from datetime import datetime
from typing import Optional
from triplestore import generate_dcat_dataset_ttl, insert_dataset_rdf, append_to_catalog_graph, delete_named_graph, remove_from_catalog_graph
from database import SessionLocal
import uuid
from crud import (
    get_datasets, create_dataset, get_catalogs, create_catalog,
    delete_dataset, delete_catalog, update_dataset, get_dataset_count,
    get_dataset_by_identifier,
)
from schemas import (
    Dataset as DatasetSchema,
    DatasetCreate,
    DatasetUpdate,
    Catalog as CatalogSchema,
    CatalogCreate,
)
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI()


class AccessRequest(BaseModel):
    webid: str
    message: Optional[str] = None


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

Base.metadata.create_all(bind=engine)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api")
def read_root():
    return {"message": "Hello, you are using the Semantic Data Catalog."}

@app.get("/api/datasets", response_model=list[DatasetSchema])
def read_datasets(skip: int = 0, limit: int = 10, db: Session = Depends(get_db)):
    return get_datasets(db, skip=skip, limit=limit)

@app.post("/api/datasets", response_model=DatasetSchema)
def create_dataset_entry(
    request: Request,
    title: str = Form(...),
    description: str = Form(...),
    identifier: str = Form(default_factory=lambda: str(uuid.uuid4())),
    issued: datetime = Form(...),
    modified: datetime = Form(...),
    publisher: str = Form(...),
    contact_point: str = Form(...),
    is_public: bool = Form(True),
    access_url_dataset: str = Form(...),
    access_url_semantic_model: Optional[str] = Form(None),
    file_format: str = Form(...),
    theme: str = Form(...),
    catalog_id: int = Form(...),
    webid: str = Form(...),
    semantic_model_file: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db)
):
    file_content = None
    file_name = None

    if semantic_model_file is not None:
        file_content = semantic_model_file.file.read()
        file_name = semantic_model_file.filename
    elif access_url_semantic_model:
        from urllib.parse import urlparse

        parsed_url = urlparse(access_url_semantic_model)
        if parsed_url.scheme not in {"http", "https"}:
            raise HTTPException(status_code=400, detail="Invalid URL scheme for semantic model")

        allowed_hosts_env = os.getenv("SEMANTIC_MODEL_HOST_ALLOWLIST", "")
        allowed_hosts = [h.strip() for h in allowed_hosts_env.split(",") if h.strip()]
        if allowed_hosts and parsed_url.hostname not in allowed_hosts:
            raise HTTPException(status_code=400, detail="Host not allowed for semantic model")

        headers = {h: request.headers[h] for h in ["Authorization", "DPoP"] if h in request.headers}

        try:
            response = requests.get(access_url_semantic_model, headers=headers)
            response.raise_for_status()
        except (requests.exceptions.MissingSchema, requests.exceptions.InvalidURL) as e:
            raise HTTPException(status_code=400, detail=f"Invalid URL for semantic model: {e}") from e
        except requests.exceptions.HTTPError as e:
            status = e.response.status_code if e.response else 502
            detail = e.response.text if e.response else str(e)
            if 400 <= status < 500:
                raise HTTPException(status_code=status, detail=f"Client error fetching semantic model: {detail}") from e
            raise HTTPException(status_code=502, detail=f"Server error fetching semantic model: {detail}") from e
        except requests.exceptions.RequestException as e:
            raise HTTPException(status_code=502, detail=f"Error fetching semantic model: {e}") from e

        file_content = response.content
        file_name = os.path.basename(parsed_url.path)
    else:
        raise HTTPException(status_code=400, detail="Semantic model file or URL must be provided")

    dataset_data = DatasetCreate(
        identifier=identifier,
        title=title,
        description=description,
        issued=issued,
        modified=modified,
        publisher=publisher,
        contact_point=contact_point,
        is_public=is_public,
        access_url_dataset=access_url_dataset,
        access_url_semantic_model=access_url_semantic_model,
        file_format=file_format,
        theme=theme,
        catalog_id=catalog_id,
        semantic_model_file=file_content,
        semantic_model_file_name=file_name,
        webid=webid,
    )

    saved_dataset = create_dataset(db, dataset_data)

    try:
        ttl_data = generate_dcat_dataset_ttl(dataset_data.model_dump())
        BASE_URI = os.getenv("BASE_URI", "https://semantic-data-catalog.com")
        dataset_uri = f"{BASE_URI}/id/{identifier}"
        insert_dataset_rdf(ttl_data.encode("utf-8"), graph_uri=dataset_uri)
        append_to_catalog_graph(dataset_uri)
    except Exception as e:
        print(f"Warning: Failed to insert RDF to Fuseki: {e}")

    return saved_dataset

@app.put("/api/datasets/{identifier}", response_model=DatasetSchema)
def update_dataset_entry(
    identifier: str,
    title: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    issued: Optional[datetime] = Form(None),
    modified: Optional[datetime] = Form(None),
    is_public: Optional[bool] = Form(None),
    access_url_dataset: Optional[str] = Form(None),
    access_url_semantic_model: Optional[str] = Form(None),
    file_format: Optional[str] = Form(None),
    theme: Optional[str] = Form(None),
    new_identifier: Optional[str] = Form(None),
    semantic_model_file: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
):
    file_content = semantic_model_file.file.read() if semantic_model_file else None
    file_name = semantic_model_file.filename if semantic_model_file else None

    dataset_data = DatasetUpdate(
        title=title,
        description=description,
        identifier=new_identifier,
        issued=issued,
        modified=modified,
        is_public=is_public,
        access_url_dataset=access_url_dataset,
        access_url_semantic_model=access_url_semantic_model,
        file_format=file_format,
        theme=theme,
        semantic_model_file=file_content,
        semantic_model_file_name=file_name,
    )

    updated = update_dataset(db, identifier, dataset_data)

    BASE_URI = os.getenv("BASE_URI", "https://semantic-data-catalog.com")
    old_dataset_uri = f"{BASE_URI}/id/{identifier}"
    new_dataset_uri = f"{BASE_URI}/id/{updated.identifier}" if updated else old_dataset_uri
    try:
        ttl_data = generate_dcat_dataset_ttl(
            Dataset.model_validate(updated).model_dump()
        )
        delete_named_graph(old_dataset_uri)
        insert_dataset_rdf(ttl_data.encode("utf-8"), graph_uri=new_dataset_uri)
    except Exception as e:
        print(f"Error while updating in the triple store: {e}")

    return updated

@app.delete("/api/datasets/{identifier}")
def delete_dataset_entry(identifier: str, db: Session = Depends(get_db)):
    deleted = delete_dataset(db, identifier)

    BASE_URI = os.getenv("BASE_URI", "https://semantic-data-catalog.com")
    dataset_uri = f"{BASE_URI}/id/{identifier}"

    try:
        delete_named_graph(dataset_uri)
        remove_from_catalog_graph(dataset_uri)
    except Exception as e:
        print(f"Error while removing from the triple store: {e}")

    return deleted

@app.get("/api/datasets/count")
def get_dataset_count_endpoint(db: Session = Depends(get_db)):
    count = get_dataset_count(db)
    return {"count": count}


@app.post("/api/datasets/{identifier}/request-access")
def request_dataset_access(identifier: str, payload: AccessRequest, db: Session = Depends(get_db)):
    dataset = get_dataset_by_identifier(db, identifier)
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")

    smtp_host = os.getenv("SMTP_HOST")
    smtp_port = int(os.getenv("SMTP_PORT", "0"))
    smtp_user = os.getenv("SMTP_USER")
    smtp_pass = os.getenv("SMTP_PASS")
    email_from = os.getenv("EMAIL_FROM")

    print(
        f"SMTP_HOST={smtp_host}, SMTP_PORT={smtp_port}, EMAIL_FROM={email_from}, CONTACT_POINT={dataset.contact_point}"
    )

    if not smtp_host or not smtp_port or not email_from:
        print("SMTP configuration missing; skipping email dispatch")
        return {"detail": "Request logged; email not sent"}

    subject = f"Zugriffsanfrage für {dataset.title}"
    body = (
        f"Der Nutzer mit WebID {payload.webid} bittet um Zugriff auf {dataset.title} ({identifier})."
    )
    if payload.message:
        body += f"\n\nNachricht des Nutzers:\n{payload.message}"
    message = f"Subject: {subject}\nFrom: {email_from}\nTo: {dataset.contact_point}\n\n{body}"

    try:
        with smtplib.SMTP(smtp_host, smtp_port) as server:
            server.starttls()
            if smtp_user and smtp_pass:
                server.login(smtp_user, smtp_pass)
            server.sendmail(email_from, [dataset.contact_point], message)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to send email: {e}")

    return {"detail": "Request sent"}

@app.get("/api/catalogs", response_model=list[CatalogSchema])
def read_catalogs(skip: int = 0, limit: int = 10, db: Session = Depends(get_db)):
    return get_catalogs(db, skip=skip, limit=limit)

@app.post("/api/catalogs", response_model=CatalogSchema)
def create_catalog_entry(catalog: CatalogCreate, db: Session = Depends(get_db)):
    return create_catalog(db, catalog)

@app.delete("/api/catalogs/{catalog_id}")
def delete_catalog_entry(catalog_id: int, db: Session = Depends(get_db)):
    return delete_catalog(db, catalog_id)

@app.get("/api/export/catalog")
def export_catalog():
    try:
        sparql_url = "http://fuseki:3030/semantic_data_catalog/sparql"
        query = "CONSTRUCT { ?s ?p ?o } WHERE { GRAPH ?g { ?s ?p ?o } }"
        headers = {"Accept": "text/turtle"}
        auth = HTTPBasicAuth("admin", "admin")

        res = requests.post(sparql_url, data={"query": query}, headers=headers, auth=auth)

        if res.status_code in [200, 204]:
            return Response(
                content=res.text,
                media_type="text/turtle",
                headers={"Content-Disposition": "attachment; filename=semantic_data_catalog.ttl"}
            )
        else:
            raise HTTPException(status_code=500, detail="Error while reading from Fuseki")

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
