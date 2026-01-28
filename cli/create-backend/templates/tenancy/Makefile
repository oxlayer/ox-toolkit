.PHONY: help dev prod build up down restart logs clean db-migrate db-seed test

help: ## Show this help message
	@echo 'Usage: make [target]'
	@echo ''
	@echo 'Available targets:'
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  %-15s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

dev: ## Start development environment
	docker-compose up --build -d --remove-orphans

prod: ## Start production environment
	docker-compose -f docker-compose.prod.yml up --build -d

build: ## Build production image
	docker build -f Dockerfile -t {{PROJECT_SLUG}}:latest .

up: ## Start services
	docker-compose up -d

down: ## Stop services
	docker-compose down

down-prod: ## Stop production services
	docker-compose -f docker-compose.prod.yml down

restart: ## Restart services
	docker-compose restart

logs: ## Show logs from all services
	docker-compose logs -f

logs-api: ## Show logs from api
	docker-compose logs -f api

logs-db: ## Show logs from postgres
	docker-compose logs -f postgres

clean: ## Stop and remove all containers, networks, and volumes
	docker-compose down -v
	docker-compose -f docker-compose.prod.yml down -v

db-migrate: ## Run database migrations
	bun run db:migrate

db-seed: ## Seed database with sample data
	bun run db:seed

db-shell: ## Open PostgreSQL shell
	docker-compose exec postgres psql -U postgres -d {{DB_NAME}}

redis-shell: ## Open Redis CLI
	docker-compose exec redis redis-cli

test: ## Run tests
	bun test

test-unit: ## Run unit tests
	bun test src/**/*.unit.test.ts

test-integration: ## Run integration tests
	bun test src/**/*.integration.test.ts

test-coverage: ## Run tests with coverage
	bun test --coverage

health: ## Check health of all services
	@echo "Checking services health..."
	@curl -sf http://localhost:{{PORT}}/health || echo "API: DOWN"
	@docker-compose ps | grep -E "postgres|redis|rabbitmq"

rebuild: ## Rebuild and restart containers
	docker-compose up -d --build

ps: ## Show running containers
	docker-compose ps

stats: ## Show container resource usage
	docker stats
