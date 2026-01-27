import os
import requests
import uuid
from datetime import datetime
from typing import Optional
from requests.auth import HTTPBasicAuth
from fastapi import FastAPI, File, UploadFile, Form, HTTPException, Request
from fastapi.responses import Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from schemas import (
    Dataset as DatasetSchema,
    DatasetCreate,
    DatasetUpdate,
    Catalog as CatalogSchema,
    CatalogCreate,
)
from triplestore import (
    generate_dcat_dataset_ttl,
    insert_dataset_rdf,
    append_to_catalog_graph,
    delete_named_graph,
    remove_from_catalog_graph,
)
from shacl_validation import validate_turtle

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class AccessRequest(BaseModel):
    webid: str
    name: str
    email: str
    message: Optional[str] = None


DATASETS: dict[str, dict] = {}
CATALOGS: list[dict] = []
NEXT_CATALOG_ID = 1


def _dataset_response(dataset: dict) -> DatasetSchema:
    payload = dict(dataset)
    payload["semantic_model_file"] = None
    return DatasetSchema(**payload)


def _catalog_response(catalog: dict) -> CatalogSchema:
    return CatalogSchema(**catalog)


@app.get("/api")
def read_root():
    return {"message": "Hello, you are using the Semantic Data Catalog."}


@app.get("/api/datasets", response_model=list[DatasetSchema])
def read_datasets(skip: int = 0, limit: int = 10):
    skip = max(skip, 0)
    ordered = sorted(DATASETS.values(), key=lambda d: (d.get("title") or "").lower())
    sliced = ordered[skip : skip + limit]
    return [_dataset_response(item) for item in sliced]


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
    catalog_id: Optional[int] = Form(None),
    webid: str = Form(...),
    semantic_model_file: Optional[UploadFile] = File(None),
):
    if identifier in DATASETS:
        raise HTTPException(status_code=409, detail="Dataset identifier already exists.")

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

    try:
        ttl_data = generate_dcat_dataset_ttl(dataset_data.model_dump())
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e

    conforms, results_text = validate_turtle(ttl_data)
    if not conforms:
        raise HTTPException(status_code=422, detail=results_text)

    DATASETS[identifier] = dataset_data.model_dump()

    try:
        BASE_URI = os.getenv("BASE_URI", "https://semantic-data-catalog.com")
        dataset_uri = f"{BASE_URI}/id/{identifier}"
        insert_dataset_rdf(ttl_data.encode("utf-8"), graph_uri=dataset_uri)
        append_to_catalog_graph(dataset_uri)
    except Exception as e:
        print(f"Warning: Failed to insert RDF to Fuseki: {e}")

    return _dataset_response(DATASETS[identifier])


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
):
    existing = DATASETS.get(identifier)
    if not existing:
        raise HTTPException(status_code=404, detail="Dataset not found")

    if new_identifier and new_identifier != identifier and new_identifier in DATASETS:
        raise HTTPException(status_code=409, detail="New dataset identifier already exists.")

    file_content = semantic_model_file.file.read() if semantic_model_file else None
    file_name = semantic_model_file.filename if semantic_model_file else None

    candidate = dict(existing)
    if title is not None:
        candidate["title"] = title
    if description is not None:
        candidate["description"] = description
    if new_identifier is not None:
        candidate["identifier"] = new_identifier
    if issued is not None:
        candidate["issued"] = issued
    if modified is not None:
        candidate["modified"] = datetime.utcnow()
    if is_public is not None:
        candidate["is_public"] = is_public
    if access_url_dataset is not None:
        candidate["access_url_dataset"] = access_url_dataset
    if access_url_semantic_model is not None:
        candidate["access_url_semantic_model"] = access_url_semantic_model
    if file_format is not None:
        candidate["file_format"] = file_format
    if theme is not None:
        candidate["theme"] = theme
    if file_content is not None:
        candidate["semantic_model_file"] = file_content
    if file_name is not None:
        candidate["semantic_model_file_name"] = file_name

    try:
        ttl_data = generate_dcat_dataset_ttl(candidate)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e

    conforms, results_text = validate_turtle(ttl_data)
    if not conforms:
        raise HTTPException(status_code=422, detail=results_text)

    DATASETS.pop(identifier, None)
    DATASETS[candidate["identifier"]] = candidate

    BASE_URI = os.getenv("BASE_URI", "https://semantic-data-catalog.com")
    old_dataset_uri = f"{BASE_URI}/id/{identifier}"
    new_dataset_uri = f"{BASE_URI}/id/{candidate['identifier']}"
    try:
        delete_named_graph(old_dataset_uri)
        insert_dataset_rdf(ttl_data.encode("utf-8"), graph_uri=new_dataset_uri)
    except Exception as e:
        print(f"Error while updating in the triple store: {e}")

    return _dataset_response(DATASETS[candidate["identifier"]])


@app.delete("/api/datasets/{identifier}")
def delete_dataset_entry(identifier: str):
    deleted = DATASETS.pop(identifier, None)
    if not deleted:
        raise HTTPException(status_code=404, detail="Dataset not found")

    BASE_URI = os.getenv("BASE_URI", "https://semantic-data-catalog.com")
    dataset_uri = f"{BASE_URI}/id/{identifier}"

    try:
        delete_named_graph(dataset_uri)
        remove_from_catalog_graph(dataset_uri)
    except Exception as e:
        print(f"Error while removing from the triple store: {e}")

    return _dataset_response(deleted)


@app.get("/api/datasets/count")
def get_dataset_count_endpoint():
    return {"count": len(DATASETS)}


@app.post("/api/datasets/{identifier}/request-access")
def request_dataset_access(identifier: str, payload: AccessRequest):
    if identifier not in DATASETS:
        raise HTTPException(status_code=404, detail="Dataset not found")
    raise HTTPException(
        status_code=410,
        detail="Access requests are handled via Solid inbox notifications in the Solid Dataspace Manager.",
    )


@app.get("/api/catalogs", response_model=list[CatalogSchema])
def read_catalogs(skip: int = 0, limit: int = 10):
    skip = max(skip, 0)
    sliced = CATALOGS[skip : skip + limit]
    return [_catalog_response(item) for item in sliced]


@app.post("/api/catalogs", response_model=CatalogSchema)
def create_catalog_entry(catalog: CatalogCreate):
    global NEXT_CATALOG_ID
    payload = catalog.model_dump()
    payload["id"] = NEXT_CATALOG_ID
    payload["datasets"] = []
    NEXT_CATALOG_ID += 1
    CATALOGS.append(payload)
    return _catalog_response(payload)


@app.delete("/api/catalogs/{catalog_id}")
def delete_catalog_entry(catalog_id: int):
    for idx, item in enumerate(CATALOGS):
        if item["id"] == catalog_id:
            removed = CATALOGS.pop(idx)
            return _catalog_response(removed)
    raise HTTPException(status_code=404, detail="Catalog not found")


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
