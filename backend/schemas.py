from pydantic import BaseModel
from typing import Optional
from datetime import datetime

# Schema für eine Person
class PersonBase(BaseModel):
    name: str
    email: str
    phone_number: Optional[str] = None

class PersonCreate(PersonBase):
    pass

class Person(PersonBase):
    id: int

    class Config:
        from_attributes = True  # Anpassung für Pydantic v2

# Schema für ein Dataset
class DatasetBase(BaseModel):
    name: str
    description: Optional[str] = None
    incremental_replace: str
    is_public: bool
    file_path: Optional[str] = None 

class DatasetCreate(DatasetBase):
    owner_id: int
    contact_id: int
    creation_date: Optional[datetime] = None
    last_modified_date: Optional[datetime] = None

class Dataset(DatasetBase):
    id: int
    creation_date: datetime
    last_modified_date: datetime
    owner: Person
    contact: Person

    class Config:
        from_attributes = True  # Anpassung für Pydantic v2

class DatasetUpdate(DatasetBase):
    pass