# 🚀 Happy Balance - Quick Start Guide

## Option 1: One-Line Install (Recommended)

### For localhost access only:

```bash
curl -sSL https://raw.githubusercontent.com/alcibiadesc/happy-balance/main/docker-compose.yml | docker compose -f - up -d
```

Access at http://localhost:3000

### For remote/network access:

⚠️ **Important:** If you want to access Happy Balance from another device (like your phone, tablet, or another computer), you need to configure the URLs first.

1. **Find your server's IP address:**
```bash
# On Linux/Mac:
hostname -I | awk '{print $1}'

# On Windows (PowerShell):
(Get-NetIPAddress -AddressFamily IPv4 | Where-Object {$_.InterfaceAlias -notlike "*Loopback*"}).IPAddress
```

2. **Create a `.env` file:**
```bash
# Replace 192.168.1.100 with YOUR server's IP address
cat > .env << EOF
VITE_API_URL=http://192.168.1.100:3004/api
CORS_ORIGIN=http://192.168.1.100:3000
ORIGIN=http://192.168.1.100:3000
EOF
```

3. **Download and start:**
```bash
curl -sSL https://raw.githubusercontent.com/alcibiadesc/happy-balance/main/docker-compose.yml -o docker-compose.yml
docker compose up -d
```

4. **Access from any device on your network:**
   - Open browser and go to: `http://YOUR_SERVER_IP:3000`
   - Example: `http://192.168.1.100:3000`

## Option 2: Docker Run Commands

If you prefer individual Docker commands:

```bash
# 1. Create network
docker network create happy-balance-network

# 2. Start PostgreSQL
docker run -d \
  --name happy-balance-postgres \
  --network happy-balance-network \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=happy_balance \
  -v happy_balance_postgres_data:/var/lib/postgresql/data \
  --restart unless-stopped \
  postgres:17-alpine

# 3. Wait for PostgreSQL to be ready
sleep 10

# 4. Start Backend
docker run -d \
  --name happy-balance-backend \
  --network happy-balance-network \
  -p 3004:3004 \
  -e NODE_ENV=production \
  -e DATABASE_URL=postgresql://postgres:postgres@happy-balance-postgres:5432/happy_balance \
  -e JWT_ACCESS_SECRET=change-this-secret-key-in-production-minimum-32-characters-long \
  -e JWT_REFRESH_SECRET=change-this-refresh-key-in-production-minimum-32-characters-long \
  -e ADMIN_USERNAME=admin \
  -e ADMIN_PASSWORD=admin123 \
  -e PORT=3004 \
  -e CORS_ORIGIN=http://localhost:3000 \
  -v happy_balance_uploads_data:/app/uploads \
  --restart unless-stopped \
  alcibiadesc/happy-balance:backend

# 5. Start Frontend
docker run -d \
  --name happy-balance-frontend \
  --network happy-balance-network \
  -p 3000:3000 \
  -e NODE_ENV=production \
  -e VITE_API_URL=http://localhost:3004/api \
  -e PORT=3000 \
  -e ORIGIN=http://localhost:3000 \
  --restart unless-stopped \
  alcibiadesc/happy-balance:frontend
```

## Option 3: Copy & Paste Docker Compose

Create a file named `docker-compose.yml` with this content:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:17-alpine
    container_name: happy-balance-postgres
    restart: unless-stopped
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: happy_balance
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      retries: 5

  backend:
    image: alcibiadesc/happy-balance:backend
    container_name: happy-balance-backend
    restart: unless-stopped
    environment:
      NODE_ENV: production
      DATABASE_URL: postgresql://postgres:postgres@postgres:5432/happy_balance
      JWT_ACCESS_SECRET: change-this-secret-key-in-production-minimum-32-characters
      JWT_REFRESH_SECRET: change-this-refresh-key-in-production-minimum-32-chars
      ADMIN_USERNAME: admin
      ADMIN_PASSWORD: admin123
      PORT: 3004
      CORS_ORIGIN: http://localhost:3000
    ports:
      - "3004:3004"
    depends_on:
      postgres:
        condition: service_healthy
    volumes:
      - uploads_data:/app/uploads

  frontend:
    image: alcibiadesc/happy-balance:frontend
    container_name: happy-balance-frontend
    restart: unless-stopped
    environment:
      NODE_ENV: production
      VITE_API_URL: http://localhost:3004/api
      PORT: 3000
      ORIGIN: http://localhost:3000
    ports:
      - "3000:3000"
    depends_on:
      - backend

volumes:
  postgres_data:
  uploads_data:
```

Then run:
```bash
docker compose up -d
```

## 🔑 Default Credentials

- **Username:** admin
- **Password:** admin123

⚠️ **Important:** Change these credentials after first login!

## 📍 Access Points

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:3004/api

## 🛠️ Troubleshooting

### Check if containers are running:
```bash
docker ps
```

### View logs:
```bash
docker logs happy-balance-frontend
docker logs happy-balance-backend
docker logs happy-balance-postgres
```

### Stop and remove everything:
```bash
docker compose down -v
```

### Update to latest version:
```bash
docker compose pull
docker compose up -d
```

## 🔒 Security Notes

For production use, make sure to:

1. Change JWT secrets to random 32+ character strings
2. Change admin credentials
3. Use HTTPS with proper certificates
4. Configure firewall rules appropriately

## 📚 More Information

- [Full Documentation](https://github.com/alcibiadesc/happy-balance)
- [Docker Hub](https://hub.docker.com/r/alcibiadesc/happy-balance)
- [Report Issues](https://github.com/alcibiadesc/happy-balance/issues)