# kadmin

## General presentation
This project is a quick db-backend-frontend project for organizing maths conferences. It handles past events, speakers, conference scripts, participants, and prospects for future conferences and their status, so the organizing team can effiently manage potential speakers and the status of making the event actually happen.

### Features
- Manage past events with speakers and participants
- Manage prospective future speakers
- Download past event scripts if any

## TODO

- [x] Seed finished
- [x] Backend GET routes
- [x] Simple frontend for listing tables
- [x] Add / update / delete participant (no photo)
- [x] Add / update / delete event with script file management
- [x] Seed prospects
- [x] Add / update / delete prospects
- [x] Add photos to participants

- [ ] Store original script filename instead of UUID
- [ ] Drag & drop uploads
- [ ] Photo at participant creation
- [ ] Display full picture on click
- [ ] Speaker table with all info
- [ ] Separate Event page with details (speakers, participants, etc.)

Frontend beautification:
- [x] Select color background and font
- [x] Make a start page where we can select one of the 4 pages
- [x] Make a prettier table for the Participants, still with the ability to edit stuff and add new people
- [x] Beautify add form
- [x] Beautify edit form
- [x] Ability to upload a picture from the add form
- [x] Make a prettier Speakers page where each speaker is a bubble and the title is the name, pseudonym and laboratory expand when hovering?
- [x] update picture to speakers
- [x] seed with all the pictures.
- [x] Uploaded pictures should maybe go in the data with a name that's parsable by the seed.py instead of a uuid so the data folder is movable as-is to a new server
- [ ] Make a prettier Events page where each event is a bubble with a picture
- [ ] On click, each event is a separate page with more information, prettier download buttons for the script files, upload button for the script file, edit button
- [ ] Add Event that also creates a speaker, with a picture
- [ ] Simple but themed prospects table where all the information is visible at once
- [ ] static image background when I have it 
- [ ] sort speakers and participants by name, events by number

### Housekeeping & security

- [ ] Add authentication
- [ ] Remove hardcoded DB URL
- [x] Clean repo (venv, node_modules)
- [ ] Manage passwords/users via env vars (not docker-compose)
- [x] Input files (participants, photos, etc.) not in repo; uploaded once at server setup

- [ ] Server setup

### Low prio
- [ ] The sorting of speakers by last name with a single name field is good for now but brittle: split speaker name into first_name and last_name would be better
- [ ] Title centering on Speakers/Events pages?
- [ ] Beautify form button and Edit/delete buttons
- [ ] In order to merge the two build photo index functions in seed.py, we should switch to all normalized names first-name_last-name for photos _on disk_ first by sweeping the photos-trombi at the beginning of seed.py. Then we can treat photo names as normalized correctly afterwards


## Howto
### Local Testing from scratch

Inputs:
- This repo (git clone)
- The data folder given as project input (not in the repo):
```text
data/
├── descentes/
│   ├── 01-xxx/
│   │   ├── info                # text file with event metadata
│   │   └── script/
│   │       ├── script-final.pdf
│   │       └── script-final.tex
│   └── 02-yyy/
│       └── ...
│
├── photos-trombi/
│   ├── prenom-nom.jpg
│   ├── prenom-nom.png
│   └── ...
│
├── orateurs-oratrices-potentiels.csv
└── participants-participantes.csv
```

1. Build containers : `docker compose up --build`
2. Reset database if needed : `docker compose exec backend python reset_db.py`
3. Seed database : `docker compose exec backend python seed.py`
4. Go to `localhost:8000/api/hello` and/or `localhost:8000/api/db-check` to test the API 


## Tech stack

- DB: PostgreSQL 15
- Backend:
    - API server: FastAPI
    - ASGI server: Uvcorn
    - ORM: SQLAlchemy
- Frontend:
    - dev server/bundler: Vite 5
    - UI framework: React 18
- Orchestration: docker with docker compose