#!/bin/bash

# Happy Balance - Docker Initialization Script
# This script helps you set up the application quickly with Docker

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_color() {
    color=$1
    message=$2
    echo -e "${color}${message}${NC}"
}

# Header
print_color "$BLUE" "
╔══════════════════════════════════════════════╗
║     Happy Balance - Docker Setup Wizard      ║
╚══════════════════════════════════════════════╝
"

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    print_color "$RED" "Error: Docker is not installed!"
    echo "Please install Docker first: https://docs.docker.com/get-docker/"
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    if ! docker compose version &> /dev/null; then
        print_color "$RED" "Error: Docker Compose is not installed!"
        echo "Please install Docker Compose first: https://docs.docker.com/compose/install/"
        exit 1
    fi
    # Use docker compose instead of docker-compose
    COMPOSE_CMD="docker compose"
else
    COMPOSE_CMD="docker-compose"
fi

# Function to generate random string
generate_secret() {
    openssl rand -base64 32 | tr -d "=+/" | cut -c1-32
}

# Check if .env exists
if [ -f .env ]; then
    print_color "$YELLOW" "⚠️  .env file already exists!"
    read -p "Do you want to overwrite it? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_color "$YELLOW" "Using existing .env file..."
    else
        cp .env .env.backup
        print_color "$GREEN" "✓ Backed up existing .env to .env.backup"

        # Create new .env from template
        cp .env.docker .env

        # Generate secure passwords
        print_color "$BLUE" "Generating secure passwords..."

        # Database password
        DB_PASS=$(generate_secret)
        sed -i.tmp "s/postgres_secure_password_change_me/$DB_PASS/" .env

        # JWT secrets
        JWT_ACCESS=$(generate_secret)
        JWT_REFRESH=$(generate_secret)
        sed -i.tmp "s/super-secret-access-key-min-32-chars-change-in-production/$JWT_ACCESS/" .env
        sed -i.tmp "s/super-secret-refresh-key-min-32-chars-change-in-production/$JWT_REFRESH/" .env

        # Admin password
        print_color "$YELLOW" "\nSet up admin account:"
        read -p "Admin username (default: admin): " admin_user
        admin_user=${admin_user:-admin}

        read -s -p "Admin password (min 8 chars): " admin_pass
        echo

        if [ ${#admin_pass} -lt 8 ]; then
            print_color "$RED" "Password must be at least 8 characters!"
            exit 1
        fi

        sed -i.tmp "s/ADMIN_USERNAME=admin/ADMIN_USERNAME=$admin_user/" .env
        sed -i.tmp "s/ADMIN_PASSWORD=admin123/ADMIN_PASSWORD=$admin_pass/" .env

        # Clean up temp files
        rm -f .env.tmp

        print_color "$GREEN" "✓ Environment configuration complete!"
    fi
else
    # Create new .env from template
    cp .env.docker .env

    print_color "$BLUE" "Setting up environment configuration..."

    # Generate secure passwords
    DB_PASS=$(generate_secret)
    JWT_ACCESS=$(generate_secret)
    JWT_REFRESH=$(generate_secret)

    sed -i.tmp "s/postgres_secure_password_change_me/$DB_PASS/" .env
    sed -i.tmp "s/super-secret-access-key-min-32-chars-change-in-production/$JWT_ACCESS/" .env
    sed -i.tmp "s/super-secret-refresh-key-min-32-chars-change-in-production/$JWT_REFRESH/" .env

    # Admin setup
    print_color "$YELLOW" "\nSet up admin account:"
    read -p "Admin username (default: admin): " admin_user
    admin_user=${admin_user:-admin}

    read -s -p "Admin password (min 8 chars): " admin_pass
    echo

    if [ ${#admin_pass} -lt 8 ]; then
        print_color "$RED" "Password must be at least 8 characters!"
        exit 1
    fi

    sed -i.tmp "s/ADMIN_USERNAME=admin/ADMIN_USERNAME=$admin_user/" .env
    sed -i.tmp "s/ADMIN_PASSWORD=admin123/ADMIN_PASSWORD=$admin_pass/" .env

    rm -f .env.tmp

    print_color "$GREEN" "✓ Environment configuration complete!"
fi

# Ask for deployment options
print_color "$BLUE" "\nDeployment Options:"
echo "1. Full stack (Frontend + Backend + Database)"
echo "2. Backend only (API + Database)"
echo "3. Development mode"
read -p "Choose deployment type (1-3): " deploy_type

case $deploy_type in
    1)
        print_color "$BLUE" "Deploying full stack..."
        $COMPOSE_CMD up -d
        ;;
    2)
        print_color "$BLUE" "Deploying backend only..."
        $COMPOSE_CMD up -d postgres backend
        ;;
    3)
        print_color "$BLUE" "Starting in development mode..."
        $COMPOSE_CMD -f docker-compose.dev.yml up
        ;;
    *)
        print_color "$RED" "Invalid option!"
        exit 1
        ;;
esac

# Wait for services to be ready
print_color "$YELLOW" "\nWaiting for services to start..."
sleep 5

# Check service health
print_color "$BLUE" "\nChecking service status..."

# Check database
if $COMPOSE_CMD ps | grep -q "postgres.*Up"; then
    print_color "$GREEN" "✓ Database is running"
else
    print_color "$RED" "✗ Database failed to start"
fi

# Check backend
if curl -f http://localhost:3004/health &> /dev/null; then
    print_color "$GREEN" "✓ Backend API is healthy"
else
    print_color "$YELLOW" "⚠ Backend is still starting..."
fi

# Check frontend (if deployed)
if [ "$deploy_type" = "1" ]; then
    if curl -f http://localhost:5173 &> /dev/null; then
        print_color "$GREEN" "✓ Frontend is running"
    else
        print_color "$YELLOW" "⚠ Frontend is still building..."
    fi
fi

# Show access information
print_color "$GREEN" "
╔══════════════════════════════════════════════╗
║           Setup Complete! 🎉                 ║
╚══════════════════════════════════════════════╝
"

print_color "$BLUE" "Access your application:"
echo "• Frontend: http://localhost:5173"
echo "• Backend API: http://localhost:3004/api"
echo "• API Docs: http://localhost:3004/api-docs"
echo ""
print_color "$YELLOW" "Admin credentials:"
echo "• Username: $admin_user"
echo "• Password: [hidden - you set this]"
echo ""
print_color "$BLUE" "Useful commands:"
echo "• View logs: $COMPOSE_CMD logs -f"
echo "• Stop services: $COMPOSE_CMD down"
echo "• Reset everything: $COMPOSE_CMD down -v"
echo ""
print_color "$GREEN" "Happy expense tracking! 💰"