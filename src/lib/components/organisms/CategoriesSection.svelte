<script lang="ts">
  import CategoryCard from '../atoms/CategoryCard.svelte';

  interface Category {
    name: string;
    amount: number;
    percentage: number;
    color?: string;
    icon?: string;
  }

  interface Props {
    title: string;
    categories: Category[];
    formatCurrency: (amount: number) => string;
  }

  let {
    title,
    categories,
    formatCurrency
  }: Props = $props();
</script>

<section class="categories-section">
  <h2 class="section-title">{title}</h2>
  <div class="categories-grid">
    {#each categories as category}
      <CategoryCard
        name={category.name}
        amount={formatCurrency(category.amount)}
        percentage={category.percentage}
        color={category.color}
        icon={category.icon || '📊'}
      />
    {/each}
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

  .categories-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 1rem;
  }

  /* Responsive */
  @media (max-width: 768px) {
    .categories-grid {
      grid-template-columns: 1fr;
    }
  }
</style>