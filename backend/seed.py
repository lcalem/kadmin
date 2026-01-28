import csv
import datetime
import os
import re
import unicodedata
from pathlib import Path
from typing import Literal

from db import SessionLocal, engine, Base
from models import Event, Participant, Speaker, Prospect
from sqlalchemy.exc import IntegrityError

BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"
EVENTS_DIR = DATA_DIR / "descentes"
PARTICIPANTS_CSV = DATA_DIR / "participants-participantes.csv"
PHOTO_DIR = DATA_DIR / "photos-trombi"
PROSPECTS_CSV = DATA_DIR / "orateurs-oratrices-potentiels.csv"

NameOrigin = Literal["freeform", "filename"]


# Part 1 : read base data to create events first, gather speaker data
def create_speakers_and_events(db):
    try:
        for name in os.listdir(EVENTS_DIR):
            full_path = os.path.join(EVENTS_DIR, name)
            if os.path.isdir(full_path):
                print(f"Subdirectory: {full_path}")

                for root, dirs, files in os.walk(full_path):
                    print(f"Current directory: {root}")
                    print(f"Sub directories: {dirs}")
                    print(f"Files: {files}")

                    info = {
                        'number': root.split(os.path.sep)[-1].split('-')[0],
                        'story': None,
                        'notes': None,
                        'script': None
                    }
                    with open(os.path.join(root, 'info')) as file_info:
                        for line in file_info:
                            parts = line.strip().split()
                            info[parts[0]] = " ".join(parts[1:])

                    if info['Date'] == 'Nuit du 21 au 22 décembre 2019':
                        d, m, y = (21, 12, 2019)  # flemme
                    else:
                        date_parts = info['Date'].split('-')
                        d, m, y = int(date_parts[0]), int(date_parts[1]), int(date_parts[2])

                    # optional fields: story, notes, script
                    if 'recit.md' in files:
                        with open(os.path.join(root, 'recit.md')) as f:
                            text_story = f.read()
                        info['story'] = text_story

                    if 'notes.md' in files:
                        with open(os.path.join(root, 'notes.md')) as f:
                            text_notes = f.read()
                        info['notes'] = text_notes
                    
                    if 'script' in dirs:
                        script_files = list()
                        for filename in os.listdir(os.path.join(root, 'script')):
                            script_path = os.path.join(root, 'script', filename)
                            print(script_path)
                            script_files.append(script_path)
                        info['script'] = script_files

                    # pprint(info)

                    # create speaker
                    speaker = Speaker(name=info['Orateur'], 
                                      ktaname=info['Pseudo'], 
                                      labo=info['Labo'])
                    db.add(speaker)
                    db.commit()

                    # create event with speaker
                    event = Event(
                        number=info['number'],
                        title=info['Titre'],
                        date=datetime.date(y, m, d),
                        story=info['story'],
                        notes=info['notes'],
                        script_files=info['script'],
                        speaker=[speaker]
                    )
                    db.add(event)
                    db.commit()
                    break

    except IntegrityError:
        db.rollback()
        print("maybe duplicate detected")


def normalize_name(name: str, origin: NameOrigin = "freeform") -> str:
    """
    Normalizes names to firstname_lastname for photo matching.
    Émilie du Châtelet -> emilie_du-chatelet
    Antoine Chambert-Loir -> antoine_chambert-loir
    Haëtham Al Aswad -> haetham_al-aswad

    Freeform origin is name written humanly
    Filename origin is photo names with - and _ swapped
    """
    name = name.strip().lower()

    # strip accents
    name = unicodedata.normalize("NFKD", name)
    name = "".join(c for c in name if not unicodedata.combining(c))

    if origin == "freeform":
        # parts (treat space, -, _ as separator)
        name = re.sub(r"[_]", " ", name)
        parts = re.split(r"\s+", name)
        if len(parts) == 1:
            return parts[0]

        first = parts[0]
        last = "-".join(parts[1:])

        return f"{first}_{last}"
    
    if origin == "filename":
        # split by -
        first, last = name.split('-', 1)
        first = first.replace("_", "-")
        last = last.replace("_", "-")
        return f"{first}_{last}"


def build_photo_index(photo_dir: Path) -> dict[str, Path]:
    """
    Returns map from normalized name (firstname-lastname) to filepath
    Assumes photo filenames are already with normalized name
    """
    photo_index: dict[str, Path] = {}
    for p in photo_dir.iterdir():
        if not p.is_file():
            continue
        if p.suffix.lower() not in {".jpg", ".jpeg", ".png"}:
            continue
        photo_index[normalize_name(p.stem, origin="filename")] = p
    return photo_index


# Part 2: add participants - retro add participants to previously created events
def create_participants(db):
    photo_index = build_photo_index(PHOTO_DIR)
    events_by_number = {e.number: e for e in db.query(Event).all()}

    with open(PARTICIPANTS_CSV, 'r') as csvfile:
        reader = csv.DictReader(csvfile)

        for row in reader:
            name = row['État civil'].strip()
            normalized_name = normalize_name(name)
            pseudo = row['Pseudo'].strip()
            note = row['Relation aux ordanisateurs'].strip()
            plusone = row["Est un +1 de l'orateur"].strip() == "1"
            event_ids = row['Descentes'].strip()

            # find photo if exists
            picture_filepath = photo_index.get(normalized_name)

            # create participant if doesn't already exist
            participant = (db.query(Participant).filter(Participant.normalized_name == normalized_name).first())
            if participant is None:
                participant = Participant(name=name,
                                          normalized_name=normalized_name,
                                          ktaname=pseudo,
                                          note=note,
                                          is_plusone=plusone,
                                          picture_file=str(picture_filepath))
                db.add(participant)
                db.flush()

            # link to events
            if event_ids:
                event_numbers = [int(x.strip()) for x in event_ids.split(',')]
                for event_number in event_numbers:
                    event = events_by_number.get(event_number)
                    if event and participant not in event.participants:
                        event.participants.append(participant)

        db.commit()


def create_prospects(db):
    if not os.path.exists(PROSPECTS_CSV):
        print(f"[seed] prospects CSV not found: {PROSPECTS_CSV}")
        return

    with open(PROSPECTS_CSV, "r") as f:
        reader = csv.DictReader(f)

        # strip *...*
        def norm_cell(h: str) -> str:
            h = (h or "").strip()
            h = re.sub(r"^\*+|\*+$", "", h)
            return h

        reader.fieldnames = [norm_cell(h) for h in reader.fieldnames]

        for row in reader:
            name = norm_cell(row.get("Orateur/Oratrice"))
            if not name:
                continue

            approached = row.get("Approché.e")
            response = row.get("Réponse")
            domain = row.get("Domaine")
            suggested_by = row.get("Suggéré par")
            remarks = row.get("Remarques")

            db.add(
                Prospect(
                    name=name,
                    approached=approached,
                    response=response,
                    domain=domain,
                    suggested_by=suggested_by,
                    remarks=remarks,
                )
            )

        db.commit()


if __name__ == '__main__':
    # create tables if needed
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    create_speakers_and_events(db)
    create_participants(db)
    create_prospects(db)

    print("Database seeded!")
    db.close()
