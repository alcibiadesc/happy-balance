<script lang="ts">
  import { Globe } from 'lucide-svelte';

  interface Props {
    value: string;
    languages: Array<{ code: string; name: string; flag: string; }>;
    onChange: (event: Event) => void;
  }

  let {
    value,
    languages,
    onChange
  }: Props = $props();
</script>

<div class="language-select">
  <div class="language-select__icon">
    <Globe size={16} strokeWidth={2} />
  </div>
  <select 
    class="language-select__input"
    {value}
    onchange={onChange}
  >
    {#each languages as lang}
      <option value={lang.code}>
        {lang.flag} {lang.name}
      </option>
    {/each}
  </select>
</div>

<style>
  /* Language Select - Exact copy from settings page */
  .language-select {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 0.75rem;
    border-radius: 0.5rem;
    border: 1px solid var(--border-color);
    background: var(--surface);
    transition: all 0.2s ease;
    min-width: 140px;
  }
  
  .language-select:hover,
  .language-select:focus-within {
    border-color: var(--acapulco);
    box-shadow: 0 0 0 3px rgba(122, 186, 165, 0.1);
  }
  
  .language-select__icon {
    display: flex;
    color: var(--text-muted);
    flex-shrink: 0;
  }
  
  .language-select__input {
    border: none;
    background: transparent;
    color: var(--text-primary);
    font-size: 0.875rem;
    cursor: pointer;
    outline: none;
    flex: 1;
    font-weight: 500;
  }

  @media (max-width: 768px) {
    .language-select {
      min-width: unset;
      width: 100%;
    }
  }
</style>