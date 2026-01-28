# kadmin

## General presentation
This project is a quick db-backend-frontend project for organizing maths conferences. It handles past events, speakers, conference scripts, participants, and prospects for future conferences and their status, so the organizing team can effiently manage potential speakers and the status of making the event actually happen.

## TODO
[x] seed finished
[x] get routes backend only
[x] simple frontend for listing tables
[x] add/update/delete participant (no photo)
[x] add/update/delete event with script file management
[x] seed prospects
[x] add/update/delete prospects
[x] photos add participants
[] original filename for script instead of uuid
[] drag&drop uploads
[] photo at participant creation
[] display full picture on click
[] Speaker table with all info
[] Separate Event page with detail, speakers, participants, etc.
[] frontend beautification

Housekeeping & security
[] add identification
[] hardcorded DB URL
[] clean repo (venv, node modules)
[] manage passwords and users from envvars not in the docker-compose
[] input files in data (participants participantes, pictures, etc) should not be in the repo but elsewhere and uploaded by hand once when setting up the server

[] server setup

## Howto
### Local Testing from scratch

1. `docker compose up --build`
2. `docker compose exec backend python reset_db.py`
3. `docker compose exec backend python seed.py`
4. Go to `localhost:8000/api/hello` and/or `localhost:8000/api/db-check` to test the API 


### To sort
- uvicorn is run via docker-compose command
- vite dev server will run via docker-compose

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