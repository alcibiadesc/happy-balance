/**
 * @happy-balance/shared-types
 *
 * Shared TypeScript types that define the API contract between
 * the frontend (SvelteKit) and backend (Express).
 *
 * These types represent the WIRE FORMAT - what goes over HTTP.
 * They are NOT domain objects (backend) or view models (frontend).
 *
 * Traceability chain:
 *   Backend: Domain Entity → Mapper → DTO (shared type) → API Response
 *   Frontend: API Response → DTO (shared type) → Mapper → ViewModel → Component
 */

// API envelope
export type { ApiResponse, PaginatedResponse, Pagination } from './api';

// Transaction contract
export type {
  TransactionType,
  TransactionStatus,
  TransactionDTO,
  CategorySummaryDTO,
  CreateTransactionRequest,
  UpdateTransactionRequest,
  PaginatedTransactionsResponse,
} from './transaction';

// Category contract
export type {
  CategoryType,
  CategoryDTO,
  CategoryWithStatsDTO,
  CreateCategoryRequest,
  UpdateCategoryRequest,
} from './category';

// Dashboard contract
export type {
  PeriodInfo,
  PeriodMetricsDTO,
  CategoryBreakdownDTO,
  ExpenseDistributionDTO,
  MonthlyTrendDTO,
  DashboardResponseDTO,
  ComparisonDTO,
} from './dashboard';

// Auth contract
export type {
  UserRole,
  UserDTO,
  LoginRequest,
  LoginResponse,
  RefreshTokenRequest,
  RefreshTokenResponse,
  MagicLinkRequest,
  MagicLinkResponse,
  ChangePasswordRequest,
} from './auth';

// Investment contract
export type {
  InvestmentType,
  InvestmentHistoryType,
  InvestmentDTO,
  InvestmentWithMetricsDTO,
  InvestmentHistoryEntryDTO,
  CreateInvestmentRequest,
  UpdateInvestmentRequest,
  PortfolioSummaryDTO,
} from './investment';

// Route constants
export { API_ROUTES } from './routes';
