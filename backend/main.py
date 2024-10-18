from fastapi import FastAPI, Depends
from database import engine, Base
from models import Dataset, Person
from sqlalchemy.orm import Session
from database import SessionLocal
from crud import get_datasets
from schemas import Dataset
from fastapi.middleware.cors import CORSMiddleware

# Initialisiere die FastAPI-Anwendung
app = FastAPI()

# Datenbank-Session-Abhängigkeit
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Erstelle die Tabellen in der Datenbank, falls sie noch nicht existieren
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
