from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey, LargeBinary
from sqlalchemy.orm import relationship
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime

Base = declarative_base()

class Dataset(Base):
    __tablename__ = 'datasets'

    identifier = Column(String(255), primary_key=True, nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(String(1024), nullable=True)
    issued = Column(DateTime, default=datetime.utcnow, nullable=False)
    modified = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    publisher = Column(String(255), nullable=False)
    contact_point = Column(String(255), nullable=False)
    access_url_dataset = Column(String(255), nullable=True)
    access_url_semantic_model = Column(String(255), nullable=True)
    file_format = Column(String(50), nullable=True)
    is_public = Column(Boolean, default=True, nullable=False)
    theme = Column(String(255), nullable=True)
    semantic_model_file = Column(LargeBinary, nullable=True)
    semantic_model_file_name = Column(String(255), nullable=True)
    catalog_id = Column(Integer, ForeignKey('catalogs.id'), nullable=True)
    webid = Column(String(255), nullable=True)

    catalog = relationship("Catalog", back_populates="datasets")

    def __repr__(self):
        return f"<Dataset(title='{self.title}', publisher='{self.publisher}', public={self.is_public})>"

class Catalog(Base):
    __tablename__ = 'catalogs'

    id = Column(Integer, primary_key=True, autoincrement=True)
    title = Column(String(255), nullable=False)
    description = Column(String(1024), nullable=True)
    issued = Column(DateTime, default=datetime.utcnow, nullable=False)
    modified = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    datasets = relationship("Dataset", back_populates="catalog")

    def __repr__(self):
        return f"<Catalog(title='{self.title}')>"
