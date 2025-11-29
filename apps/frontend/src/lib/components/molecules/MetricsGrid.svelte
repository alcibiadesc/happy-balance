<script lang="ts">
  import { TrendingUp, PiggyBank } from 'lucide-svelte';
  import MetricCard from '../atoms/MetricCard.svelte';
  import ExpensesCard from './ExpensesCard.svelte';

  interface FilteredMetrics {
    income: number;
    expenses: number;
    investments: number;
    balance: number;
    savingsRate: number;
  }

  interface Trends {
    income: number;
    expenses: number;
    investments: number;
  }

  interface ExpenseDistribution {
    essential?: { _amount: number } | number;
    discretionary?: { _amount: number } | number;
    debtPayments?: { _amount: number } | number;
    uncategorized?: { _amount: number } | number;
  }

  interface Props {
    metrics: FilteredMetrics;
    trends: Trends;
    expenseDistribution?: ExpenseDistribution;
    categoryBreakdown?: any[];
    loading?: boolean;
    labels: {
      income: string;
      expenses: string;
      investments: string;
      balance: string;
      savedPercentage: string;
    };
    formatCurrency: (amount: number) => string;
    formatTrend: (value: number) => string;
    getTrendColor: (value: number, type: string) => string;
  }

  let {
    metrics,
    trends,
    expenseDistribution,
    categoryBreakdown = [],
    loading = false,
    labels,
    formatCurrency,
    formatTrend,
    getTrendColor
  }: Props = $props();

</script>

<section class="metrics-section">
  <div class="metrics-grid">
    <!-- Income Card -->
    <MetricCard
      icon={TrendingUp}
      iconClass="income"
      label={labels.income}
      value={formatCurrency(metrics.income)}
      {loading}
      trend={formatTrend(trends.income)}
      trendColor={getTrendColor(trends.income, 'income')}
    />

    <!-- Expenses Card -->
    <ExpensesCard
      value={formatCurrency(metrics.expenses)}
      trend={formatTrend(trends.expenses)}
      trendColor={getTrendColor(trends.expenses, 'expenses')}
      {loading}
    />

    <!-- Investments Card -->
    <MetricCard
      icon={PiggyBank}
      iconClass="investments"
      label={labels.investments}
      value={formatCurrency(metrics.investments)}
      {loading}
      trend={formatTrend(trends.investments)}
      trendColor={getTrendColor(trends.investments, 'investments')}
    />
  </div>
</section>

<style>
  .metrics-section {
    margin-bottom: 2rem;
  }

  .metrics-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1rem;
  }

  /* Responsive */
  @media (max-width: 768px) {
    .metrics-grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  @media (max-width: 480px) {
    .metrics-grid {
      grid-template-columns: 1fr;
    }
  }
</style>