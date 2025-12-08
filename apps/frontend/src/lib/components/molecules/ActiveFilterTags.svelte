<script lang="ts">
  import { X, TrendingUp, TrendingDown, Tag } from 'lucide-svelte';
  import type { Category } from '$lib/types/transaction';

  interface Props {
    transactionType?: 'income' | 'expenses' | null;
    showUncategorized?: boolean;
    selectedCategories?: string[];
    selectedPrimaryTypes?: string[];
    categories?: Category[];
    primaryTypeNames?: Record<string, string>;
    onRemoveTransactionType?: () => void;
    onRemoveUncategorized?: () => void;
    onRemoveCategory?: (id: string) => void;
    onRemovePrimaryType?: (type: string) => void;
  }

  let {
    transactionType = null,
    showUncategorized = false,
    selectedCategories = [],
    selectedPrimaryTypes = [],
    categories = [],
    primaryTypeNames = {},
    onRemoveTransactionType,
    onRemoveUncategorized,
    onRemoveCategory,
    onRemovePrimaryType,
  }: Props = $props();

  const hasFilters = $derived(
    transactionType ||
      showUncategorized ||
      selectedCategories.length > 0 ||
      selectedPrimaryTypes.length > 0
  );
</script>

{#if hasFilters}
  <div class="active-tags">
    {#if transactionType === 'income'}
      <button class="tag income-tag" onclick={onRemoveTransactionType}>
        <TrendingUp size={10} />
        <span>Ingresos</span>
        <X size={10} class="tag-close" />
      </button>
    {/if}

    {#if transactionType === 'expenses'}
      <button class="tag expense-tag" onclick={onRemoveTransactionType}>
        <TrendingDown size={10} />
        <span>Gastos</span>
        <X size={10} class="tag-close" />
      </button>
    {/if}

    {#if showUncategorized}
      <button class="tag uncategorized-tag" onclick={onRemoveUncategorized}>
        <Tag size={10} style="opacity: 0.5" />
        <span>Sin categorizar</span>
        <X size={10} class="tag-close" />
      </button>
    {/if}

    {#each selectedPrimaryTypes as primaryType (primaryType)}
      <button class="tag primary-type-tag" onclick={() => onRemovePrimaryType?.(primaryType)}>
        <span>{primaryTypeNames[primaryType] || primaryType}</span>
        <X size={10} class="tag-close" />
      </button>
    {/each}

    {#each selectedCategories as categoryId (categoryId)}
      {@const category = categories.find((c) => c.id === categoryId)}
      {#if category}
        <button
          class="tag category-tag"
          style="--category-color: {category.color}"
          onclick={() => onRemoveCategory?.(categoryId)}
        >
          <span class="tag-emoji">{category.icon}</span>
          <span>{category.name}</span>
          <X size={10} class="tag-close" />
        </button>
      {/if}
    {/each}
  </div>
{/if}

<style>
  .active-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-top: 1rem;
    padding: 1rem;
    background: var(--surface-muted);
    border-radius: 0.75rem;
    border: 1px dashed rgba(209, 213, 219, 0.5);
    align-items: center;
  }

  .tag {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    min-height: 2rem;
    border: none;
    border-radius: 1rem;
    background: var(--surface-muted);
    font-size: 0.8125rem;
    font-weight: 500;
    line-height: 1;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .tag:hover {
    background: var(--surface-hover);
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.06);
  }

  .tag-emoji {
    font-size: 0.75rem;
  }

  .tag-close {
    margin-left: 0.25rem;
    opacity: 0.4;
    transition: opacity 0.15s ease;
  }

  .tag:hover .tag-close {
    opacity: 0.7;
  }

  .tag.income-tag {
    background: var(--success-light);
    color: #10b981;
  }

  .tag.expense-tag {
    background: var(--error-bg);
    color: #ef4444;
  }

  .tag.uncategorized-tag {
    background: var(--gray-100);
    color: var(--gray-600);
  }

  .tag.category-tag {
    background: var(--surface-muted);
    color: var(--text-secondary);
  }

  .tag.primary-type-tag {
    background: var(--primary-light);
    color: var(--primary);
  }

  @media (max-width: 480px) {
    .active-tags {
      justify-content: center;
    }

    .tag {
      font-size: 0.625rem;
      padding: 0.25rem 0.5rem;
      min-height: 1.5rem;
    }
  }
</style>
