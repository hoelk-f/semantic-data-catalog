import os
import argparse
import uuid
from sqlalchemy.orm import Session
from database import SessionLocal
from crud import (
    create_dataset, create_catalog, get_dataset_by_identifier, get_catalog
)
from schemas import (
    DatasetCreate, CatalogCreate
)
from datetime import datetime

def reset_database(db: Session):
    from models import Dataset, Catalog

    db.query(Dataset).delete()
    db.query(Catalog).delete()
    db.commit()
    print("Database reset complete.")

SEMANTIC_MODEL_OTHER_FILE_PATH = "public/assets/files/other.ttl"
SEMANTIC_MODEL_TEMP_1_FILE_PATH = "public/assets/files/temp-1.ttl"
SEMANTIC_MODEL_TEMP_2_FILE_PATH = "public/assets/files/temp-2.ttl"
SEMANTIC_MODEL_TEMP_3_FILE_PATH = "public/assets/files/temp-3.ttl"

def populate_db(db: Session):
    # Load semantic model files
    with open(SEMANTIC_MODEL_TEMP_1_FILE_PATH, "rb") as f:
        semantic_model_temp_1 = f.read()

    with open(SEMANTIC_MODEL_TEMP_2_FILE_PATH, "rb") as f:
        semantic_model_temp_2 = f.read()

    with open(SEMANTIC_MODEL_TEMP_3_FILE_PATH, "rb") as f:
        semantic_model_temp_3 = f.read()

    with open(SEMANTIC_MODEL_OTHER_FILE_PATH, "rb") as f:
        semantic_model_other = f.read()

    # Create Catalog
    catalog = get_catalog(db, catalog_id=1) or create_catalog(
        db,
        CatalogCreate(
            title="Semantic Data Catalog",
            description="A DCAT-compliant catalog with semantic models.",
            issued=datetime(2024, 12, 1),
            modified=datetime(2024, 12, 15),
        ),
    )

    # Create Datasets
    datasets = [
        {
            "title": "Weather Data Wuppertal 2022",
            "description": "Hourly meteorological data from Wuppertal in 2022, including temperature, humidity, and precipitation levels collected via local weather stations.",
            "semantic_model": semantic_model_temp_1,
            "file_name": "weather_wuppertal_2022.ttl",
            "issued": datetime(2023, 1, 15),
            "modified": datetime(2023, 12, 20),
            "file_format": "text/csv",
            "theme": "http://example.org/themes/weather",
            "access_url_dataset": "http://localhost:3000/testpod1s1/weather_wuppertal_2022.csv",
            "access_url_semantic_model": "http://localhost:3000/testpod1s1/weather_wuppertal_2022.csv"
        },
        {
            "title": "Energy Consumption Smart Building 2023",
            "description": "Electricity and heating consumption records from a smart building in Wuppertal, gathered as part of an energy efficiency project.",
            "semantic_model": semantic_model_temp_2,
            "file_name": "smart_building_energy_2023.ttl",
            "issued": datetime(2023, 6, 1),
            "modified": datetime(2024, 1, 10),
            "file_format": "application/json",
            "theme": "http://example.org/themes/energy",
            "access_url_dataset": "http://localhost:3000/testpod2s1/smart_building_energy_2023.json",
            "access_url_semantic_model": "http://localhost:3000/testpod2s1/smart_building_energy_2023.json"
        },
        {
            "title": "Traffic Flow Data A46 Wuppertal",
            "description": "Traffic sensor data including vehicle counts and average speed on highway A46 near Wuppertal for 2022.",
            "semantic_model": semantic_model_temp_3,
            "file_name": "traffic_flow_a46_2022.ttl",
            "issued": datetime(2022, 10, 1),
            "modified": datetime(2023, 5, 30),
            "file_format": "text/csv",
            "theme": "http://example.org/themes/transport",
            "access_url_dataset": "http://localhost:3000/testpod3s1/traffic_flow_a46_2022.csv",
            "access_url_semantic_model": "http://localhost:3000/testpod3s1/traffic_flow_a46_2022.csv"
        },
        {
            "title": "Air Quality Measurements Wuppertal 2023",
            "description": "Air pollutant concentrations such as NO2, PM10, and ozone measured at several urban and suburban locations across Wuppertal.",
            "semantic_model": semantic_model_other,
            "file_name": "air_quality_wuppertal_2023.ttl",
            "issued": datetime(2023, 3, 5),
            "modified": datetime(2024, 2, 28),
            "file_format": "application/json",
            "theme": "http://example.org/themes/environment",
            "access_url_dataset": "http://localhost:3000/testpod4s1/air_quality_wuppertal_2023.json",
            "access_url_semantic_model": "http://localhost:3000/testpod4s1/air_quality_wuppertal_2023.json"
        },
        {
            "title": "River Wupper Water Levels 2022",
            "description": "Hydrological data of the River Wupper including daily water levels, flow rates, and seasonal variations collected in 2022.",
            "semantic_model": semantic_model_other,
            "file_name": "wupper_water_levels_2022.ttl",
            "issued": datetime(2022, 7, 20),
            "modified": datetime(2023, 2, 15),
            "file_format": "text/csv",
            "theme": "http://example.org/themes/hydrology",
            "access_url_dataset": "http://localhost:3000/testpod1s2/wupper_water_levels_2022.csv",
            "access_url_semantic_model": "http://localhost:3000/testpod1s2/wupper_water_levels_2022.csv"
        },
        {
            "title": "Solar Power Production Wuppertal 2023",
            "description": "Photovoltaic energy production data from multiple installations across Wuppertal in 2023, part of a renewable energy study.",
            "semantic_model": semantic_model_other,
            "file_name": "solar_power_wuppertal_2023.ttl",
            "issued": datetime(2023, 5, 10),
            "modified": datetime(2024, 1, 25),
            "file_format": "application/json",
            "theme": "http://example.org/themes/renewable-energy",
            "access_url_dataset": "http://localhost:3000/testpod2s2/solar_power_wuppertal_2023.json",
            "access_url_semantic_model": "http://localhost:3000/testpod2s2/solar_power_wuppertal_2023.json"
        },
        {
            "title": "Public Transport Timetable Wuppertal 2024",
            "description": "Timetable data for buses and light rail services in Wuppertal for 2024, including departure times, routes, and service frequencies.",
            "semantic_model": semantic_model_other,
            "file_name": "public_transport_timetable_2024.ttl",
            "issued": datetime(2024, 1, 1),
            "modified": datetime(2024, 3, 1),
            "file_format": "application/json",
            "theme": "http://example.org/themes/transport",
            "access_url_dataset": "http://localhost:3000/testpod3s2/public_transport_timetable_2024.json",
            "access_url_semantic_model": "http://localhost:3000/testpod3s2/public_transport_timetable_2024.json"
        },
        {
            "title": "Biodiversity Records Wuppertal Forests 2023",
            "description": "Species observations and ecological surveys documenting flora and fauna diversity within Wuppertals forest regions.",
            "semantic_model": semantic_model_other,
            "file_name": "biodiversity_wuppertal_forests_2023.ttl",
            "issued": datetime(2023, 4, 10),
            "modified": datetime(2024, 2, 5),
            "file_format": "text/csv",
            "theme": "http://example.org/themes/environment",
            "access_url_dataset": "http://localhost:3000/testpod1s3/biodiversity_wuppertal_forests_2023.csv",
            "access_url_semantic_model": "http://localhost:3000/testpod1s3/biodiversity_wuppertal_forests_2023.csv"
        },
        {
            "title": "Noise Pollution Data Wuppertal 2023",
            "description": "Environmental noise data collected from various zones in Wuppertal, measuring average and peak decibel levels during 2023.",
            "semantic_model": semantic_model_other,
            "file_name": "noise_pollution_wuppertal_2023.ttl",
            "issued": datetime(2023, 2, 1),
            "modified": datetime(2023, 11, 15),
            "file_format": "application/json",
            "theme": "http://example.org/themes/environmental-health",
            "access_url_dataset": "http://localhost:3000/testpod2s3/noise_pollution_wuppertal_2023.json",
            "access_url_semantic_model": "http://localhost:3000/testpod2s3/noise_pollution_wuppertal_2023.json"
        },
        {
            "title": "Electric Vehicle Charging Stations Wuppertal",
            "description": "Geospatial and operational data of public EV charging stations in Wuppertal, including charging capacity and station availability.",
            "semantic_model": semantic_model_other,
            "file_name": "ev_charging_stations_wuppertal.ttl",
            "issued": datetime(2023, 8, 1),
            "modified": datetime(2024, 2, 20),
            "file_format": "text/csv",
            "theme": "http://example.org/themes/energy-infrastructure",
            "access_url_dataset": "http://localhost:3000/testpod3s3/ev_charging_stations_wuppertal.csv",
            "access_url_semantic_model": "http://localhost:3000/testpod3s3/ev_charging_stations_wuppertal.csv"
        }
    ]

    for idx, dataset in enumerate(datasets, start=1):
        identifier = str(uuid.uuid4())
        existing_dataset = get_dataset_by_identifier(db, identifier)
        if not existing_dataset:
            create_dataset(
                db,
                DatasetCreate(
                    title=dataset["title"],
                    description=dataset["description"],
                    identifier=identifier,
                    issued=dataset["issued"],
                    modified=dataset["modified"],
                    publisher="Florian Hölken",
                    contact_point="hoelken@uni-wuppertal.de",
                    is_public=True,
                    access_url_dataset=dataset["access_url_dataset"],
                    access_url_semantic_model=dataset["access_url_semantic_model"],
                    file_format=dataset["file_format"],
                    theme=dataset["theme"],
                    semantic_model_file=dataset["semantic_model"],
                    semantic_model_file_name=dataset["file_name"],
                    catalog_id=catalog.id,
                    webid="https://testpod1.solidcommunity.net/profile/card#me",
                ),
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
