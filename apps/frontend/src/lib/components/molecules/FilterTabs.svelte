<script lang="ts">
  interface Tab {
    id: string;
    label: string;
    count?: number;
    badge?: number;
    disabled?: boolean;
  }

  interface Props {
    tabs: Tab[];
    activeTab: string;
    onTabChange: (tabId: string) => void;
  }

  let { tabs, activeTab, onTabChange }: Props = $props();
</script>

<div class="filter-tabs">
  {#each tabs as tab (tab.id)}
    <button
      class="filter-tab"
      class:active={activeTab === tab.id}
      disabled={tab.disabled}
      onclick={() => onTabChange(tab.id)}
    >
      {tab.label}
      {#if tab.count !== undefined}
        ({tab.count})
      {/if}
      {#if tab.badge && tab.badge > 0}
        <span class="selected-badge">{tab.badge}</span>
      {/if}
    </button>
  {/each}
</div>

<style>
  .filter-tabs {
    display: flex;
    gap: 0.25rem;
    background: var(--surface-muted);
    border-radius: 0.5rem;
    padding: 0.25rem;
  }

  .filter-tab {
    padding: 0.5rem 1rem;
    background: transparent;
    border: none;
    border-radius: 0.375rem;
    color: var(--text-secondary);
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    white-space: nowrap;
  }

  .filter-tab:hover:not(:disabled) {
    color: var(--text-primary);
    background: rgba(122, 186, 165, 0.1);
  }

  .filter-tab.active {
    color: var(--acapulco);
    background: var(--surface);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }

  .filter-tab:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .selected-badge {
    display: inline-block;
    margin-left: 0.5rem;
    padding: 0.125rem 0.375rem;
    background: var(--acapulco);
    color: white;
    border-radius: 0.25rem;
    font-size: 0.75rem;
    font-weight: 600;
  }

  @media (max-width: 768px) {
    .filter-tabs {
      flex-wrap: wrap;
      gap: 0.125rem;
    }

    .filter-tab {
      padding: 0.375rem 0.75rem;
      font-size: 0.75rem;
    }
  }
</style>
