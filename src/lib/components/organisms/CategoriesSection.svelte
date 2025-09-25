<script lang="ts">
  import CategoryCard from "../atoms/CategoryCard.svelte";
  import { ChevronDown, ChevronUp } from "lucide-svelte";

  interface Category {
    name: string;
    amount: number;
    percentage: number;
    color?: string;
    icon?: string;
    monthlyBudget?: number | null;
    budgetUsage?: number | null;
  }

  interface Props {
    title: string;
    categories: Category[];
    formatCurrency: (amount: number) => string;
  }

  let { title, categories, formatCurrency }: Props = $props();

  let expanded = $state(false);
  let containerRef: HTMLDivElement;
  let cardsPerRow = $state(4);
  let isMobile = $state(false);

  // Number of categories to show on mobile before expanding
  const MOBILE_INITIAL_SHOW = 3;

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
    expanded ? categories : categories.slice(0, cardsPerRow)
  );
  const hiddenCount = $derived(categories.length - cardsPerRow);
  const hasHiddenCategories = $derived(categories.length > cardsPerRow);
</script>

<section class="categories-section">
  <h2 class="section-title">{title}</h2>
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
