#!/bin/bash

# Happy Balance - Docker Update Script
# This script pulls the latest Docker images and restarts containers

set -e

echo "🔄 Starting Happy Balance update process..."
echo ""

# Get the directory where docker-compose.yml is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_DIR="$( cd "$SCRIPT_DIR/.." && pwd )"

cd "$PROJECT_DIR"

# Check if docker compose is available
if ! command -v docker &> /dev/null; then
    echo "❌ Error: Docker is not installed or not in PATH"
    exit 1
fi

echo "📦 Current running versions:"
docker ps --filter "name=happy-balance" --format "table {{.Names}}\t{{.Image}}\t{{.Status}}"
echo ""

# Pull latest images
echo "⬇️  Pulling latest images from Docker Hub..."
if docker compose pull; then
    echo "✅ Images pulled successfully"
else
    echo "❌ Failed to pull images"
    exit 1
fi

echo ""
echo "🔄 Restarting containers with new images..."

# Restart containers with new images
if docker compose up -d; then
    echo "✅ Containers restarted successfully"
else
    echo "❌ Failed to restart containers"
    exit 1
fi

echo ""
echo "⏳ Waiting for services to be healthy..."
sleep 5

# Check health status
echo ""
echo "📊 Updated running versions:"
docker ps --filter "name=happy-balance" --format "table {{.Names}}\t{{.Image}}\t{{.Status}}"

echo ""
echo "🎉 Update completed successfully!"
echo ""
echo "🔗 Check your application at:"
echo "   - Frontend: http://balance.nas:14080"
echo "   - Backend API: http://localhost:14040"
echo "   - Health check: http://localhost:14040/health"
echo "   - Version info: http://localhost:14040/version"
