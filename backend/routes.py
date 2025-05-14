from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from typing import List

from db import SessionLocal
from models import Event
from schemas import EventBase

app = FastAPI()

# vite
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # TODO frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@app.get("/api/hello")
def read_root():
    return {"message": "Hello from FastAPI! -- testing the reload"}


@app.get("/api/events", response_model=List[EventBase])
def get_events(db: Session = Depends(get_db)):
    return db.query(Event).all()
