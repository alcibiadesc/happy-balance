<script lang="ts">
  import CategoryCard from "../atoms/CategoryCard.svelte";
  import { ChevronDown, ChevronUp } from "lucide-svelte";
  import { t } from "$lib/stores/i18n";

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
  }

  interface Props {
    title: string;
    categories: Category[];
    categoryBreakdown?: any[];
    expenseDistribution?: any;
    totalExpenses?: number;
    totalIncome?: number;
    totalInvestments?: number;
    formatCurrency: (amount: number) => string;
  }

  let {
    title,
    categories,
    categoryBreakdown = [],
    expenseDistribution = {},
    totalExpenses = 0,
    totalIncome = 0,
    totalInvestments = 0,
    formatCurrency
  }: Props = $props();

  type BreakdownType = 'expenses' | 'income' | 'investments';
  let selectedType = $state<BreakdownType>('expenses');

  let expanded = $state(false);
  let containerRef: HTMLDivElement;
  let cardsPerRow = $state(4);
  let isMobile = $state(false);

  // Number of categories to show on mobile before expanding
  const MOBILE_INITIAL_SHOW = 3;

  // Get expense categories from categoryBreakdown (individual categories like "Alquiler", "Comida", etc.)
  const expenseCategories = $derived.by(() => {
    const filtered = categoryBreakdown.filter(cat =>
      cat.type === 'essential' ||
      cat.type === 'discretionary' ||
      cat.type === 'debt_payment'
    );

    console.log('[CategoriesSection] Filtered expense categories:', filtered);

    const mapped = filtered
      .filter(cat => (cat.amount || cat.total) && Math.abs(cat.amount || cat.total || 0) > 0.01)
      .sort((a, b) => Math.abs(b.amount || b.total || 0) - Math.abs(a.amount || a.total || 0))
      .map(cat => ({
        name: cat.categoryName || cat.name,
        amount: Math.abs(cat.amount || cat.total || 0),
        percentage: cat.percentage || (totalExpenses > 0 ? Math.round((Math.abs(cat.amount || cat.total || 0) / totalExpenses) * 100) : 0),
        color: cat.color || (cat.type === 'essential' ? '#60a5fa' : cat.type === 'debt_payment' ? '#ef4444' : '#f59e0b'),
        icon: cat.icon || (cat.type === 'essential' ? '🏠' : cat.type === 'debt_payment' ? '💳' : '🛍️')
      }));

    console.log('[CategoriesSection] Final expense categories:', mapped);
    return mapped;
  });

  // Get income categories from categoryBreakdown
  const incomeCategories = $derived.by(() => {
    console.log('[CategoriesSection] Full categoryBreakdown:', JSON.stringify(categoryBreakdown, null, 2));
    console.log('[CategoriesSection] totalIncome:', totalIncome);

    const filtered = categoryBreakdown.filter(cat => {
      console.log('[CategoriesSection] Category:', cat.categoryName || cat.name, 'type:', cat.type, 'amount:', cat.amount, 'total:', cat.total);
      return cat.type === 'income';
    });

    console.log('[CategoriesSection] Filtered income categories:', filtered);

    const mapped = filtered
      .filter(cat => (cat.amount || cat.total) && Math.abs(cat.amount || cat.total || 0) > 0.01)
      .sort((a, b) => Math.abs(b.amount || b.total || 0) - Math.abs(a.amount || a.total || 0))
      .map(cat => ({
        name: cat.categoryName || cat.name,
        amount: Math.abs(cat.amount || cat.total || 0),
        percentage: cat.percentage || (totalIncome > 0 ? Math.round((Math.abs(cat.amount || cat.total || 0) / totalIncome) * 100) : 0),
        color: cat.color || '#34d399',
        icon: cat.icon || '💰'
      }));

    console.log('[CategoriesSection] Final income categories:', mapped);
    return mapped;
  });

  // Get investment categories from categoryBreakdown
  const investmentCategories = $derived.by(() => {
    const filtered = categoryBreakdown.filter(cat => cat.type === 'investment');
    console.log('[CategoriesSection] Filtered investment categories:', filtered);

    const mapped = filtered
      .filter(cat => (cat.amount || cat.total) && Math.abs(cat.amount || cat.total || 0) > 0.01)
      .sort((a, b) => Math.abs(b.amount || b.total || 0) - Math.abs(a.amount || a.total || 0))
      .map(cat => ({
        name: cat.categoryName || cat.name,
        amount: Math.abs(cat.amount || cat.total || 0),
        percentage: cat.percentage || (totalInvestments > 0 ? Math.round((Math.abs(cat.amount || cat.total || 0) / totalInvestments) * 100) : 0),
        color: cat.color || '#60a5fa',
        icon: cat.icon || '📈'
      }));

    console.log('[CategoriesSection] Final investment categories:', mapped);
    return mapped;
  });

  // Current categories based on selected type
  const currentCategories = $derived(
    selectedType === 'expenses' ? expenseCategories :
    selectedType === 'income' ? incomeCategories :
    investmentCategories
  );

  // Calculate how many cards fit in a row and detect mobile
  $effect(() => {
    if (containerRef) {
      const updateCardsPerRow = () => {
        const containerWidth = containerRef.clientWidth;
        const windowWidth = window.innerWidth;
        isMobile = windowWidth <= 768;

        if (isMobile) {
          cardsPerRow = MOBILE_INITIAL_SHOW; // Show limited cards on mobile initially
        } else {
          const minCardWidth = 200; // Minimum width per card in pixels
          const gap = 16; // Gap between cards in pixels
          const calculatedCards = Math.floor((containerWidth + gap) / (minCardWidth + gap));
          cardsPerRow = Math.max(1, calculatedCards);
        }
      };

      updateCardsPerRow();
      window.addEventListener('resize', updateCardsPerRow);

      return () => {
        window.removeEventListener('resize', updateCardsPerRow);
      };
    }
  });

  const visibleCategories = $derived(
    expanded ? currentCategories : currentCategories.slice(0, cardsPerRow)
  );
  const hiddenCount = $derived(currentCategories.length - cardsPerRow);
  const hasHiddenCategories = $derived(currentCategories.length > cardsPerRow);
</script>

<section class="categories-section">
  <h2 class="section-title">{title}</h2>

  <!-- Type Selector Tabs -->
  <div class="type-selector">
    <button
      class="type-tab"
      class:active={selectedType === 'expenses'}
      onclick={() => { selectedType = 'expenses'; expanded = false; }}
    >
      {$t("dashboard.metrics.expenses")}
    </button>
    <button
      class="type-tab"
      class:active={selectedType === 'income'}
      onclick={() => { selectedType = 'income'; expanded = false; }}
    >
      {$t("dashboard.metrics.income")}
    </button>
    <button
      class="type-tab"
      class:active={selectedType === 'investments'}
      onclick={() => { selectedType = 'investments'; expanded = false; }}
    >
      {$t("dashboard.metrics.investments")}
    </button>
  </div>

  <div class="categories-container" bind:this={containerRef}>
    <div class="categories-grid">
      {#each visibleCategories as category}
        <CategoryCard
          name={category.name}
          amount={formatCurrency(category.amount)}
          percentage={category.percentage}
          color={category.color}
          icon={category.icon || "📊"}
          monthlyBudget={category.monthlyBudget ? formatCurrency(category.monthlyBudget) : null}
          budgetUsage={category.budgetUsage}
        />
      {/each}
    </div>

    {#if hasHiddenCategories}
      <button
        class="expand-button"
        onclick={() => expanded = !expanded}
        aria-expanded={expanded}
        aria-label={expanded ? "Mostrar menos categorías" : `Mostrar ${hiddenCount} categorías más`}
      >
        <span class="expand-text">
          {#if expanded}
            Mostrar menos
          {:else}
            +{hiddenCount} más
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

  .categories-container {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .categories-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 1rem;
  }

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
    transition: transform 0.2s ease;
  }

  /* Responsive - Show all cards in single column on mobile */
  @media (max-width: 768px) {
    .categories-grid {
      grid-template-columns: 1fr;
    }

    .expand-button {
      width: 100%;
      justify-content: center;
      padding: 0.75rem 1.5rem;
      font-size: 0.875rem;
      margin-top: 1rem;
    }
  }
</style>
