# Happy Balance 💰

Personal finance management application built with modern technologies and clean architecture principles.

## 🏗️ Architecture

This application follows **Domain-Driven Design (DDD)** and **Hexagonal Architecture** patterns:

### Frontend (SvelteKit)

- **Presentation Layer**: Svelte components using Atomic Design
- **Application Layer**: Use cases and stores
- **Domain Layer**: Business logic and entities
- **Infrastructure Layer**: API adapters and external services

### Backend (Node.js/Express)

- **Domain Layer**: Entities, Value Objects, Services, Repository Interfaces
- **Application Layer**: Use Cases, Commands, Queries
- **Infrastructure Layer**: Database (PostgreSQL), REST API Controllers, External Adapters

## 🚀 Quick Start

### Option 1: Docker Setup (Recommended) 🐳

The easiest way to get started with a fully reproducible environment:

```bash
git clone <your-repo>
cd expense-tracker
docker compose up
```

**That's it!** The application will be available at http://localhost:5173 with hot reloading enabled.

👉 **See [DOCKER_SETUP.md](./DOCKER_SETUP.md) for detailed Docker documentation**

### Option 2: Local Development

If you prefer to run without Docker:

#### Prerequisites

- Node.js >= 20.0.0
- pnpm >= 8.0.0
- PostgreSQL 16+

#### Setup Steps

1. **Install dependencies**

   ```bash
   pnpm install:all
   ```

2. **Setup database** (PostgreSQL)

   ```bash
   # Option 1: Using Docker for database only
   docker-compose -f docker-compose.dev.yml up postgres -d

   # Option 2: Local PostgreSQL
   # Create a database named 'happy_balance'
   ```

3. **Configure environment**

   ```bash
   # Create backend/.env with your database connection
   echo 'DATABASE_URL="postgresql://postgres:password@localhost:5432/happy_balance"' > backend/.env
   ```

4. **Setup database schema**

   ```bash
   pnpm db:setup
   pnpm db:seed
   ```

5. **Start development servers**
   ```bash
   pnpm dev
   ```

This will start:

- Frontend at http://localhost:5173
- Backend API at http://localhost:3000

## 🎯 Features

### ✅ Implemented

- **Transaction Management**: Create, read, update, delete transactions
- **CSV Import**: Import transactions from bank CSV files with smart field detection
- **Duplicate Detection**: Automatic detection of potential duplicate transactions
- **Auto-Categorization**: Smart categorization based on merchant patterns
- **Dashboard**: Financial overview with statistics and charts
- **Multi-currency Support**: Handle different currencies
- **Responsive Design**: Mobile-friendly interface
- **Dark/Light Theme**: Theme switcher
- **Real-time Updates**: Live data synchronization

### 🚧 Planned

- **Excel Import**: Import from Excel files
- **Budget Management**: Set and track budgets
- **Reporting**: Generate detailed financial reports
- **Data Export**: Export data in various formats
- **Bank API Integration**: Direct bank connection
- **Investment Tracking**: Track investment portfolio
- **Bill Reminders**: Recurring payment reminders

## 📊 Database Schema

### Tables

- **transactions**: Store all financial transactions
- **categories**: Hierarchical category system
- **import_logs**: Track import operations
- **app_settings**: Application configuration

## 🛠️ Tech Stack

### Frontend

- **Framework**: SvelteKit 2.0
- **Language**: TypeScript
- **Styling**: Tailwind CSS + DaisyUI
- **Charts**: Chart.js
- **Icons**: Lucide Svelte
- **i18n**: svelte-i18n

### Backend

- **Runtime**: Node.js 20+
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL 16
- **ORM**: Prisma
- **Validation**: Zod
- **File Upload**: Multer

### DevOps & Tools

- **Package Manager**: pnpm
- **Build Tool**: Vite
- **Container**: Docker + Docker Compose
- **Linting**: ESLint + Prettier
- **Testing**: Vitest
- **Type Checking**: TypeScript

## 🐳 Docker Deployment

### Development

```bash
# Start development environment (includes database)
pnpm docker:dev

# Stop development environment
pnpm docker:dev:down
```

### Production

```bash
# Build and start production containers
pnpm docker:prod

# Stop production containers
pnpm docker:prod:down
```

### Services

- **Frontend**: http://localhost:3001
- **Backend API**: http://localhost:3000
- **PostgreSQL**: localhost:5432

## 📝 Scripts

### Root Commands

```bash
pnpm dev              # Start both frontend and backend in development
pnpm build            # Build both frontend and backend
pnpm start            # Start production frontend server
pnpm test             # Run tests
pnpm lint             # Run linting
pnpm typecheck        # Run type checking
```

### Database Commands

```bash
pnpm db:setup         # Generate Prisma client and push schema
pnpm db:migrate       # Run database migrations
pnpm db:reset         # Reset database (WARNING: deletes all data)
```

### Docker Commands

```bash
pnpm docker:dev       # Start development environment
pnpm docker:prod      # Start production environment
pnpm install:all      # Install all dependencies
pnpm clean            # Clean build artifacts and node_modules
```

## 🗂️ Project Structure

```
happy-balance/
├── src/                          # Frontend source
│   ├── lib/
│   │   ├── domain/              # Domain layer (business logic)
│   │   ├── application/         # Application layer (use cases)
│   │   ├── infrastructure/      # Infrastructure layer (adapters)
│   │   └── components/          # UI components (atomic design)
│   ├── routes/                  # SvelteKit routes
│   └── app.html
├── backend/                     # Backend source
│   ├── src/
│   │   ├── domain/             # Domain layer
│   │   ├── application/        # Application layer
│   │   └── infrastructure/     # Infrastructure layer
│   ├── prisma/                 # Database schema and migrations
│   └── package.json
├── docker-compose.yml          # Production deployment
├── docker-compose.dev.yml      # Development environment
└── package.json                # Root workspace configuration
```

## 🔧 Environment Variables

### Backend (.env)

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/happy_balance"
PORT=3000
NODE_ENV=development
CORS_ORIGIN="http://localhost:5173"
MAX_FILE_SIZE=10485760  # 10MB
```

### Frontend (optional)

```env
PUBLIC_API_URL="http://localhost:3000/api"
```

## 📄 API Documentation

### Transactions

- `POST /api/transactions` - Create transaction
- `GET /api/transactions` - List transactions (with filters & pagination)
- `GET /api/transactions/:id` - Get transaction by ID
- `PUT /api/transactions/:id` - Update transaction
- `DELETE /api/transactions/:id` - Delete transaction
- `GET /api/transactions/statistics` - Get financial statistics
- `GET /api/transactions/dashboard` - Get dashboard data

### Import

- `POST /api/import/csv` - Import from CSV file
- `POST /api/import/validate` - Validate CSV file
- `GET /api/import/history` - Get import history

### Health

- `GET /health` - Health check

## 🧪 Testing

```bash
# Run all tests
pnpm test

# Run backend tests only
pnpm test:backend

# Run with coverage
pnpm test:coverage
```

## 🔒 Security Features

- **CORS Protection**: Configured for frontend domain
- **Helmet**: Security headers
- **Input Validation**: Zod schemas for API validation
- **File Upload Limits**: Configurable file size limits
- **SQL Injection Protection**: Prisma ORM with parameterized queries

## 🌍 Internationalization

The application supports multiple languages through svelte-i18n:

- English (default)
- Spanish
- More languages can be added easily

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📋 Development Guidelines

### Code Style

- Use TypeScript for type safety
- Follow ESLint and Prettier configurations
- Write tests for new features
- Use conventional commit messages

### Architecture Rules

- Keep domain logic pure (no external dependencies)
- Use dependency inversion (inject dependencies)
- Implement interfaces in infrastructure layer
- Keep components atomic and reusable

### Database Migrations

```bash
# Create new migration
cd backend && pnpm prisma migrate dev --name your-migration-name

# Apply migrations
pnpm db:migrate
```

## 🐛 Troubleshooting

### Common Issues

1. **Database connection failed**
   - Check PostgreSQL is running
   - Verify DATABASE_URL in backend/.env
   - Run `pnpm db:setup` to initialize schema

2. **CORS errors**
   - Verify CORS_ORIGIN in backend/.env matches frontend URL
   - Check backend is running on port 3000

3. **File upload fails**
   - Check MAX_FILE_SIZE in backend/.env
   - Verify file format is supported (CSV)

4. **Docker issues**
   - Run `docker-compose down -v` to reset volumes
   - Check Docker has enough memory allocated

## 📜 License

MIT License - see [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

Created with ❤️ using Claude Code

---

**Happy Balancing! 💰✨**
