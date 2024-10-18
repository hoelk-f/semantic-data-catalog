from sqlalchemy.orm import Session
from models import Dataset, Person
from schemas import DatasetCreate, DatasetUpdate, PersonCreate
from datetime import datetime

# CRUD-Funktionen für Person
def create_person(db: Session, person: PersonCreate):
    # Überprüfe, ob eine Person mit der gleichen E-Mail bereits existiert
    existing_person = get_person_by_email(db, person.email)
    if existing_person:
        return existing_person  # Wenn vorhanden, gebe die vorhandene Person zurück

    # Wenn die Person nicht existiert, erstelle sie
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

# CRUD-Funktionen für Dataset
def create_dataset(db: Session, dataset: DatasetCreate, owner_id: int, contact_id: int):
    # Überprüfe, ob ein Dataset mit dem gleichen Dateipfad bereits existiert
    existing_dataset = db.query(Dataset).filter(Dataset.file_path == dataset.file_path).first()
    if existing_dataset:
        return existing_dataset  # Wenn vorhanden, gebe den vorhandenen Datensatz zurück

    # Wenn das Dataset nicht existiert, erstelle es
    db_dataset = Dataset(
        name=dataset.name,
        description=dataset.description,
        creation_date=dataset.creation_date or datetime.utcnow(),
        last_modified_date=dataset.last_modified_date or datetime.utcnow(),
        incremental_replace=dataset.incremental_replace,
        owner_id=owner_id,
        contact_id=contact_id,
        is_public=dataset.is_public,
        file_path=dataset.file_path
    )
    db.add(db_dataset)
    db.commit()
    db.refresh(db_dataset)
    return db_dataset

def get_dataset(db: Session, dataset_id: int):
    return db.query(Dataset).filter(Dataset.id == dataset_id).first()

def get_datasets(db: Session, skip: int = 0, limit: int = 10):
    return db.query(Dataset).offset(skip).limit(limit).all()

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
    db_dataset = get_dataset(db, dataset_id)
    if db_dataset:
        db.delete(db_dataset)
        db.commit()
    return db_dataset
