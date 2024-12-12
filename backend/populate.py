from sqlalchemy.orm import Session
from database import SessionLocal
from crud import create_person, create_dataset, create_dataspace, get_dataspace_by_name, create_pod, get_pod_by_name
from schemas import PersonCreate, DatasetCreate, DataspaceCreate, PodCreate
from datetime import datetime

BLOB_FILE_PATH = "public/assets/files/test.ttl"

def populate_db(db: Session):
    with open(BLOB_FILE_PATH, "rb") as f:
        file_blob = f.read()

    person1 = create_person(db, PersonCreate(name="Alice Example", email="alice@example.com", phone_number="123456789"))
    person2 = create_person(db, PersonCreate(name="Bob Example", email="bob@example.com", phone_number="987654321"))

    dataset1 = DatasetCreate(
        name="Temperature Data 1",
        description="Test Temperature Dataset 1",
        incremental_replace="replace",
        is_public=True,
        file_path="C:/Users/Florian Hölken/source/repos/solid-server/data/server1/testpod1s1/sensor_1.csv",
        owner_id=person1.id,
        contact_id=person2.id,
        creation_date=datetime(2024, 9, 2),
        last_modified_date=datetime(2024, 9, 2),
        file_blob=file_blob
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
        last_modified_date=datetime(2024, 9, 2),
        file_blob=file_blob
    )

    dataset3 = DatasetCreate(
        name="Temperature Data 3",
        description="Test Temperature Dataset 3",
        incremental_replace="incremental",
        is_public=False,
        file_path="C:/Users/Florian Hölken/source/repos/solid-server/data/server1/testpod1s1/sensor_3.json",
        owner_id=person1.id,
        contact_id=person1.id,
        creation_date=datetime(2024, 10, 2),
        last_modified_date=datetime(2024, 10, 2),
        file_blob=file_blob
    )

    create_dataset(db, dataset1, file_blob=file_blob)
    create_dataset(db, dataset2, file_blob=file_blob)
    create_dataset(db, dataset3, file_blob=file_blob)

    dataspace1 = DataspaceCreate(name="solid-dataspace-1", link="http://localhost:3000")
    dataspace2 = DataspaceCreate(name="solid-dataspace-2", link="http://localhost:3001")
    dataspace3 = DataspaceCreate(name="solid-dataspace-3", link="http://localhost:3002")

    for dataspace in [dataspace1, dataspace2, dataspace3]:
        existing_dataspace = get_dataspace_by_name(db, dataspace.name)
        if not existing_dataspace:
            create_dataspace(db, dataspace)

    pod1 = PodCreate(name="data-pod-1", server_id=1, path="testpod1s1/")
    pod2 = PodCreate(name="data-pod-2", server_id=2, path="testpod1s2/")
    pod3 = PodCreate(name="data-pod-3", server_id=3, path="testpod1s3/")

    for pod in [pod1, pod2, pod3]:
        existing_pod = get_pod_by_name(db, pod.name)
        if not existing_pod:
            create_pod(db, pod)

# Hauptskript
def main():
    db = SessionLocal()
    try:
        populate_db(db)
    finally:
        db.close()

if __name__ == "__main__":
    main()
