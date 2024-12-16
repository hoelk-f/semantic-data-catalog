from sqlalchemy.orm import Session
from database import SessionLocal
from crud import (
    create_agent, create_dataset, create_catalog, create_dataspace, create_pod,
    get_agent, get_dataset, get_catalog, get_dataspace_by_name, get_pod_by_name
)
from schemas import (
    AgentCreate, DatasetCreate, CatalogCreate, DataspaceCreate, PodCreate
)
from datetime import datetime

BLOB_FILE_PATH = "public/assets/files/test.ttl"

def populate_db(db: Session):
    with open(BLOB_FILE_PATH, "rb") as f:
        semantic_model_content = f.read()

    # Create Agents
    agent1 = get_agent(db, agent_id=1) or create_agent(db, AgentCreate(name="Alice Publisher", email="alice@publisher.com"))
    agent2 = get_agent(db, agent_id=2) or create_agent(db, AgentCreate(name="Bob Contact", email="bob@contact.com"))

    # Create Catalog
    catalog = get_catalog(db, catalog_id=1) or create_catalog(
        db,
        CatalogCreate(
            title="Sample Data Catalog",
            description="A DCAT-compliant catalog with the addition for semantic models containing datasets.",
            issued=datetime(2024, 12, 1),
            modified=datetime(2024, 12, 15),
            publisher_id=agent1.id,
        ),
    )

    # Create Datasets
    for i in range(1, 6):
        dataset_identifier = f"dataset-{i}"
        existing_dataset = get_dataset(db, dataset_id=i)
        if not existing_dataset:
            create_dataset(
                db,
                DatasetCreate(
                    title=f"Dataset {i}",
                    description=f"This is dataset {i}.",
                    identifier=dataset_identifier,
                    issued=datetime(2024, 12, 1),
                    modified=datetime(2024, 12, 15),
                    publisher_id=agent1.id,
                    contact_point_id=agent2.id,
                    is_public=bool(i % 2),
                    access_url=f"http://localhost:8000/datasets/{i}",
                    download_url=f"http://localhost:8000/files/dataset-{i}.csv",
                    file_format="text/csv",
                    theme="http://example.org/themes/science",
                    semantic_model_file=semantic_model_content,
                    semantic_model_file_name="test_semantic_model.ttl",
                    catalog_id=catalog.id,
                ),
            )

    # Create Dataspaces
    dataspace1 = get_dataspace_by_name(db, "solid-dataspace-1") or create_dataspace(db, DataspaceCreate(name="solid-dataspace-1", link="http://localhost:3000"))
    dataspace2 = get_dataspace_by_name(db, "solid-dataspace-2") or create_dataspace(db, DataspaceCreate(name="solid-dataspace-2", link="http://localhost:3001"))
    dataspace3 = get_dataspace_by_name(db, "solid-dataspace-3") or create_dataspace(db, DataspaceCreate(name="solid-dataspace-3", link="http://localhost:3002"))

    # Create Pods
    pod1 = get_pod_by_name(db, "data-pod-1") or create_pod(db, PodCreate(name="data-pod-1", server_id=dataspace1.id, path="testpod1s1/"))
    pod2 = get_pod_by_name(db, "data-pod-2") or create_pod(db, PodCreate(name="data-pod-2", server_id=dataspace2.id, path="testpod1s2/"))
    pod3 = get_pod_by_name(db, "data-pod-3") or create_pod(db, PodCreate(name="data-pod-3", server_id=dataspace2.id, path="testpod1s3/"))


def main():
    db = SessionLocal()
    try:
        populate_db(db)
    finally:
        db.close()


if __name__ == "__main__":
    main()
