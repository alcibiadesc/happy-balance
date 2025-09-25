<script lang="ts">
  import { TrendingUp, Wallet, PiggyBank } from 'lucide-svelte';
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
    essential?: { _amount: number };
    discretionary?: { _amount: number };
    debtPayments?: { _amount: number };
  }

  interface Props {
    metrics: FilteredMetrics;
    trends: Trends;
    expenseDistribution?: ExpenseDistribution;
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

    <!-- Expenses Card with Breakdown -->
    <ExpensesCard
      totalExpenses={metrics.expenses}
      essentialExpenses={expenseDistribution?.essential?._amount || 0}
      discretionaryExpenses={expenseDistribution?.discretionary?._amount || 0}
      debtPayments={expenseDistribution?.debtPayments?._amount || 0}
      trend={trends.expenses}
      {loading}
      {formatCurrency}
      {formatTrend}
      {getTrendColor}
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

    <!-- Balance Card -->
    <MetricCard
      icon={Wallet}
      iconClass="balance"
      label={labels.balance}
      value={formatCurrency(metrics.balance)}
      {loading}
      subtext={labels.savedPercentage.replace('{percentage}', metrics.savingsRate.toFixed(1))}
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