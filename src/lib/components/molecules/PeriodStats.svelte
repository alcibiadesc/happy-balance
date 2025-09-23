<script lang="ts">
  import { t } from '$lib/stores/i18n';
  import type { Transaction, Category } from '$lib/types/transaction';

  interface PeriodStatsData {
    income: number;
    expenses: number;
    essentialExpenses: number;
    discretionaryExpenses: number;
    investmentExpenses: number;
    uncategorizedExpenses: number;
    expensesWithoutInvestments: number;
    uncategorizedExpensesOnly: number;
    balance: number;
  }

  let { stats }: { stats: PeriodStatsData } = $props();

  function formatAmount(amount: number): string {
    if (isNaN(amount)) return '€0.00';
    const abs = Math.abs(amount);
    const formatted = abs.toLocaleString('es-ES', {
      style: 'currency',
      currency: 'EUR'
    });
    return amount < 0 && abs !== 0 ? `-${formatted}` : formatted;
  }
</script>

<div class="period-stats">
  <div class="balance-display">
    <div class="balance-label">{$t('transactions.period.balance')}</div>
    <div class="balance-value" class:positive={stats.balance >= 0} class:negative={stats.balance < 0}>
      {formatAmount(stats.balance)}
    </div>
  </div>

  <div class="stats-overview">
    <div class="stat-row">
      <span class="stat-label">{$t('transactions.period.income')}</span>
      <span class="stat-value income">{formatAmount(stats.income)}</span>
    </div>
    <div class="stat-row">
      <span class="stat-label">{$t('dashboard.metrics.investments')}</span>
      <span class="stat-value investment">{formatAmount(stats.investmentExpenses)}</span>
    </div>
    <div class="stat-row">
      <span class="stat-label">{$t('transactions.period.total_expenses')}</span>
      <span class="stat-value expense">{formatAmount(stats.expensesWithoutInvestments)}</span>
    </div>
  </div>

  <div class="expense-breakdown">
    <div class="breakdown-header">
      <span class="breakdown-title">{$t('transactions.period.expense_distribution')}</span>
    </div>

    <div class="breakdown-content">
      <div class="breakdown-row">
        <div class="breakdown-item">
          <div class="breakdown-dot essential"></div>
          <span class="breakdown-label">{$t('transactions.period.essential')}</span>
        </div>
        <span class="breakdown-value">{formatAmount(stats.essentialExpenses)}</span>
      </div>

      <div class="breakdown-row">
        <div class="breakdown-item">
          <div class="breakdown-dot discretionary"></div>
          <span class="breakdown-label">{$t('transactions.period.discretionary')}</span>
        </div>
        <span class="breakdown-value">{formatAmount(stats.discretionaryExpenses)}</span>
      </div>

      <div class="breakdown-row uncategorized">
        <div class="breakdown-item">
          <div class="breakdown-dot uncategorized"></div>
          <span class="breakdown-label">{$t('transactions.period.uncategorized')}</span>
        </div>
        <span class="breakdown-value">{formatAmount(stats.uncategorizedExpensesOnly)}</span>
      </div>
    </div>

    <div class="visual-bar">
      <div
        class="bar-segment essential"
        style="width: {stats.expensesWithoutInvestments > 0 ? (stats.essentialExpenses / stats.expensesWithoutInvestments * 100) : 0}%"
      ></div>
      <div
        class="bar-segment discretionary"
        style="width: {stats.expensesWithoutInvestments > 0 ? (stats.discretionaryExpenses / stats.expensesWithoutInvestments * 100) : 0}%"
      ></div>
      <div
        class="bar-segment uncategorized"
        style="width: {stats.expensesWithoutInvestments > 0 ? (stats.uncategorizedExpensesOnly / stats.expensesWithoutInvestments * 100) : 0}%"
      ></div>
    </div>
  </div>
</div>

<style>
  .period-stats {
    display: flex;
    flex-direction: column;
    gap: var(--space-xl);
    max-width: 320px;
    margin: 0 auto;
  }

  /* Balance Display - Featured */
  .balance-display {
    text-align: center;
  }

  .balance-label {
    font-size: 0.875rem;
    color: var(--text-muted);
    margin-bottom: var(--space-xs);
    font-weight: 300;
  }

  .balance-value {
    font-size: 2.25rem;
    font-weight: 300;
    letter-spacing: -0.025em;
    color: var(--text-primary);
  }

  .balance-value.positive {
    color: var(--acapulco);
  }

  .balance-value.negative {
    color: var(--froly);
  }

  /* Stats Overview - Clean rows */
  .stats-overview {
    border-top: 1px solid var(--gray-200);
    border-bottom: 1px solid var(--gray-200);
    padding: var(--space-lg) 0;
  }

  .stat-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--space-sm) 0;
  }

  .stat-label {
    font-size: 0.875rem;
    color: var(--text-secondary);
    font-weight: 400;
  }

  .stat-value {
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--text-primary);
  }

  .stat-value.income {
    color: var(--acapulco);
  }

  .stat-value.investment {
    color: #8B5CF6;
  }

  .stat-value.expense {
    color: var(--text-primary);
  }

  /* Expense Breakdown - Minimal */
  .expense-breakdown {
    padding-top: var(--space-md);
  }

  .breakdown-header {
    margin-bottom: var(--space-md);
  }

  .breakdown-title {
    font-size: 0.75rem;
    color: var(--text-muted);
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .breakdown-content {
    margin-bottom: var(--space-lg);
  }

  .breakdown-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--space-xs) 0;
  }

  .breakdown-row.uncategorized {
    opacity: 0.7;
    font-size: 0.8125rem;
  }

  .breakdown-item {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
  }

  .breakdown-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .breakdown-dot.essential {
    background: var(--froly);
  }

  .breakdown-dot.discretionary {
    background: var(--acapulco);
  }

  .breakdown-dot.uncategorized {
    background: var(--text-muted);
  }

  .breakdown-label {
    font-size: 0.8125rem;
    color: var(--text-secondary);
    font-weight: 400;
  }

  .breakdown-value {
    font-size: 0.8125rem;
    color: var(--text-primary);
    font-weight: 500;
  }

  /* Visual Bar - Subtle */
  .visual-bar {
    display: flex;
    height: 2px;
    border-radius: 1px;
    background: var(--gray-200);
    overflow: hidden;
  }

  .bar-segment {
    transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .bar-segment.essential {
    background: var(--froly);
  }

  .bar-segment.discretionary {
    background: var(--acapulco);
  }

  .bar-segment.uncategorized {
    background: var(--text-muted);
  }

  @media (max-width: 768px) {
    .period-stats {
      gap: var(--space-lg);
      max-width: 100%;
    }

    .balance-display {
      padding-bottom: var(--space-md);
    }

    .stats-overview {
      padding: var(--space-md) 0;
    }

    .expense-breakdown {
      padding-top: var(--space-sm);
    }
  }
</style>