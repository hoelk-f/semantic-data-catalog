from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.declarative import declarative_base
import os

# Fallback to the default database that ships with the docker-compose setup
DEFAULT_DATABASE_URL = (
    "mysql+pymysql://semantic_data_catalog:mNXZqSq4oK53Q7@db:3306/semantic_data_catalog"
)

SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL") or DEFAULT_DATABASE_URL

engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

