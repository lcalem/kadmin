from pathlib import Path

import datetime
import uuid

from fastapi import FastAPI, Depends, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from sqlalchemy import text
from sqlalchemy.orm import Session

from typing import List

from db import SessionLocal
from models import Event, Speaker, Participant, Prospect
from schemas import EventBase, SpeakerBase, ParticipantBase, ParticipantCreate, ParticipantUpdate, ProspectBase, ProspectCreate, ProspectUpdate

from utils import normalize_name


app = FastAPI()
UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

PHOTO_DIR = Path("data") / "photos-trombi"
PHOTO_DIR.mkdir(parents=True, exist_ok=True)
SPEAKER_PHOTO_DIR = Path("data") / "photos-speakers"
SPEAKER_PHOTO_DIR.mkdir(exist_ok=True)
EVENT_PHOTO_DIR = Path("data") / "photos-events"
EVENT_PHOTO_DIR.mkdir(exist_ok=True)
ALLOWED_PHOTO_EXTS = {".jpg", ".jpeg", ".png"}

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


# ------- SANITY CHECKS -------
@app.get("/api/db-check")
def db_check(db: Session = Depends(get_db)):
    result = db.execute(text("SELECT 1")).scalar()
    return {"db": "ok", "result": result}


@app.get("/api/hello")
def read_root():
    return {"message": "Hello from FastAPI! -- testing the reload 2"}


# ------- EVENT ROUTES -------
@app.get("/api/events", response_model=List[EventBase])
def get_events(db: Session = Depends(get_db)):
    return db.query(Event).order_by(Event.number.asc()).all()


@app.post("/api/events", response_model=EventBase)
async def create_event(
    number: int = Form(...),
    title: str = Form(...),
    date: str = Form(...),  # "YYYY-MM-DD"
    script: UploadFile | None = File(None),
    db: Session = Depends(get_db),
):
    # basic uniqueness check
    if db.query(Event).filter(Event.number == number).first():
        raise HTTPException(status_code=400, detail="Event number already exists")

    stored_files = None
    if script is not None:
        suffix = Path(script.filename).suffix.lower()  # keep extension
        stored_name = f"{uuid.uuid4().hex}{suffix}"
        stored_path = UPLOAD_DIR / stored_name

        with stored_path.open("wb") as f:
            while chunk := await script.read(1024 * 1024):
                f.write(chunk)

        stored_files = [stored_name]  # store internal file name(s)

    # parse date safely
    try:
        parsed_date = datetime.date.fromisoformat(date)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date (expected YYYY-MM-DD)")

    ev = Event(
        number=number,
        title=title,
        date=parsed_date,
        story=None,
        notes=None,
        script_files=stored_files,
    )
    db.add(ev)
    db.commit()
    db.refresh(ev)
    return ev


@app.get("/api/events/{event_id}/script")
def download_event_script(event_id: int, db: Session = Depends(get_db)):
    ev = db.query(Event).filter(Event.id == event_id).first()
    if not ev:
        raise HTTPException(status_code=404, detail="Event not found")

    if not ev.script_files or len(ev.script_files) == 0:
        raise HTTPException(status_code=404, detail="No script uploaded for this event")

    stored_name = ev.script_files[0]
    path = UPLOAD_DIR / stored_name
    if not path.exists():
        raise HTTPException(status_code=404, detail="Script missing on disk")

    return FileResponse(path=str(path), filename=stored_name)


@app.put("/api/events/{event_id}", response_model=EventBase)
async def update_event(
    event_id: int,
    number: int = Form(...),
    title: str = Form(...),
    date: str = Form(...),  # YYYY-MM-DD
    script: UploadFile | None = File(None),
    db: Session = Depends(get_db),
):
    ev = db.query(Event).filter(Event.id == event_id).first()
    if not ev:
        raise HTTPException(status_code=404, detail="Event not found")

    # number uniqueness check (allow keeping same number)
    existing = db.query(Event).filter(Event.number == number, Event.id != event_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Event number already exists")

    try:
        parsed_date = datetime.date.fromisoformat(date)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date (expected YYYY-MM-DD)")

    # update regular fields
    ev.number = number
    ev.title = title
    ev.date = parsed_date

    # optional: replace script (delete old)
    if script is not None:
        if ev.script_files and len(ev.script_files) > 0:
            old_name = ev.script_files[0]
            old_path = UPLOAD_DIR / old_name
            if old_path.exists():
                old_path.unlink()

        suffix = Path(script.filename).suffix.lower()
        stored_name = f"{uuid.uuid4().hex}{suffix}"
        stored_path = UPLOAD_DIR / stored_name

        with stored_path.open("wb") as f:
            while chunk := await script.read(1024 * 1024):
                f.write(chunk)

        ev.script_files = [stored_name]

    db.commit()
    db.refresh(ev)
    return ev


@app.delete("/api/events/{event_id}")
def delete_event(event_id: int, db: Session = Depends(get_db)):
    ev = db.query(Event).filter(Event.id == event_id).first()
    if not ev:
        raise HTTPException(status_code=404, detail="Event not found")

    # delete script file if present
    if ev.script_files and len(ev.script_files) > 0:
        stored_name = ev.script_files[0]
        path = UPLOAD_DIR / stored_name
        if path.exists():
            path.unlink()

    if ev.cover_photo:
        path = EVENT_PHOTO_DIR / ev.cover_photo
        if path.exists():
            path.unlink()

    db.delete(ev)
    db.commit()
    return {"ok": True}


@app.get("/api/events/{event_id}/cover")
def get_event_cover(event_id: int, db: Session = Depends(get_db)):
    ev = db.query(Event).filter(Event.id == event_id).first()
    if not ev:
        raise HTTPException(status_code=404, detail="Event not found")

    if not ev.cover_photo:
        raise HTTPException(status_code=404, detail="No cover for event")

    path = EVENT_PHOTO_DIR / ev.cover_photo
    if not path.exists():
        raise HTTPException(status_code=404, detail="Cover file missing on disk")

    return FileResponse(path=str(path))


@app.post("/api/events/{event_id}/cover", response_model=EventBase)
async def upload_event_cover(
    event_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    ev = db.query(Event).filter(Event.id == event_id).first()
    if not ev:
        raise HTTPException(status_code=404, detail="Event not found")

    if ev.number is None:
        raise HTTPException(status_code=400, detail="Event has no number")

    ext = Path(file.filename).suffix.lower()
    if ext not in ALLOWED_PHOTO_EXTS:
        raise HTTPException(status_code=400, detail="Unsupported file type")

    # ensure event folder exists
    event_folder = EVENT_PHOTO_DIR / str(ev.number)
    event_folder.mkdir(parents=True, exist_ok=True)

    # delete old cover file if present
    if ev.cover_photo:
        old_path = EVENT_PHOTO_DIR / ev.cover_photo
        if old_path.exists():
            old_path.unlink()

    # store new file
    filename = f"{ev.number}_title{ext}"
    rel_path = Path(str(ev.number)) / filename   # stored in DB
    abs_path = EVENT_PHOTO_DIR / rel_path

    with abs_path.open("wb") as f:
        while chunk := await file.read(1024 * 1024):
            f.write(chunk)

    # update DB
    ev.cover_photo = str(rel_path)
    db.commit()
    db.refresh(ev)

    return ev


# ------- SPEAKERS ROUTES -------
@app.get("/api/speakers", response_model=list[SpeakerBase])
def get_speakers(db: Session = Depends(get_db)):
    def last_name_key(name: str | None):
        if not name:
            return ""
        return name.strip().split()[-1].lower()

    speakers = db.query(Speaker).all()
    speakers.sort(key=lambda s: last_name_key(s.name))

    out = []
    for s in speakers:
        events = (
            db.query(Event)
              .filter(Event.speaker.any(Speaker.id == s.id))
              .all()
        )
        event_numbers = sorted([e.number for e in events if e.number is not None])

        out.append({
            "id": s.id,
            "name": s.name,
            "ktaname": s.ktaname,
            "labo": s.labo,
            "picture_file": s.picture_file,
            "event_numbers": event_numbers,
        })
    return out


@app.get("/api/speaker/{speaker_id}/picture")
def get_speaker_picture(speaker_id: int, db: Session = Depends(get_db)):
    s = db.query(Speaker).filter(Speaker.id == speaker_id).first()
    if not s:
        raise HTTPException(status_code=404, detail="Speaker not found")

    if not s.picture_file:
        raise HTTPException(status_code=404, detail="No picture for speaker")

    path = SPEAKER_PHOTO_DIR / s.picture_file
    if not path.exists():
        raise HTTPException(status_code=404, detail="Picture file missing on disk")

    return FileResponse(path=str(path))


@app.post("/api/speaker/{speaker_id}/picture", response_model=SpeakerBase)
async def upload_speaker_picture(
    speaker_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    s = db.query(Speaker).filter(Speaker.id == speaker_id).first()
    if not s:
        raise HTTPException(status_code=404, detail="Speaker not found")

    ext = Path(file.filename).suffix.lower()
    if ext not in ALLOWED_PHOTO_EXTS:
        raise HTTPException(status_code=400, detail="Unsupported file type")

    # delete old file if present
    if s.picture_file:
        old_path = SPEAKER_PHOTO_DIR / s.picture_file
        if old_path.exists():
            old_path.unlink()

    slug = normalize_name(s.name or "")
    filename = f"{slug}{ext}"
    stored_path = SPEAKER_PHOTO_DIR / filename

    with stored_path.open("wb") as f:
        while chunk := await file.read(1024 * 1024):
            f.write(chunk)

    s.picture_file = filename
    db.commit()
    db.refresh(s)

    events = db.query(Event).filter(Event.speaker.any(Speaker.id == s.id)).all()
    event_numbers = sorted([e.number for e in events if e.number is not None])

    return {
        "id": s.id,
        "name": s.name,
        "ktaname": s.ktaname,
        "labo": s.labo,
        "picture_file": s.picture_file,
        "event_numbers": event_numbers,
    }


# ------- PARTICIPANTS ROUTES -------
@app.get("/api/participants", response_model=List[ParticipantBase])
def get_participants(db: Session = Depends(get_db)):
    return db.query(Participant).all()


@app.get("/api/participants/{participant_id}/picture")
def get_participant_picture(participant_id: int, db: Session = Depends(get_db)):
    p = db.query(Participant).filter(Participant.id == participant_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Participant not found")

    if not p.picture_file:
        raise HTTPException(status_code=404, detail="No picture for participant")

    path = PHOTO_DIR / p.picture_file
    if not path.exists():
        raise HTTPException(status_code=404, detail="Picture file missing on disk")

    return FileResponse(path=str(path))


@app.post("/api/participants", response_model=ParticipantBase)
def create_participant(payload: ParticipantCreate, db: Session = Depends(get_db)):
    p = Participant(
        name=payload.name,
        ktaname=payload.ktaname,
        note=payload.note,
        is_plusone=payload.is_plusone,
        normalized_name=None,
        picture_file=None,
    )
    db.add(p)
    db.commit()
    db.refresh(p)
    return p


@app.put("/api/participants/{participant_id}", response_model=ParticipantBase)
def update_participant(participant_id: int, payload: ParticipantUpdate, db: Session = Depends(get_db)):
    p = db.query(Participant).filter(Participant.id == participant_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Participant not found")

    data = payload.model_dump(exclude_unset=True)
    for k, v in data.items():
        setattr(p, k, v)

    db.commit()
    db.refresh(p)
    return p


@app.post("/api/participants/{participant_id}/picture", response_model=ParticipantBase)
async def upload_participant_picture(
    participant_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    p = db.query(Participant).filter(Participant.id == participant_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Participant not found")

    ext = Path(file.filename).suffix.lower()
    if ext not in ALLOWED_PHOTO_EXTS:
        raise HTTPException(status_code=400, detail="Unsupported file type")

    # delete old file if present
    if p.picture_file:
        old_path = PHOTO_DIR / p.picture_file
        if old_path.exists():
            old_path.unlink()

    stored_name = f"{uuid.uuid4().hex}{ext}"
    stored_path = PHOTO_DIR / stored_name

    with stored_path.open("wb") as f:
        while chunk := await file.read(1024 * 1024):
            f.write(chunk)

    p.picture_file = stored_name
    db.commit()
    db.refresh(p)
    return p


@app.delete("/api/participants/{participant_id}")
def delete_participant(participant_id: int, db: Session = Depends(get_db)):
    p = db.query(Participant).filter(Participant.id == participant_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Participant not found")

    db.delete(p)
    db.commit()
    return {"ok": True}


# ------ PROSPECTS ROUTES ------
@app.get("/api/prospects", response_model=list[ProspectBase])
def get_prospects(db: Session = Depends(get_db)):
    return db.query(Prospect).order_by(Prospect.id.desc()).all()


@app.post("/api/prospects", response_model=ProspectBase)
def create_prospect(payload: ProspectCreate, db: Session = Depends(get_db)):
    p = Prospect(**payload.model_dump())
    db.add(p)
    db.commit()
    db.refresh(p)
    return p


@app.put("/api/prospects/{prospect_id}", response_model=ProspectBase)
def update_prospect(prospect_id: int, payload: ProspectUpdate, db: Session = Depends(get_db)):
    p = db.query(Prospect).filter(Prospect.id == prospect_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Prospect not found")

    data = payload.model_dump(exclude_unset=True)
    for k, v in data.items():
        setattr(p, k, v)

    db.commit()
    db.refresh(p)
    return p


@app.delete("/api/prospects/{prospect_id}")
def delete_prospect(prospect_id: int, db: Session = Depends(get_db)):
    p = db.query(Prospect).filter(Prospect.id == prospect_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Prospect not found")

    db.delete(p)
    db.commit()
    return {"ok": True}