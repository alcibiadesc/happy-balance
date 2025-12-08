<script lang="ts">
  import { Search } from 'lucide-svelte';

  interface Props {
    value?: string;
    placeholder?: string;
    debounceMs?: number;
    onSearch: (value: string) => void;
  }

  let { value = '', placeholder = 'Buscar...', debounceMs = 300, onSearch }: Props = $props();

  let searchTimeout: ReturnType<typeof setTimeout>;

  function handleInput(event: Event) {
    const target = event.target as HTMLInputElement;
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      onSearch(target.value.toLowerCase());
    }, debounceMs);
  }
</script>

<div class="search-wrapper">
  <Search size={18} class="search-icon" />
  <input type="text" {placeholder} class="search-input" {value} oninput={handleInput} />
</div>

<style>
  .search-wrapper {
    position: relative;
    width: 100%;
    max-width: 400px;
  }

  .search-wrapper :global(.search-icon) {
    position: absolute;
    left: 0.75rem;
    top: 50%;
    transform: translateY(-50%);
    color: var(--text-muted);
    pointer-events: none;
  }

  .search-input {
    width: 100%;
    padding: 0.75rem 0.75rem 0.75rem 2.75rem;
    border: 1px solid var(--border-color);
    border-radius: 0.5rem;
    background: var(--surface);
    color: var(--text-primary);
    font-size: 0.875rem;
    transition: all 0.2s ease;
  }

  .search-input:focus {
    outline: none;
    border-color: var(--acapulco);
    box-shadow: 0 0 0 2px rgba(122, 186, 165, 0.1);
  }

  .search-input::placeholder {
    color: var(--text-muted);
  }
</style>
