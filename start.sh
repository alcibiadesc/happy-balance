#!/bin/bash
# Happy Balance - Start script
# Builds images locally and starts all services

set -e

cd "$(dirname "$0")"

echo "🔨 Building images from source..."
docker compose build backend frontend

echo "🚀 Starting services..."
docker compose up -d

echo "⏳ Waiting for health checks..."
sleep 5

echo "📊 Status:"
docker compose ps

echo ""
echo "✅ Done! Services available at:"
echo "   Frontend: http://localhost:14080"
echo "   Backend:  http://localhost:14040"
