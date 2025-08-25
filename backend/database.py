from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.engine.url import make_url
from sqlalchemy.exc import ArgumentError
import os

# Fallback to the default database that ships with the docker-compose setup
DEFAULT_DATABASE_URL = (
    "mysql+pymysql://semantic_data_catalog:mNXZqSq4oK53Q7@db:3306/semantic_data_catalog"
)

# Validate the DATABASE_URL environment variable, falling back to the default if
# it is missing or malformed.  This avoids crashes when docker-compose provides
# an empty or otherwise unparsable value.
raw_database_url = os.getenv("DATABASE_URL")
if raw_database_url:
    try:
        # ``make_url`` raises ``ArgumentError`` if the value cannot be parsed
        # as a valid SQLAlchemy URL.
        make_url(raw_database_url)
        SQLALCHEMY_DATABASE_URL = raw_database_url
    except ArgumentError:
        SQLALCHEMY_DATABASE_URL = DEFAULT_DATABASE_URL
else:
    SQLALCHEMY_DATABASE_URL = DEFAULT_DATABASE_URL

engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

