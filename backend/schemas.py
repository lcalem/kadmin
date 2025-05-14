from pydantic import BaseModel
from typing import List, Optional
import datetime


class EventBase(BaseModel):
    id: int
    number: int
    title: str
    date: datetime.date
    story: Optional[str]
    notes: Optional[str]
    script_files: Optional[List[str]]

    class Config:
        orm_mode = True
