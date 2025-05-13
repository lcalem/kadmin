.PHONY: up down build logs backend frontend db

up:
	docker-compose up -d

down:
	docker-compose down

build:
	docker-compose build

logs:
	docker-compose logs -f

backend:
	docker-compose exec backend bash

frontend:
	docker-compose exec frontend sh

db:
	docker-compose exec db psql -U user -d appdb