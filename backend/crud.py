from sqlalchemy.orm import Session
from models import Dataset as DatasetModel, Agent, Dataspace, Catalog
from schemas import DatasetCreate, DatasetUpdate, AgentCreate, DataspaceCreate, CatalogCreate
from datetime import datetime

# CRUD for Agent
def create_agent(db: Session, agent: AgentCreate):
    db_agent = Agent(name=agent.name, email=agent.email, phone_number=agent.phone_number)
    db.add(db_agent)
    db.commit()
    db.refresh(db_agent)
    return db_agent

def get_agent(db: Session, agent_id: int):
    return db.query(Agent).filter(Agent.id == agent_id).first()

def get_agents(db: Session, skip: int = 0, limit: int = 10):
    return db.query(Agent).offset(skip).limit(limit).all()

def delete_agent(db: Session, agent_id: int):
    db_agent = get_agent(db, agent_id)
    if db_agent:
        db.delete(db_agent)
        db.commit()
    return db_agent

# CRUD for Dataset
def create_dataset(db: Session, dataset: DatasetCreate):    
    db_dataset = DatasetModel(
        title=dataset.title,
        description=dataset.description,
        identifier=dataset.identifier,
        issued=dataset.issued,
        modified=dataset.modified,
        publisher_id=dataset.publisher_id,
        contact_point_id=dataset.contact_point_id,
        is_public=dataset.is_public,
        access_url_dataset=dataset.access_url_dataset,
        access_url_semantic_model=dataset.access_url_semantic_model,
        file_format=dataset.file_format,
        theme=dataset.theme,
        semantic_model_file=dataset.semantic_model_file,
        semantic_model_file_name=dataset.semantic_model_file_name,
        catalog_id=dataset.catalog_id,
    )
    db.add(db_dataset)
    db.commit()
    db.refresh(db_dataset)
    return db_dataset

def get_dataset(db: Session, dataset_id: int):
    return db.query(DatasetModel).filter(DatasetModel.id == dataset_id).first()

def get_datasets(db: Session, skip: int = 0, limit: int = 10):
    datasets = db.query(DatasetModel).offset(skip).limit(limit).all()

    for dataset in datasets:
        if dataset.semantic_model_file:
            dataset.semantic_model_file = dataset.semantic_model_file.decode("utf-8")

    return datasets

def get_dataset_count(db: Session) -> int:
    return db.query(DatasetModel).count()

def get_dataset_by_identifier(db: Session, identifier: str):
    return db.query(DatasetModel).filter(DatasetModel.identifier == identifier).first()

def update_dataset(db: Session, dataset_id: int, dataset: DatasetUpdate):
    db_dataset = get_dataset(db, dataset_id)
    if db_dataset:
        if dataset.title is not None:
            db_dataset.title = dataset.title
        if dataset.description is not None:
            db_dataset.description = dataset.description
        if dataset.identifier is not None:
            db_dataset.identifier = dataset.identifier
        if dataset.issued is not None:
            db_dataset.issued = dataset.issued
        if dataset.modified is not None:
            db_dataset.modified = datetime.utcnow()
        if dataset.is_public is not None:
            db_dataset.is_public = dataset.is_public
        if dataset.access_url_dataset is not None:
            db_dataset.access_url_dataset = dataset.access_url_dataset
        if dataset.access_url_semantic_model is not None:
            db_dataset.access_url_semantic_model = dataset.access_url_semantic_model
        if dataset.file_format is not None:
            db_dataset.file_format = dataset.file_format
        if dataset.theme is not None:
            db_dataset.theme = dataset.theme
        if dataset.semantic_model_file is not None:
            db_dataset.semantic_model_file = dataset.semantic_model_file
        if dataset.semantic_model_file_name is not None:
            db_dataset.semantic_model_file_name = dataset.semantic_model_file_name
        db.commit()
        db.refresh(db_dataset)
    return db_dataset

def delete_dataset(db: Session, dataset_id: int):
    db_dataset = get_dataset(db, dataset_id)
    if db_dataset:
        db.delete(db_dataset)
        db.commit()
    return db_dataset

# CRUD for Dataspace
def create_dataspace(db: Session, dataspace: DataspaceCreate):
    db_dataspace = Dataspace(name=dataspace.name, link=dataspace.link)
    db.add(db_dataspace)
    db.commit()
    db.refresh(db_dataspace)
    return db_dataspace

def get_dataspace(db: Session, dataspace_id: int):
    return db.query(Dataspace).filter(Dataspace.id == dataspace_id).first()

def get_dataspace_by_name(db: Session, name: str):
    return db.query(Dataspace).filter(Dataspace.name == name).first()

def get_dataspaces(db: Session, skip: int = 0, limit: int = 10):
    return db.query(Dataspace).offset(skip).limit(limit).all()

def delete_dataspace(db: Session, dataspace_id: int):
    db_dataspace = get_dataspace(db, dataspace_id)
    if db_dataspace:
        db.delete(db_dataspace)
        db.commit()
    return db_dataspace

# CRUD for Catalog
def create_catalog(db: Session, catalog: CatalogCreate):
    db_catalog = Catalog(
        title=catalog.title,
        description=catalog.description,
        issued=catalog.issued,
        modified=catalog.modified,
        publisher_id=catalog.publisher_id
    )
    db.add(db_catalog)
    db.commit()
    db.refresh(db_catalog)
    return db_catalog

def get_catalog(db: Session, catalog_id: int):
    return db.query(Catalog).filter(Catalog.id == catalog_id).first()

def get_catalogs(db: Session, skip: int = 0, limit: int = 10):
    return db.query(Catalog).offset(skip).limit(limit).all()

def delete_catalog(db: Session, catalog_id: int):
    db_catalog = get_catalog(db, catalog_id)
    if db_catalog:
        db.delete(db_catalog)
        db.commit()
    return db_catalog
