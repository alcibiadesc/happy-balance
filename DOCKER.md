# Docker Setup

## Quick Start (Build locally)

```bash
# Clone and run
git clone https://github.com/alcibiadesc/happy-balance.git
cd happy-balance
docker-compose up -d --build
```

Access:
- Frontend: http://localhost:3000
- Backend: http://localhost:3004
- Login: admin / admin123

## Using Pre-built Images

```bash
# Use production compose file
docker-compose -f docker-compose.prod.yml up -d
```

## Files

- `docker-compose.yml` - Builds from source code (recommended)
- `docker-compose.prod.yml` - Uses pre-built images from Docker Hub
- `Dockerfile` - Frontend build
- `backend/Dockerfile` - Backend build

## Important Variables

```yaml
# Database
POSTGRES_USER: postgres
POSTGRES_PASSWORD: postgres  # CHANGE IN PRODUCTION!

# Backend
JWT_ACCESS_SECRET: your-secret-key  # CHANGE IN PRODUCTION!
JWT_REFRESH_SECRET: your-refresh-key  # CHANGE IN PRODUCTION!
ADMIN_USERNAME: admin
ADMIN_PASSWORD: admin123  # CHANGE IN PRODUCTION!
CORS_ORIGIN: http://localhost:3000,http://localhost:5173

# Frontend
VITE_API_URL: http://localhost:3004/api
```

## Commands

```bash
# Start
docker-compose up -d --build

# Stop
docker-compose down

# Clean everything
docker-compose down -v

# View logs
docker-compose logs -f [service]

# Rebuild specific service
docker-compose build --no-cache [service]
```

## Production Notes

1. Change ALL passwords and secrets
2. Use environment variables or .env file
3. Don't expose PostgreSQL port (remove ports from postgres service)
4. Use reverse proxy (nginx/traefik) for SSL
5. Set up backup strategy for postgres_data volume