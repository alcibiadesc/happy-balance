# 🐳 Happy Balance - Docker Deployment Guide

## 📦 Quick Start

### Production Deployment (Recommended for Users)

```bash
# 1. Pull pre-built images from Docker Hub
docker compose pull

# 2. Start all services
docker compose up -d

# 3. Access the application
# Frontend: http://localhost:3000
# Backend API: http://localhost:3004
# Default credentials: admin / admin123
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file to customize settings:

```env
# Database
POSTGRES_PASSWORD=your-secure-password

# Backend
JWT_ACCESS_SECRET=your-super-secret-jwt-key-32chars
JWT_REFRESH_SECRET=your-super-secret-refresh-key-32chars
ADMIN_PASSWORD=your-secure-password
CORS_ORIGIN=*

# Ports (optional)
FRONTEND_PORT=3000
BACKEND_PORT=3004
```

## 🚀 Commands

```bash
# Start services
docker compose up -d

# Stop services
docker compose down

# View logs
docker compose logs -f

# Check status
docker compose ps

# Update to latest version
docker compose pull && docker compose up -d
```

## 📊 Image Sizes

- Backend: **675MB** (70% smaller than v1!)
- Frontend: **570MB**
- Total: **~1.24GB**

---
Built with ❤️ using Docker best practices
