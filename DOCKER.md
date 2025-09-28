# Docker Setup

## Prerequisites
- Docker & Docker Compose

## Installation

### 1. Clone repository
```bash
git clone https://github.com/alcibiadesc/happy-balance.git
cd happy-balance
```

### 2. Build and run
```bash
docker-compose up -d --build
```

### 3. Access
- Frontend: http://localhost:3000
- Backend: http://localhost:3004
- Database: localhost:5432

## Configuration

Edit `docker-compose.yml` to change:
- Ports
- Passwords
- Environment variables

## Commands

```bash
# Start
docker-compose up -d

# Stop
docker-compose down

# Logs
docker-compose logs -f

# Rebuild
docker-compose build --no-cache
```

## Production

For production, change in `docker-compose.yml`:
- All passwords
- JWT secrets
- Remove database port exposure
- Add SSL/TLS via reverse proxy