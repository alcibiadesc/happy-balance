import type { PageLoad } from './$types';
import { browser } from '$app/environment';
import { getApiUrl } from '$lib/utils/api-url';
import { ModernApiDashboardRepository } from '$lib/modules/dashboard/infrastructure/adapters/ModernApiDashboardRepository';
import { Period } from '$lib/modules/dashboard/domain/value-objects/Period';

export const load: PageLoad = async ({ fetch, depends }) => {
  // Declare dependency for invalidation
  depends('dashboard:data');

  if (!browser) {
    // Return empty data for SSR - will load on client
    return {
      initialData: null,
      availablePeriods: [],
      error: null
    };
  }

  const apiBase = getApiUrl();
  const repository = new ModernApiDashboardRepository(apiBase);

  try {
    // Load available periods and initial dashboard data in parallel
    const [availablePeriods, dashboardData] = await Promise.all([
      repository.getAvailablePeriods(),
      repository.getDashboardData(Period.create('overview', 0), 'EUR')
    ]);

    // Load 12 months history for charts
    const history = await repository.getHistory(12);

    return {
      initialData: {
        ...dashboardData,
        monthlyTrend: history.map((item: any) => {
          const summary = item.summary || item;
          return {
            month: item.monthName || item.label || item.month || 'Unknown',
            income: summary.income || 0,
            expenses: summary.expenses || 0,
            balance: summary.balance || ((summary.income || 0) - (summary.expenses || 0)),
            investments: summary.investments || 0
          };
        }),
        monthlyBarData: history.map((item: any) => {
          const summary = item.summary || item;
          const totalExpenses = summary.expenses || 0;
          return {
            month: item.monthName || item.label || item.month || 'Unknown',
            income: summary.income || 0,
            essentialExpenses: item.essentialExpenses || (totalExpenses * 0.6),
            discretionaryExpenses: item.discretionaryExpenses || (totalExpenses * 0.4),
            debtPayments: item.debtPayments || 0,
            investments: summary.investments || 0
          };
        })
      },
      availablePeriods,
      error: null
    };
  } catch (error) {
    return {
      initialData: null,
      availablePeriods: [],
      error: error instanceof Error ? error.message : 'Failed to load dashboard data'
    };
  }
};
