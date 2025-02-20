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

    # Create Agents
    agent1 = get_agent(db, agent_id=1) or create_agent(db, AgentCreate(name="Florian Hölken", email="hoelken@uni-wuppertal.de"))
    agent2 = get_agent(db, agent_id=2) or create_agent(db, AgentCreate(name="André Pomp", email="pomp@uni-wuppertal.de"))
    agent3 = get_agent(db, agent_id=3) or create_agent(db, AgentCreate(name="Alexander Paulus", email="paulus@uni-wuppertal.de"))
    agent4 = get_agent(db, agent_id=4) or create_agent(db, AgentCreate(name="Ali Bahja", email="bahja@uni-wuppertal.de"))
    agent5 = get_agent(db, agent_id=5) or create_agent(db, AgentCreate(name="Andreas Burgdorf", email="burgdorf@uni-wuppertal.de"))
    agent6 = get_agent(db, agent_id=6) or create_agent(db, AgentCreate(name="Jakob Deich", email="deich@uni-wuppertal.de"))
    agent7 = get_agent(db, agent_id=7) or create_agent(db, AgentCreate(name="Lara Baumanns", email="baumanns@uni-wuppertal.de"))
    agent8 = get_agent(db, agent_id=8) or create_agent(db, AgentCreate(name="Miguel Gomes", email="alvesgomes@uni-wuppertal.de"))
    agent9 = get_agent(db, agent_id=9) or create_agent(db, AgentCreate(name="Andre Bröcker", email="abroecker@uni-wuppertal.de"))
    agent10 = get_agent(db, agent_id=10) or create_agent(db, AgentCreate(name="Sebastian Chmielewski", email="chmielewski@uni-wuppertal.de"))

    agents = [agent1, agent2, agent3, agent4, agent5, agent6, agent7, agent8, agent9, agent10]

    # Create Catalog
    catalog = get_catalog(db, catalog_id=1) or create_catalog(
        db,
        CatalogCreate(
            title="Semantic Data Catalog",
            description="A DCAT-compliant catalog with semantic models.",
            issued=datetime(2024, 12, 1),
            modified=datetime(2024, 12, 15),
            publisher_id=agent1.id,
        ),
    )

    # Create Datasets
    datasets = [
        {"title": "Temperature Dataset 1", "semantic_model": semantic_model_temp_1, "file_name": "semantic_model_temp-1.ttl"},
        {"title": "Temperature Dataset 2", "semantic_model": semantic_model_temp_2, "file_name": "semantic_model_temp-2.ttl"},
        {"title": "Temperature Dataset 3", "semantic_model": semantic_model_temp_3, "file_name": "semantic_model_temp-3.ttl"},
        {"title": "Dataset 4", "semantic_model": semantic_model_other, "file_name": "test_semantic_model.ttl"},
        {"title": "Dataset 5", "semantic_model": semantic_model_other, "file_name": "test_semantic_model.ttl"},
        {"title": "Dataset 6", "semantic_model": semantic_model_other, "file_name": "test_semantic_model.ttl"},
        {"title": "Dataset 7", "semantic_model": semantic_model_other, "file_name": "test_semantic_model.ttl"},
        {"title": "Dataset 8", "semantic_model": semantic_model_other, "file_name": "test_semantic_model.ttl"},
        {"title": "Dataset 9", "semantic_model": semantic_model_other, "file_name": "test_semantic_model.ttl"},
        {"title": "Dataset 10", "semantic_model": semantic_model_other, "file_name": "test_semantic_model.ttl"},
    ]

    for idx, dataset in enumerate(datasets, start=1):
        existing_dataset = get_dataset(db, dataset_id=idx)
        if not existing_dataset:
            create_dataset(
                db,
                DatasetCreate(
                    title=dataset["title"],
                    description=f"This is test dataset {idx}.",
                    identifier=f"dataset-{idx}",
                    issued=datetime(2024, 12, 1),
                    modified=datetime(2024, 12, 1),
                    publisher_id=agents[idx - 1].id,
                    contact_point_id=agents[idx - 1].id,
                    is_public=True,
                    access_url=f"http://localhost:3000/testpod{idx}s{idx}/dataset-{idx}.csv",
                    download_url=f"http://localhost:3000/testpod{idx}s{idx}/dataset-{idx}.csv",
                    file_format="text/csv" if idx % 2 == 0 else "application/json",
                    theme="http://example.org/themes/science",
                    semantic_model_file=dataset["semantic_model"],
                    semantic_model_file_name=dataset["file_name"],
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
