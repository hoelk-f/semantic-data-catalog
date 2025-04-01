from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class AgentBase(BaseModel):
    name: str
    email: Optional[str] = None
    phone_number: Optional[str] = None

class AgentCreate(AgentBase):
    pass

class Agent(AgentBase):
    id: int

    class Config:
        orm_mode = True

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
    publisher_id: int
    contact_point_id: int
    semantic_model_file: Optional[bytes] = None 
    catalog_id: Optional[int] = None

    class Config:
        orm_mode = True

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
        orm_mode = True

class Dataset(DatasetBase):
    identifier: str
    publisher: Agent
    contact_point: Agent
    semantic_model_file: Optional[str] = None

    class Config:
        orm_mode = True

class DataspaceBase(BaseModel):
    name: str
    link: str

class DataspaceCreate(DataspaceBase):
    pass

class Dataspace(DataspaceBase):
    id: int

    class Config:
        orm_mode = True

class PodBase(BaseModel):
    name: str
    server_id: int
    path: str

class PodCreate(PodBase):
    pass

class Pod(PodBase):
    id: int

    class Config:
        orm_mode = True

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
        orm_mode = True
