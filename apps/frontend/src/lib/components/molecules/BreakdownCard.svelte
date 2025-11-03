<script lang="ts">
  import { TrendingDown, TrendingUp, PiggyBank, ChevronDown, ChevronUp } from "lucide-svelte";
  import { t } from "$lib/stores/i18n";

  interface Props {
    // Metrics
    totalExpenses: number;
    totalIncome: number;
    totalInvestments: number;

    // Expense breakdown
    essentialExpenses: number;
    discretionaryExpenses: number;
    debtPayments: number;
    uncategorizedExpenses?: number;

    // Income & Investment categories
    categoryBreakdown: any[];

    // Trend
    expensesTrend: number;
    incomeTrend: number;
    investmentsTrend: number;

    // Utilities
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

  // Calculate others amount for expenses
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

  function toggleExpanded() {
    expanded = !expanded;
  }

  function selectType(type: BreakdownType) {
    selectedType = type;
    expanded = true;
  }
</script>

<article class="breakdown-card">
  <!-- Type Selector Tabs -->
  <div class="type-selector">
    <button
      class="type-tab"
      class:active={selectedType === 'expenses'}
      onclick={() => selectType('expenses')}
    >
      <TrendingDown size={16} />
      <span>Gastos</span>
    </button>
    <button
      class="type-tab"
      class:active={selectedType === 'income'}
      onclick={() => selectType('income')}
    >
      <TrendingUp size={16} />
      <span>Ingresos</span>
    </button>
    <button
      class="type-tab"
      class:active={selectedType === 'investments'}
      onclick={() => selectType('investments')}
    >
      <PiggyBank size={16} />
      <span>Inversiones</span>
    </button>
  </div>

  <!-- Header -->
  <div class="metric-header">
    <div class="metric-icon {currentColor}">
      <svelte:component this={currentIcon} size={18} strokeWidth={2} />
    </div>
    <span class="metric-label">
      {selectedType === 'expenses' ? $t("dashboard.metrics.expenses") :
       selectedType === 'income' ? $t("dashboard.metrics.income") :
       $t("dashboard.metrics.investments")}
    </span>
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

  <!-- Value & Trend -->
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

  <!-- Breakdown -->
  {#if expanded && currentTotal > 0}
    <div class="breakdown">
      {#if selectedType === 'expenses'}
        <!-- Expenses Breakdown -->
        <div class="breakdown-item">
          <div class="breakdown-info">
            <div class="category-indicator essential"></div>
            <div>
              <span class="breakdown-label">{$t("dashboard.metrics.essential_expenses")}</span>
              <span class="breakdown-amount">{formatCurrency(essentialExpenses)}</span>
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
              <span class="breakdown-label">{$t("dashboard.metrics.discretionary_expenses")}</span>
              <span class="breakdown-amount">{formatCurrency(discretionaryExpenses)}</span>
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
                <span class="breakdown-label">{$t("dashboard.metrics.debt_payments")}</span>
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
        <!-- Income Breakdown -->
        {#if incomeCategories.length > 0}
          {#each incomeCategories as category}
            <div class="breakdown-item">
              <div class="breakdown-info">
                <div class="category-indicator income" style="background-color: {category.color || '#7aba9e'}"></div>
                <div>
                  <span class="breakdown-label">
                    {#if category.icon}{category.icon}{/if}
                    {category.name}
                  </span>
                  <span class="breakdown-amount">{formatCurrency(Math.abs(category.total))}</span>
                </div>
              </div>
              <div class="breakdown-percentage">
                {Math.round((Math.abs(category.total) / totalIncome) * 100)}%
              </div>
            </div>
          {/each}
        {:else}
          <div class="no-data-message">
            <span class="no-data-text">No hay categorías de ingresos para este período</span>
          </div>
        {/if}

      {:else if selectedType === 'investments'}
        <!-- Investments Breakdown -->
        {#if investmentCategories.length > 0}
          {#each investmentCategories as category}
            <div class="breakdown-item">
              <div class="breakdown-info">
                <div class="category-indicator investment" style="background-color: {category.color || '#023c46'}"></div>
                <div>
                  <span class="breakdown-label">
                    {#if category.icon}{category.icon}{/if}
                    {category.name}
                  </span>
                  <span class="breakdown-amount">{formatCurrency(Math.abs(category.total))}</span>
                </div>
              </div>
              <div class="breakdown-percentage">
                {Math.round((Math.abs(category.total) / totalInvestments) * 100)}%
              </div>
            </div>
          {/each}
        {:else}
          <div class="no-data-message">
            <span class="no-data-text">No hay inversiones para este período</span>
          </div>
        {/if}
      {/if}
    </div>
  {:else if expanded && currentTotal === 0}
    <div class="breakdown">
      <div class="no-data-message">
        <span class="no-data-text">
          {selectedType === 'expenses' ? 'No hay gastos para este período' :
           selectedType === 'income' ? 'No hay ingresos para este período' :
           'No hay inversiones para este período'}
        </span>
      </div>
    </div>
  {/if}
</article>

<style>
  .breakdown-card {
    background: var(--surface-elevated);
    border-radius: 12px;
    padding: 1.25rem;
    transition: all 0.2s ease;
    border: 1px solid var(--border-color, transparent);
  }

  .breakdown-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
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
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.5rem 0.75rem;
    border: none;
    border-radius: 6px;
    background: transparent;
    color: var(--text-secondary);
    font-size: 0.8125rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .type-tab:hover {
    background: var(--surface-elevated);
    color: var(--text-primary);
  }

  .type-tab.active {
    background: var(--surface-elevated);
    color: var(--primary);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  }

  /* Header */
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
    background: rgba(122, 186, 158, 0.1);
    color: var(--success);
  }

  .metric-icon.investments {
    background: rgba(2, 60, 70, 0.1);
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

  /* Value & Trend */
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

  /* Breakdown */
  .breakdown {
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

  .no-data-message {
    text-align: center;
    padding: 1rem;
  }

  .no-data-text {
    font-size: 0.875rem;
    color: var(--text-muted);
    font-style: italic;
  }
</style>
