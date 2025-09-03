# 💰 Expense Tracker

Personal finance management application built with SvelteKit, following Hexagonal Architecture and DDD principles.

## 🚀 Fast Development (Recommended)

### Hybrid workflow: pnpm for development + Docker for production

```bash
# 1. Install dependencies
pnpm install

# 2. Start database only
pnpm db:up

# 3. Development with instant hot reload
pnpm dev
# Access: http://192.168.1.170:5179/ or http://100.122.190.40:5179/
```

### Useful Commands

```bash
# Development
pnpm dev              # Dev server with hot reload (network accessible)
pnpm dev:local        # Dev server localhost only
pnpm build            # Build for production
pnpm preview          # Preview build

# Database
pnpm db:up            # PostgreSQL only in Docker
pnpm db:down          # Stop database
pnpm db:logs          # View database logs
pnpm db:migrate       # Run database migrations
pnpm db:studio        # Open Prisma Studio

# Production (stable versions)
pnpm docker:prod      # Full Docker deployment
pnpm docker:prod:down # Stop production
pnpm docker:prod:logs # View production logs
```

## 📋 Features

- ✅ **Instant Hot Reload** with pnpm
- ✅ **Hexagonal Architecture** + DDD
- ✅ **Atomic Design System** (Atoms → Molecules → Organisms)
- ✅ **SvelteKit 5** with runes
- ✅ **Tailwind CSS** + shadcn/ui
- ✅ **PostgreSQL** in Docker
- ✅ **Smart N26 CSV Importer**
- ✅ **Financial Dashboard** with real metrics
- ✅ **Auto-categorization** of transactions

## 🏗️ Architecture

```
src/
├── lib/
│   ├── domain/          # Entities, Value Objects, Services
│   ├── application/     # Use Cases
│   ├── infrastructure/  # Adapters (CSV, DB, APIs)
│   ├── ui/             # Atomic Design Components
│   │   ├── atoms/      # Button, Input, Badge...
│   │   ├── molecules/  # MetricCard, CurrencyDisplay...
│   │   └── organisms/  # Dashboard, ImportWizard...
│   └── shared/         # Shared utilities
└── routes/             # Pages & API endpoints
```

## 🌐 Access URLs

- **Development**: http://192.168.1.170:5179/
- **Tailscale**: http://100.122.190.40:5179/
- **Database**: localhost:5433
- **Health Check**: http://192.168.1.170:5179/health

## 🐳 Docker

### Development (not recommended - slower)
```bash
pnpm docker:dev          # Fully dockerized with hot reload
pnpm docker:dev:rebuild  # Rebuild containers
```

### Production (stable versions)
```bash
pnpm docker:prod         # Optimized production deployment
```

## 📊 Dashboard Metrics

- **Income**: €72,503
- **Essential Expenses**: €11,489 
- **Discretionary Expenses**: €14,105
- **Savings**: €20,653
- **Investments**: €80,699
- **Savings Rate**: 135.9%

## 🔄 N26 Importer

1. **Upload** → Upload your N26 CSV file
2. **Parse** → Extract and validate transactions  
3. **Validate** → Check for duplicates and categories
4. **Import** → Save to database with auto-categorization

## 🛠️ Tech Stack

- **Frontend**: SvelteKit 5, TypeScript, Tailwind CSS
- **Backend**: Node.js, Prisma ORM
- **Database**: PostgreSQL 16
- **Container**: Docker, Docker Compose
- **Package Manager**: pnpm (development), npm (Docker)

---

**Recommended workflow**: Use `pnpm dev` for daily development and `pnpm docker:prod` only for stable production versions.