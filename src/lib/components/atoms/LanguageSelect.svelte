<script lang="ts">
  import { Globe } from 'lucide-svelte';
  import { t } from '$lib/stores/i18n';
  
  interface Props {
    value?: string;
    onchange?: (lang: string) => void;
  }
  
  let { value = 'en', onchange }: Props = $props();
  
  const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'es', name: $t('settings.languages.spanish'), flag: '🇪🇸' }
  ];
  
  function handleChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    const newLang = target.value;
    onchange?.(newLang);
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
    border-radius: 6px;
    border: 1px solid rgba(2, 60, 70, 0.2);
    background: var(--surface);
    transition: all 0.2s ease;
    min-width: 140px;
  }
  
  .language-select:hover {
    border-color: var(--primary);
    box-shadow: var(--shadow-sm);
  }
  
  .language-select:focus-within {
    border-color: var(--primary);
    box-shadow: 0 0 0 2px rgba(2, 60, 70, 0.1);
  }
  
  .language-select__icon {
    display: flex;
    color: var(--text-secondary);
    flex-shrink: 0;
  }
  
  .language-select__input {
    border: none;
    background: transparent;
    color: var(--text-primary) !important;
    font-size: 0.875rem;
    cursor: pointer;
    outline: none;
    flex: 1;
    font-weight: 500;
  }
  
  .language-select__input option {
    background: var(--surface-elevated) !important;
    color: var(--text-primary) !important;
    padding: 0.5rem;
  }
  
  /* Light mode specific */
  html:not(.dark) .language-select {
    background: var(--surface);
    border-color: rgba(2, 60, 70, 0.15);
  }
  
  html:not(.dark) .language-select__input option {
    background: white !important;
    color: var(--evening-sea) !important;
  }
  
  /* Dark mode */
  html.dark .language-select {
    background: var(--gray-700);
    border-color: rgba(254, 247, 238, 0.2);
  }
  
  html.dark .language-select:hover,
  html.dark .language-select:focus-within {
    border-color: var(--acapulco);
  }
  
  html.dark .language-select:focus-within {
    box-shadow: 0 0 0 2px rgba(122, 186, 165, 0.2);
  }
  
  html.dark .language-select__input {
    color: var(--bridesmaid) !important;
  }
  
  html.dark .language-select__input option {
    background: var(--gray-800) !important;
    color: var(--bridesmaid) !important;
  }
</style>
