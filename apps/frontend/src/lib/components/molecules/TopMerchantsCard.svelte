<script lang="ts">
  import { Store } from 'lucide-svelte';
  import { t } from '$lib/stores/i18n';

  interface CategoryData {
    name: string;
    amount: number;
    percentage: number;
    color: string;
    icon?: string;
  }

  interface Props {
    categories: CategoryData[];
    totalExpenses: number;
    loading?: boolean;
    formatCurrency: (amount: number) => string;
  }

  let { categories, totalExpenses, loading = false, formatCurrency }: Props = $props();

  // Show top 5 expense categories
  const topCategories = $derived(
    [...categories]
      .filter((c) => c.amount > 0)
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5)
  );

  const maxAmount = $derived(topCategories[0]?.amount || 1);
</script>

<div class="merchants-card" class:loading>
  <div class="card-header">
    <div class="header-icon">
      <Store size={20} />
    </div>
    <div class="header-text">
      <h3>{$t('dashboard.top_categories.title') || 'Top gastos'}</h3>
      <span class="subtitle"
        >{$t('dashboard.top_categories.subtitle') || 'Categorías con mayor gasto'}</span
      >
    </div>
  </div>

  {#if topCategories.length === 0}
    <div class="empty-state">
      <p>{$t('dashboard.categories.no_data') || 'Sin datos para este período'}</p>
    </div>
  {:else}
    <div class="categories-list">
      {#each topCategories as category, index (category.name)}
        <div class="category-item">
          <div class="category-rank">#{index + 1}</div>
          <div class="category-info">
            <div class="category-header">
              <span class="category-color" style="background: {category.color}"></span>
              <span class="category-name">{category.name}</span>
              <span class="category-percentage">{category.percentage.toFixed(1)}%</span>
            </div>
            <div class="category-bar-container">
              <div
                class="category-bar"
                style="width: {(category.amount / maxAmount) * 100}%; background: {category.color}"
              ></div>
            </div>
          </div>
          <div class="category-amount">
            {formatCurrency(category.amount)}
          </div>
        </div>
      {/each}
    </div>
  {/if}

  <div class="card-footer">
    <span class="total-label">{$t('dashboard.top_categories.total') || 'Total gastos'}</span>
    <span class="total-value">{formatCurrency(totalExpenses)}</span>
  </div>
</div>

<style>
  .merchants-card {
    background: var(--surface-elevated);
    border: 1px solid var(--border-color);
    border-radius: 12px;
    padding: 1.25rem;
    transition: all 0.2s ease;
  }

  .merchants-card.loading {
    opacity: 0.6;
  }

  .card-header {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 1.25rem;
  }

  .header-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border-radius: 10px;
    background: var(--primary-alpha, rgba(99, 102, 241, 0.1));
    color: var(--primary);
  }

  .header-text h3 {
    font-size: 0.9375rem;
    font-weight: 600;
    color: var(--text-primary);
    margin: 0;
  }

  .subtitle {
    font-size: 0.75rem;
    color: var(--text-muted);
  }

  .empty-state {
    padding: 2rem;
    text-align: center;
    color: var(--text-muted);
    font-size: 0.875rem;
  }

  .categories-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .category-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .category-rank {
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--surface-muted);
    border-radius: 6px;
    font-size: 0.6875rem;
    font-weight: 600;
    color: var(--text-muted);
  }

  .category-info {
    flex: 1;
    min-width: 0;
  }

  .category-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.25rem;
  }

  .category-color {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .category-name {
    flex: 1;
    font-size: 0.8125rem;
    font-weight: 500;
    color: var(--text-primary);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .category-percentage {
    font-size: 0.6875rem;
    color: var(--text-muted);
    font-weight: 500;
  }

  .category-bar-container {
    height: 4px;
    background: var(--surface-muted);
    border-radius: 2px;
    overflow: hidden;
  }

  .category-bar {
    height: 100%;
    border-radius: 2px;
    transition: width 0.5s ease;
  }

  .category-amount {
    font-size: 0.8125rem;
    font-weight: 600;
    color: var(--text-primary);
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
  }

  .card-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 1rem;
    padding-top: 0.75rem;
    border-top: 1px solid var(--border-color);
  }

  .total-label {
    font-size: 0.75rem;
    color: var(--text-muted);
  }

  .total-value {
    font-size: 0.9375rem;
    font-weight: 700;
    color: var(--text-primary);
    font-variant-numeric: tabular-nums;
  }

  @media (max-width: 480px) {
    .merchants-card {
      padding: 1rem;
    }

    .category-name {
      max-width: 100px;
    }
  }
</style>
