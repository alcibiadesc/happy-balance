#!/bin/bash

# Happy Balance - Development Start Script
# This script ensures all services are running before starting dev mode

set -e

echo "🚀 Happy Balance - Starting Development Environment"
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

echo "✅ Docker is running"

# Start PostgreSQL if not running
if ! docker ps | grep -q happy-balance-postgres-dev; then
    echo "🔧 Starting PostgreSQL database..."
    docker compose -f docker-compose.dev.yml up -d postgres
    echo "⏳ Waiting for database to be healthy..."
    sleep 5
else
    echo "✅ PostgreSQL is already running"
fi

# Check database health
if docker ps --filter "name=happy-balance-postgres-dev" --format "{{.Status}}" | grep -q "healthy"; then
    echo "✅ Database is healthy"
else
    echo "⚠️  Database is starting... waiting a bit more..."
    sleep 5
fi

echo ""
echo "🎯 Environment ready! You can now:"
echo "   1. Start backend:  cd apps/backend && pnpm dev"
echo "   2. Start frontend: cd apps/frontend && pnpm dev"
echo "   3. Or run both:    pnpm dev (from root)"
echo ""
echo "📝 Login credentials:"
echo "   Username: admin"
echo "   Password: admin123"
echo ""
echo "🌐 URLs:"
echo "   Frontend: http://localhost:5173"
echo "   Backend:  http://localhost:14040/api"
echo "   Database: postgresql://postgres:postgres@localhost:15432/happy_balance_main"
echo ""

# Optionally start dev mode
read -p "🚀 Start dev mode now? (y/N) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    pnpm dev
fi
