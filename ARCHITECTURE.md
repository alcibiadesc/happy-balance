# 🏗️ Architecture Design Document

## Vision Statement
A maintainable, scalable expense tracking application following DDD + Hexagonal Architecture + Atomic Design patterns for optimal developer experience and production stability.

## Architecture Overview

### Core Principles
1. **Domain-Driven Design (DDD)**: Business logic isolated in domain layer
2. **Hexagonal Architecture**: Clean separation between business logic and technical concerns
3. **Atomic Design System**: Consistent, reusable UI components
4. **Clean Code**: SOLID principles, high cohesion, low coupling
5. **Test-Driven Development**: Comprehensive testing at all layers

### Folder Structure

```
src/
├── lib/
│   ├── domain/                 # Domain Layer (Pure Business Logic)
│   │   ├── entities/           # Business entities
│   │   ├── value-objects/      # Immutable value objects
│   │   ├── services/           # Domain services
│   │   ├── repositories/       # Repository interfaces
│   │   ├── events/             # Domain events
│   │   └── specifications/     # Business rules & validations
│   │
│   ├── application/            # Application Layer (Use Cases)
│   │   ├── use-cases/          # Application use cases
│   │   ├── services/           # Application services
│   │   ├── commands/           # Command objects
│   │   ├── queries/            # Query objects
│   │   └── handlers/           # CQRS handlers
│   │
│   ├── infrastructure/         # Infrastructure Layer (Adapters)
│   │   ├── repositories/       # Repository implementations
│   │   ├── database/           # Database configuration
│   │   ├── external-apis/      # External service adapters
│   │   ├── parsers/            # Data parsers (CSV, etc.)
│   │   └── factories/          # Infrastructure factories
│   │
│   ├── ui/                     # Presentation Layer (Atomic Design)
│   │   ├── atoms/              # Basic UI elements
│   │   ├── molecules/          # Simple UI components
│   │   ├── organisms/          # Complex UI sections
│   │   ├── templates/          # Page layouts
│   │   └── pages/              # Complete page implementations
│   │
│   ├── shared/                 # Shared Utilities
│   │   ├── types/              # TypeScript types
│   │   ├── constants/          # Application constants
│   │   ├── utils/              # Utility functions
│   │   ├── errors/             # Custom error classes
│   │   └── contracts/          # Shared interfaces
│   │
│   └── config/                 # Configuration
│       ├── database.ts         # Database configuration
│       ├── environment.ts      # Environment variables
│       └── dependencies.ts     # Dependency injection
│
├── routes/                     # SvelteKit routes
│   ├── api/                    # API endpoints
│   └── (app)/                  # Application pages
│
└── tests/                      # Test suites
    ├── unit/                   # Unit tests
    ├── integration/            # Integration tests
    └── e2e/                    # End-to-end tests
```

## Domain Layer Design

### Core Entities
- **Account**: Financial account with balance tracking
- **Transaction**: Financial transaction with categorization
- **Category**: Expense/income category with hierarchy
- **Budget**: Budget planning and tracking
- **SavingsAccount**: Dedicated savings goals
- **Rule**: Auto-categorization rules

### Value Objects
- **Money**: Amount with currency
- **TransactionDate**: Date with validation
- **AccountNumber**: Validated account identifier
- **CategoryPath**: Hierarchical category path
- **BudgetPeriod**: Time period for budgets

### Domain Services
- **CategorizationEngine**: Auto-categorize transactions
- **BudgetCalculator**: Budget calculations and analysis
- **TransactionAnalyzer**: Financial analytics
- **RuleEngine**: Apply categorization rules

## Application Layer Design

### Use Cases (Commands)
- **ImportTransactions**: Import and process CSV files
- **CategorizeTransaction**: Assign category to transaction
- **CreateBudget**: Set up new budget
- **AnalyzeSpending**: Generate spending insights

### Query Services
- **DashboardQuery**: Fetch dashboard metrics
- **TransactionQuery**: Search and filter transactions
- **BudgetQuery**: Budget status and progress
- **AnalyticsQuery**: Financial analysis data

## Infrastructure Layer Design

### Repository Implementations
- **PrismaTransactionRepository**: Transaction persistence
- **PrismaCategoryRepository**: Category management
- **PrismaAccountRepository**: Account data
- **InMemoryRepository**: Testing implementations

### External Adapters
- **N26CSVParser**: Parse N26 bank CSV files
- **CurrencyAPI**: Real-time exchange rates
- **NotificationService**: Email/push notifications

## UI Layer Design (Atomic Design)

### Atoms
- **Button**: Various button styles and states
- **Input**: Form inputs with validation
- **Badge**: Status and category badges
- **Icon**: Consistent iconography
- **Typography**: Text components

### Molecules
- **MetricCard**: Dashboard metric display
- **CurrencyDisplay**: Formatted currency amounts
- **CategorySelector**: Category picker
- **DateRangePicker**: Date selection
- **SearchBox**: Search with filters

### Organisms
- **DashboardMetrics**: Main dashboard overview
- **TransactionTable**: Transaction list/grid
- **ImportWizard**: Multi-step import process
- **BudgetChart**: Budget visualization
- **SpendingAnalytics**: Charts and insights

### Templates
- **DashboardTemplate**: Main dashboard layout
- **TransactionTemplate**: Transaction page layout
- **SettingsTemplate**: Settings page layout

## Development Workflow

### Local Development
1. **Database**: PostgreSQL in Docker container
2. **App**: SvelteKit dev server with HMR
3. **Testing**: Vitest for unit/integration tests
4. **TypeScript**: Strict type checking
5. **Linting**: ESLint + Prettier

### Production Deployment
1. **Multi-stage Docker build**
2. **Optimized bundle**
3. **Health checks**
4. **Database migrations**
5. **Environment configuration**

## Testing Strategy

### Unit Tests
- Domain entities and value objects
- Application services and use cases
- Repository implementations
- UI component logic

### Integration Tests
- Database operations
- API endpoints
- External service integrations
- End-to-end workflows

### E2E Tests
- Critical user journeys
- Import process
- Dashboard functionality
- Category management

## Quality Gates

### Code Quality
- 90%+ test coverage
- Zero TypeScript errors
- ESLint compliance
- Sonar quality gates

### Performance
- < 100ms API response times
- < 2s page load times
- Lighthouse score > 95
- Bundle size optimization

## Deployment Architecture

### Docker Composition
```yaml
services:
  app:          # SvelteKit application
  database:     # PostgreSQL with persistence
  redis:        # Caching layer (future)
  nginx:        # Reverse proxy (future)
```

### Environment Management
- **Development**: Local Docker + hot reload
- **Staging**: Docker Compose on server
- **Production**: Optimized containers

This architecture provides:
- ✅ **Maintainability**: Clear separation of concerns
- ✅ **Testability**: Dependency injection and mocking
- ✅ **Scalability**: Modular, loosely-coupled design
- ✅ **Developer Experience**: Hot reload, type safety
- ✅ **Production Ready**: Optimized builds, health checks