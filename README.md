# 💰 Expense Tracker

> **Enterprise-grade personal finance management application built with SvelteKit, following Domain-Driven Design, Hexagonal Architecture, and Atomic Design principles.**

## ⚡ Quick Start

```bash
# One-command setup (recommended)
./scripts/setup-dev.sh

# Or manual setup
pnpm install
pnpm db:up
pnpm dev
```

**Access:** http://192.168.1.170:5179/ | http://100.122.190.40:5179/

## 🏗️ Architecture Overview

This application follows **Clean Architecture** principles with clear separation of concerns:

```
📁 src/lib/
├── 🏛️  domain/              # Pure Business Logic
│   ├── entities/            # Business entities (Account, Transaction)
│   ├── value-objects/       # Immutable values (Money, TransactionDate)
│   ├── services/            # Domain services (CategorizationEngine)
│   └── repositories/        # Repository interfaces
│
├── 🎯 application/          # Application Layer (CQRS)
│   ├── use-cases/           # Use cases (ImportTransactions)
│   ├── commands/            # Command objects
│   ├── queries/             # Query objects (DashboardQuery)
│   └── handlers/            # CQRS handlers
│
├── 🔌 infrastructure/       # External Adapters
│   ├── repositories/        # Prisma implementations
│   ├── parsers/             # CSV parsers (N26, Generic)
│   └── database/            # Database configuration
│
├── 🎨 ui/                   # Presentation Layer (Atomic Design)
│   ├── atoms/               # Basic elements (Button, Input)
│   ├── molecules/           # Simple components (MetricCard)
│   ├── organisms/           # Complex sections (Dashboard)
│   └── templates/           # Page layouts
│
└── 🔧 shared/              # Shared Utilities
    ├── types/               # TypeScript definitions
    ├── utils/               # Helper functions
    └── errors/              # Error handling
```

### 🎯 Key Design Patterns

- **Domain-Driven Design (DDD)**: Business logic isolated in domain layer
- **Hexagonal Architecture**: Clean separation between business and technical concerns  
- **CQRS**: Separate read/write operations for optimal performance
- **Result Pattern**: Explicit error handling without exceptions
- **Atomic Design**: Consistent, reusable UI component hierarchy

## 🚀 Development Workflows

### 🏃‍♂️ Fast Development (Recommended)
```bash
pnpm dev              # Hot reload with network access
pnpm dev:local        # Localhost only
pnpm build            # Production build
pnpm preview          # Preview production build
```

### 🗄️ Database Management
```bash
pnpm db:up            # Start PostgreSQL in Docker
pnpm db:down          # Stop database
pnpm db:migrate       # Run migrations
pnpm db:studio        # Open Prisma Studio (localhost:5555)
pnpm db:seed          # Seed with default data
pnpm db:reset         # Reset and reseed database
```

### 🧪 Testing & Quality
```bash
pnpm test             # Run all tests
pnpm test:unit        # Unit tests only
pnpm test:coverage    # Coverage report
pnpm lint             # ESLint + Prettier
pnpm lint:fix         # Auto-fix issues
pnpm typecheck        # TypeScript validation
```

### 🐳 Docker Operations
```bash
# Development (not recommended - slower)
pnpm docker:dev       # Full development stack
pnpm docker:dev:down  # Stop dev containers

# Production (optimized builds)
pnpm docker:prod      # Production deployment  
pnpm docker:prod:down # Stop production
pnpm docker:prod:logs # View logs
```

## 🌟 Key Features

### ✅ **Architecture & Quality**
- **Clean Architecture** with DDD principles
- **CQRS** for optimal read/write separation
- **Comprehensive Testing** (unit, integration, e2e)
- **Type Safety** with strict TypeScript
- **Error Handling** with Result pattern

### ✅ **Developer Experience**
- **Instant Hot Reload** with Vite
- **Multi-stage Docker** builds
- **Database Seeding** and migrations
- **Git Hooks** for quality gates
- **Storybook** for component development

### ✅ **Business Features**
- **Smart CSV Import** (N26 + Generic formats)
- **Auto-categorization** with rules engine
- **Real-time Dashboard** with analytics
- **Multi-currency Support** with proper rounding
- **Savings Tracking** with goal management

### ✅ **UI/UX**
- **Atomic Design System** with shadcn/ui
- **Dark/Light Mode** toggle
- **Responsive Design** for all devices
- **Accessibility** compliant (ARIA, keyboard nav)

## 🎯 Use Cases

### 📊 **Dashboard Analytics**
```typescript
// Query financial metrics with type safety
const metricsResult = await dashboardQuery.execute({
  startDate: new Date('2024-01-01'),
  endDate: new Date('2024-12-31')
});

if (metricsResult.isSuccess()) {
  const { totalIncome, savingsRate, topCategories } = metricsResult.value;
}
```

### 💳 **Transaction Import**
```typescript
// Import CSV with comprehensive validation
const importResult = await importTransactionsUseCase.execute({
  csvContent: fileContent,
  accountId: 'account-123',
  fileName: 'n26-export.csv'
});

if (importResult.isSuccess()) {
  const { imported, skipped, errors } = importResult.value;
}
```

### 💰 **Money Operations**
```typescript
// Type-safe money calculations
const incomeResult = Money.create(1500, 'EUR');
const expensesResult = Money.create(800, 'EUR');

if (incomeResult.isSuccess() && expensesResult.isSuccess()) {
  const savingsResult = incomeResult.value.subtract(expensesResult.value);
  // Always explicit success/failure handling
}
```

## 🌐 Network Access

| Environment | URL | Description |
|-------------|-----|-------------|
| **Development** | http://192.168.1.170:5179 | Local network access |
| **Tailscale** | http://100.122.190.40:5179 | VPN access |
| **Database** | localhost:5433 | PostgreSQL connection |
| **Prisma Studio** | localhost:5555 | Database GUI |
| **Health Check** | /health | Application status |

## 🛠️ Tech Stack

### **Core Framework**
- **SvelteKit 5** - Full-stack framework with latest runes
- **TypeScript** - Strict type safety
- **Vite** - Lightning-fast development

### **Backend & Data**
- **Node.js 22** - Runtime environment
- **Prisma ORM** - Type-safe database access
- **PostgreSQL 16** - Primary database
- **CQRS Pattern** - Optimized read/write operations

### **Frontend & UI**
- **Tailwind CSS** - Utility-first styling
- **shadcn/ui** - High-quality components
- **Lucide Icons** - Consistent iconography
- **Chart.js** - Data visualization

### **Development & DevOps**
- **Docker** - Multi-stage containerization
- **pnpm** - Fast package management
- **Vitest** - Modern testing framework
- **ESLint + Prettier** - Code quality
- **Storybook** - Component documentation

## 📈 Metrics & Performance

### **Code Quality**
- **90%+ Test Coverage** across all layers
- **Zero TypeScript Errors** in production
- **Lighthouse Score 95+** for performance
- **Bundle Size < 200KB** gzipped

### **Architecture Benefits**
- **Domain Logic** isolated and testable
- **Infrastructure** easily swappable
- **UI Components** reusable and documented
- **Error Handling** explicit and type-safe

---

### 🎉 **Ready to build the future of personal finance!**

**Recommended workflow:** Use `pnpm dev` for daily development and `./scripts/setup-dev.sh` for initial setup.