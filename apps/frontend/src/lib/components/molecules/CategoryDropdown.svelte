<script lang="ts">
  import { Check, ChevronDown, Tag } from 'lucide-svelte';

  interface Item {
    id: string;
    label: string;
    icon?: string;
  }

  interface Props {
    label: string;
    items: Item[];
    selectedIds: string[];
    open: boolean;
    onToggle: () => void;
    onSelectItem: (id: string) => void;
  }

  let { label, items, selectedIds, open, onToggle, onSelectItem }: Props = $props();

  const displayLabel = $derived(
    selectedIds.length > 0 ? `${selectedIds.length} ${label.toLowerCase()}` : label
  );
</script>

<div class="category-selector">
  <button
    class="category-pill"
    class:active={selectedIds.length > 0}
    class:open
    onclick={(e) => {
      e.stopPropagation();
      onToggle();
    }}
  >
    <Tag size={12} />
    <span>{displayLabel}</span>
    <ChevronDown size={12} class="chevron {open ? 'rotated' : ''}" />
  </button>

  {#if open}
    <div class="category-dropdown">
      <div class="category-grid">
        {#each items as item (item.id)}
          <button
            class="category-chip"
            class:selected={selectedIds.includes(item.id)}
            onclick={() => onSelectItem(item.id)}
          >
            {#if item.icon}
              <span class="chip-emoji">{item.icon}</span>
            {/if}
            <span class="chip-name">{item.label}</span>
            {#if selectedIds.includes(item.id)}
              <div class="chip-check">
                <Check size={8} />
              </div>
            {/if}
          </button>
        {/each}
      </div>
    </div>
  {/if}
</div>

<style>
  .category-selector {
    position: relative;
    z-index: 30;
  }

  .category-pill {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.625rem 1.25rem;
    min-height: 2.5rem;
    border: none;
    border-radius: 0.625rem;
    background: var(--surface-muted);
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--text-secondary);
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    justify-content: space-between;
    min-width: 180px;
    position: relative;
    width: 100%;
  }

  .category-pill:hover {
    background: var(--surface-hover);
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.06);
    color: var(--text-primary);
  }

  .category-pill.active {
    background: var(--acapulco-alpha-10);
    color: var(--acapulco);
    box-shadow: 0 2px 8px rgba(var(--primary-rgb), 0.15);
  }

  .chevron {
    transition: transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
    opacity: 0.5;
  }

  :global(.chevron.rotated) {
    transform: rotate(180deg);
    opacity: 0.8;
  }

  .category-dropdown {
    position: absolute;
    top: calc(100% + 0.25rem);
    left: 0;
    right: 0;
    background: var(--surface-elevated);
    border: 1px solid var(--gray-200);
    border-radius: 0.5rem;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    z-index: 35;
    max-height: 200px;
    overflow-y: auto;
    min-width: 240px;
  }

  .category-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 1px;
    padding: 0.25rem;
  }

  .category-chip {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.25rem 0.5rem;
    border: none;
    border-radius: 0.25rem;
    background: transparent;
    cursor: pointer;
    transition: all 0.2s ease;
    position: relative;
    font-size: 0.8125rem;
    color: var(--text-primary);
    text-align: left;
  }

  .category-chip:hover {
    background: var(--gray-50);
  }

  .category-chip.selected {
    background: var(--acapulco-alpha-10);
    color: var(--acapulco);
  }

  .chip-emoji {
    font-size: 0.875rem;
    width: 16px;
    text-align: center;
  }

  .chip-name {
    flex: 1;
    text-align: left;
    font-weight: 500;
  }

  .chip-check {
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: var(--acapulco);
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.625rem;
    margin-left: auto;
  }

  @media (max-width: 768px) {
    .category-dropdown {
      min-width: auto;
      left: 0;
      right: 0;
    }
  }

  @media (max-width: 480px) {
    .category-pill {
      min-width: auto;
      justify-content: center;
    }

    .category-dropdown {
      max-height: 150px;
    }
  }

  @media (max-width: 360px) {
    .category-pill {
      padding: 0.375rem 0.625rem;
      font-size: 0.6875rem;
      min-height: 2rem;
      gap: 0.25rem;
    }

    .category-pill :global(svg) {
      width: 10px;
      height: 10px;
    }

    .category-dropdown {
      min-width: 180px;
      max-width: calc(100vw - 2rem);
      max-height: 120px;
    }

    .category-chip {
      padding: 0.25rem 0.5rem;
      font-size: 0.75rem;
    }

    .chip-emoji {
      font-size: 0.75rem;
    }
  }
</style>
