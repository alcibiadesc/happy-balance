<script lang="ts">
  import { TrendingDown, ChevronDown, ChevronUp } from "lucide-svelte";
  import { t } from "$lib/stores/i18n";

  interface CategoryData {
    id: string;
    name: string;
    amount: number;
    percentage: number;
    transactionCount?: number;
    color?: string;
    monthlyBudget?: number | null;
    quarterlyBudget?: number | null;
    budgetUsage?: number | null;
    annualBudget?: number | null;
  }

  interface Props {
    totalExpenses: number;
    essentialExpenses: number;
    discretionaryExpenses: number;
    debtPayments: number;
    categoryBreakdown?: CategoryData[];
    trend: number;
    loading?: boolean;
    formatCurrency: (amount: number) => string;
    formatTrend: (value: number) => string;
    getTrendColor: (value: number, type: string) => string;
  }

  let {
    totalExpenses,
    essentialExpenses,
    discretionaryExpenses,
    debtPayments,
    categoryBreakdown = [],
    trend,
    loading = false,
    formatCurrency,
    formatTrend,
    getTrendColor,
  }: Props = $props();

  $effect(() => {
    console.log(
      "[ExpensesCard] Props received, categoryBreakdown:",
      categoryBreakdown,
    );
    if (categoryBreakdown.length > 0) {
      console.log("[ExpensesCard] First category:", categoryBreakdown[0]);
    }
  });

  let expanded = $state(false);

  function toggleExpanded() {
    expanded = !expanded;
  }
</script>

<article class="metric-card expenses-card">
  <div class="metric-header">
    <div class="metric-icon expenses">
      <TrendingDown size={18} strokeWidth={2} />
    </div>
    <span class="metric-label">{$t("dashboard.metrics.expenses")}</span>
    <button
      class="expand-button"
      onclick={toggleExpanded}
      aria-label={expanded ? "Contraer desglose" : "Ver desglose"}
    >
      {#if expanded}
        <ChevronUp size={16} />
      {:else}
        <ChevronDown size={16} />
      {/if}
    </button>
  </div>

  <div class="metric-body">
    <div class="metric-value">
      {#if loading}
        <div class="metric-skeleton"></div>
      {:else}
        {formatCurrency(totalExpenses)}
      {/if}
    </div>
    {#if !loading}
      <div
        class="metric-trend"
        style="color: {getTrendColor(trend, 'expenses')}"
      >
        {formatTrend(trend)}
      </div>
    {/if}
  </div>

  {#if expanded && totalExpenses > 0}
    <div class="expenses-breakdown">
      {#if categoryBreakdown.length > 0}
        {#each categoryBreakdown.slice(0, 5) as category}
          {@const categoryAmount =
            typeof category.amount === "object"
              ? category.amount.amount
              : category.amount}
          {@const hasMonthlyBudget =
            category.monthlyBudget !== null &&
            category.monthlyBudget !== undefined &&
            category.monthlyBudget > 0}
          <div class="breakdown-item">
            <div class="breakdown-info">
              {#if category.color}
                <div
                  class="category-indicator"
                  style="background-color: {category.color}"
                ></div>
              {/if}
              <div>
                <span class="breakdown-label">{category.name}</span>
                <div class="breakdown-amounts">
                  <span class="breakdown-amount">
                    {formatCurrency(categoryAmount)}
                    {#if hasMonthlyBudget}
                      / {formatCurrency(category.monthlyBudget)}
                      {#if category.budgetUsage !== null && category.budgetUsage !== undefined}
                        <span
                          class="budget-usage-inline"
                          class:over-budget={category.budgetUsage > 100}
                        >
                          ({Math.round(category.budgetUsage)}%)
                        </span>
                      {/if}
                    {/if}
                  </span>
                </div>
              </div>
            </div>
            <div class="breakdown-stats">
              <div class="breakdown-percentage">
                {Math.round(
                  category.percentage || (categoryAmount / totalExpenses) * 100,
                )}%
              </div>
            </div>
          </div>
        {/each}
        {#if categoryBreakdown.length > 5}
          <div class="breakdown-item more-categories">
            <span class="breakdown-label"
              >+{categoryBreakdown.length - 5} categorías más</span
            >
          </div>
        {/if}
      {:else}
        <!-- Fallback to old display if no category data -->
        <div class="breakdown-item">
          <div class="breakdown-info">
            <span class="breakdown-label"
              >{$t("dashboard.metrics.essential_expenses")}</span
            >
            <span class="breakdown-amount"
              >{formatCurrency(essentialExpenses)}</span
            >
          </div>
          <div class="breakdown-percentage">
            {Math.round((essentialExpenses / totalExpenses) * 100)}%
          </div>
        </div>

        <div class="breakdown-item">
          <div class="breakdown-info">
            <span class="breakdown-label"
              >{$t("dashboard.metrics.discretionary_expenses")}</span
            >
            <span class="breakdown-amount"
              >{formatCurrency(discretionaryExpenses)}</span
            >
          </div>
          <div class="breakdown-percentage">
            {Math.round((discretionaryExpenses / totalExpenses) * 100)}%
          </div>
        </div>

        <div class="breakdown-item">
          <div class="breakdown-info">
            <span class="breakdown-label"
              >{$t("dashboard.metrics.debt_payments")}</span
            >
            <span class="breakdown-amount">{formatCurrency(debtPayments)}</span>
          </div>
          <div class="breakdown-percentage">
            {Math.round((debtPayments / totalExpenses) * 100)}%
          </div>
        </div>
      {/if}
    </div>
  {:else if expanded && totalExpenses === 0}
    <div class="expenses-breakdown">
      <div class="no-expenses-message">
        <span class="no-expenses-text">No hay gastos para este período</span>
      </div>
    </div>
  {/if}
</article>

<style>
  .expenses-card {
    background: var(--surface-elevated);
    border-radius: 12px;
    padding: 1.25rem;
    transition: all 0.2s ease;
    border: 1px solid var(--border-color, transparent);
  }

  .expenses-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  }

  .metric-header {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 1rem;
    position: relative;
  }

  .metric-icon {
    width: 36px;
    height: 36px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .metric-icon.expenses {
    background: rgba(245, 121, 108, 0.1);
    color: var(--accent);
  }

  .metric-label {
    font-size: 0.875rem;
    color: var(--text-secondary);
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    flex: 1;
  }

  .expand-button {
    border: none;
    background: transparent;
    color: var(--text-muted);
    cursor: pointer;
    padding: 0.25rem;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
  }

  .expand-button:hover {
    color: var(--text-primary);
    background: var(--surface-muted);
  }

  .metric-body {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
  }

  .metric-value {
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--text-primary);
    letter-spacing: -0.025em;
  }

  .metric-trend {
    font-size: 0.875rem;
    font-weight: 600;
  }

  .expenses-breakdown {
    margin-top: 1rem;
    padding-top: 1rem;
    border-top: 1px solid var(--border-color);
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .breakdown-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .breakdown-info {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .breakdown-info > div {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .category-indicator {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .breakdown-label {
    font-size: 0.8125rem;
    color: var(--text-secondary);
    font-weight: 500;
  }

  .breakdown-amount {
    font-size: 0.9375rem;
    color: var(--text-primary);
    font-weight: 600;
  }

  .breakdown-amounts {
    display: flex;
    align-items: baseline;
    gap: 0.25rem;
  }

  .breakdown-budget {
    font-size: 0.75rem;
    color: var(--text-muted);
  }

  .budget-usage-inline {
    font-size: 0.875rem;
    color: var(--success);
    font-weight: 600;
    margin-left: 0.25rem;
  }

  .budget-usage-inline.over-budget {
    color: var(--accent);
  }

  .breakdown-stats {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 0.25rem;
  }

  .breakdown-percentage {
    font-size: 0.875rem;
    color: var(--text-primary);
    font-weight: 600;
    padding: 0.125rem 0.5rem;
    background: var(--surface-muted);
    border-radius: 12px;
  }

  .metric-skeleton {
    width: 80%;
    height: 1.5rem;
    background: linear-gradient(
      90deg,
      var(--surface-muted) 25%,
      var(--surface-elevated) 50%,
      var(--surface-muted) 75%
    );
    background-size: 200% 100%;
    border-radius: 4px;
    animation: skeleton-loading 1.5s infinite;
  }

  @keyframes skeleton-loading {
    0% {
      background-position: 200% 0;
    }
    100% {
      background-position: -200% 0;
    }
  }

  .no-expenses-message {
    text-align: center;
    padding: 1rem;
  }

  .no-expenses-text {
    font-size: 0.875rem;
    color: var(--text-muted);
    font-style: italic;
  }

  .more-categories {
    padding-top: 0.5rem;
    border-top: 1px dashed var(--border-color);
    font-size: 0.8125rem;
    color: var(--text-muted);
    font-style: italic;
  }
</style>
