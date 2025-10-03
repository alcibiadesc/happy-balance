<script lang="ts">
  import { Search, X } from 'lucide-svelte';
  import { t } from '$lib/stores/i18n';

  interface SearchBarProps {
    value: string;
    placeholder?: string;
    onInput: (value: string) => void;
    onClear: () => void;
  }

  let {
    value = '',
    placeholder = $t('transactions.search_placeholder'),
    onInput,
    onClear
  }: SearchBarProps = $props();
</script>

<div class="search-bar" class:searching={value.length > 0}>
  <Search size={14} class="search-icon" />
  <input
    type="text"
    {placeholder}
    {value}
    oninput={(e) => onInput(e.currentTarget.value)}
  />
  {#if value.length > 0}
    <button
      class="clear-search"
      onclick={onClear}
      aria-label={$t('common.reset')}
    >
      <X size={12} />
    </button>
  {/if}
</div>

<style>
  .search-bar {
    flex: 1;
    max-width: 320px;
    position: relative;
    display: flex;
    align-items: center;
    background: var(--surface);
    border: 1px solid var(--border-color);
    border-radius: 8px;
    padding: 0 0.75rem;
    transition: all 0.2s ease;
  }

  .search-bar:focus-within {
    border-color: var(--primary);
    box-shadow: 0 0 0 3px var(--primary-alpha-10);
  }

  .search-bar.searching {
    border-color: var(--primary);
  }

  .search-bar input {
    flex: 1;
    padding: 0.5rem 0.25rem;
    background: transparent;
    border: none;
    color: var(--text-primary);
    font-size: 0.875rem;
    outline: none;
  }

  .search-bar input::placeholder {
    color: var(--text-muted);
  }

  :global(.search-icon) {
    color: var(--text-muted);
    margin-right: 0.5rem;
    flex-shrink: 0;
  }

  .clear-search {
    padding: 0.25rem;
    background: transparent;
    border: none;
    color: var(--text-muted);
    cursor: pointer;
    border-radius: 4px;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .clear-search:hover {
    background: var(--surface-hover);
    color: var(--text-primary);
  }

  @media (min-width: 768px) and (max-width: 1023px) {
    .search-bar {
      max-width: 240px;
      min-width: 180px;
    }
  }

  @media (max-width: 767px) {
    .search-bar {
      max-width: 100%;
      flex: 1;
    }
  }
</style>