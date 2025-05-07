import requests
from requests.auth import HTTPBasicAuth
from fastapi.responses import Response
from fastapi import FastAPI, Depends, File, UploadFile, Form
from scripts.migrate_to_fuseki import migrate_to_fuseki
from fastapi.responses import JSONResponse
from database import engine, Base
from models import Dataset as Catalog
from sqlalchemy.orm import Session
from datetime import datetime
from triplestore import generate_dcat_dataset_ttl, insert_dataset_rdf, append_to_catalog_graph, delete_named_graph, remove_from_catalog_graph
from database import SessionLocal
import uuid
from fastapi import HTTPException
from crud import (
    get_datasets, create_dataset, get_catalogs, create_catalog, 
    delete_dataset, delete_catalog, update_dataset, get_dataset_count
)
from schemas import (
    Dataset, DatasetCreate, Catalog, CatalogCreate
)
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

Base.metadata.create_all(bind=engine)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Hello, DCAT-Compliant Data Catalog!"}

# Datasets
@app.get("/datasets", response_model=list[Dataset])
def read_datasets(skip: int = 0, limit: int = 10, db: Session = Depends(get_db)):
    return get_datasets(db, skip=skip, limit=limit)

@app.post("/datasets", response_model=Dataset)
def create_dataset_entry(
    title: str = Form(...),
    description: str = Form(...),
    identifier: str = Form(default_factory=lambda: str(uuid.uuid4())),
    issued: datetime = Form(...),
    modified: datetime = Form(...),
    publisher: str = Form(...),
    contact_point: str = Form(...),
    is_public: bool = Form(...),
    access_url_dataset: str = Form(...),
    access_url_semantic_model: str = Form(...),
    file_format: str = Form(...),
    theme: str = Form(...),
    catalog_id: int = Form(...),
    webid: str = Form(...),
    db: Session = Depends(get_db)
):
    try:
        response = requests.get(access_url_semantic_model)
        response.raise_for_status()
        file_content = response.content
        file_name = access_url_semantic_model.split("/")[-1]
    except Exception as e:
        return JSONResponse(
            status_code=400,
            content={"error": f"Failed to fetch semantic model from pod: {str(e)}"}
        )

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
        dataset_uri = f"https://catalog.gesundes-tal.de/id/{identifier}"
        insert_dataset_rdf(ttl_data.encode("utf-8"), graph_uri=dataset_uri)
        append_to_catalog_graph(dataset_uri)
    except Exception as e:
        print(f"Warning: Failed to insert RDF to Fuseki: {e}")

    return saved_dataset

@app.put("/datasets/{identifier}", response_model=Dataset)
def update_dataset_entry(
    identifier: str,
    title: str = Form(...),
    description: str = Form(...),
    issued: datetime = Form(...),
    modified: datetime = Form(...),
    publisher: str = Form(...),
    contact_point: str = Form(...),
    is_public: bool = True,
    access_url_dataset: str = Form(...),
    access_url_semantic_model: str = Form(...),
    file_format: str = Form(...),
    theme: str = Form(...),
    catalog_id: int = Form(...),
    semantic_model_file: UploadFile = File(None),
    db: Session = Depends(get_db)
):
    # Datei auslesen
    file_content = semantic_model_file.file.read() if semantic_model_file else None
    file_name = semantic_model_file.filename if semantic_model_file else None

    # Neues Dataset-Objekt erzeugen
    dataset_data = DatasetCreate(
        title=title,
        description=description,
        identifier=identifier,
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
        semantic_model_file_name=file_name
    )

    updated = update_dataset(db, identifier, dataset_data)

    dataset_uri = f"https://catalog.gesundes-tal.de/id/{identifier}"
    try:
        ttl_data = generate_dcat_dataset_ttl(dataset_data.model_dump())
        delete_named_graph(dataset_uri)
        insert_dataset_rdf(ttl_data.encode("utf-8"), graph_uri=dataset_uri)
    except Exception as e:
        print(f"Fehler beim Aktualisieren im Triple Store: {e}")

    return updated

@app.delete("/datasets/{identifier}")
def delete_dataset_entry(identifier: str, db: Session = Depends(get_db)):
    deleted = delete_dataset(db, identifier)

    dataset_uri = f"https://catalog.gesundes-tal.de/id/{identifier}"

    try:
        delete_named_graph(dataset_uri)
        remove_from_catalog_graph(dataset_uri)
    except Exception as e:
        print(f"Fehler beim Entfernen aus dem Triple Store: {e}")

    return deleted

@app.get("/datasets/count")
def get_dataset_count_endpoint(db: Session = Depends(get_db)):
    count = get_dataset_count(db)
    return {"count": count}

# Catalogs
@app.get("/catalogs", response_model=list[Catalog])
def read_catalogs(skip: int = 0, limit: int = 10, db: Session = Depends(get_db)):
    return get_catalogs(db, skip=skip, limit=limit)

@app.post("/catalogs", response_model=Catalog)
def create_catalog_entry(catalog: CatalogCreate, db: Session = Depends(get_db)):
    return create_catalog(db, catalog)

@app.delete("/catalogs/{catalog_id}")
def delete_catalog_entry(catalog_id: int, db: Session = Depends(get_db)):
    return delete_catalog(db, catalog_id)

@app.get("/download/semantic_data_catalog", response_class=Response)
def download_triple_store():
    sparql_url = "http://fuseki:3030/semantic_data_catalog/sparql"
    query = "CONSTRUCT { ?s ?p ?o } WHERE { ?s ?p ?o }"
    headers = {"Accept": "text/turtle"}
    auth = HTTPBasicAuth("admin", "admin")

    res = requests.post(
        sparql_url,
        data={"query": query},
        headers=headers,
        auth=auth
    )

    if res.status_code in [200, 204]:
        return Response(
            content=res.text,
            media_type="text/turtle",
            headers={"Content-Disposition": "attachment; filename=semantic_data_catalog.ttl"}
        )
    else:
        raise HTTPException(status_code=500, detail="Fuseki-Abfrage fehlgeschlagen")

@app.get("/export/catalog")
def export_catalog():
    try:
        # 1. Migrieren
        migrate_to_fuseki()

        # 2. Daten aus Fuseki abholen
        sparql_url = "http://fuseki:3030/semantic_data_catalog/sparql"
        query = "CONSTRUCT { ?s ?p ?o } WHERE { ?s ?p ?o }"
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
            raise HTTPException(status_code=500, detail="Fehler beim Lesen aus Fuseki")

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))