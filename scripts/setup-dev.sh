#!/bin/bash

# Setup Development Environment for Expense Tracker
# This script sets up everything needed for development

set -e

echo "🚀 Setting up Expense Tracker development environment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if required tools are installed
check_requirements() {
    log_info "Checking requirements..."
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        log_error "Node.js is not installed. Please install Node.js 20+ first."
        exit 1
    fi
    
    NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 20 ]; then
        log_error "Node.js version 20+ is required. Current version: $(node --version)"
        exit 1
    fi
    
    # Check pnpm
    if ! command -v pnpm &> /dev/null; then
        log_info "Installing pnpm..."
        npm install -g pnpm
    fi
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        log_warning "Docker is not installed. You can still develop without Docker, but some features may not work."
    else
        # Check if Docker daemon is running
        if ! docker ps &> /dev/null; then
            log_warning "Docker daemon is not running. Please start Docker."
        fi
    fi
    
    log_success "Requirements check passed"
}

# Setup environment variables
setup_env() {
    log_info "Setting up environment variables..."
    
    if [ ! -f .env ]; then
        if [ -f .env.example ]; then
            cp .env.example .env
            log_success "Created .env file from .env.example"
        else
            log_warning ".env.example not found. Creating basic .env file..."
            cat > .env << EOF
DATABASE_URL="postgresql://expense_tracker:dev_password_2024@localhost:5433/expense_tracker"
NODE_ENV="development"
SECRET_KEY="dev_secret_key_not_for_production"
EOF
            log_success "Created basic .env file"
        fi
    else
        log_success ".env file already exists"
    fi
}

# Install dependencies
install_dependencies() {
    log_info "Installing dependencies..."
    
    if [ -f pnpm-lock.yaml ]; then
        pnpm install --frozen-lockfile
    else
        pnpm install
    fi
    
    log_success "Dependencies installed"
}

# Setup database
setup_database() {
    log_info "Setting up database..."
    
    if command -v docker &> /dev/null && docker ps &> /dev/null; then
        log_info "Starting PostgreSQL with Docker..."
        
        # Start database container
        if pnpm db:up; then
            log_success "Database started successfully"
            
            # Wait for database to be ready
            sleep 5
            
            # Run migrations
            log_info "Running database migrations..."
            if pnpm db:migrate; then
                log_success "Database migrations completed"
            else
                log_warning "Database migrations failed. You may need to run them manually later."
            fi
            
        else
            log_warning "Failed to start database with Docker. You'll need to set up PostgreSQL manually."
        fi
    else
        log_warning "Docker not available. Please set up PostgreSQL manually:"
        echo "  - Host: localhost"
        echo "  - Port: 5433"
        echo "  - Database: expense_tracker"
        echo "  - User: expense_tracker"
        echo "  - Password: dev_password_2024"
    fi
}

# Setup git hooks (if git repo exists)
setup_git_hooks() {
    if [ -d .git ]; then
        log_info "Setting up git hooks..."
        
        # Create pre-commit hook
        mkdir -p .git/hooks
        cat > .git/hooks/pre-commit << 'EOF'
#!/bin/sh
# Run linting and type checking before commit

echo "Running pre-commit checks..."

# Run type check
if ! pnpm typecheck; then
    echo "❌ Type check failed"
    exit 1
fi

# Run linting
if ! pnpm lint; then
    echo "❌ Linting failed"
    exit 1
fi

echo "✅ Pre-commit checks passed"
EOF
        
        chmod +x .git/hooks/pre-commit
        log_success "Git hooks setup completed"
    fi
}

# Generate Prisma client
generate_prisma() {
    log_info "Generating Prisma client..."
    
    if npx prisma generate; then
        log_success "Prisma client generated"
    else
        log_warning "Failed to generate Prisma client. You may need to do this manually."
    fi
}

# Main setup function
main() {
    echo "🚀 Expense Tracker Development Setup"
    echo "======================================"
    
    check_requirements
    setup_env
    install_dependencies
    generate_prisma
    setup_database
    setup_git_hooks
    
    echo ""
    echo "======================================"
    log_success "Development environment setup complete!"
    echo ""
    echo "🎯 Next steps:"
    echo "  1. Start development: pnpm dev"
    echo "  2. Open browser: http://localhost:5179"
    echo "  3. View database: pnpm db:studio"
    echo ""
    echo "📚 Useful commands:"
    echo "  - pnpm dev          # Start development server"
    echo "  - pnpm build        # Build for production"
    echo "  - pnpm test         # Run tests"
    echo "  - pnpm lint         # Run linter"
    echo "  - pnpm typecheck    # Check TypeScript"
    echo "  - pnpm db:studio    # Open Prisma Studio"
    echo "  - pnpm db:migrate   # Run database migrations"
    echo ""
    log_success "Happy coding! 🎉"
}

# Run main function
main