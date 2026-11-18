.PHONY: install dev build preview lint test migrate-postgres

install:
	npm install

dev:
	npm run dev

build:
	npm run build

preview:
	npm run preview

lint:
	npm run lint

test:
	npm test

migrate-postgres:
	npm run db:migrate:postgres
