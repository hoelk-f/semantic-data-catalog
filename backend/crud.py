from sqlalchemy.orm import Session
from models import Dataset as DatasetModel, Person, Dataspace, Pod
from schemas import DatasetCreate, DatasetUpdate, PersonCreate, DataspaceCreate, PodCreate
from datetime import datetime

# CRUD for Person
def create_person(db: Session, person: PersonCreate):
    existing_person = get_person_by_email(db, person.email)
    if existing_person:
        return existing_person
    db_person = Person(
        name=person.name,
        email=person.email,
        phone_number=person.phone_number
    )
    db.add(db_person)
    db.commit()
    db.refresh(db_person)
    return db_person

def get_person(db: Session, person_id: int):
    return db.query(Person).filter(Person.id == person_id).first()

def get_person_by_email(db: Session, email: str):
    return db.query(Person).filter(Person.email == email).first()

def get_persons(db: Session, skip: int = 0, limit: int = 10):
    return db.query(Person).offset(skip).limit(limit).all()

def update_person(db: Session, person_id: int, person: PersonCreate):
    db_person = get_person(db, person_id)
    if db_person:
        db_person.name = person.name
        db_person.email = person.email
        db_person.phone_number = person.phone_number
        db.commit()
        db.refresh(db_person)
    return db_person

def delete_person(db: Session, person_id: int):
    db_person = get_person(db, person_id)
    if db_person:
        db.delete(db_person)
        db.commit()
    return db_person

# CRUD for Dataset
def create_dataset(db: Session, dataset: DatasetCreate, file_blob: bytes = None):
    existing_dataset = db.query(DatasetModel).filter(DatasetModel.name == dataset.name).first()
    if existing_dataset:
        return existing_dataset

    db_dataset = DatasetModel(
        name=dataset.name,
        description=dataset.description,
        creation_date=dataset.creation_date,
        last_modified_date=dataset.last_modified_date,
        incremental_replace=dataset.incremental_replace,
        owner_id=dataset.owner_id,
        contact_id=dataset.contact_id,
        is_public=dataset.is_public,
        file_path=dataset.file_path,
        file_blob=file_blob
    )
    db.add(db_dataset)
    db.commit()
    db.refresh(db_dataset)
    return db_dataset

def get_dataset(db: Session, dataset_id: int):
    return db.query(DatasetModel).filter(DatasetModel.id == dataset_id).first()

def get_datasets(db: Session, skip: int = 0, limit: int = 10):
    return db.query(DatasetModel).offset(skip).limit(limit).all()

def update_dataset(db: Session, dataset_id: int, dataset: DatasetUpdate):
    db_dataset = get_dataset(db, dataset_id)
    if db_dataset:
        db_dataset.name = dataset.name
        db_dataset.description = dataset.description
        db_dataset.incremental_replace = dataset.incremental_replace
        db_dataset.is_public = dataset.is_public
        db.commit()
        db.refresh(db_dataset)
    return db_dataset

def delete_dataset(db: Session, dataset_id: int):
    dataset = db.query(DatasetModel).filter(DatasetModel.id == dataset_id).first()
    db.delete(dataset)
    db.commit()
    return {"message": "Dataset deleted successfully"}

# CRUD for Dataspace
def create_dataspace(db: Session, dataspace: DataspaceCreate):
    existing_dataspace = db.query(Dataspace).filter(Dataspace.name == dataspace.name).first()
    if existing_dataspace:
        return existing_dataspace
    db_dataspace = Dataspace(name=dataspace.name, link=dataspace.link)
    db.add(db_dataspace)
    db.commit()
    db.refresh(db_dataspace)
    return db_dataspace

def get_dataspace(db: Session, dataspace_id: int):
    return db.query(Dataspace).filter(Dataspace.id == dataspace_id).first()

def get_dataspaces(db: Session, skip: int = 0, limit: int = 10):
    return db.query(Dataspace).offset(skip).limit(limit).all()

def delete_dataspace(db: Session, dataspace_id: int):
    db_dataspace = get_dataspace(db, dataspace_id)
    if db_dataspace:
        db.delete(db_dataspace)
        db.commit()
    return db_dataspace

def get_dataspace_by_name(db: Session, name: str):
    return db.query(Dataspace).filter(Dataspace.name == name).first()

# CRUD for Pod
def create_pod(db: Session, pod: PodCreate):
    db_pod = Pod(name=pod.name, server_id=pod.server_id, path=pod.path)
    db.add(db_pod)
    db.commit()
    db.refresh(db_pod)
    return db_pod

def get_pod(db: Session, pod_id: int):
    return db.query(Pod).filter(Pod.id == pod_id).first()

def get_pods(db: Session, skip: int = 0, limit: int = 10):
    return db.query(Pod).offset(skip).limit(limit).all()

def delete_pod(db: Session, pod_id: int):
    db_pod = get_pod(db, pod_id)
    if db_pod:
        db.delete(db_pod)
        db.commit()
    return db_pod

def get_pod_by_name(db: Session, name: str):
    return db.query(Pod).filter(Pod.name == name).first()

def get_pods_by_dataspace_id(db: Session, dataspace_id: int):
    return db.query(Pod).filter(Pod.server_id == dataspace_id).all()
