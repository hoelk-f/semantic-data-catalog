from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.engine.url import make_url
from sqlalchemy.exc import ArgumentError
import logging
import os

logger = logging.getLogger(__name__)

DEFAULT_DATABASE_URL = "mysql+pymysql://semantic_data_catalog:mNXZqSq4oK53Q7@db:3306/semantic_data_catalog"

def get_database_url() -> str:
    raw_database_url = os.getenv("DATABASE_URL")
    if raw_database_url:
        try:
            make_url(raw_database_url)
            return raw_database_url
        except ArgumentError:
            logger.warning("Invalid DATABASE_URL %r provided; using default", raw_database_url)
    else:
        logger.info("DATABASE_URL not set; using default MySQL database")
    return DEFAULT_DATABASE_URL

SQLALCHEMY_DATABASE_URL = get_database_url()

engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


