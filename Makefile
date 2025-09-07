# Expense Tracker - Docker-First Development
# All commands run in Docker containers - no local dependencies needed!

.PHONY: help dev prod test clean

# Colors for output
BLUE := \033[34m
GREEN := \033[32m
YELLOW := \033[33m
RED := \033[31m
NC := \033[0m # No Color

# Default target
help: ## Show this help message
	@echo "${BLUE}💰 Expense Tracker - Docker Commands${NC}"
	@echo ""
	@echo "${GREEN}🚀 Development:${NC}"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | grep -E '^(dev|setup|status)' | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  ${BLUE}%-15s${NC} %s\n", $$1, $$2}'
	@echo ""
	@echo "${GREEN}🐘 Database:${NC}"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | grep -E '^(db-)' | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  ${BLUE}%-15s${NC} %s\n", $$1, $$2}'
	@echo ""
	@echo "${GREEN}🧪 Testing & Quality:${NC}"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | grep -E '^(test|lint)' | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  ${BLUE}%-15s${NC} %s\n", $$1, $$2}'
	@echo ""
	@echo "${GREEN}🏭 Production:${NC}"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | grep -E '^(prod)' | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  ${BLUE}%-15s${NC} %s\n", $$1, $$2}'
	@echo ""
	@echo "${GREEN}🧹 Maintenance:${NC}"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | grep -E '^(clean|logs)' | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  ${BLUE}%-15s${NC} %s\n", $$1, $$2}'

# Development
setup: ## 🚀 First-time setup (build and start development stack)
	@echo "${GREEN}🚀 Setting up Expense Tracker development environment...${NC}"
	docker compose -f docker-compose.dev.yml build
	docker compose -f docker-compose.dev.yml up -d
	@echo "${GREEN}✅ Setup complete!${NC}"
	@echo "${YELLOW}🌐 App: http://localhost:5179${NC}"
	@echo "${YELLOW}📊 PgAdmin: http://localhost:5050 (admin@expense-tracker.dev / admin)${NC}"

dev: ## 🔥 Start development with hot reload
	@echo "${GREEN}🔥 Starting development environment...${NC}"
	docker compose -f docker-compose.dev.yml up --build

dev-bg: ## 🔥 Start development in background
	@echo "${GREEN}🔥 Starting development in background...${NC}"
	docker compose -f docker-compose.dev.yml up -d --build
	@echo "${YELLOW}🌐 App: http://localhost:5179${NC}"

stop: ## ⏹️  Stop development environment
	docker compose -f docker-compose.dev.yml down

restart: ## 🔄 Restart development environment
	docker compose -f docker-compose.dev.yml restart

rebuild: ## 🔨 Rebuild and restart containers
	docker compose -f docker-compose.dev.yml up --build --force-recreate

shell: ## 🐚 Access app container shell
	docker compose -f docker-compose.dev.yml exec app sh

status: ## 📊 Show container status
	docker compose -f docker-compose.dev.yml ps

# Database
db-shell: ## 🐘 Access PostgreSQL shell
	docker compose -f docker-compose.dev.yml exec postgres psql -U expense_tracker -d expense_tracker

db-admin: ## 🖥️  Open PgAdmin web interface info
	@echo "${YELLOW}📊 PgAdmin: http://localhost:5050${NC}"
	@echo "${YELLOW}📧 Email: admin@expense-tracker.dev${NC}"
	@echo "${YELLOW}🔑 Password: admin${NC}"

db-logs: ## 📋 View database logs
	docker compose -f docker-compose.dev.yml logs -f postgres

db-reset: ## ⚠️  Reset database (destroys all data!)
	@echo "${RED}⚠️  This will destroy all data!${NC}"
	@echo -n "Are you sure? [y/N] " && read ans && [ $${ans:-N} = y ]
	docker compose -f docker-compose.dev.yml down -v
	docker compose -f docker-compose.dev.yml up -d postgres

# Testing & Quality
test: ## 🧪 Run tests inside container
	docker compose -f docker-compose.dev.yml exec app pnpm vitest

test-coverage: ## 📊 Run tests with coverage report
	docker compose -f docker-compose.dev.yml exec app pnpm vitest run --coverage

lint: ## 🔍 Check code quality (Prettier + ESLint)
	docker compose -f docker-compose.dev.yml exec app pnpm prettier --check .
	docker compose -f docker-compose.dev.yml exec app pnpm eslint .

lint-fix: ## 🔧 Fix code quality issues
	docker compose -f docker-compose.dev.yml exec app pnpm prettier --write .
	docker compose -f docker-compose.dev.yml exec app pnpm eslint . --fix

typecheck: ## 🔍 TypeScript type checking
	docker compose -f docker-compose.dev.yml exec app pnpm svelte-kit sync
	docker compose -f docker-compose.dev.yml exec app pnpm tsc --noEmit

# Production
prod: ## 🏭 Start production environment
	@echo "${GREEN}🏭 Starting production environment...${NC}"
	docker compose up -d --build
	@echo "${YELLOW}🌐 Production app: http://localhost:5179${NC}"

prod-logs: ## 📋 View production logs
	docker compose logs -f

prod-down: ## ⏹️  Stop production environment
	docker compose down

# Maintenance
logs: ## 📋 View development logs
	docker compose -f docker-compose.dev.yml logs -f

clean: ## 🧹 Clean up containers, volumes, and images
	@echo "${YELLOW}🧹 Cleaning up Docker resources...${NC}"
	docker compose -f docker-compose.dev.yml down -v
	docker compose down -v 2>/dev/null || true
	docker system prune -f
	@echo "${GREEN}✅ Cleanup complete!${NC}"

clean-all: ## 🔥 Nuclear clean (removes everything including images)
	@echo "${RED}🔥 This will remove ALL Docker resources for this project!${NC}"
	@echo -n "Are you sure? [y/N] " && read ans && [ $${ans:-N} = y ]
	docker compose -f docker-compose.dev.yml down -v --rmi all
	docker compose down -v --rmi all 2>/dev/null || true
	docker system prune -a -f

# Quick access URLs
urls: ## 🌐 Show all service URLs
	@echo "${GREEN}🌐 Service URLs:${NC}"
	@echo "  ${BLUE}App:${NC}         http://localhost:5179"
	@echo "  ${BLUE}PgAdmin:${NC}     http://localhost:5050"
	@echo "  ${BLUE}Database:${NC}    localhost:5433"