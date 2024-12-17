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
    agent1 = get_agent(db, agent_id=1) or create_agent(db, AgentCreate(name="Florian Hölken", email="hoelken@uni-wuppertal.de"))
    agent2 = get_agent(db, agent_id=2) or create_agent(db, AgentCreate(name="André Pomp", email="pomp@uni-wuppertal.de"))
    agent3 = get_agent(db, agent_id=3) or create_agent(db, AgentCreate(name="Alexander Paulus", email="paulus@uni-wuppertal.de"))
    agent4 = get_agent(db, agent_id=4) or create_agent(db, AgentCreate(name="Jakob Deich", email="deich@uni-wuppertal.de"))
    agent5 = get_agent(db, agent_id=5) or create_agent(db, AgentCreate(name="Miguel Gomes", email="alvesgomes@uni-wuppertal.de"))
    agent6 = get_agent(db, agent_id=6) or create_agent(db, AgentCreate(name="Sebastian Chmielewski", email="chmielewski@uni-wuppertal.de"))
    agent7 = get_agent(db, agent_id=7) or create_agent(db, AgentCreate(name="Andre Bröcker", email="abroecker@uni-wuppertal.de"))
    agent8 = get_agent(db, agent_id=8) or create_agent(db, AgentCreate(name="Lara Baumanns", email="baumanns@uni-wuppertal.de"))
    agent9 = get_agent(db, agent_id=9) or create_agent(db, AgentCreate(name="Ali Bahja", email="bahja@uni-wuppertal.de"))
    agent10 = get_agent(db, agent_id=10) or create_agent(db, AgentCreate(name="Andreas Burgdorf", email="burgdorf@uni-wuppertal.de"))

    # Create Catalog
    catalog = get_catalog(db, catalog_id=1) or create_catalog(
        db,
        CatalogCreate(
            title="Semantic Data Catalog",
            description="A DCAT-compliant catalog with the addition for semantic models containing datasets to showcase the benefits of semantic technologies in dataspaces.",
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
                description="This is dataset 1 for testing the heat monitoring app.",
                identifier="dataset-1",
                issued=datetime(2024, 9, 1),
                modified=datetime(2024, 12, 15),
                publisher_id=agent1.id,
                contact_point_id=agent1.id,
                is_public=True,
                access_url="http://localhost:3000/testpod1s1/temp-1.csv",
                download_url="http://localhost:3000/testpod1s1/temp-1.csv",
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
                description="This is dataset 2 for testing the heat monitoring app.",
                identifier="dataset-2",
                issued=datetime(2024, 9, 1),
                modified=datetime(2024, 12, 14),
                publisher_id=agent2.id,
                contact_point_id=agent2.id,
                is_public=True,
                access_url="http://localhost:3000/testpod2s3/temp-2.json",
                download_url="http://localhost:3000/testpod2s3/temp-2.json",
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
                description="This is dataset 3 for testing the heat monitoring app.",
                identifier="dataset-3",
                issued=datetime(2024, 12, 1),
                modified=datetime(2024, 12, 15),
                publisher_id=agent3.id,
                contact_point_id=agent3.id,
                is_public=True,
                access_url="http://localhost:3000/testpod1s2/temp-3.csv",
                download_url="http://localhost:3000/testpod1s2/temp-3.csv",
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
                description="This is test dataset 4.",
                identifier="dataset-4",
                issued=datetime(2024, 12, 1),
                modified=datetime(2024, 12, 1),
                publisher_id=agent4.id,
                contact_point_id=agent4.id,
                is_public=True,
                access_url="http://localhost:3000/testpod2s1/dataset-4.csv",
                download_url="http://localhost:3000/testpod2s1/dataset-4.csv",
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
                description="This is test dataset 5.",
                identifier="dataset-5",
                issued=datetime(2024, 12, 1),
                modified=datetime(2024, 12, 1),
                publisher_id=agent5.id,
                contact_point_id=agent5.id,
                is_public=True,
                access_url="http://localhost:3000/testpod2s2/dataset-5.json",
                download_url="http://localhost:3000/testpod2s2/dataset-5.json",
                file_format="application/json",
                theme="http://example.org/themes/science",
                semantic_model_file=semantic_model_content,
                semantic_model_file_name="test_semantic_model.ttl",
                catalog_id=catalog.id,
            ),
        )

    dataset6 = get_dataset(db, dataset_id=6)
    if not dataset6:
        create_dataset(
            db,
            DatasetCreate(
                title="Dataset 6",
                description="This is test dataset 6.",
                identifier="dataset-6",
                issued=datetime(2024, 12, 1),
                modified=datetime(2024, 12, 1),
                publisher_id=agent6.id,
                contact_point_id=agent6.id,
                is_public=True,
                access_url="http://localhost:3000/testpod3s1/dataset-6.csv",
                download_url="http://localhost:3000/testpod3s1/dataset-6.csv",
                file_format="text/csv",
                theme="http://example.org/themes/science",
                semantic_model_file=semantic_model_content,
                semantic_model_file_name="test_semantic_model.ttl",
                catalog_id=catalog.id,
            ),
        )

    dataset7 = get_dataset(db, dataset_id=7)
    if not dataset7:
        create_dataset(
            db,
            DatasetCreate(
                title="Dataset 7",
                description="This is test dataset 7.",
                identifier="dataset-7",
                issued=datetime(2024, 12, 1),
                modified=datetime(2024, 12, 1),
                publisher_id=agent7.id,
                contact_point_id=agent7.id,
                is_public=True,
                access_url="http://localhost:3000/testpod4s1/dataset-7.csv",
                download_url="http://localhost:3000/testpod4s1/dataset-7.csv",
                file_format="text/csv",
                theme="http://example.org/themes/science",
                semantic_model_file=semantic_model_content,
                semantic_model_file_name="test_semantic_model.ttl",
                catalog_id=catalog.id,
            ),
        )

    dataset8 = get_dataset(db, dataset_id=8)
    if not dataset8:
        create_dataset(
            db,
            DatasetCreate(
                title="Dataset 8",
                description="This is test dataset 8.",
                identifier="dataset-8",
                issued=datetime(2024, 12, 1),
                modified=datetime(2024, 12, 1),
                publisher_id=agent8.id,
                contact_point_id=agent8.id,
                is_public=True,
                access_url="http://localhost:3000/testpod3s2/dataset-8.json",
                download_url="http://localhost:3000/testpod3s2/dataset-8.json",
                file_format="application/json",
                theme="http://example.org/themes/science",
                semantic_model_file=semantic_model_content,
                semantic_model_file_name="test_semantic_model.ttl",
                catalog_id=catalog.id,
            ),
        )

    dataset9 = get_dataset(db, dataset_id=9)
    if not dataset9:
        create_dataset(
            db,
            DatasetCreate(
                title="Dataset 9",
                description="This is test dataset 9.",
                identifier="dataset-9",
                issued=datetime(2024, 12, 1),
                modified=datetime(2024, 12, 1),
                publisher_id=agent9.id,
                contact_point_id=agent9.id,
                is_public=True,
                access_url="http://localhost:3000/testpod3s2/dataset-9.csv",
                download_url="http://localhost:3000/testpod3s2/dataset-9.csv",
                file_format="text/csv",
                theme="http://example.org/themes/science",
                semantic_model_file=semantic_model_content,
                semantic_model_file_name="test_semantic_model.ttl",
                catalog_id=catalog.id,
            ),
        )

    dataset10 = get_dataset(db, dataset_id=10)
    if not dataset10:
        create_dataset(
            db,
            DatasetCreate(
                title="Dataset 10",
                description="This is test dataset 10.",
                identifier="dataset-10",
                issued=datetime(2024, 12, 1),
                modified=datetime(2024, 12, 1),
                publisher_id=agent10.id,
                contact_point_id=agent10.id,
                is_public=True,
                access_url="http://localhost:3000/testpod3s3/dataset-10.json",
                download_url="http://localhost:3000/testpod3s3/dataset-10.json",
                file_format="application/json",
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
    pod2 = get_pod_by_name(db, "data-pod-2") or create_pod(db, PodCreate(name="data-pod-2", server_id=dataspace1.id, path="testpod2s1/"))
    pod3 = get_pod_by_name(db, "data-pod-3") or create_pod(db, PodCreate(name="data-pod-3", server_id=dataspace1.id, path="testpod3s1/"))
    pod4 = get_pod_by_name(db, "data-pod-4") or create_pod(db, PodCreate(name="data-pod-4", server_id=dataspace1.id, path="testpod4s1/"))
    pod5 = get_pod_by_name(db, "data-pod-5") or create_pod(db, PodCreate(name="data-pod-5", server_id=dataspace2.id, path="testpod1s2/"))
    pod6 = get_pod_by_name(db, "data-pod-6") or create_pod(db, PodCreate(name="data-pod-6", server_id=dataspace2.id, path="testpod2s2/"))
    pod7 = get_pod_by_name(db, "data-pod-7") or create_pod(db, PodCreate(name="data-pod-7", server_id=dataspace2.id, path="testpod3s2/"))
    pod8 = get_pod_by_name(db, "data-pod-8") or create_pod(db, PodCreate(name="data-pod-8", server_id=dataspace3.id, path="testpod1s3/"))
    pod9 = get_pod_by_name(db, "data-pod-9") or create_pod(db, PodCreate(name="data-pod-9", server_id=dataspace3.id, path="testpod2s3/"))
    pod10 = get_pod_by_name(db, "data-pod-10") or create_pod(db, PodCreate(name="data-pod-10", server_id=dataspace3.id, path="testpod3s3/"))


def main():
    db = SessionLocal()
    try:
        populate_db(db)
    finally:
        db.close()


if __name__ == "__main__":
    main()
