# Development Environment Setup

## Overview

This project uses an **isolated development environment** system that allows multiple developers to work on different features/branches simultaneously without conflicts, especially when using Git worktrees.

## Key Features

- **Ephemeral databases**: Each worktree/branch gets its own PostgreSQL database
- **Dynamic port allocation**: Automatic port assignment to avoid conflicts
- **Single command setup**: `pnpm run dev` sets up everything
- **Docker-based**: Database runs in Docker for consistency
- **Zero configuration**: Everything is configured automatically

## How It Works

### Workspace Detection

The system detects if you're working in:
- **Main repository**: Uses branch name as identifier
- **Git worktree**: Uses worktree name as identifier

Each workspace gets its own:
- Database instance: `happy_balance_[workspace_id]`
- Unique ports for database, backend, and frontend
- Environment configuration files

### Port Assignment

Ports are assigned based on a hash of the workspace ID:
- Database: `5432 + offset`
- Backend: `3000 + offset`
- Frontend: `5173 + offset`

This ensures consistent ports for each workspace while avoiding conflicts.

## Usage

### Start Development Environment

```bash
pnpm setup && pnpm dev
```

This two-step flow will:
1. Detect your workspace (main repo or worktree)
2. Generate unique ports for your workspace
3. Start a PostgreSQL database in Docker
4. Run database migrations
5. Start the backend server
6. Start the frontend server
7. Display all URLs and ports

Notes:
- On main: uses standard ports (5432, 3000, 5173). If Postgres is not running, a local Docker container is provisioned automatically.
- On worktrees: unique, deterministic ports are assigned and a dedicated Postgres container is provisioned per worktree.

### Clean Up

To stop everything, press `Ctrl+C`. The script will:
- Stop all servers
- Stop the Docker container
- Clean up gracefully

To completely remove Docker containers:

```bash
pnpm run dev:clean
```

## Working with Worktrees

### Create a New Worktree

```bash
# Create a new worktree for a feature
git worktree add ../expense-tracker-feature-x feature/new-feature

# Navigate to the worktree
cd ../expense-tracker-feature-x

# Install dependencies
pnpm install

# Start development environment
pnpm run dev
```

Each worktree will have:
- Its own database with isolated data
- Unique ports (no conflicts with other worktrees)
- Independent environment configuration

### Example Scenario

You can have multiple worktrees running simultaneously:

```
Main repository (main branch):
- Database: localhost:5432
- Backend: http://localhost:3000
- Frontend: http://localhost:5173

Worktree 1 (feature/payment-integration):
- Database: localhost:5867
- Backend: http://localhost:3435
- Frontend: http://localhost:5608

Worktree 2 (fix/csv-import):
- Database: localhost:6234
- Backend: http://localhost:3802
- Frontend: http://localhost:5975
```

## Docker Requirements

Make sure Docker is installed and running:

```bash
# Check Docker status
docker --version

# Start Docker Desktop (macOS)
open -a Docker
```

## Environment Files

The system automatically manages environment files:

### Backend (.env)
- `DATABASE_URL`: Points to workspace-specific database
- `PORT`: Unique backend port
- `CORS_ORIGIN`: Points to workspace-specific frontend

### Frontend (.env.local)
- `VITE_API_URL`: Points to workspace-specific backend
- `VITE_PORT`: Unique frontend port

## Troubleshooting

### Port Already in Use

The script automatically kills processes on required ports, but if issues persist:

```bash
# Manually kill a port (example for port 3000)
lsof -ti:3000 | xargs kill -9
```

### Database Connection Issues

```bash
# Check if Docker is running
docker ps

# Check specific workspace database
docker ps | grep expense-tracker-db-[workspace-id]

# View database logs
docker logs expense-tracker-db-[workspace-id]
```

### Reset Everything

```bash
# Stop all Docker containers
docker stop $(docker ps -q)

# Remove all expense-tracker containers
docker rm $(docker ps -a | grep expense-tracker | awk '{print $1}')

# Remove all expense-tracker volumes
docker volume rm $(docker volume ls | grep expense-tracker | awk '{print $2}')
```

## Legacy Mode

If you prefer the old development setup:

```bash
# Use the legacy development command
pnpm run dev:legacy
```

This uses a single shared database and fixed ports (not recommended for worktree development).

## Best Practices

1. **Always use `pnpm run dev`** instead of starting services individually
2. **Let the script manage ports** - don't hardcode ports in your code
3. **Use relative API URLs** in frontend code to work with dynamic ports
4. **Commit .env.example** files, not actual .env files
5. **Clean up Docker containers** when switching between major branches

## Architecture Benefits

- **Complete isolation**: No data conflicts between features
- **Parallel development**: Multiple developers can work simultaneously
- **Clean testing**: Each feature gets a fresh database
- **Easy cleanup**: Removing a worktree removes its database
- **Consistent environments**: Docker ensures same PostgreSQL version

## Additional Commands

```bash
# View all workspace databases
docker ps | grep expense-tracker-db

# Connect to a specific database
docker exec -it expense-tracker-db-[workspace-id] psql -U postgres -d happy_balance_[workspace_id]

# View Docker volumes
docker volume ls | grep expense-tracker

# Check which ports are in use
lsof -i -P | grep LISTEN
```