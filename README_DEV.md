# 🛠️ Happy Balance - Development Guide

## 🚀 Quick Start

### Option 1: Using the dev script (Recommended)
```bash
./dev.sh
```

### Option 2: Manual setup
```bash
# 1. Start PostgreSQL
docker compose -f docker-compose.dev.yml up -d postgres

# 2. Wait for database to be healthy (5-10 seconds)
docker ps

# 3. Start development
pnpm dev
```

## 📋 Prerequisites

- **Docker Desktop** - Must be running
- **Node.js 18+** and **pnpm**
- Ports available: `5173` (frontend), `14040` (backend), `15432` (database)

## 🔐 Default Credentials

```
Username: admin
Password: admin123
```

## 🌐 Service URLs

| Service | URL | Description |
|---------|-----|-------------|
| Frontend | http://localhost:5173 | SvelteKit app |
| Backend | http://localhost:14040/api | NestJS API |
| Database | localhost:15432 | PostgreSQL |

## 🐛 Troubleshooting

### "Can't reach database server at localhost:15432"

**Solution:**
```bash
# Check if Docker is running
docker ps

# Start PostgreSQL
docker compose -f docker-compose.dev.yml up -d postgres

# Wait 5 seconds for database to initialize
sleep 5

# Verify it's healthy
docker ps --filter "name=happy-balance-postgres-dev"
```

### "Port already in use"

**Solution:**
```bash
# Find what's using the port
lsof -i :5173  # or :14040, :15432

# Kill the process or use different ports in .env files
```

### "Cannot connect with admin credentials"

**Solution:**
1. Make sure backend is running: `cd apps/backend && pnpm dev`
2. Check backend logs for errors
3. Verify database is healthy: `docker ps`
4. Try resetting: `docker compose -f docker-compose.dev.yml down && docker volume rm happy_balance_postgres_dev_data`

### Fresh start (reset everything)

```bash
# Stop all containers
docker compose -f docker-compose.dev.yml down

# Remove volumes (this deletes ALL data)
docker volume rm happy_balance_postgres_dev_data

# Start fresh
./dev.sh
```

## 📦 Project Structure

```
happy-balance/
├── apps/
│   ├── backend/          # NestJS API (Port 14040)
│   │   ├── src/
│   │   ├── prisma/
│   │   └── .env
│   └── frontend/         # SvelteKit app (Port 5173)
│       ├── src/
│       └── .env.local
├── docker-compose.dev.yml
└── dev.sh               # Quick start script
```

## 🔧 Development Commands

```bash
# Root level (recommended)
pnpm dev                 # Start both frontend and backend
pnpm build              # Build both apps
pnpm test               # Run all tests

# Backend only
cd apps/backend
pnpm dev                # Start backend (localhost:14040)
pnpm test               # Run backend tests
pnpm prisma studio      # Open Prisma Studio

# Frontend only
cd apps/frontend
pnpm dev                # Start frontend (localhost:5173)
pnpm test               # Run frontend tests
pnpm build              # Build for production
```

## 🗃️ Database Management

```bash
# View data in Prisma Studio
cd apps/backend
pnpm prisma studio

# Create migration
pnpm prisma migrate dev --name your_migration_name

# Reset database (deletes all data!)
pnpm prisma migrate reset

# View database directly
docker exec -it happy-balance-postgres-dev psql -U postgres -d happy_balance_main
```

## 🎨 Recent Features Added

### ✅ Search Improvements
- Case/accent/whitespace insensitive search
- "cafe" finds "Café", "senor" finds "Señor"

### ✅ Advanced Filters
- Filter by uncategorized + income/expenses
- Filter by primary category types (income, essential, discretionary, investment, debt_payment, no_compute)

### ✅ Dashboard Improvements
- **Annual view by default** (better BI practices)
- Charts show **last 12 months** for trend analysis
- Fixed expense distribution (Essential/Discretionary/Debt Payments)

### ✅ Visual Improvements
- Better chart contrast in light mode
- Related transactions color-coded (green=income, red=expenses)
- Cleaner grid lines and axis labels

### ✅ BreakdownCard Component
- Tabbed interface for Expenses/Income/Investments
- Dynamic breakdown by category with percentages
- Unified component replacing separate cards

## 📝 Git Commits

Recent improvements (7 commits):
1. `8117156` - Search improvements (case/accent/whitespace insensitive)
2. `16412e8` - Fix expense distribution
3. `4b5fd7b` - Improve related transactions colors
4. `f2136a8` - Advanced filtering with primary types
5. `fed674d` - Chart contrast and visual clarity
6. `cda1010` - Dashboard annual view + 12-month charts
7. `897076b` - BreakdownCard with type selector

## 🆘 Need Help?

1. **Check Docker is running**: `docker ps`
2. **Check database health**: `docker ps --filter "name=postgres"`
3. **View backend logs**: `cd apps/backend && pnpm dev`
4. **View frontend logs**: `cd apps/frontend && pnpm dev`
5. **Reset everything**: `docker compose -f docker-compose.dev.yml down -v && ./dev.sh`

## 🌟 Pro Tips

- Use `./dev.sh` for automatic setup
- Keep Docker Desktop running while developing
- Use `pnpm prisma studio` to view/edit database visually
- Check `apps/backend/.env` and `apps/frontend/.env.local` for config
- Frontend HMR works on port 5173 with instant updates
- Backend auto-restarts on file changes

Happy coding! 🎉
