from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey, LargeBinary
from sqlalchemy.orm import relationship
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime

Base = declarative_base()

class Agent(Base):
    __tablename__ = 'agents'

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), nullable=True)
    phone_number = Column(String(50), nullable=True)

    def __repr__(self):
        return f"<Agent(name='{self.name}', email='{self.email}')>"

class Dataset(Base):
    __tablename__ = 'datasets'

    id = Column(Integer, primary_key=True, autoincrement=True)
    title = Column(String(255), nullable=False)
    description = Column(String(1024), nullable=True)
    identifier = Column(String(255), unique=True, nullable=False)
    issued = Column(DateTime, default=datetime.utcnow, nullable=False)
    modified = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    publisher_id = Column(Integer, ForeignKey('agents.id'), nullable=False)
    contact_point_id = Column(Integer, ForeignKey('agents.id'), nullable=False)
    access_url_dataset = Column(String(255), nullable=True)
    access_url_semantic_model = Column(String(255), nullable=True)
    file_format = Column(String(50), nullable=True)
    is_public = Column(Boolean, default=False, nullable=False)
    theme = Column(String(255), nullable=True)
    semantic_model_file = Column(LargeBinary, nullable=True)
    semantic_model_file_name = Column(String(255), nullable=True)
    catalog_id = Column(Integer, ForeignKey('catalogs.id'), nullable=True)

    publisher = relationship("Agent", foreign_keys=[publisher_id], backref="published_datasets")
    contact_point = relationship("Agent", foreign_keys=[contact_point_id], backref="contact_datasets")
    catalog = relationship("Catalog", back_populates="datasets")

    def __repr__(self):
        return f"<Dataset(title='{self.title}', publisher='{self.publisher.name}', public={self.is_public})>"

class Dataspace(Base):
    __tablename__ = 'dataspaces'

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(255), nullable=False)
    link = Column(String(1024), nullable=False)

    def __repr__(self):
        return f"<Dataspace(name='{self.name}', link='{self.link}')>"

class Pod(Base):
    __tablename__ = 'pods'

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(255), nullable=False)
    server_id = Column(Integer, ForeignKey('dataspaces.id'), nullable=False)
    path = Column(String(1024), nullable=False)

    server = relationship("Dataspace", backref="pods")

    def __repr__(self):
        return f"<Pod(name='{self.name}', server='{self.server.name}', path='{self.path}')>"

class Catalog(Base):
    __tablename__ = 'catalogs'

    id = Column(Integer, primary_key=True, autoincrement=True)
    title = Column(String(255), nullable=False)  # dct:title
    description = Column(String(1024), nullable=True)  # dct:description
    issued = Column(DateTime, default=datetime.utcnow, nullable=False)  # dct:issued
    modified = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)  # dct:modified
    publisher_id = Column(Integer, ForeignKey('agents.id'), nullable=False)  # dct:publisher

    publisher = relationship("Agent", backref="catalogs")
    datasets = relationship("Dataset", back_populates="catalog")

    def __repr__(self):
        return f"<Catalog(title='{self.title}', publisher='{self.publisher.name}')>"
