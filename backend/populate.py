from sqlalchemy.orm import Session
from database import SessionLocal
from crud import create_person, create_dataset
from schemas import PersonCreate, DatasetCreate
from datetime import datetime

# Testdaten für Personen und Datensätze
def populate_db(db: Session):
    # Testpersonen
    person1 = create_person(db, PersonCreate(name="Alice Example", email="alice@example.com", phone_number="123456789"))
    person2 = create_person(db, PersonCreate(name="Bob Example", email="bob@example.com", phone_number="987654321"))

    # Testdatensätze
    dataset1 = DatasetCreate(
        name="Temperature Data 1",
        description="Test Temperature Dataset 1",
        incremental_replace="replace",
        is_public=True,
        file_path="C:/Users/Florian Hölken/source/repos/solid-server/data/server1/testpod1s1/sensor_1.csv",
        owner_id=person1.id,
        contact_id=person2.id,
        creation_date=datetime(2024, 9, 2),
        last_modified_date=datetime(2024, 9, 2)
    )

    dataset2 = DatasetCreate(
        name="Temperature Data 2",
        description="Test Temperature Dataset 2",
        incremental_replace="incremental",
        is_public=True,
        file_path="C:/Users/Florian Hölken/source/repos/solid-server/data/server2/testpod1s2/sensor_2.csv",
        owner_id=person2.id,
        contact_id=person1.id,
        creation_date=datetime(2024, 9, 2),
        last_modified_date=datetime(2024, 9, 2)
    )

    dataset3 = DatasetCreate(
        name="Temperature Data 3",
        description="Test Temperature Dataset 3",
        incremental_replace="incremental",
        is_public=False,
        file_path="C:/Users/Florian Hölken/source/repos/solid-server/data/server1/testpod1s1/sensor_3.csv",
        owner_id=person1.id,
        contact_id=person1.id,
        creation_date=datetime(2024, 10, 2),
        last_modified_date=datetime(2024, 10, 2)
    )

    create_dataset(db, dataset1, owner_id=person1.id, contact_id=person2.id)
    create_dataset(db, dataset2, owner_id=person2.id, contact_id=person1.id)
    create_dataset(db, dataset3, owner_id=person1.id, contact_id=person1.id)

# Hauptskript
def main():
    # Datenbank-Session erstellen
    db = SessionLocal()

    try:
        populate_db(db)
    finally:
        db.close()

if __name__ == "__main__":
    main()
