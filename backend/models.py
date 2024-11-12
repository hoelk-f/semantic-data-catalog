from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey, LargeBinary
from sqlalchemy.orm import relationship
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime

Base = declarative_base()

class Person(Base):
    __tablename__ = 'persons'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), nullable=False, unique=True)
    phone_number = Column(String(50))

    def __repr__(self):
        return f"<Person(name='{self.name}', email='{self.email}')>"

class Dataset(Base):
    __tablename__ = 'datasets'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(255), nullable=False)
    description = Column(String(1024))
    creation_date = Column(DateTime, default=datetime.utcnow, nullable=False)
    last_modified_date = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    incremental_replace = Column(String(50), nullable=False)
    owner_id = Column(Integer, ForeignKey('persons.id'), nullable=False)
    contact_id = Column(Integer, ForeignKey('persons.id'), nullable=False)
    is_public = Column(Boolean, default=False, nullable=False)
    file_path = Column(String(1024), nullable=True)
    file_blob = Column(LargeBinary, nullable=True)

    owner = relationship("Person", foreign_keys=[owner_id], backref="owned_datasets")
    contact = relationship("Person", foreign_keys=[contact_id], backref="contact_datasets")

    def __repr__(self):
        return f"<Dataset(name='{self.name}', owner='{self.owner.name}', public={self.is_public}, file_path='{self.file_path}')>"

class Pod(Base):
    __tablename__ = 'pods'

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(255), nullable=False)
    server_id = Column(Integer, ForeignKey('dataspaces.id'), nullable=False)
    path = Column(String(1024), nullable=False)

    server = relationship("Dataspace", back_populates="pods")

    def __repr__(self):
        return f"<Pod(name='{self.name}', server='{self.server.name}', path='{self.path}')>"

class Dataspace(Base):
    __tablename__ = 'dataspaces'

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(255), nullable=False)
    link = Column(String(1024), nullable=False)

    pods = relationship("Pod", back_populates="server")

    def __repr__(self):
        return f"<Dataspace(name='{self.name}', link='{self.link}')>"
