from pydantic import BaseModel
from typing import Optional
from datetime import datetime

# Schema for a Person
class PersonBase(BaseModel):
    name: str
    email: str
    phone_number: Optional[str] = None

class PersonCreate(PersonBase):
    pass

class Person(PersonBase):
    id: int

    class Config:
        orm_mode = True

# Schema for a Dataset
class DatasetBase(BaseModel):
    name: str
    description: Optional[str] = None
    incremental_replace: str
    is_public: bool
    file_path: Optional[str] = None 

class DatasetCreate(BaseModel):
    name: str
    description: Optional[str] = None
    creation_date: Optional[datetime] = None
    last_modified_date: Optional[datetime] = None
    incremental_replace: str
    owner_id: int
    contact_id: int
    is_public: bool = False
    file_path: Optional[str] = None
    file_blob: Optional[bytes] = None

    class Config:
        orm_mode = True

class Dataset(DatasetBase):
    id: int
    creation_date: datetime
    last_modified_date: datetime
    owner: Person
    contact: Person

    class Config:
        orm_mode = True

class DatasetUpdate(DatasetBase):
    pass

# Schema for a Dataspace
class DataspaceBase(BaseModel):
    name: str
    link: str

class DataspaceCreate(DataspaceBase):
    pass

class Dataspace(DataspaceBase):
    id: int

    class Config:
        orm_mode = True

# Schema for Pod
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