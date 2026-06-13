include backend/.env.sample
export PATH := $(PATH):$(HOME)/go/bin:/usr/local/go/bin #so that make is able to find the golang-migrate tool
export

.PHONY: up down db-up db-down seed init

up:
	docker compose up -d --wait

down:
	docker compose down

db-up:
	migrate -database "$(DATABASE_URL)" -path "./backend/database/migrations" up

db-down:
	migrate -database "$(DATABASE_URL)" -path "./backend/database/migrations" down

seed:
	docker exec -i pg_database psql -U "$(POSTGRES_USER)" -d "$(POSTGRES_DB)" < ./backend/database/config_seed.sql

init:up db-up seed
