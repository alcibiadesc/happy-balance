# 📦 Docker Installation Guide for Happy Balance

## 🚀 Quick Start with Docker Compose

### Prerequisites
- Docker and Docker Compose installed
- Git (to clone the repository)
- Portainer (optional, for GUI management)

### Installation Steps

#### 1. Clone the Repository
```bash
git clone https://github.com/alcibiadesc/happy-balance.git
cd happy-balance
```

#### 2. Configure Environment Variables
```bash
# Copy the Docker environment template
cp .env.docker .env

# Edit the .env file with your preferred settings
# IMPORTANT: Change all passwords and secrets in production!
nano .env
```

#### 3. Build and Start with Docker Compose
```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Stop and remove volumes (WARNING: Deletes all data)
docker-compose down -v
```

## 🎯 Installation with Portainer

### Method 1: Deploy from docker-compose.yml (Recommended)

1. **Access Portainer Dashboard**
   - Navigate to your Portainer instance (e.g., `http://your-server:9000`)
   - Select your Docker environment

2. **Create a New Stack**
   - Go to **Stacks** → **Add stack**
   - Name your stack: `happy-balance`

3. **Configure the Stack**

   **Option A: Git Repository (Recommended)**
   - Select **Git Repository**
   - Repository URL: `https://github.com/alcibiadesc/happy-balance.git`
   - Reference: `main` (or your preferred branch)
   - Compose path: `docker-compose.yml`

   **Option B: Web Editor**
   - Copy the contents of `docker-compose.yml`
   - Paste into the web editor

4. **Add Environment Variables**
   Click **Advanced mode** and add these environment variables:

   ```env
   # Database
   POSTGRES_USER=postgres
   POSTGRES_PASSWORD=your_secure_password_here
   POSTGRES_DB=happy_balance
   POSTGRES_PORT=5432

   # Backend
   BACKEND_PORT=3004
   NODE_ENV=production

   # Frontend
   FRONTEND_PORT=5173
   VITE_API_URL=http://your-server-ip:3004/api

   # CORS (adjust to your domain)
   CORS_ORIGIN=http://your-server-ip:5173

   # Security (CHANGE THESE!)
   JWT_ACCESS_SECRET=generate-a-random-32-char-string-here
   JWT_REFRESH_SECRET=generate-another-random-32-char-string-here

   # Admin Account (CHANGE THESE!)
   ADMIN_USERNAME=admin
   ADMIN_PASSWORD=your_admin_password_here
   ```

5. **Deploy the Stack**
   - Review your configuration
   - Click **Deploy the stack**
   - Wait for all services to start (check the logs)

### Method 2: Deploy Individual Containers

If you prefer to manage containers individually:

1. **Create Network**
   - Go to **Networks** → **Add network**
   - Name: `happy-balance`
   - Driver: `bridge`

2. **Deploy PostgreSQL**
   - Go to **Containers** → **Add container**
   - Image: `postgres:17-alpine`
   - Name: `happy-balance-db`
   - Network: `happy-balance`
   - Environment variables:
     ```
     POSTGRES_USER=postgres
     POSTGRES_PASSWORD=your_password
     POSTGRES_DB=happy_balance
     ```
   - Volumes: Create a volume mapping `/var/lib/postgresql/data`
   - Restart policy: `unless-stopped`

3. **Deploy Backend**
   - Build the image first (if not using pre-built):
     ```bash
     cd backend
     docker build -t happy-balance-backend .
     ```
   - In Portainer, go to **Containers** → **Add container**
   - Image: `happy-balance-backend`
   - Name: `happy-balance-backend`
   - Network: `happy-balance`
   - Port mapping: `3004:3004`
   - Environment variables (as listed above)
   - Restart policy: `unless-stopped`

4. **Deploy Frontend**
   - Build the image first:
     ```bash
     docker build -t happy-balance-frontend .
     ```
   - Deploy similarly to backend
   - Port mapping: `5173:5173`

## 🔧 Configuration Options

### Database Persistence
The PostgreSQL data is stored in a Docker volume. To backup:
```bash
# Backup database
docker exec happy-balance-db pg_dump -U postgres happy_balance > backup.sql

# Restore database
docker exec -i expense-tracker-db psql -U postgres happy_balance < backup.sql
```

### SSL/HTTPS Configuration
For production, use a reverse proxy like Nginx or Traefik:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:5173;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /api {
        proxy_pass http://localhost:3004;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Resource Limits (Optional)
Add to your docker-compose.yml services:
```yaml
deploy:
  resources:
    limits:
      cpus: '0.5'
      memory: 512M
    reservations:
      cpus: '0.25'
      memory: 256M
```

## 🔍 Health Checks & Monitoring

### Check Service Status
```bash
# Via Docker
docker-compose ps
docker-compose logs backend
docker-compose logs frontend
docker-compose logs postgres

# Via Portainer
# Navigate to Containers → View logs/stats for each container
```

### API Health Check
```bash
# Backend health
curl http://localhost:3004/health

# Frontend
curl http://localhost:5173
```

## 📱 First Login

1. Navigate to `http://your-server:5173`
2. Login with the admin credentials you configured
3. **IMPORTANT**: Change the admin password immediately after first login

## 🛠️ Troubleshooting

### Common Issues

1. **Database connection failed**
   - Ensure PostgreSQL container is running
   - Check DATABASE_URL in backend environment
   - Verify network connectivity between containers

2. **CORS errors**
   - Update CORS_ORIGIN in backend environment
   - Include your frontend URL

3. **Port conflicts**
   - Change BACKEND_PORT and FRONTEND_PORT in .env
   - Update docker-compose.yml accordingly

4. **Permission errors**
   - Ensure proper file permissions
   - The containers run as non-root user (nodeuser)

### Reset Everything
```bash
# Stop and remove all containers and volumes
docker-compose down -v

# Rebuild from scratch
docker-compose build --no-cache
docker-compose up -d
```

## 🔒 Security Recommendations

1. **Change all default passwords**
2. **Use strong JWT secrets** (minimum 32 characters)
3. **Enable HTTPS** in production
4. **Restrict database port** (don't expose 5432 publicly)
5. **Regular backups** of the PostgreSQL volume
6. **Keep Docker images updated**

## 📊 Portainer Stack Template

Save this as a Portainer template for easy deployment:

```json
{
  "version": "2",
  "templates": [
    {
      "type": 3,
      "title": "Happy Balance - Expense Tracker",
      "description": "Personal finance management application",
      "note": "Remember to change all passwords and secrets!",
      "categories": ["finance", "productivity"],
      "platform": "linux",
      "logo": "https://raw.githubusercontent.com/alcibiadesc/happy-balance/main/static/logo/happy-balance-logo.png",
      "repository": {
        "url": "https://github.com/alcibiadesc/happy-balance",
        "stackfile": "docker-compose.yml"
      },
      "env": [
        {
          "name": "POSTGRES_PASSWORD",
          "label": "Database Password",
          "description": "PostgreSQL password (CHANGE THIS!)",
          "default": "change_me_now"
        },
        {
          "name": "JWT_ACCESS_SECRET",
          "label": "JWT Access Secret",
          "description": "Secret for JWT tokens (min 32 chars)",
          "default": "change-this-to-a-very-long-random-string"
        },
        {
          "name": "ADMIN_PASSWORD",
          "label": "Admin Password",
          "description": "Initial admin password (CHANGE AFTER LOGIN!)",
          "default": "change_me_immediately"
        }
      ]
    }
  ]
}
```

## 📞 Support

- **GitHub Issues**: [https://github.com/alcibiadesc/happy-balance/issues](https://github.com/alcibiadesc/happy-balance/issues)
- **Documentation**: Check the `/docs` folder in the repository

---

**Happy tracking your finances! 💰**