from fastapi import FastAPI, Depends
from database import engine, Base
from models import Dataset, Person, Dataspace
from sqlalchemy.orm import Session
from database import SessionLocal
from crud import get_datasets, create_dataspace, get_dataspaces, delete_dataspace
from schemas import Dataset, Dataspace, DataspaceCreate
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
    datasets = get_datasets(db, skip=skip, limit=limit)
    return datasets

@app.post("/dataspaces", response_model=Dataspace)
def create_dataspace_entry(dataspace: DataspaceCreate, db: Session = Depends(get_db)):
    return create_dataspace(db, dataspace)

@app.get("/dataspaces", response_model=list[Dataspace])
def read_dataspaces(skip: int = 0, limit: int = 10, db: Session = Depends(get_db)):
    return get_dataspaces(db, skip=skip, limit=limit)

@app.delete("/dataspaces/{dataspace_id}", response_model=Dataspace)
def delete_dataspace_entry(dataspace_id: int, db: Session = Depends(get_db)):
    return delete_dataspace(db, dataspace_id)
