/**
 * Centralized Zod validation schemas
 * All API input validation schemas should be defined here
 */
import { z } from 'zod';

// ============================================
// Common / Shared Schemas
// ============================================

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const dateRangeSchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

export const idParamSchema = z.object({
  id: z.string().uuid(),
});

export const sortSchema = z.object({
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// ============================================
// Auth Schemas
// ============================================

export const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

export const registerSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

// ============================================
// Transaction Schemas
// ============================================

export const transactionFiltersSchema = z.object({
  ...paginationSchema.shape,
  ...dateRangeSchema.shape,
  categoryId: z.string().uuid().optional(),
  type: z.enum(['income', 'expense', 'transfer']).optional(),
  search: z.string().optional(),
  minAmount: z.coerce.number().optional(),
  maxAmount: z.coerce.number().optional(),
  hidden: z.coerce.boolean().optional(),
});

export const createTransactionSchema = z.object({
  date: z.string().datetime(),
  description: z.string().min(1, 'Description is required'),
  amount: z.number(),
  type: z.enum(['income', 'expense', 'transfer']),
  categoryId: z.string().uuid().optional().nullable(),
  notes: z.string().optional(),
  merchant: z.string().optional(),
});

export const updateTransactionSchema = createTransactionSchema.partial();

export const bulkUpdateTransactionsSchema = z.object({
  ids: z.array(z.string().uuid()).min(1, 'At least one ID is required'),
  updates: z.object({
    categoryId: z.string().uuid().optional().nullable(),
    hidden: z.boolean().optional(),
    notes: z.string().optional(),
  }),
});

// ============================================
// Category Schemas
// ============================================

export const createCategorySchema = z.object({
  name: z.string().min(1, 'Category name is required'),
  icon: z.string().optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format').optional(),
  parentId: z.string().uuid().optional().nullable(),
  type: z.enum(['income', 'expense', 'both']).default('expense'),
  budget: z.number().positive().optional(),
});

export const updateCategorySchema = createCategorySchema.partial();

// ============================================
// Investment Schemas
// ============================================

export const createInvestmentSchema = z.object({
  name: z.string().min(1, 'Investment name is required'),
  symbol: z.string().optional(),
  currentValue: z.number().min(0),
  currency: z.string().length(3).default('EUR'),
  categoryId: z.string().uuid().optional().nullable(),
  highlight: z.boolean().default(false),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  icon: z.string().optional(),
  notes: z.string().optional(),
});

export const updateInvestmentSchema = createInvestmentSchema.partial();

export const addHistoryEntrySchema = z.object({
  amount: z.number().positive('Amount must be positive'),
  type: z.enum(['CONTRIBUTION', 'WITHDRAWAL', 'VALUE_UPDATE']),
  date: z.string(),
  notes: z.string().optional(),
});

// ============================================
// Import Schemas
// ============================================

export const importOptionsSchema = z.object({
  skipDuplicates: z.boolean().default(true),
  dateFormat: z.string().optional(),
  delimiter: z.string().length(1).default(','),
  encoding: z.string().default('utf-8'),
});

export const importSelectionSchema = z.object({
  selectedIds: z.array(z.string()).min(1, 'Select at least one transaction'),
  options: importOptionsSchema.optional(),
});

// ============================================
// User Management Schemas (Admin)
// ============================================

export const createUserSchema = z.object({
  username: z.string().min(3),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(['user', 'admin']).default('user'),
});

export const updateUserSchema = z.object({
  username: z.string().min(3).optional(),
  email: z.string().email().optional(),
  role: z.enum(['user', 'admin']).optional(),
  isActive: z.boolean().optional(),
});

// ============================================
// Metrics / Dashboard Schemas
// ============================================

export const metricsQuerySchema = z.object({
  period: z.enum(['day', 'week', 'month', 'quarter', 'year']).default('month'),
  ...dateRangeSchema.shape,
  compareWithPrevious: z.coerce.boolean().default(false),
});

export const dashboardQuerySchema = z.object({
  period: z.enum(['day', 'week', 'month', 'quarter', 'year', 'custom']).default('month'),
  ...dateRangeSchema.shape,
});

// ============================================
// Type exports for use in controllers
// ============================================

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type TransactionFilters = z.infer<typeof transactionFiltersSchema>;
export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;
export type UpdateTransactionInput = z.infer<typeof updateTransactionSchema>;
export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
export type CreateInvestmentInput = z.infer<typeof createInvestmentSchema>;
export type UpdateInvestmentInput = z.infer<typeof updateInvestmentSchema>;
export type AddHistoryEntryInput = z.infer<typeof addHistoryEntrySchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type MetricsQuery = z.infer<typeof metricsQuerySchema>;
export type DashboardQuery = z.infer<typeof dashboardQuerySchema>;
