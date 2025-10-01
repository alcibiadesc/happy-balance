# 🚀 Development Quick Start

Quick guide to get Happy Balance running locally for development.

## Prerequisites

- Node.js 20+
- pnpm (`npm install -g pnpm`)
- Docker (for PostgreSQL)

## One-Command Start

```bash
# Start PostgreSQL + Backend + Frontend in one command
pnpm dev
```

That's it! The script will automatically:
- ✅ Install dependencies if needed
- ✅ Start PostgreSQL in Docker
- ✅ Generate Prisma client
- ✅ Push database schema
- ✅ Start backend on http://localhost:3004
- ✅ Start frontend on http://localhost:5173

## Manual Setup (if pnpm dev fails)

### 1. Start PostgreSQL

```bash
pnpm db:start
```

### 2. Setup Database

```bash
cd apps/backend
npx prisma generate
npx prisma db push
```

### 3. Start Backend

```bash
cd apps/backend
pnpm dev
```

### 4. Start Frontend (in another terminal)

```bash
cd apps/frontend
pnpm dev
```

## Default Credentials

- **Username:** `admin`
- **Password:** `admin123`

⚠️ The admin user is created automatically when the backend starts.

## Environment Variables

Backend `.env` (already configured):
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/happy_balance"
PORT=3004
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
JWT_ACCESS_SECRET=dev-secret-key-minimum-32-characters-long-for-jwt-access
JWT_REFRESH_SECRET=dev-refresh-key-minimum-32-characters-long-for-jwt-refresh
```

## Common Issues

### Port 3004 already in use

```bash
# Stop Docker containers
docker compose down

# Or kill process on port
lsof -ti:3004 | xargs kill -9
```

### Database connection error

```bash
# Restart PostgreSQL
pnpm db:stop
pnpm db:start

# Wait 10 seconds, then try again
```

### Admin user not found

The admin user is created automatically on backend startup. If login fails:

1. Check backend logs for errors
2. Restart the backend (`Ctrl+C` and `pnpm dev` again)
3. Verify PostgreSQL is running: `docker ps | grep happy-balance-db`

## Stop Everything

```bash
# Stop dev servers: Ctrl+C in terminal

# Stop PostgreSQL
pnpm db:stop
```

## Database Management

```bash
# Start PostgreSQL
pnpm db:start

# Stop PostgreSQL
pnpm db:stop

# Reset database (deletes all data!)
pnpm db:reset

# Run migrations
pnpm db:migrate

# Seed sample data
pnpm db:seed
```

## Access Points

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:3004/api
- **API Docs:** http://localhost:3004/api-docs
- **PostgreSQL:** localhost:5432 (user: postgres, password: postgres)

## Next Steps

- Read [docs/DEVELOPMENT.md](./docs/DEVELOPMENT.md) for detailed development guide
- Check [CONTRIBUTING.md](./CONTRIBUTING.md) for contribution guidelines
