/**
 * API route constants shared between frontend and backend.
 * Use these instead of hardcoded strings for traceability.
 *
 * When you need to trace a request from frontend to backend:
 * 1. Find the route constant used in the frontend
 * 2. Search for the same constant in the backend
 * 3. Follow to the controller → use case → domain
 */
export const API_ROUTES = {
  auth: {
    login: '/api/auth/login',
    logout: '/api/auth/logout',
    refresh: '/api/auth/refresh',
    me: '/api/auth/me',
    changePassword: '/api/auth/change-password',
    magicLink: '/api/auth/magic-link',
    verifyMagicLink: '/api/auth/verify-magic-link',
  },
  transactions: {
    base: '/api/transactions',
    byId: (id: string) => `/api/transactions/${id}`,
    paginated: '/api/transactions',
    bulkUpdate: '/api/transactions/bulk-update',
    smartCategorize: '/api/transactions/smart-categorize',
    reimbursements: '/api/transactions/reimbursements',
  },
  categories: {
    base: '/api/categories',
    byId: (id: string) => `/api/categories/${id}`,
    stats: (id: string) => `/api/categories/${id}/stats`,
  },
  dashboard: {
    base: '/api/dashboard',
    metrics: '/api/dashboard/metrics',
  },
  metrics: {
    periodStats: '/api/metrics/period-stats',
    dashboardData: '/api/metrics/dashboard',
    trends: '/api/metrics/trends',
  },
  investments: {
    base: '/api/investments',
    byId: (id: string) => `/api/investments/${id}`,
    portfolio: '/api/investments/portfolio',
    history: (id: string) => `/api/investments/${id}/history`,
  },
  import: {
    csv: '/api/import/csv',
    checkDuplicates: '/api/import/check-duplicates',
    selected: '/api/import/selected',
  },
  export: {
    csv: '/api/export/csv',
    json: '/api/export/json',
  },
  preferences: {
    base: '/api/preferences',
  },
  admin: {
    users: '/api/admin/users',
    userById: (id: string) => `/api/admin/users/${id}`,
    resetPassword: '/api/admin/users/reset-password',
  },
} as const;
