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
    dataset1 = get_dataset(db, dataset_id=1)
    if not dataset1:
        create_dataset(
            db,
            DatasetCreate(
                title="Temperature Dataset 1",
                description="This is dataset 1 for testing the heat monitoring app",
                identifier="dataset-1",
                issued=datetime(2024, 9, 1),
                modified=datetime(2024, 12, 15),
                publisher_id=agent1.id,
                contact_point_id=agent2.id,
                is_public=True,
                access_url="http://localhost:8000/datasets/1",
                download_url="http://localhost:8000/files/dataset-1.csv",
                file_format="text/csv",
                theme="http://example.org/themes/science",
                semantic_model_file=semantic_model_content,
                semantic_model_file_name="test_semantic_model.ttl",
                catalog_id=catalog.id,
            ),
        )

    dataset2 = get_dataset(db, dataset_id=2)
    if not dataset2:
        create_dataset(
            db,
            DatasetCreate(
                title="Temperature Dataset 2",
                description="This is dataset 2 for testing the heat monitoring app",
                identifier="dataset-2",
                issued=datetime(2024, 9, 1),
                modified=datetime(2024, 12, 14),
                publisher_id=agent1.id,
                contact_point_id=agent2.id,
                is_public=True,
                access_url="http://localhost:8000/datasets/2",
                download_url="http://localhost:8000/files/dataset-2.csv",
                file_format="application/json",
                theme="http://example.org/themes/science",
                semantic_model_file=semantic_model_content,
                semantic_model_file_name="test_semantic_model.ttl",
                catalog_id=catalog.id,
            ),
        )

    dataset3 = get_dataset(db, dataset_id=3)
    if not dataset3:
        create_dataset(
            db,
            DatasetCreate(
                title="Temperature Dataset 3",
                description="This is dataset 3 for testing the heat monitoring app",
                identifier="dataset-3",
                issued=datetime(2024, 12, 1),
                modified=datetime(2024, 12, 15),
                publisher_id=agent1.id,
                contact_point_id=agent2.id,
                is_public=True,
                access_url="http://localhost:8000/datasets/3",
                download_url="http://localhost:8000/files/dataset-3.csv",
                file_format="text/csv",
                theme="http://example.org/themes/science",
                semantic_model_file=semantic_model_content,
                semantic_model_file_name="test_semantic_model.ttl",
                catalog_id=catalog.id,
            ),
        )

    dataset4 = get_dataset(db, dataset_id=4)
    if not dataset4:
        create_dataset(
            db,
            DatasetCreate(
                title="Dataset 4",
                description="This is dataset 4.",
                identifier="dataset-4",
                issued=datetime(2024, 12, 1),
                modified=datetime(2024, 12, 15),
                publisher_id=agent1.id,
                contact_point_id=agent2.id,
                is_public=True,
                access_url="http://localhost:8000/datasets/4",
                download_url="http://localhost:8000/files/dataset-4.csv",
                file_format="text/csv",
                theme="http://example.org/themes/science",
                semantic_model_file=semantic_model_content,
                semantic_model_file_name="test_semantic_model.ttl",
                catalog_id=catalog.id,
            ),
        )

    dataset5 = get_dataset(db, dataset_id=5)
    if not dataset5:
        create_dataset(
            db,
            DatasetCreate(
                title="Dataset 5",
                description="This is dataset 5.",
                identifier="dataset-5",
                issued=datetime(2024, 12, 1),
                modified=datetime(2024, 12, 15),
                publisher_id=agent1.id,
                contact_point_id=agent2.id,
                is_public=True,
                access_url="http://localhost:8000/datasets/5",
                download_url="http://localhost:8000/files/dataset-5.csv",
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
