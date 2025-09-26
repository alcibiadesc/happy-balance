# Docker Setup for Expense Tracker

This guide explains how to run the Expense Tracker application using Docker with proper environment variable configuration.

## Quick Start

1. **Copy environment file:**
   ```bash
   cp .env.docker .env
   ```

2. **⚠️ IMPORTANT: Update credentials in `.env`:**
   - Change `POSTGRES_PASSWORD`
   - Change `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET`
   - Change `ADMIN_USERNAME` and `ADMIN_PASSWORD`

3. **Start the application:**
   ```bash
   docker-compose up -d
   ```

4. **Initialize the database:**
   ```bash
   # Run database migrations
   docker-compose exec backend npm run db:push

   # Create admin user
   docker-compose exec backend npm run seed:admin
   ```

5. **Access the application:**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3004
   - Database: localhost:5432

## Environment Variables

### Admin User Configuration

The admin user is automatically created using environment variables:

```env
# Default admin credentials (CHANGE IN PRODUCTION!)
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
```

### Security Variables (CRITICAL - CHANGE IN PRODUCTION!)

```env
# JWT Secrets (minimum 32 characters)
JWT_ACCESS_SECRET=super-secret-access-key-min-32-chars-change-in-production
JWT_REFRESH_SECRET=super-secret-refresh-key-min-32-chars-change-in-production

# Database password
POSTGRES_PASSWORD=postgres_secure_password_change_me
```

### Optional Variables

```env
# Ports
BACKEND_PORT=3004
FRONTEND_PORT=5173
POSTGRES_PORT=5432

# Database
POSTGRES_USER=postgres
POSTGRES_DB=happy_balance

# API
VITE_API_URL=http://localhost:3004/api
CORS_ORIGIN=http://localhost:5173

# File uploads
MAX_FILE_SIZE=10485760
UPLOAD_DIR=uploads
```

## Admin User Management

### Create/Update Admin User

The admin user is created automatically when the backend starts. You can also manually trigger it:

```bash
# Using Docker
docker-compose exec backend npm run seed:admin

# Or locally (in backend directory)
npm run seed:admin
```

### Customize Admin Credentials

Set environment variables before starting:

```bash
# Option 1: Set in .env file
ADMIN_USERNAME=myadmin
ADMIN_PASSWORD=mysecurepassword

# Option 2: Set inline
ADMIN_USERNAME=myadmin ADMIN_PASSWORD=mysecurepassword docker-compose up -d
```

## Development vs Production

### Development Setup

```bash
# Use development compose file
docker-compose -f .docker-compose.main.yml up -d

# Or use default docker-compose.yml with development settings
NODE_ENV=development docker-compose up -d
```

### Production Setup

1. **Generate secure secrets:**
   ```bash
   # Generate JWT secrets (minimum 32 characters)
   openssl rand -base64 32
   ```

2. **Update .env with production values:**
   ```env
   NODE_ENV=production
   ADMIN_USERNAME=your_admin_username
   ADMIN_PASSWORD=your_secure_admin_password
   JWT_ACCESS_SECRET=your_generated_access_secret
   JWT_REFRESH_SECRET=your_generated_refresh_secret
   POSTGRES_PASSWORD=your_secure_db_password
   ```

3. **Use production compose:**
   ```bash
   docker-compose -f docker-compose.prod.yml up -d
   ```

## Troubleshooting

### Check Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f postgres
```

### Reset Database

```bash
# Stop services
docker-compose down

# Remove database volume
docker volume rm expense-tracker_postgres_data

# Restart and reinitialize
docker-compose up -d
docker-compose exec backend npm run db:push
docker-compose exec backend npm run seed:admin
```

### Check Admin User

```bash
# Connect to database
docker-compose exec postgres psql -U postgres -d happy_balance

# Check users table
SELECT username, role, "isActive" FROM users;
```

## Security Best Practices

1. **Always change default passwords in production**
2. **Use strong, unique JWT secrets (minimum 32 characters)**
3. **Use environment-specific `.env` files**
4. **Never commit `.env` files to version control**
5. **Regularly rotate JWT secrets**
6. **Use HTTPS in production**
7. **Limit CORS origins to trusted domains**

## Available Scripts

```bash
# Database
docker-compose exec backend npm run db:push     # Apply schema changes
docker-compose exec backend npm run db:migrate  # Run migrations
docker-compose exec backend npm run db:reset    # Reset database

# Admin user
docker-compose exec backend npm run seed:admin  # Create/update admin user

# Development
docker-compose exec backend npm run dev         # Start dev server
docker-compose exec backend npm run lint        # Run linter
docker-compose exec backend npm run typecheck   # Type checking
```