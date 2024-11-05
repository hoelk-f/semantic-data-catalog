from fastapi import FastAPI, Depends
from database import engine, Base
from models import Dataset, Person, Dataspace, Pod
from sqlalchemy.orm import Session
from database import SessionLocal
from crud import get_datasets, create_dataspace, get_dataspaces, delete_dataspace, get_pods, get_pods_by_dataspace_id  # Import get_pods_by_dataspace_id
from schemas import Dataset, Dataspace, DataspaceCreate, Pod  # Import Pod schema
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

Base.metadata.create_all(bind=engine)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Hello, Solid Data Catalogue!"}

@app.get("/datasets", response_model=list[Dataset])
def read_datasets(skip: int = 0, limit: int = 10, db: Session = Depends(get_db)):
    return get_datasets(db, skip=skip, limit=limit)

@app.post("/dataspaces", response_model=Dataspace)
def create_dataspace_entry(dataspace: DataspaceCreate, db: Session = Depends(get_db)):
    return create_dataspace(db, dataspace)

@app.get("/dataspaces", response_model=list[Dataspace])
def read_dataspaces(skip: int = 0, limit: int = 10, db: Session = Depends(get_db)):
    return get_dataspaces(db, skip=skip, limit=limit)

@app.delete("/dataspaces/{dataspace_id}", response_model=Dataspace)
def delete_dataspace_entry(dataspace_id: int, db: Session = Depends(get_db)):
    return delete_dataspace(db, dataspace_id)

@app.get("/pods", response_model=list[Pod])
def read_pods(skip: int = 0, limit: int = 10, db: Session = Depends(get_db)):
    return get_pods(db, skip=skip, limit=limit)

@app.get("/dataspaces/{dataspace_id}/pods", response_model=list[Pod])
def read_pods_by_dataspace(dataspace_id: int, db: Session = Depends(get_db)):
    return get_pods_by_dataspace_id(db, dataspace_id)
