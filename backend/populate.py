import os
import argparse
import uuid
from sqlalchemy.orm import Session
from database import SessionLocal
from crud import create_dataset, create_catalog, get_dataset_by_identifier, get_catalog
from schemas import DatasetCreate, CatalogCreate
import random
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

def populate_db(db: Session):
    catalog = get_catalog(db, catalog_id=1) or create_catalog(
        db,
        CatalogCreate(
            title="Semantic Data Catalog",
            description="A DCAT-compliant catalog with semantic models.",
            issued=datetime(2024, 12, 1),
            modified=datetime(2024, 12, 15),
        ),
    )

    datasets = [
        {
            "title": "Ticket Vending Machines in Canberra",
            "description": "Locations and payment options of ticket vending machines for paper tickets and MyWay cards in Canberra.",
            "file_name": "0001.ttl",
            "data_file": "0001.csv",
            "file_format": "text/csv",
            "theme": "transport",
            "webid": "https://testpod1.solidcommunity.net/profile/card#me",
            "publisher": "Florian Hölken",
            "contact_point": "hoelken@uni-wuppertal.de",
            "base_url": "https://testpod1.solidcommunity.net/public"
        },
        {
            "title": "MyWay Retail Agents in Canberra",
            "description": "Geospatial locations of MyWay retail agents across various Canberra regions.",
            "file_name": "0002.ttl",
            "data_file": "0002.csv",
            "file_format": "text/csv",
            "theme": "transport",
            "webid": "https://testpod1.solidcommunity.net/profile/card#me",
            "publisher": "Florian Hölken",
            "contact_point": "hoelken@uni-wuppertal.de",
            "base_url": "https://testpod1.solidcommunity.net/public"
        },
        {
            "title": "Police Department Facilities in Little Rock",
            "description": "Addresses and locations of police department facilities in Little Rock, Arkansas.",
            "file_name": "0006.ttl",
            "data_file": "0006.json",
            "file_format": "application/json",
            "theme": "public-safety",
            "webid": "https://testpod1.solidcommunity.net/profile/card#me",
            "publisher": "Florian Hölken",
            "contact_point": "hoelken@uni-wuppertal.de",
            "base_url": "https://testpod1.solidcommunity.net/public"
        },
        {
            "title": "Open Spaces in Greater London (GiGL)",
            "description": "GIS polygon data of public open space sites in Greater London, including land use type and area.",
            "file_name": "0009.ttl",
            "data_file": "0009.json",
            "file_format": "application/json",
            "theme": "environment",
            "webid": "https://testpod1.solidcommunity.net/profile/card#me",
            "publisher": "Florian Hölken",
            "contact_point": "hoelken@uni-wuppertal.de",
            "base_url": "https://testpod1.solidcommunity.net/public"
        },
        {
            "title": "Crash Data in Cambridge (2010–2016)",
            "description": "Traffic incidents in Cambridge involving vehicles, bicycles, and pedestrians, including location and time.",
            "file_name": "0010.ttl",
            "data_file": "0010.json",
            "file_format": "application/json",
            "theme": "transport",
            "webid": "https://testpod1.solidcommunity.net/profile/card#me",
            "publisher": "Florian Hölken",
            "contact_point": "hoelken@uni-wuppertal.de",
            "base_url": "https://testpod1.solidcommunity.net/public"
        },
        {
            "title": "Crash Data in ACT",
            "description": "Reported road crashes in ACT including location and severity info.",
            "file_name": "0003.ttl",
            "data_file": "0003.csv",
            "file_format": "text/csv",
            "theme": "transport",
            "webid": "https://testpodfu.solidcommunity.net/profile/card#me",
            "publisher": "Fabricated User",
            "contact_point": "fabricatedu@gmail.com",
            "base_url": "https://testpodfu.solidcommunity.net/public"
        },
        {
            "title": "Low Bridges and Road Barriers in London",
            "description": "Height-restricted structures like tunnels and barriers in Greater London.",
            "file_name": "0004.ttl",
            "data_file": "0004.csv",
            "file_format": "text/csv",
            "theme": "infrastructure",
            "webid": "https://testpodfu.solidcommunity.net/profile/card#me",
            "publisher": "Fabricated User",
            "contact_point": "fabricatedu@gmail.com",
            "base_url": "https://testpodfu.solidcommunity.net/public"
        },
        {
            "title": "Camden Business Rates",
            "description": "Rates charged to companies in Camden since 2010, incl. reliefs and periods.",
            "file_name": "0005.ttl",
            "data_file": "0005.csv",
            "file_format": "text/csv",
            "theme": "finance",
            "webid": "https://testpodfu.solidcommunity.net/profile/card#me",
            "publisher": "Fabricated User",
            "contact_point": "fabricatedu@gmail.com",
            "base_url": "https://testpodfu.solidcommunity.net/public"
        },
        {
            "title": "Parking Bays in Camden",
            "description": "Parking bay locations, restrictions, tariffs and lengths in Camden.",
            "file_name": "0007.ttl",
            "data_file": "0007.json",
            "file_format": "application/json",
            "theme": "urban-planning",
            "webid": "https://testpodfu.solidcommunity.net/profile/card#me",
            "publisher": "Fabricated User",
            "contact_point": "fabricatedu@gmail.com",
            "base_url": "https://testpodfu.solidcommunity.net/public"
        },
        {
            "title": "Penalty Charge Notices in Camden",
            "description": "Issued PCNs including type, vehicle, restriction, and enforcement method.",
            "file_name": "0008.ttl",
            "data_file": "0008.json",
            "file_format": "application/json",
            "theme": "traffic-violations",
            "webid": "https://testpodfu.solidcommunity.net/profile/card#me",
            "publisher": "Fabricated User",
            "contact_point": "fabricatedu@gmail.com",
            "base_url": "https://testpodfu.solidcommunity.net/public"
        },
    ]

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
    parser = argparse.ArgumentParser(description="Populate Semantic Data Catalog DB")
    parser.add_argument('--reset-db', action='store_true', help='Reset the database before populating')
    args = parser.parse_args()

    reset_env = os.getenv("RESET_DB", "false").lower() == "true"
    db = SessionLocal()
    try:
        if args.reset_db or reset_env:
            reset_database(db)
        populate_db(db)
    finally:
        db.close()

if __name__ == "__main__":
    main()
