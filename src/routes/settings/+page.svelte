<script lang="ts">
  import { Download, Trash2, DollarSign, Palette, Globe } from 'lucide-svelte';
  import ThemeToggle from '$lib/components/atoms/ThemeToggle.svelte';
  import LanguageSelect from '$lib/components/atoms/LanguageSelect.svelte';
  import { t, currentLanguage, setLanguage } from '$lib/stores/i18n';
  import { currentCurrency, currencies, setCurrency } from '$lib/stores/currency';
  import { browser } from '$app/environment';
  import { onMount } from 'svelte';
  
  const currencyOptions = Object.values(currencies).map(curr => ({
    value: curr.code,
    label: `${curr.symbol} ${curr.name}`,
    symbol: curr.symbol
  }));
  
  function handleExportData() {
    // Create a sample data export
    const data = {
      expenses: [],
      settings: {
        currency: $currentCurrency,
        language: $currentLanguage,
        exportDate: new Date().toISOString()
      }
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `expense-tracker-data-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
  
  function handleDeleteAllData() {
    if (confirm($t('settings.confirmDelete'))) {
      // Clear localStorage data
      if (browser) {
        const keysToKeep = ['theme', 'expense-tracker-language', 'expense-tracker-currency'];
        const allKeys = Object.keys(localStorage);
        allKeys.forEach(key => {
          if (!keysToKeep.includes(key)) {
            localStorage.removeItem(key);
          }
        });
      }
      alert($t('settings.dataDeleted'));
    }
  }
  
  function handleLanguageChange(lang: string) {
    setLanguage(lang);
  }
  
  function handleCurrencyChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    setCurrency(target.value);
  }
</script>

<svelte:head>
  <title>{$t('settings.title')} - Expense Tracker</title>
</svelte:head>

<div class="settings-page">
  <div class="settings-header">
    <h1 class="page-title">{$t('settings.title')}</h1>
  </div>
  
  <div class="settings-grid">
    <!-- Appearance Settings -->
    <div class="settings-card">
      <div class="card-header">
        <div class="card-icon appearance">
          <Palette size={20} strokeWidth={2} />
        </div>
        <h2 class="card-title">{$t('settings.appearance')}</h2>
      </div>
      <div class="card-content">
        <div class="setting-item">
          <span class="setting-label">{$t('settings.theme')}</span>
          <ThemeToggle size="md" />
        </div>
      </div>
    </div>

    <!-- Localization Settings -->
    <div class="settings-card">
      <div class="card-header">
        <div class="card-icon localization">
          <Globe size={20} strokeWidth={2} />
        </div>
        <h2 class="card-title">{$t('settings.localization')}</h2>
      </div>
      <div class="card-content">
        <div class="setting-item">
          <span class="setting-label">{$t('settings.language')}</span>
          <LanguageSelect 
            value={$currentLanguage} 
            onchange={handleLanguageChange}
          />
        </div>
        <div class="setting-item">
          <span class="setting-label">{$t('settings.currency')}</span>
          <select 
            class="currency-select"
            value={$currentCurrency}
            onchange={handleCurrencyChange}
          >
            {#each currencyOptions as currency}
              <option value={currency.value}>{currency.label}</option>
            {/each}
          </select>
        </div>
      </div>
    </div>

    <!-- Data Management -->
    <div class="settings-card">
      <div class="card-header">
        <div class="card-icon data">
          <DollarSign size={20} strokeWidth={2} />
        </div>
        <h2 class="card-title">{$t('settings.dataManagement')}</h2>
      </div>
      <div class="card-content">
        <div class="action-buttons">
          <button 
            class="action-button export"
            onclick={handleExportData}
          >
            <Download size={16} strokeWidth={2} />
            {$t('settings.exportData')}
          </button>
          <button 
            class="action-button delete"
            onclick={handleDeleteAllData}
          >
            <Trash2 size={16} strokeWidth={2} />
            {$t('settings.deleteAllData')}
          </button>
        </div>
      </div>
    </div>
  </div>
</div>

<style>
  .settings-page {
    max-width: 900px;
    margin: 0 auto;
    padding: 1.5rem;
  }
  
  .settings-header {
    margin-bottom: 2rem;
  }
  
  .page-title {
    font-size: 1.75rem;
    font-weight: 600;
    color: var(--text-primary);
    margin: 0;
    letter-spacing: -0.025em;
  }
  
  .settings-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 1.5rem;
  }
  
  .settings-card {
    background: var(--surface-elevated);
    border-radius: 12px;
    padding: 1.5rem;
    border: 1px solid var(--border-color, transparent);
    box-shadow: var(--shadow-sm);
    transition: all 0.2s ease;
  }
  
  .settings-card:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-md);
  }
  
  .card-header {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 1.25rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid var(--border-color, rgba(2, 60, 70, 0.08));
  }
  
  .card-icon {
    width: 40px;
    height: 40px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .card-icon.appearance {
    background: rgba(245, 121, 108, 0.1);
    color: var(--accent);
  }
  
  .card-icon.localization {
    background: rgba(122, 186, 165, 0.1);
    color: var(--success);
  }
  
  .card-icon.data {
    background: rgba(254, 205, 44, 0.1);
    color: var(--warning);
  }
  
  .card-title {
    font-size: 1rem;
    font-weight: 600;
    color: var(--text-primary);
    margin: 0;
  }
  
  .card-content {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
  
  .setting-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
  }
  
  .setting-label {
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--text-secondary);
  }
  
  .currency-select {
    padding: 0.5rem 0.75rem;
    border: 1px solid var(--border-color, rgba(2, 60, 70, 0.2));
    border-radius: 6px;
    background: var(--surface);
    color: var(--text-primary);
    font-size: 0.875rem;
    min-width: 140px;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  
  .currency-select:hover {
    border-color: var(--primary);
  }
  
  .currency-select:focus {
    outline: none;
    border-color: var(--primary);
    box-shadow: 0 0 0 2px rgba(2, 60, 70, 0.1);
  }
  
  .action-buttons {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }
  
  .action-button {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    border-radius: 8px;
    font-weight: 500;
    font-size: 0.875rem;
    cursor: pointer;
    transition: all 0.2s ease;
    border: 1px solid;
  }
  
  .action-button.export {
    background: transparent;
    border-color: var(--success);
    color: var(--success);
  }
  
  .action-button.export:hover {
    background: var(--success);
    color: white;
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(122, 186, 165, 0.25);
  }
  
  .action-button.delete {
    background: transparent;
    border-color: var(--accent);
    color: var(--accent);
  }
  
  .action-button.delete:hover {
    background: var(--accent);
    color: white;
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(245, 121, 108, 0.25);
  }
  
  .action-button:focus {
    outline: none;
    box-shadow: 0 0 0 2px var(--surface), 0 0 0 4px currentColor;
  }
  
  /* Dark mode */
  html.dark .settings-card {
    background: var(--gray-800);
    border-color: rgba(254, 247, 238, 0.1);
  }
  
  html.dark .card-header {
    border-color: rgba(254, 247, 238, 0.1);
  }
  
  html.dark .currency-select {
    background: var(--gray-700);
    border-color: rgba(254, 247, 238, 0.2);
    color: var(--text-primary);
  }
  
  html.dark .currency-select:hover,
  html.dark .currency-select:focus {
    border-color: var(--acapulco);
  }
  
  html.dark .currency-select:focus {
    box-shadow: 0 0 0 2px rgba(122, 186, 165, 0.2);
  }
  
  html.dark .action-button.export {
    border-color: var(--acapulco);
    color: var(--acapulco);
  }
  
  html.dark .action-button.export:hover {
    background: var(--acapulco);
    color: var(--gray-900);
  }
  
  /* Light mode specific styles */
  html:not(.dark) .settings-card {
    background: white;
    border-color: rgba(2, 60, 70, 0.08);
  }
  
  html:not(.dark) .card-header {
    border-color: rgba(2, 60, 70, 0.08);
  }
  
  html:not(.dark) .currency-select {
    background: var(--surface);
    border-color: rgba(2, 60, 70, 0.15);
  }
  
  /* Mobile responsive */
  @media (max-width: 768px) {
    .settings-page {
      padding: 1rem;
    }
    
    .settings-grid {
      grid-template-columns: 1fr;
      gap: 1rem;
    }
    
    .settings-card {
      padding: 1.25rem;
    }
    
    .setting-item {
      flex-direction: column;
      align-items: stretch;
      gap: 0.5rem;
    }
    
    .currency-select {
      min-width: unset;
      width: 100%;
    }
  }
</style>
