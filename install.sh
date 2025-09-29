#!/bin/bash
# Happy Balance - Quick Install Script
# Usage: curl -sSL https://raw.githubusercontent.com/alcibiadesc/happy-balance/main/install.sh | bash

set -e

echo "🚀 Installing Happy Balance..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    echo "Visit: https://docs.docker.com/get-docker/"
    exit 1
fi

# Check if Docker Compose is installed
if ! docker compose version &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    echo "Visit: https://docs.docker.com/compose/install/"
    exit 1
fi

# Create directory for Happy Balance
INSTALL_DIR="$HOME/happy-balance"
echo "📁 Creating installation directory: $INSTALL_DIR"
mkdir -p "$INSTALL_DIR"
cd "$INSTALL_DIR"

# Download docker-compose.yml
echo "📥 Downloading docker-compose.yml..."
curl -sSL https://raw.githubusercontent.com/alcibiadesc/happy-balance/main/docker-compose.yml -o docker-compose.yml

# Create .env file with secure defaults
echo "🔐 Creating .env file with secure secrets..."
cat > .env << EOF
# Happy Balance Configuration
# Generated on $(date)

# Security - Auto-generated secure tokens
JWT_ACCESS_SECRET=$(openssl rand -hex 32)
JWT_REFRESH_SECRET=$(openssl rand -hex 32)

# Admin credentials (CHANGE THESE!)
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123

# Ports
FRONTEND_PORT=3000
BACKEND_PORT=3004

# URLs
VITE_API_URL=http://localhost:3004/api
CORS_ORIGIN=http://localhost:3000
ORIGIN=http://localhost:3000
EOF

echo "✅ Configuration created"

# Start services
echo "🐳 Starting Happy Balance services..."
docker compose up -d

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 10

# Check if services are running
if docker ps | grep -q happy-balance; then
    echo ""
    echo "✅ Happy Balance installed successfully!"
    echo ""
    echo "📍 Access your Happy Balance instance at:"
    echo "   Frontend: http://localhost:3000"
    echo "   Backend API: http://localhost:3004/api"
    echo ""
    echo "🔑 Default credentials:"
    echo "   Username: admin"
    echo "   Password: admin123"
    echo ""
    echo "⚠️  IMPORTANT: Change the default credentials after first login!"
    echo ""
    echo "📁 Installation directory: $INSTALL_DIR"
    echo "📝 Configuration file: $INSTALL_DIR/.env"
    echo ""
    echo "🛠️  Useful commands:"
    echo "   View logs:  cd $INSTALL_DIR && docker compose logs -f"
    echo "   Stop:       cd $INSTALL_DIR && docker compose down"
    echo "   Update:     cd $INSTALL_DIR && docker compose pull && docker compose up -d"
    echo "   Uninstall:  cd $INSTALL_DIR && docker compose down -v && rm -rf $INSTALL_DIR"
else
    echo "❌ Installation failed. Please check Docker logs:"
    echo "   cd $INSTALL_DIR && docker compose logs"
    exit 1
fi