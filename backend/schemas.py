from pydantic import BaseModel, ConfigDict
from typing import List, Optional
import datetime


class EventBase(BaseModel):
    id: int
    number: int
    title: str
    date: datetime.date
    story: Optional[str]
    notes: Optional[str]
    cover_photo: Optional[str] = None
    script_files: Optional[List[str]]

    model_config = ConfigDict(from_attributes=True)


class SpeakerBase(BaseModel):
    id: int
    name: Optional[str] = None
    ktaname: Optional[str] = None
    labo: Optional[str] = None
    picture_file: Optional[str] = None
    
    event_numbers: List[int] = []

    model_config = ConfigDict(from_attributes=True)


class ParticipantBase(BaseModel):
    id: int
    name: Optional[str] = None
    normalized_name: Optional[str] = None
    ktaname: Optional[str] = None
    note: Optional[str] = None
    is_plusone: Optional[bool] = None
    picture_file: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class ParticipantCreate(BaseModel):
    name: str
    ktaname: Optional[str] = None
    note: Optional[str] = None
    is_plusone: bool = False


class ParticipantUpdate(BaseModel):
    name: Optional[str] = None
    ktaname: Optional[str] = None
    note: Optional[str] = None
    is_plusone: Optional[bool] = None


class ProspectBase(BaseModel):
    id: int
    name: Optional[str] = None
    approached: Optional[str] = None
    response: Optional[str] = None
    domain: Optional[str] = None
    suggested_by: Optional[str] = None
    remarks: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class ProspectCreate(BaseModel):
    name: str
    approached: Optional[str] = None
    response: Optional[str] = None
    domain: Optional[str] = None
    suggested_by: Optional[str] = None
    remarks: Optional[str] = None


class ProspectUpdate(BaseModel):
    name: Optional[str] = None
    approached: Optional[str] = None
    response: Optional[str] = None
    domain: Optional[str] = None
    suggested_by: Optional[str] = None
    remarks: Optional[str] = None