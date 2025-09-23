<script lang="ts">
  import { Plus, Info } from 'lucide-svelte';
  import { t } from '$lib/stores/i18n';
  import type { Category } from '$lib/types/transaction';

  interface Props {
    title: string;
    description: string;
    icon: any;
    iconClass: string;
    categories: Category[];
    onAddNew: () => void;
    showHelperButton?: boolean;
    onHelperClick?: (e: Event) => void;
    children?: any;
  }

  let {
    title,
    description,
    icon: Icon,
    iconClass,
    categories,
    onAddNew,
    showHelperButton = false,
    onHelperClick,
    children
  }: Props = $props();
</script>

<section class="category-section">
  <div class="section-header">
    <div class="section-icon {iconClass}">
      <Icon size={20} strokeWidth={2} />
    </div>
    <div class="section-info">
      <h2 class="section-title">
        {title}
        {#if showHelperButton}
          <button
            class="helper-button"
            onclick={onHelperClick}
            aria-label={$t('categories.more_info')}
          >
            <Info size={14} strokeWidth={2} />
          </button>
        {/if}
      </h2>
      <p class="section-description">{description}</p>
    </div>
    <button class="add-button" onclick={onAddNew}>
      <Plus size={16} strokeWidth={2} />
      {$t('categories.new_category')}
    </button>
  </div>

  <div class="categories-list">
    {@render children?.()}
  </div>
</section>

<style>
  /* Category Section - Exact copy from categories page */
  .category-section {
    background: var(--surface-elevated);
    border-radius: 1rem;
    padding: 1.5rem;
    border: 1px solid var(--border-color);
  }

  .section-header {
    display: flex;
    align-items: flex-start;
    gap: 1rem;
    margin-bottom: 1.5rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid var(--border-color);
  }

  .section-icon {
    width: 3rem;
    height: 3rem;
    border-radius: 0.75rem;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .section-icon.income {
    background: rgba(122, 186, 165, 0.1);
    color: var(--acapulco);
  }

  .section-icon.essential {
    background: rgba(245, 121, 108, 0.1);
    color: #f5796c;
  }

  .section-icon.discretionary {
    background: rgba(254, 205, 44, 0.1);
    color: #fecd2c;
  }

  .section-icon.investment {
    background: rgba(79, 172, 254, 0.1);
    color: #4facfe;
  }

  .section-icon.debt {
    background: rgba(245, 121, 108, 0.2);
    color: #e74c3c;
  }

  .section-icon.no-compute {
    background: rgba(149, 165, 166, 0.1);
    color: #95a5a6;
  }

  .section-info {
    flex: 1;
  }

  .section-title {
    font-size: 1.125rem;
    font-weight: 600;
    color: var(--text-primary);
    margin: 0 0 0.25rem 0;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .helper-button {
    width: 1.25rem;
    height: 1.25rem;
    border-radius: 50%;
    border: 1px solid var(--border-color);
    background: var(--surface);
    color: var(--text-muted);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .helper-button:hover {
    background: var(--surface-elevated);
    border-color: var(--acapulco);
    color: var(--acapulco);
  }

  .section-description {
    font-size: 0.875rem;
    color: var(--text-muted);
    margin: 0;
  }

  .add-button {
    padding: 0.5rem 1rem;
    border: 1px dashed var(--border-color);
    border-radius: 0.5rem;
    background: var(--surface);
    color: var(--text-muted);
    font-size: 0.875rem;
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .add-button:hover {
    background: var(--surface-elevated);
    border-color: var(--acapulco);
    color: var(--acapulco);
  }

  .categories-list {
    display: flex;
    flex-direction: column;
    gap: var(--space-sm, 0.75rem);
  }

  @media (max-width: 768px) {
    .section-header {
      flex-direction: column;
    }

    .add-button {
      width: 100%;
      justify-content: center;
    }
  }
</style>