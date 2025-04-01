from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

# Agent
class AgentBase(BaseModel):
    name: str
    email: Optional[str] = None
    phone_number: Optional[str] = None

class AgentCreate(AgentBase):
    pass

class Agent(AgentBase):
    id: int
    class Config:
        from_attributes = True

# Dataset
class DatasetBase(BaseModel):
    title: str 
    description: Optional[str] = None 
    identifier: str 
    issued: Optional[datetime] = None 
    modified: Optional[datetime] = None 
    is_public: bool = False
    access_url_dataset: Optional[str] = None 
    access_url_semantic_model: Optional[str] = None 
    file_format: Optional[str] = None 
    theme: Optional[str] = None 
    semantic_model_file_name: Optional[str] = None 

class DatasetCreate(DatasetBase):
    publisher: str
    contact_point: str
    semantic_model_file: Optional[bytes] = None 
    catalog_id: Optional[int] = None
    class Config:
        from_attributes = True

class DatasetUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    identifier: Optional[str] = None
    issued: Optional[datetime] = None
    modified: Optional[datetime] = None
    is_public: Optional[bool] = None
    access_url_dataset: Optional[str] = None
    access_url_semantic_model: Optional[str] = None
    file_format: Optional[str] = None
    theme: Optional[str] = None
    semantic_model_file_name: Optional[str] = None
    semantic_model_file: Optional[bytes] = None
    class Config:
        from_attributes = True

class Dataset(DatasetBase):
    identifier: str
    publisher: str
    contact_point: str
    semantic_model_file: Optional[str] = None
    class Config:
        from_attributes = True

# Catalog
class CatalogBase(BaseModel):
    title: str 
    description: Optional[str] = None 
    issued: Optional[datetime] = None 
    modified: Optional[datetime] = None 

class CatalogCreate(CatalogBase):
    publisher_id: int

class Catalog(CatalogBase):
    id: int
    publisher: Agent
    datasets: List[Dataset] = []
    class Config:
        from_attributes = True
