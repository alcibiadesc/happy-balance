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
  },
  transactions: {
    base: '/api/transactions',
    byId: (id: string) => `/api/transactions/${id}`,
    paginated: '/api/transactions/paginated',
    autoCategorize: '/api/transactions/auto-categorize',
    categorize: (id: string) => `/api/transactions/${id}/categorize`,
    similar: (id: string) => `/api/transactions/${id}/similar`,
    potentialReimbursements: (id: string) => `/api/transactions/${id}/potential-reimbursements`,
    linkSplit: (id: string) => `/api/transactions/${id}/link-split`,
    unlinkSplit: (id: string) => `/api/transactions/${id}/unlink-split`,
    tinderSuggestions: '/api/transactions/tinder-suggestions',
    statistics: '/api/transactions/statistics',
    dashboard: '/api/transactions/dashboard',
    metrics: '/api/transactions/metrics',
  },
  categories: {
    base: '/api/categories',
    byId: (id: string) => `/api/categories/${id}`,
    stats: (id: string) => `/api/categories/${id}/stats`,
  },
  dashboard: {
    base: '/api/dashboard',
    current: '/api/dashboard/current',
    availablePeriods: '/api/dashboard/available-periods',
    history: '/api/dashboard/history',
    trends: '/api/dashboard/trends',
    year: (year: number) => `/api/dashboard/year/${year}`,
    month: (year: number, month: number) => `/api/dashboard/month/${year}/${month}`,
    quarter: (year: number, quarter: number) => `/api/dashboard/quarter/${year}/${quarter}`,
    comparison: (year: number, month: number) => `/api/dashboard/comparison/${year}/${month}`,
    categories: (year: number, month: number) => `/api/dashboard/categories/${year}/${month}`,
    savings: (year: number, month: number) => `/api/dashboard/savings/${year}/${month}`,
    enhanced: (year: number, month: number) => `/api/dashboard/enhanced/${year}/${month}`,
    range: '/api/dashboard/range',
  },
  metrics: {
    trends: '/api/metrics/trends',
  },
  investments: {
    base: '/api/investments',
    byId: (id: string) => `/api/investments/${id}`,
    summary: '/api/investments/summary',
    withMetrics: '/api/investments/with-metrics',
    timeline: '/api/investments/timeline',
    sortOrder: '/api/investments/sort-order',
    history: (id: string) => `/api/investments/${id}/history`,
    historyEntry: (id: string, historyId: string) =>
      `/api/investments/${id}/history/${historyId}`,
    syncCategories: '/api/investments/sync-categories',
    importGofire: '/api/investments/import/gofire',
    export: '/api/investments/export',
  },
  import: {
    csv: '/api/import/csv',
    preview: '/api/import/preview',
    validate: '/api/import/validate',
    checkDuplicates: '/api/import/check-duplicates',
    selected: '/api/import/selected',
    generateHashes: '/api/import/generate-hashes',
    history: '/api/import/history',
  },
  export: {
    all: '/api/export/all',
    importAll: '/api/export/import-all',
    transactions: '/api/export/transactions',
    investments: '/api/export/investments',
    categories: '/api/export/categories',
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
