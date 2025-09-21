import { writable, derived } from "svelte/store";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3005/api";

export interface DashboardMetrics {
  periodBalance: {
    income: number;
    expenses: number;
    balance: number;
    currency: string;
  };
  expenseDistribution: {
    essential: number;
    discretionary: number;
    uncategorized: number;
    currency: string;
  };
  categoryBreakdown: Array<{
    categoryId: string | null;
    categoryName: string;
    amount: number;
    percentage: number;
    transactionCount: number;
    isEssential: boolean;
  }>;
  monthlyTrend: Array<{
    month: string;
    income: number;
    expenses: number;
    balance: number;
  }>;
  transactionMetrics: {
    totalCount: number;
    avgTransactionAmount: number;
    largestTransaction: number;
    smallestTransaction: number;
    mostFrequentMerchant: string;
    transactionCountByType: {
      income: number;
      expense: number;
      investment: number;
    };
  };
  lastUpdated: string;
  periodInfo: {
    startDate: string;
    endDate: string;
    periodType: "week" | "month" | "quarter" | "year" | "custom";
  };
}

interface MetricsState {
  data: DashboardMetrics | null;
  loading: boolean;
  error: string | null;
  cache: Map<string, { data: DashboardMetrics; timestamp: number }>;
}

const CACHE_TTL = 2 * 60 * 1000; // 2 minutes cache for metrics

function createDashboardMetricsStore() {
  const { subscribe, update } = writable<MetricsState>({
    data: null,
    loading: false,
    error: null,
    cache: new Map(),
  });

  function getCacheKey(params: any): string {
    return JSON.stringify(params);
  }

  function isCacheValid(timestamp: number): boolean {
    return Date.now() - timestamp < CACHE_TTL;
  }

  return {
    subscribe,

    async loadMetrics(params: {
      period?: "week" | "month" | "quarter" | "year" | "custom";
      startDate?: string;
      endDate?: string;
      currency?: string;
      periodOffset?: number;
      includeInvestments?: boolean;
    } = {}) {
      const cacheKey = getCacheKey(params);

      // Check cache first
      update((state) => {
        const cached = state.cache.get(cacheKey);
        if (cached && isCacheValid(cached.timestamp)) {
          console.log("📦 Metrics cache hit");
          return {
            ...state,
            data: cached.data,
            loading: false,
            error: null,
          };
        }

        // Set loading state
        return {
          ...state,
          loading: true,
          error: null,
        };
      });

      try {
        // Build query parameters
        const searchParams = new URLSearchParams();

        if (params.period) searchParams.set("period", params.period);
        if (params.startDate) searchParams.set("startDate", params.startDate);
        if (params.endDate) searchParams.set("endDate", params.endDate);
        if (params.currency) searchParams.set("currency", params.currency);
        if (params.periodOffset !== undefined) searchParams.set("periodOffset", params.periodOffset.toString());
        if (params.includeInvestments !== undefined) searchParams.set("includeInvestments", params.includeInvestments.toString());

        const response = await fetch(`${API_BASE}/transactions/metrics?${searchParams}`);

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Failed to load metrics");
        }

        const result = await response.json();

        if (result.success && result.data) {
          const metrics = result.data as DashboardMetrics;

          update((state) => {
            // Cache the result
            state.cache.set(cacheKey, {
              data: metrics,
              timestamp: Date.now(),
            });

            return {
              ...state,
              data: metrics,
              loading: false,
              error: null,
            };
          });

          console.log("✅ Dashboard metrics loaded:", metrics);
        } else {
          throw new Error("Invalid metrics response");
        }
      } catch (error) {
        console.error("❌ Failed to load dashboard metrics:", error);

        update((state) => ({
          ...state,
          loading: false,
          error: error instanceof Error ? error.message : "Unknown error",
        }));
      }
    },

    // Clear cache
    clearCache() {
      update((state) => ({
        ...state,
        cache: new Map(),
      }));
    },

    // Reset state
    reset() {
      update(() => ({
        data: null,
        loading: false,
        error: null,
        cache: new Map(),
      }));
    },
  };
}

// Create store instance
export const dashboardMetrics = createDashboardMetricsStore();

// Derived stores for easy access
export const metricsData = derived(
  dashboardMetrics,
  ($store) => $store.data
);

export const metricsLoading = derived(
  dashboardMetrics,
  ($store) => $store.loading
);

export const metricsError = derived(
  dashboardMetrics,
  ($store) => $store.error
);

// Derived computed metrics
export const computedMetrics = derived(metricsData, ($data) => {
  if (!$data) {
    return {
      savingsRate: 0,
      spendingRate: 0,
      essentialExpenseRatio: 0,
      avgDailySpending: 0,
      remainingBudget: 0,
    };
  }

  const { periodBalance, expenseDistribution, transactionMetrics } = $data;

  const savingsRate = periodBalance.income > 0
    ? (periodBalance.balance / periodBalance.income) * 100
    : 0;

  const spendingRate = periodBalance.income > 0
    ? (periodBalance.expenses / periodBalance.income) * 100
    : 0;

  const totalExpenseDistribution = expenseDistribution.essential +
    expenseDistribution.discretionary +
    expenseDistribution.uncategorized;

  const essentialExpenseRatio = totalExpenseDistribution > 0
    ? (expenseDistribution.essential / totalExpenseDistribution) * 100
    : 0;

  // Calculate average daily spending (assumes 30 days for month, adjust as needed)
  const daysInPeriod = $data.periodInfo.periodType === 'week' ? 7 :
    $data.periodInfo.periodType === 'month' ? 30 :
    $data.periodInfo.periodType === 'quarter' ? 90 :
    $data.periodInfo.periodType === 'year' ? 365 : 30;

  const avgDailySpending = periodBalance.expenses / daysInPeriod;

  return {
    savingsRate: Math.round(savingsRate * 100) / 100,
    spendingRate: Math.round(spendingRate * 100) / 100,
    essentialExpenseRatio: Math.round(essentialExpenseRatio * 100) / 100,
    avgDailySpending: Math.round(avgDailySpending * 100) / 100,
    remainingBudget: periodBalance.balance,
  };
});

// Helper functions for formatting
export function formatMetricsCurrency(amount: number, currency: string = 'EUR'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatMetricsPercentage(value: number): string {
  return `${value.toFixed(1)}%`;
}

// Quick access functions
export function getIncomeTotal(data: DashboardMetrics | null): number {
  return data?.periodBalance.income || 0;
}

export function getExpensesTotal(data: DashboardMetrics | null): number {
  return data?.periodBalance.expenses || 0;
}

export function getBalanceTotal(data: DashboardMetrics | null): number {
  return data?.periodBalance.balance || 0;
}

export function getTopCategories(data: DashboardMetrics | null, limit: number = 5) {
  return data?.categoryBreakdown
    .filter(cat => cat.amount > 0)
    .sort((a, b) => b.amount - a.amount)
    .slice(0, limit) || [];
}

export function getExpensesByType(data: DashboardMetrics | null) {
  if (!data) {
    return {
      essential: 0,
      discretionary: 0,
      uncategorized: 0,
      essentialPercentage: 0,
      discretionaryPercentage: 0,
      uncategorizedPercentage: 0,
    };
  }

  const { expenseDistribution } = data;
  const total = expenseDistribution.essential +
    expenseDistribution.discretionary +
    expenseDistribution.uncategorized;

  return {
    essential: expenseDistribution.essential,
    discretionary: expenseDistribution.discretionary,
    uncategorized: expenseDistribution.uncategorized,
    essentialPercentage: total > 0 ? (expenseDistribution.essential / total) * 100 : 0,
    discretionaryPercentage: total > 0 ? (expenseDistribution.discretionary / total) * 100 : 0,
    uncategorizedPercentage: total > 0 ? (expenseDistribution.uncategorized / total) * 100 : 0,
  };
}