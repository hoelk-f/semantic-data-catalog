from fastapi import FastAPI
from database import engine, Base
from models import Dataset, Person

# Initialisiere die FastAPI-Anwendung
app = FastAPI()

# Erstelle die Tabellen in der Datenbank, falls sie noch nicht existieren
Base.metadata.create_all(bind=engine)

@app.get("/")
def read_root():
    return {"message": "Hello, Solid Data Catalogue!"}