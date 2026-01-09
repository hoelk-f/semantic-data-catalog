import os
from os import getenv
import uuid
from sqlalchemy.orm import Session
from database import SessionLocal
from crud import create_dataset, create_catalog, get_dataset_by_identifier, get_catalog
from triplestore_migration import migrate_to_fuseki, reset_triplestore, ensure_fuseki_dataset_exists
from schemas import DatasetCreate, CatalogCreate
import random
import json
from datetime import datetime, timedelta

def reset_database(db: Session):
    from models import Dataset, Catalog
    db.query(Dataset).delete()
    db.query(Catalog).delete()
    db.commit()
    print("Database reset complete.")

def random_date(start: datetime, end: datetime) -> datetime:
    delta = end - start
    random_days = random.randint(0, delta.days)
    return start + timedelta(days=random_days)

def create_catalog_entry(db: Session):
    catalog_name = getenv("CATALOG_NAME", "Default Catalog Name")
    catalog_description = getenv("CATALOG_DESCRIPTION", "Default Catalog Description")

    catalog = get_catalog(db, catalog_id=1)
    if not catalog:
        return create_catalog(
            db,
            CatalogCreate(
                title=catalog_name,
                description=catalog_description,
                issued=datetime.utcnow(),
                modified=datetime.utcnow(),
            ),
        )
    else:
        return catalog

def populate_db(db: Session):
    catalog = create_catalog_entry(db)
    
    datasets_path = os.path.join(os.path.dirname(__file__), 'populate', 'create-datasets.json')
    with open(datasets_path, 'r', encoding='utf-8') as dataset_file:
        datasets = json.load(dataset_file)

    for dataset in datasets:
        identifier = str(uuid.uuid4())
        ttl_path = os.path.join("public/assets/files", dataset["file_name"])
        with open(ttl_path, "rb") as f:
            semantic_model = f.read()

        access_url_dataset = f"{dataset['base_url']}/{dataset['data_file']}"
        access_url_semantic_model = f"{dataset['base_url']}/{dataset['file_name']}"

        if not get_dataset_by_identifier(db, identifier):
            create_dataset(
                db,
                DatasetCreate(
                    title=dataset["title"],
                    description=dataset["description"],
                    identifier=identifier,
                    issued=random_date(datetime(2024, 1, 1), datetime(2024, 12, 31)),
                    modified=random_date(datetime(2025, 1, 1), datetime(2025, 4, 17)),
                    publisher=dataset["publisher"],
                    contact_point=dataset["contact_point"],
                    is_public=True,
                    access_url_dataset=access_url_dataset,
                    access_url_semantic_model=access_url_semantic_model,
                    file_format=dataset["file_format"],
                    theme=dataset["theme"],
                    semantic_model_file=semantic_model,
                    semantic_model_file_name=dataset["file_name"],
                    catalog_id=catalog.id,
                    webid=dataset["webid"],
                )
            )

def main():
    ensure_fuseki_dataset_exists()

    reset_env = os.getenv("RESET_DB", "false").lower() == "true"
    populate_env = os.getenv("RUN_POPULATE", "false").lower() == "true"

    db = SessionLocal()
    try:
        if reset_env:
            reset_database(db)

            reset_triplestore()

            create_catalog_entry(db)

        if populate_env:
            populate_db(db)

            migrate_to_fuseki()
    finally:
        db.close()

if __name__ == "__main__":
    main()