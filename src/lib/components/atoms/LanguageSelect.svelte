<script lang="ts">
  import { Globe } from 'lucide-svelte';
  
  interface Props {
    value?: string;
    onchange?: (lang: string) => void;
  }
  
  let { value = 'en', onchange }: Props = $props();
  
  const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'de', name: 'Deutsch', flag: '🇩🇪' }
  ];
  
  function handleChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    onchange?.(target.value);
  }
</script>

<div class="language-select">
  <div class="language-select__icon">
    <Globe size={16} strokeWidth={2} />
  </div>
  <select 
    class="language-select__input"
    {value}
    onchange={handleChange}
    aria-label="Select language"
  >
    {#each languages as lang}
      <option value={lang.code}>
        {lang.flag} {lang.name}
      </option>
    {/each}
  </select>
</div>

<style>
  .language-select {
    position: relative;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 0.75rem;
    border-radius: var(--radius-md);
    border: 1px solid var(--text-muted);
    background: var(--surface-elevated);
    transition: all 0.15s ease;
  }
  
  .language-select:hover {
    border-color: var(--primary);
    box-shadow: var(--shadow-sm);
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
  }
  
  .language-select__input option {
    background: var(--surface-elevated);
    color: var(--text-primary);
    padding: 0.5rem;
  }
  
  /* Dark mode */
  html.dark .language-select__input option {
    background: var(--surface-elevated);
  }
</style>
