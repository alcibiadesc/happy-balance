<script lang="ts">
  import CategoryCard from '../atoms/CategoryCard.svelte';
  import { ChevronDown, ChevronUp } from 'lucide-svelte';
  import { t } from '$lib/stores/i18n';

  interface Category {
    name: string;
    amount: number;
    percentage: number;
    color?: string;
    icon?: string;
    monthlyBudget?: number | null;
    budgetUsage?: number | null;
    type?: string;
    total?: number;
    categoryName?: string;
  }

  interface Props {
    title: string;
    categories?: Category[];
    categoryBreakdown?: Category[];
    expenseDistribution?: Record<string, number>;
    totalExpenses?: number;
    totalIncome?: number;
    totalInvestments?: number;
    formatCurrency: (amount: number) => string;
  }

  let {
    title,
    categories = [],
    categoryBreakdown = [],
    totalExpenses = 0,
    totalIncome = 0,
    totalInvestments = 0,
    formatCurrency,
  }: Props = $props();

  type BreakdownType = 'expenses' | 'income' | 'investments';
  let selectedType = $state<BreakdownType>('expenses');
  let expanded = $state(false);

  // Initial items to show before expanding
  const INITIAL_SHOW = 6;

  // Type configuration for filtering and styling
  const typeConfig: Record<
    BreakdownType,
    {
      types: string[];
      total: number;
      defaultColor: string;
      defaultIcon: string;
    }
  > = $derived({
    expenses: {
      types: ['essential', 'discretionary', 'debt_payment'],
      total: totalExpenses,
      defaultColor: '#ef4444',
      defaultIcon: '🛍️',
    },
    income: {
      types: ['income'],
      total: totalIncome,
      defaultColor: '#34d399',
      defaultIcon: '💰',
    },
    investments: {
      types: ['investment'],
      total: totalInvestments,
      defaultColor: '#60a5fa',
      defaultIcon: '📈',
    },
  });

  // Filter and map categories based on selected type
  function filterCategories(type: BreakdownType): Category[] {
    const config = typeConfig[type];

    return categoryBreakdown
      .filter((cat) => config.types.includes(cat.type || ''))
      .filter((cat) => {
        const amount = cat.amount || cat.total || 0;
        return Math.abs(amount) > 0.01;
      })
      .sort((a, b) => Math.abs(b.amount || b.total || 0) - Math.abs(a.amount || a.total || 0))
      .map((cat) => {
        const amount = Math.abs(cat.amount || cat.total || 0);
        const total = config.total;

        return {
          name: cat.categoryName || cat.name || 'Sin nombre',
          amount,
          percentage: cat.percentage || (total > 0 ? Math.round((amount / total) * 100) : 0),
          color: cat.color || config.defaultColor,
          icon: cat.icon || config.defaultIcon,
          monthlyBudget: cat.monthlyBudget,
          budgetUsage: cat.budgetUsage,
        };
      });
  }

  // Current categories based on selected type
  const currentCategories = $derived(filterCategories(selectedType));

  // Visible categories (limited or all)
  const visibleCategories = $derived(
    expanded ? currentCategories : currentCategories.slice(0, INITIAL_SHOW)
  );

  const hiddenCount = $derived(Math.max(0, currentCategories.length - INITIAL_SHOW));
  const hasMore = $derived(currentCategories.length > INITIAL_SHOW);

  // Reset expanded state when switching tabs
  function selectType(type: BreakdownType) {
    selectedType = type;
    expanded = false;
  }
</script>

<section class="categories-section">
  <h2 class="section-title">{title}</h2>

  <!-- Type Selector Tabs -->
  <div class="type-selector">
    <button
      class="type-tab"
      class:active={selectedType === 'expenses'}
      onclick={() => selectType('expenses')}
    >
      {$t('dashboard.metrics.expenses')}
      {#if filterCategories('expenses').length > 0}
        <span class="tab-count">{filterCategories('expenses').length}</span>
      {/if}
    </button>
    <button
      class="type-tab"
      class:active={selectedType === 'income'}
      onclick={() => selectType('income')}
    >
      {$t('dashboard.metrics.income')}
      {#if filterCategories('income').length > 0}
        <span class="tab-count">{filterCategories('income').length}</span>
      {/if}
    </button>
    <button
      class="type-tab"
      class:active={selectedType === 'investments'}
      onclick={() => selectType('investments')}
    >
      {$t('dashboard.metrics.investments')}
      {#if filterCategories('investments').length > 0}
        <span class="tab-count">{filterCategories('investments').length}</span>
      {/if}
    </button>
  </div>

  <!-- Categories Grid -->
  <div class="categories-container">
    {#if currentCategories.length === 0}
      <div class="empty-state">
        <p>{$t('dashboard.categories.no_data')}</p>
      </div>
    {:else}
      <div class="categories-grid" class:has-few={currentCategories.length <= 2}>
        {#each visibleCategories as category (category.name)}
          <CategoryCard
            name={category.name}
            amount={formatCurrency(category.amount)}
            percentage={category.percentage}
            color={category.color}
            icon={category.icon || '📊'}
            monthlyBudget={category.monthlyBudget ? formatCurrency(category.monthlyBudget) : null}
            budgetUsage={category.budgetUsage}
          />
        {/each}
      </div>

      {#if hasMore}
        <button
          class="expand-button"
          onclick={() => (expanded = !expanded)}
          aria-expanded={expanded}
        >
          <span class="expand-text">
            {#if expanded}
              {$t('common.show_less') || 'Mostrar menos'}
            {:else}
              +{hiddenCount} {$t('common.more') || 'más'}
            {/if}
          </span>
          <span class="expand-icon">
            {#if expanded}
              <ChevronUp size={16} />
            {:else}
              <ChevronDown size={16} />
            {/if}
          </span>
        </button>
      {/if}
    {/if}
  </div>
</section>

<style>
  .categories-section {
    background: var(--surface-elevated);
    border-radius: 16px;
    padding: 1.5rem;
    margin-bottom: 2rem;
    border: 1px solid var(--border-color, transparent);
  }

  .section-title {
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--text-primary);
    margin: 0 0 1rem 0;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  /* Type Selector Tabs */
  .type-selector {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 1.5rem;
    padding: 0.25rem;
    background: var(--surface-muted);
    border-radius: 8px;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }

  .type-tab {
    flex: 1;
    min-width: 0;
    padding: 0.5rem 0.75rem;
    border: none;
    background: transparent;
    color: var(--text-secondary);
    font-size: 0.8125rem;
    font-weight: 500;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.375rem;
    white-space: nowrap;
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

  .tab-count {
    font-size: 0.6875rem;
    background: var(--primary);
    color: white;
    padding: 0.125rem 0.375rem;
    border-radius: 10px;
    font-weight: 600;
  }

  .categories-container {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  /* Grid that fills available space properly */
  .categories-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    gap: 1rem;
  }

  /* When only 1-2 items, limit their width */
  .categories-grid.has-few {
    grid-template-columns: repeat(auto-fit, minmax(240px, 320px));
    justify-content: start;
  }

  /* Empty state */
  .empty-state {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2rem 1rem;
    color: var(--text-muted);
    text-align: center;
  }

  .empty-state p {
    margin: 0;
    font-size: 0.875rem;
  }

  /* Expand button */
  .expand-button {
    align-self: center;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    background: transparent;
    border: 1px solid var(--border-color);
    border-radius: 20px;
    color: var(--text-muted);
    font-size: 0.813rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    margin-top: 0.5rem;
  }

  .expand-button:hover {
    background: var(--surface-muted);
    color: var(--text-primary);
    border-color: var(--text-muted);
  }

  .expand-button:active {
    transform: scale(0.98);
  }

  .expand-text {
    display: flex;
    align-items: center;
  }

  .expand-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0.7;
  }

  /* Responsive */
  @media (max-width: 640px) {
    .categories-section {
      padding: 1rem;
    }

    .categories-grid {
      grid-template-columns: 1fr;
    }

    .categories-grid.has-few {
      grid-template-columns: 1fr;
    }

    .type-tab {
      padding: 0.5rem;
      font-size: 0.75rem;
    }

    .tab-count {
      font-size: 0.625rem;
      padding: 0.0625rem 0.25rem;
    }

    .expand-button {
      width: 100%;
      justify-content: center;
      padding: 0.75rem;
    }
  }

  @media (min-width: 641px) and (max-width: 900px) {
    .categories-grid {
      grid-template-columns: repeat(2, 1fr);
    }

    .categories-grid.has-few {
      grid-template-columns: repeat(auto-fit, minmax(240px, 280px));
    }
  }

  @media (min-width: 901px) and (max-width: 1100px) {
    .categories-grid {
      grid-template-columns: repeat(3, 1fr);
    }
  }
</style>
