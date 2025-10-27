import os
from os import getenv
import uuid
from sqlalchemy.orm import Session
from database import SessionLocal
from crud import create_dataset, create_catalog, get_dataset_by_identifier, get_catalog
from triplestore_migration import migrate_to_fuseki, reset_triplestore, ensure_fuseki_dataset_exists
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
            "webid": "https://tmdt-solid-community-server.de/dace/profile/card#me",
            "publisher": "Jakob Deich",
            "contact_point": "deich@uni-wuppertal.de",
            "base_url": "https://tmdt-solid-community-server.de/dace/public"
        },
        {
            "title": "Low Bridges and Road Barriers in London",
            "description": "Height-restricted structures like tunnels and barriers in Greater London.",
            "file_name": "0004.ttl",
            "data_file": "0004.csv",
            "file_format": "text/csv",
            "theme": "infrastructure",
            "webid": "https://tmdt-solid-community-server.de/dace/profile/card#me",
            "publisher": "Jakob Deich",
            "contact_point": "deich@uni-wuppertal.de",
            "base_url": "https://tmdt-solid-community-server.de/dace/public"
        },
        {
            "title": "Camden Business Rates",
            "description": "Rates charged to companies in Camden since 2010, incl. reliefs and periods.",
            "file_name": "0005.ttl",
            "data_file": "0005.csv",
            "file_format": "text/csv",
            "theme": "finance",
            "webid": "https://tmdt-solid-community-server.de/dace/profile/card#me",
            "publisher": "Jakob Deich",
            "contact_point": "deich@uni-wuppertal.de",
            "base_url": "https://tmdt-solid-community-server.de/dace/public"
        },
        {
            "title": "Parking Bays in Camden",
            "description": "Parking bay locations, restrictions, tariffs and lengths in Camden.",
            "file_name": "0007.ttl",
            "data_file": "0007.json",
            "file_format": "application/json",
            "theme": "urban-planning",
            "webid": "https://tmdt-solid-community-server.de/dace/profile/card#me",
            "publisher": "Jakob Deich",
            "contact_point": "deich@uni-wuppertal.de",
            "base_url": "https://tmdt-solid-community-server.de/dace/public"
        },
        {
            "title": "Penalty Charge Notices in Camden",
            "description": "Issued PCNs including type, vehicle, restriction, and enforcement method.",
            "file_name": "0008.ttl",
            "data_file": "0008.json",
            "file_format": "application/json",
            "theme": "traffic-violations",
            "webid": "https://tmdt-solid-community-server.de/dace/profile/card#me",
            "publisher": "Jakob Deich",
            "contact_point": "deich@uni-wuppertal.de",
            "base_url": "https://tmdt-solid-community-server.de/dace/public"
        },
        {
            "title": "Geospatial Boundaries of Urban Districts in Wuppertal",
            "description": "This dataset contains the geospatial boundary data of urban districts in Wuppertal, Germany. Represented as polygons in GeoJSON format, it provides detailed spatial outlines suitable for mapping, spatial analysis, and integration with environmental or urban planning datasets.",
            "file_name": "hma-wuppertal-quartiere.ttl",
            "data_file": "hma-wuppertal-quartiere.json",
            "file_format": "application/json",
            "theme": "geolocation-data",
            "webid": "https://testpod1.solidcommunity.net/profile/card#me",
            "publisher": "Florian Hölken",
            "contact_point": "hoelken@uni-wuppertal.de",
            "base_url": "https://testpod1.solidcommunity.net/public"
        },
        {
            "title": "Environmental Sensor Data with Geospatial Boundaries for Urban Districts of Wuppertal",
            "description": "This dataset contains environmental sensor readings linked to geospatial boundaries of urban districts in Wuppertal, Germany. It includes attributes such as temperature, geographic coordinates, and district identifiers, enabling spatial analysis and integration with urban monitoring applications.",
            "file_name": "hma-temp-1.ttl",
            "data_file": "hma-temp-1.csv",
            "file_format": "text/csv",
            "theme": "environmental-data",
            "webid": "https://testpod1.solidcommunity.net/profile/card#me",
            "publisher": "Florian Hölken",
            "contact_point": "hoelken@uni-wuppertal.de",
            "base_url": "https://testpod1.solidcommunity.net/public"
        },
        {
            "title": "Georeferenced Environmental Data for Wuppertal Urban Districts",
            "description": "This dataset provides temperature readings and activation status from environmental sensors deployed across various urban districts in Wuppertal, Germany. Each entry is linked to precise geographic coordinates, supporting location-based analysis and urban monitoring applications.",
            "file_name": "hma-temp-2.ttl",
            "data_file": "hma-temp-2.json",
            "file_format": "application/json",
            "theme": "environmental-data",
            "webid": "https://tmdt-solid-community-server.de/dace/profile/card#me",
            "publisher": "Jakob Deich",
            "contact_point": "deich@uni-wuppertal.de",
            "base_url": "https://tmdt-solid-community-server.de/dace/public"
        },
        {
            "title": "Spatial Environmental Measurements Across Urban Districts in Wuppertal",
            "description": "The dataset includes spatially located temperature data collected from environmental sensors positioned throughout Wuppertal's urban districts. It supports applications in environmental analysis, urban planning, and smart city research by linking sensor data to specific geographic locations.",
            "file_name": "hma-temp-3.ttl",
            "data_file": "hma-temp-3.csv",
            "file_format": "text/csv",
            "theme": "environmental-data",
            "webid": "https://testpodfh.solidcommunity.net/profile/card#me",
            "publisher": "HMA Testuser",
            "contact_point": "holken.florian@gmail.com",
            "base_url": "https://testpodfh.solidcommunity.net/public"
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