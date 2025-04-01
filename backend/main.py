import requests
from fastapi import FastAPI, Depends, File, UploadFile, Form
from fastapi.responses import JSONResponse
from database import engine, Base
from models import Dataset as Agent, Dataspace, Pod, Catalog
from sqlalchemy.orm import Session
from datetime import datetime
from database import SessionLocal
from crud import (
    get_datasets, create_dataset, get_agents, create_agent,
    get_dataspaces, create_dataspace, get_catalogs, create_catalog,
    get_pods, create_pod, delete_dataset, delete_catalog, delete_agent,
    delete_dataspace, delete_pod, update_dataset, get_dataset_count, 
    get_pods_for_dataspace
)
from schemas import (
    Dataset, DatasetCreate, Agent, AgentCreate,
    Dataspace, DataspaceCreate, Catalog, CatalogCreate, Pod, PodCreate
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

# Agents
@app.get("/agents", response_model=list[Agent])
def read_agents(skip: int = 0, limit: int = 10, db: Session = Depends(get_db)):
    return get_agents(db, skip=skip, limit=limit)

@app.post("/agents", response_model=Agent)
def create_agent_entry(agent: AgentCreate, db: Session = Depends(get_db)):
    return create_agent(db, agent)

@app.delete("/agents/{agent_id}")
def delete_agent_entry(agent_id: int, db: Session = Depends(get_db)):
    return delete_agent(db, agent_id)

# Datasets
@app.get("/datasets", response_model=list[Dataset])
def read_datasets(skip: int = 0, limit: int = 10, db: Session = Depends(get_db)):
    return get_datasets(db, skip=skip, limit=limit)

@app.post("/datasets", response_model=Dataset)
def create_dataset_entry(
    title: str = Form(...),
    description: str = Form(...),
    identifier: str = Form(...),
    issued: datetime = Form(...),
    modified: datetime = Form(...),
    publisher_id: int = Form(...),
    contact_point_id: int = Form(...),
    is_public: bool = Form(...),
    access_url_dataset: str = Form(...),
    access_url_semantic_model: str = Form(...),
    file_format: str = Form(...),
    theme: str = Form(...),
    catalog_id: int = Form(...),
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
        title=title,
        description=description,
        identifier=identifier,
        issued=issued,
        modified=modified,
        publisher_id=publisher_id,
        contact_point_id=contact_point_id,
        is_public=is_public,
        access_url_dataset=access_url_dataset,
        access_url_semantic_model=access_url_semantic_model,
        file_format=file_format,
        theme=theme,
        catalog_id=catalog_id,
        semantic_model_file=file_content,
        semantic_model_file_name=file_name
    )

    return create_dataset(db, dataset_data)

@app.put("/datasets/{dataset_id}", response_model=Dataset)
def update_dataset_entry(
    dataset_id: int,
    title: str = Form(...),
    description: str = Form(...),
    identifier: str = Form(...),
    issued: datetime = Form(...),
    modified: datetime = Form(...),
    publisher_id: int = Form(...),
    contact_point_id: int = Form(...),
    is_public: bool = Form(...),
    access_url_dataset: str = Form(...),
    access_url_semantic_model: str = Form(...),
    file_format: str = Form(...),
    theme: str = Form(...),
    catalog_id: int = Form(...),
    semantic_model_file: UploadFile = File(None),
    db: Session = Depends(get_db)
):
    file_content = semantic_model_file.file.read() if semantic_model_file else None
    file_name = semantic_model_file.filename if semantic_model_file else None

    dataset_data = DatasetCreate(
        title=title,
        description=description,
        identifier=identifier,
        issued=issued,
        modified=modified,
        publisher_id=publisher_id,
        contact_point_id=contact_point_id,
        is_public=is_public,
        access_url_dataset=access_url_dataset,
        access_url_semantic_model=access_url_semantic_model,
        file_format=file_format,
        theme=theme,
        catalog_id=catalog_id,
        semantic_model_file=file_content,
        semantic_model_file_name=file_name
    )

    return update_dataset(db, dataset_id, dataset_data)

@app.delete("/datasets/{dataset_id}")
def delete_dataset_entry(dataset_id: int, db: Session = Depends(get_db)):
    return delete_dataset(db, dataset_id)

@app.get("/datasets/count")
def get_dataset_count_endpoint(db: Session = Depends(get_db)):
    count = get_dataset_count(db)
    return {"count": count}

# Dataspaces
@app.get("/dataspaces", response_model=list[Dataspace])
def read_dataspaces(skip: int = 0, limit: int = 10, db: Session = Depends(get_db)):
    return get_dataspaces(db, skip=skip, limit=limit)

@app.post("/dataspaces", response_model=Dataspace)
def create_dataspace_entry(dataspace: DataspaceCreate, db: Session = Depends(get_db)):
    return create_dataspace(db, dataspace)

@app.delete("/dataspaces/{dataspace_id}")
def delete_dataspace_entry(dataspace_id: int, db: Session = Depends(get_db)):
    return delete_dataspace(db, dataspace_id)

@app.get("/dataspaces/{dataspace_id}/pods")
def get_pods_for_dataspace_endpoint(dataspace_id: int, db: Session = Depends(get_db)):
    return get_pods_for_dataspace(db, dataspace_id)

# Pods
@app.get("/pods", response_model=list[Pod])
def read_pods(skip: int = 0, limit: int = 10, db: Session = Depends(get_db)):
    return get_pods(db, skip=skip, limit=limit)

@app.post("/pods", response_model=Pod)
def create_pod_entry(pod: PodCreate, db: Session = Depends(get_db)):
    return create_pod(db, pod)

@app.delete("/pods/{pod_id}")
def delete_pod_entry(pod_id: int, db: Session = Depends(get_db)):
    return delete_pod(db, pod_id)

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
