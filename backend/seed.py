import datetime
import os
from pprint import pprint

from db import SessionLocal, engine, Base
from models import Event, Participant, Speaker
from sqlalchemy.exc import IntegrityError


# Part 1 : read base data to create events first, gather speaker data
def create_speakers_and_events(db):
    try:
        events_dir = "data/descentes/"
        for name in os.listdir(events_dir):
            full_path = os.path.join(events_dir, name)
            if os.path.isdir(full_path):
                print(f"Subdirectory: {full_path}")

                for root, dirs, files in os.walk(full_path):
                    print(f"📁 Current directory: {root}")
                    print(f"📁 Sub directories: {dirs}")
                    print(f"📄 Files: {files}")

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
                        d, m, y = tuple(int(x) for x in info['Date'].split('-'))

                    # optional fields: story, notes, script
                    if 'recit.md' in files:
                        with open(os.path.join(root, 'recit.md')) as f: text_story = f.read()
                        info['story'] = text_story

                    if 'notes.md' in files:
                        with open(os.path.join(root, 'notes.md')) as f: text_notes = f.read()
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
                    speaker = Speaker(name=info['Orateur'], ktaname=info['Pseudo'], labo=['Labo'])
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


# Part 2: add participants - retro add participants to previously created events
def create_participants(db):
    pass
    # # Add sample participants
    # alice = Participant(name="Alice", email="alice@example.com")
    # bob = Participant(name="Bob", email="bob@example.com")
    # db.add_all([alice, bob])
    # db.commit()


if __name__ == '__main__':
    # create tables if needed
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    create_speakers_and_events(db)
    create_participants(db)

    print("Database seeded!")
    db.close()
