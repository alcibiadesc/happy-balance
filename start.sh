#!/bin/bash
# Happy Balance - Quick Start Script
# Uses pre-built images from Docker Hub for fast deployment
#
# Usage:
#   ./start.sh          - Pull latest images and start (always pulls first)
#   ./start.sh --build  - Build images locally (slow, for development)
#   ./start.sh --update - Force pull and recreate containers
#   ./start.sh --stop   - Stop all services

set -e

cd "$(dirname "$0")"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    print_error "Docker is not running. Please start Docker first."
    exit 1
fi

case "${1:-}" in
    --stop)
        echo "🛑 Stopping services..."
        docker compose down
        print_status "Services stopped"
        exit 0
        ;;
    --build)
        echo "🔨 Building images locally (this may take a while)..."
        docker compose build backend frontend
        echo "🚀 Starting services..."
        docker compose up -d
        ;;
    --update)
        echo "📥 Force pulling latest images..."
        docker compose pull backend frontend
        echo "🚀 Starting services with new images..."
        docker compose up -d --force-recreate
        ;;
    *)
        # Default: always pull latest images, then start
        echo "🚀 Starting Happy Balance..."
        echo "📥 Pulling latest images..."
        docker compose pull
        docker compose up -d
        ;;
esac

# Wait for services
echo "⏳ Waiting for services to be ready..."
sleep 3

# Check health
BACKEND_HEALTHY=false
FRONTEND_HEALTHY=false
RETRIES=20

for i in $(seq 1 $RETRIES); do
    if docker compose ps backend | grep -q "healthy"; then
        BACKEND_HEALTHY=true
    fi
    if docker compose ps frontend | grep -q "healthy"; then
        FRONTEND_HEALTHY=true
    fi

    if $BACKEND_HEALTHY && $FRONTEND_HEALTHY; then
        break
    fi

    echo -ne "\r⏳ Waiting for health checks... ($i/$RETRIES)"
    sleep 2
done
echo ""

# Status report
echo ""
echo "📊 Service Status:"
docker compose ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}"

echo ""
if $BACKEND_HEALTHY && $FRONTEND_HEALTHY; then
    print_status "All services are healthy!"
else
    if ! $BACKEND_HEALTHY; then
        print_warning "Backend may still be starting..."
    fi
    if ! $FRONTEND_HEALTHY; then
        print_warning "Frontend may still be starting..."
    fi
fi

echo ""
echo "✅ Happy Balance is ready!"
echo ""
echo "   🌐 Frontend: http://localhost:${FRONTEND_PORT:-14080}"
echo "   🔌 Backend:  http://localhost:${BACKEND_PORT:-14040}"
echo "   🗄️  Database: localhost:${POSTGRES_PORT:-15432}"
echo ""
echo "Commands:"
echo "   ./start.sh --stop    Stop all services"
echo "   ./start.sh --update  Update to latest version"
echo "   docker compose logs  View logs"
