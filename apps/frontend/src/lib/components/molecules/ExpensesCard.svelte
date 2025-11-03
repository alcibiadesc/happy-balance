<script lang="ts">
  import { TrendingDown, TrendingUp, PiggyBank, ChevronDown, ChevronUp } from "lucide-svelte";
  import { t } from "$lib/stores/i18n";

  interface Props {
    totalExpenses: number;
    totalIncome: number;
    totalInvestments: number;
    essentialExpenses: number;
    discretionaryExpenses: number;
    debtPayments: number;
    uncategorizedExpenses?: number;
    categoryBreakdown?: any[];
    expensesTrend: number;
    incomeTrend: number;
    investmentsTrend: number;
    loading?: boolean;
    formatCurrency: (amount: number) => string;
    formatTrend: (value: number) => string;
    getTrendColor: (value: number, type: string) => string;
  }

  let {
    totalExpenses,
    totalIncome,
    totalInvestments,
    essentialExpenses,
    discretionaryExpenses,
    debtPayments,
    uncategorizedExpenses = 0,
    categoryBreakdown = [],
    expensesTrend,
    incomeTrend,
    investmentsTrend,
    loading = false,
    formatCurrency,
    formatTrend,
    getTrendColor,
  }: Props = $props();

  type BreakdownType = 'expenses' | 'income' | 'investments';
  let selectedType = $state<BreakdownType>('expenses');
  let expanded = $state(false);

  // Use uncategorized from props, or calculate if not provided
  const othersAmount = $derived(
    uncategorizedExpenses ||
    Math.max(0, totalExpenses - essentialExpenses - discretionaryExpenses - debtPayments)
  );

  // Get income categories with totals
  const incomeCategories = $derived(
    categoryBreakdown
      .filter(cat => cat.type === 'income' || cat.type === 'INCOME')
      .filter(cat => cat.total && Math.abs(cat.total) > 0.01)
      .sort((a, b) => Math.abs(b.total) - Math.abs(a.total))
  );

  // Get investment categories with totals
  const investmentCategories = $derived(
    categoryBreakdown
      .filter(cat => cat.type === 'investment' || cat.type === 'INVESTMENT')
      .filter(cat => cat.total && Math.abs(cat.total) > 0.01)
      .sort((a, b) => Math.abs(b.total) - Math.abs(a.total))
  );

  // Current totals and trend based on selected type
  const currentTotal = $derived(
    selectedType === 'expenses' ? totalExpenses :
    selectedType === 'income' ? totalIncome :
    totalInvestments
  );

  const currentTrend = $derived(
    selectedType === 'expenses' ? expensesTrend :
    selectedType === 'income' ? incomeTrend :
    investmentsTrend
  );

  const currentIcon = $derived(
    selectedType === 'expenses' ? TrendingDown :
    selectedType === 'income' ? TrendingUp :
    PiggyBank
  );

  const currentColor = $derived(
    selectedType === 'expenses' ? 'expenses' :
    selectedType === 'income' ? 'income' :
    'investments'
  );

  const currentLabel = $derived(
    selectedType === 'expenses' ? $t("dashboard.metrics.expenses") :
    selectedType === 'income' ? $t("dashboard.metrics.income") :
    $t("dashboard.metrics.investments")
  );

  function toggleExpanded() {
    expanded = !expanded;
  }

  function selectType(type: BreakdownType) {
    selectedType = type;
    if (!expanded) {
      expanded = true;
    }
  }
</script>

<article class="metric-card expenses-card">
  <div class="metric-header">
    <div class="metric-icon {currentColor}">
      <svelte:component this={currentIcon} size={18} strokeWidth={2} />
    </div>
    <span class="metric-label">{currentLabel}</span>
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

  <!-- Type Selector Tabs -->
  <div class="type-selector">
    <button
      class="type-tab"
      class:active={selectedType === 'expenses'}
      onclick={() => selectType('expenses')}
    >
      {$t("dashboard.metrics.expenses")}
    </button>
    <button
      class="type-tab"
      class:active={selectedType === 'income'}
      onclick={() => selectType('income')}
    >
      {$t("dashboard.metrics.income")}
    </button>
    <button
      class="type-tab"
      class:active={selectedType === 'investments'}
      onclick={() => selectType('investments')}
    >
      {$t("dashboard.metrics.investments")}
    </button>
  </div>

  <div class="metric-body">
    <div class="metric-value">
      {#if loading}
        <div class="metric-skeleton"></div>
      {:else}
        {formatCurrency(currentTotal)}
      {/if}
    </div>
    {#if !loading}
      <div
        class="metric-trend"
        style="color: {getTrendColor(currentTrend, currentColor)}"
      >
        {formatTrend(currentTrend)}
      </div>
    {/if}
  </div>

  {#if expanded && currentTotal > 0}
    <div class="expenses-breakdown">
      {#if selectedType === 'expenses'}
        <!-- Expense Breakdown -->
        <div class="breakdown-item">
          <div class="breakdown-info">
            <div class="category-indicator essential"></div>
            <div>
              <span class="breakdown-label"
                >{$t("dashboard.metrics.essential_expenses")}</span
              >
              <span class="breakdown-amount"
                >{formatCurrency(essentialExpenses)}</span
              >
            </div>
          </div>
          <div class="breakdown-percentage">
            {Math.round((essentialExpenses / totalExpenses) * 100)}%
          </div>
        </div>

        <div class="breakdown-item">
          <div class="breakdown-info">
            <div class="category-indicator discretionary"></div>
            <div>
              <span class="breakdown-label"
                >{$t("dashboard.metrics.discretionary_expenses")}</span
              >
              <span class="breakdown-amount"
                >{formatCurrency(discretionaryExpenses)}</span
              >
            </div>
          </div>
          <div class="breakdown-percentage">
            {Math.round((discretionaryExpenses / totalExpenses) * 100)}%
          </div>
        </div>

        {#if debtPayments > 0}
          <div class="breakdown-item">
            <div class="breakdown-info">
              <div class="category-indicator debt"></div>
              <div>
                <span class="breakdown-label"
                  >{$t("dashboard.metrics.debt_payments")}</span
                >
                <span class="breakdown-amount">{formatCurrency(debtPayments)}</span>
              </div>
            </div>
            <div class="breakdown-percentage">
              {Math.round((debtPayments / totalExpenses) * 100)}%
            </div>
          </div>
        {/if}

        {#if othersAmount > 0}
          <div class="breakdown-item">
            <div class="breakdown-info">
              <div class="category-indicator others"></div>
              <div>
                <span class="breakdown-label">Otros gastos</span>
                <span class="breakdown-amount">{formatCurrency(othersAmount)}</span>
              </div>
            </div>
            <div class="breakdown-percentage">
              {Math.round((othersAmount / totalExpenses) * 100)}%
            </div>
          </div>
        {/if}

      {:else if selectedType === 'income'}
        <!-- Income Categories Breakdown -->
        {#each incomeCategories as category}
          <div class="breakdown-item">
            <div class="breakdown-info">
              <div class="category-indicator income-category"></div>
              <div>
                <span class="breakdown-label">{category.name}</span>
                <span class="breakdown-amount">{formatCurrency(Math.abs(category.total))}</span>
              </div>
            </div>
            <div class="breakdown-percentage">
              {Math.round((Math.abs(category.total) / totalIncome) * 100)}%
            </div>
          </div>
        {/each}

      {:else if selectedType === 'investments'}
        <!-- Investment Categories Breakdown -->
        {#each investmentCategories as category}
          <div class="breakdown-item">
            <div class="breakdown-info">
              <div class="category-indicator investment-category"></div>
              <div>
                <span class="breakdown-label">{category.name}</span>
                <span class="breakdown-amount">{formatCurrency(Math.abs(category.total))}</span>
              </div>
            </div>
            <div class="breakdown-percentage">
              {Math.round((Math.abs(category.total) / totalInvestments) * 100)}%
            </div>
          </div>
        {/each}
      {/if}
    </div>
  {:else if expanded && currentTotal === 0}
    <div class="expenses-breakdown">
      <div class="no-expenses-message">
        <span class="no-expenses-text">
          {#if selectedType === 'expenses'}
            No hay gastos para este período
          {:else if selectedType === 'income'}
            No hay ingresos para este período
          {:else}
            No hay inversiones para este período
          {/if}
        </span>
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

  .metric-icon.income {
    background: rgba(52, 211, 153, 0.1);
    color: var(--success);
  }

  .metric-icon.investments {
    background: rgba(96, 165, 250, 0.1);
    color: var(--primary);
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

  /* Type Selector Tabs */
  .type-selector {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 1rem;
    padding: 0.25rem;
    background: var(--surface-muted);
    border-radius: 8px;
  }

  .type-tab {
    flex: 1;
    padding: 0.5rem 0.75rem;
    border: none;
    background: transparent;
    color: var(--text-secondary);
    font-size: 0.8125rem;
    font-weight: 500;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .type-tab:hover {
    background: var(--surface-elevated);
    color: var(--text-primary);
  }

  .type-tab.active {
    background: var(--surface-elevated);
    color: var(--text-primary);
    font-weight: 600;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
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

  .category-indicator.essential {
    background-color: var(--primary);
  }

  .category-indicator.discretionary {
    background-color: var(--warning);
  }

  .category-indicator.debt {
    background-color: var(--accent);
  }

  .category-indicator.others {
    background-color: var(--text-muted);
  }

  .category-indicator.income-category {
    background-color: var(--success);
  }

  .category-indicator.investment-category {
    background-color: var(--primary);
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
