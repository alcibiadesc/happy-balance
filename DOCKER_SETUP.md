# 🐳 Docker Development Environment Setup

This guide will help you set up a reproducible development environment for Happy Balance using Docker, SvelteKit, Prisma, and PostgreSQL.

## 🚀 Quick Start

### Prerequisites

- Docker and Docker Compose installed on your system
- Git (to clone the repository)

### One-Command Setup

1. **Clone the repository**

   ```bash
   git clone <your-repo-url>
   cd expense-tracker
   ```

2. **Create environment file** (optional - has sensible defaults)

   ```bash
   # Create a .env.local file for custom configuration (optional)
   cat > .env.local << EOF
   POSTGRES_PASSWORD=password
   POSTGRES_PORT=5432
   API_PORT=3000
   FRONTEND_PORT=5173
   NODE_ENV=development
   ENABLE_SEED_DATA=true
   EOF
   ```

3. **Start the environment**
   ```bash
   docker compose up
   ```

That's it! The application will be available at:

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000
- **Database**: localhost:5432

## 🔥 Features

### ✅ Hot Reloading

- Frontend automatically reloads when you modify `.svelte`, `.ts`, `.js`, or `.css` files
- Backend automatically restarts when you modify backend source files
- Tailwind CSS changes are instantly reflected
- Configuration changes are automatically picked up

### ✅ Database Management

```bash
# Run migrations
docker compose exec app pnpm prisma migrate dev

# Reset database with seed data
docker compose exec app pnpm prisma migrate reset

# Access database directly
pnpm docker:db
```

### ✅ Development Tools

```bash
# View logs
pnpm docker:logs

# Access container shell
pnpm docker:shell

# Stop everything
pnpm docker:down

# Clean up (removes volumes and containers)
pnpm docker:clean
```

## 📁 Project Structure in Docker

```
/app/                          # Container working directory
├── src/                       # Frontend source (mounted)
├── backend/                   # Backend source (mounted)
│   ├── src/                  # Backend TypeScript source
│   ├── prisma/               # Database schema and migrations
│   └── package.json          # Backend dependencies
├── package.json              # Root workspace configuration
└── docker/                   # Docker configuration
    └── Dockerfile.dev        # Development Dockerfile
```

## 🔧 Environment Variables

The Docker setup uses these environment variables with sensible defaults:

| Variable            | Default    | Description                 |
| ------------------- | ---------- | --------------------------- |
| `POSTGRES_PASSWORD` | `password` | PostgreSQL password         |
| `POSTGRES_PORT`     | `5432`     | Database port               |
| `API_PORT`          | `3000`     | Backend API port            |
| `FRONTEND_PORT`     | `5173`     | Frontend dev server port    |
| `ENABLE_SEED_DATA`  | `true`     | Create sample data on setup |

## 📊 Database Schema & Seeding

The environment automatically:

1. Creates the PostgreSQL database
2. Runs Prisma migrations
3. Generates the Prisma client
4. Seeds the database with:
   - Default categories (Food, Transportation, etc.)
   - App settings (currency, preferences)
   - Sample transactions (if `ENABLE_SEED_DATA=true`)

## 🛠️ Development Workflow

### Making Code Changes

1. Edit files in `src/` (frontend) or `backend/src/` (backend)
2. Changes are automatically detected and servers restart/reload
3. Database changes require running migrations

### Database Changes

1. Modify `backend/prisma/schema.prisma`
2. Create migration: `docker compose exec app pnpm prisma migrate dev`
3. Migration is applied automatically

### Adding Dependencies

1. Add to `package.json` or `backend/package.json`
2. Restart containers: `docker compose restart app`
3. Or rebuild: `docker compose up --build`

## 🚨 Troubleshooting

### Database Connection Issues

```bash
# Check database status
docker compose exec postgres pg_isready -U postgres

# View database logs
docker compose logs postgres

# Reset everything
pnpm docker:clean && docker compose up
```

### Build Issues

```bash
# Force rebuild
docker compose up --build --force-recreate

# Clear Docker cache
docker system prune -a
```

### Port Conflicts

```bash
# Check if ports are in use
lsof -i :5173  # Frontend
lsof -i :3000  # Backend
lsof -i :5432  # Database

# Modify ports in .env.local if needed
```

## 📋 Available Scripts

| Script                | Description                               |
| --------------------- | ----------------------------------------- |
| `pnpm docker:up`      | Start the development environment         |
| `pnpm docker:down`    | Stop the environment                      |
| `pnpm docker:logs`    | View application logs                     |
| `pnpm docker:shell`   | Access container shell                    |
| `pnpm docker:db`      | Connect to PostgreSQL                     |
| `pnpm docker:migrate` | Run database migrations                   |
| `pnpm docker:seed`    | Run database seeding                      |
| `pnpm docker:reset`   | Reset database with migrations            |
| `pnpm docker:clean`   | Clean up everything (containers, volumes) |

## 🔄 Migration Management

### Creating Migrations

```bash
# After modifying schema.prisma
docker compose exec app sh -c "cd backend && pnpm prisma migrate dev --name your-migration-name"
```

### Applying Migrations in Team

```bash
# When pulling new migrations from git
docker compose exec app sh -c "cd backend && pnpm prisma migrate dev"
```

### Reset Everything

```bash
# Reset database and apply all migrations
docker compose exec app sh -c "cd backend && pnpm prisma migrate reset"
```

## 🎯 Production Considerations

This setup is optimized for development. For production:

1. Use the production Dockerfile stages
2. Set `NODE_ENV=production`
3. Use secure passwords and environment variables
4. Consider using managed database services
5. Implement proper logging and monitoring

## 🤝 Team Development

### Sharing the Environment

1. Commit your changes to git
2. Team members run: `git pull && docker compose up --build`
3. Migrations are automatically applied
4. Everyone has the same environment

### Best Practices

- Always commit schema changes with migrations
- Use `docker compose up --build` when pulling dependency changes
- Reset database locally if schema conflicts occur
- Keep `.env.local` out of version control (already in .gitignore)
