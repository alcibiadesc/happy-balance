<script lang="ts">
  import { Download, Upload, Trash2, DollarSign, Palette, Globe, FileText, AlertCircle, CheckCircle } from 'lucide-svelte';
  import { t, currentLanguage, setLanguage } from '$lib/stores/i18n';
  import { currentCurrency, currencies, setCurrency } from '$lib/stores/currency';
  import { theme, setTheme, effectiveTheme } from '$lib/stores/theme';
  import { browser } from '$app/environment';
  import { onMount } from 'svelte';
  
  const currencyOptions = Object.values(currencies).map(curr => ({
    value: curr.code,
    label: `${curr.symbol} ${curr.name}`,
    symbol: curr.symbol
  }));
  
  const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'es', name: 'Español', flag: '🇪🇸' }
  ];

  // Theme state
  $: isDark = $effectiveTheme === 'dark';

  // Theme toggle function
  function toggleTheme() {
    const newTheme = isDark ? 'light' : 'dark';
    setTheme(newTheme);
  }

  // Import/Export state
  let importStatus = '';
  let importError = '';
  let importSuccess = false;
  let importing = false;
  
  function handleExportData() {
    // Create a comprehensive data export
    const data = {
      transactions: JSON.parse(localStorage.getItem('transactions') || '[]'),
      transactionHashes: JSON.parse(localStorage.getItem('transaction-hashes') || '[]'),
      categories: JSON.parse(localStorage.getItem('categories') || '[]'),
      settings: {
        currency: $currentCurrency,
        language: $currentLanguage,
        theme: $theme,
        exportDate: new Date().toISOString(),
        version: '1.0.0'
      },
      metadata: {
        appName: 'Happy Balance',
        exportedBy: 'Settings Export',
        totalTransactions: JSON.parse(localStorage.getItem('transactions') || '[]').length
      }
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `happy-balance-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    // Show success feedback
    importStatus = $t('settings.export_success');
    importSuccess = true;
    setTimeout(() => {
      importStatus = '';
      importSuccess = false;
    }, 3000);
  }
  
  function handleFileImport(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    
    if (!file) return;
    
    // Reset states
    importError = '';
    importStatus = '';
    importSuccess = false;
    importing = true;
    
    // Validate file type
    if (!file.name.toLowerCase().endsWith('.json')) {
      importError = $t('settings.import_invalid_file');
      importing = false;
      return;
    }
    
    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      importError = $t('settings.import_file_too_large');
      importing = false;
      return;
    }
    
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const content = e.target?.result as string;
        const data = JSON.parse(content);
        
        // Validate data structure
        if (!validateImportData(data)) {
          importError = $t('settings.import_invalid_format');
          importing = false;
          return;
        }
        
        // Ask for confirmation
        const confirmMessage = $t('settings.import_confirmation', {
          transactions: data.transactions?.length || 0,
          date: data.settings?.exportDate ? new Date(data.settings.exportDate).toLocaleDateString() : 'Unknown'
        });
        
        if (!confirm(confirmMessage)) {
          importing = false;
          return;
        }
        
        // Import data
        await importData(data);
        
        // Success feedback
        importStatus = $t('settings.import_success', { count: data.transactions?.length || 0 });
        importSuccess = true;
        importing = false;
        
        setTimeout(() => {
          importStatus = '';
          importSuccess = false;
        }, 5000);
        
      } catch (error) {
        console.error('Import error:', error);
        importError = $t('settings.import_parse_error');
        importing = false;
      }
    };
    
    reader.onerror = () => {
      importError = $t('settings.import_read_error');
      importing = false;
    };
    
    reader.readAsText(file);
    
    // Clear the input so the same file can be selected again
    input.value = '';
  }
  
  function validateImportData(data: any): boolean {
    // Check if it's a valid Happy Balance export
    if (!data || typeof data !== 'object') return false;
    
    // Must have transactions array (can be empty)
    if (!Array.isArray(data.transactions)) return false;
    
    // Optional but recommended: settings and metadata
    if (data.settings && typeof data.settings !== 'object') return false;
    if (data.metadata && typeof data.metadata !== 'object') return false;
    
    return true;
  }
  
  async function importData(data: any) {
    if (!browser) return;
    
    // Import transactions
    if (data.transactions && Array.isArray(data.transactions)) {
      const existingTransactions = JSON.parse(localStorage.getItem('transactions') || '[]');
      const existingHashes = JSON.parse(localStorage.getItem('transaction-hashes') || '[]');
      
      // Filter out duplicates based on hash
      const newTransactions = data.transactions.filter((tx: any) => {
        return tx.hash && !existingHashes.includes(tx.hash);
      });
      
      // Merge transactions
      const mergedTransactions = [...existingTransactions, ...newTransactions];
      const mergedHashes = [...existingHashes, ...newTransactions.map((tx: any) => tx.hash)];
      
      localStorage.setItem('transactions', JSON.stringify(mergedTransactions));
      localStorage.setItem('transaction-hashes', JSON.stringify(mergedHashes));
    }
    
    // Import transaction hashes (if provided separately)
    if (data.transactionHashes && Array.isArray(data.transactionHashes)) {
      const existingHashes = JSON.parse(localStorage.getItem('transaction-hashes') || '[]');
      const uniqueHashes = [...new Set([...existingHashes, ...data.transactionHashes])];
      localStorage.setItem('transaction-hashes', JSON.stringify(uniqueHashes));
    }
    
    // Import categories (if provided)
    if (data.categories && Array.isArray(data.categories)) {
      const existingCategories = JSON.parse(localStorage.getItem('categories') || '[]');
      const mergedCategories = [...existingCategories, ...data.categories];
      localStorage.setItem('categories', JSON.stringify(mergedCategories));
    }
    
    // Import settings (optional)
    if (data.settings) {
      if (data.settings.currency && currencies[data.settings.currency]) {
        setCurrency(data.settings.currency);
      }
      if (data.settings.language && languages.find(l => l.code === data.settings.language)) {
        setLanguage(data.settings.language);
      }
      if (data.settings.theme && ['light', 'dark', 'system'].includes(data.settings.theme)) {
        setTheme(data.settings.theme);
      }
    }
  }
  
  function handleDeleteAllData() {
    if (confirm($t('settings.clear_data_confirmation'))) {
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
      
      // Show success feedback
      importStatus = $t('success.deleted');
      importSuccess = true;
      setTimeout(() => {
        importStatus = '';
        importSuccess = false;
      }, 3000);
    }
  }
  
  function handleLanguageChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    setLanguage(target.value);
  }
  
  function handleCurrencyChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    setCurrency(target.value);
  }

  // Clear status messages after some time
  $: if (importError) {
    setTimeout(() => {
      importError = '';
    }, 5000);
  }
</script>

<svelte:head>
  <title>{$t('settings.title')} - Happy Balance</title>
</svelte:head>

<main class="settings-page">
  <div class="settings-header">
    <h1 class="page-title">{$t('settings.title')}</h1>
  </div>
  
  <!-- Status Messages -->
  {#if importStatus}
    <div class="status-message {importSuccess ? 'success' : 'info'}">
      {#if importSuccess}
        <CheckCircle size={20} strokeWidth={2} />
      {:else}
        <FileText size={20} strokeWidth={2} />
      {/if}
      <span>{importStatus}</span>
    </div>
  {/if}
  
  {#if importError}
    <div class="status-message error">
      <AlertCircle size={20} strokeWidth={2} />
      <span>{importError}</span>
    </div>
  {/if}
  
  <div class="settings-grid">
    <!-- Appearance Settings -->
    <div class="settings-card">
      <div class="card-header">
        <div class="card-icon appearance">
          <Palette size={20} strokeWidth={2} />
        </div>
        <h2 class="card-title">{$t('settings.theme')}</h2>
      </div>
      <div class="card-content">
        <div class="setting-item">
          <div class="setting-info">
            <span class="setting-label">{$t('settings.theme')}</span>
            <span class="setting-desc">
              {isDark ? $t('settings.themes.dark') : $t('settings.themes.light')}
            </span>
          </div>
          <!-- DaisyUI Toggle with custom styling -->
          <div class="theme-toggle-container">
            <div class="theme-option {!isDark ? 'active' : ''}">
              ☀️
            </div>
            <input
              type="checkbox"
              checked={isDark}
              onchange={toggleTheme}
              class="toggle toggle-primary toggle-lg"
            />
            <div class="theme-option {isDark ? 'active' : ''}">
              🌙
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Localization Settings -->
    <div class="settings-card">
      <div class="card-header">
        <div class="card-icon localization">
          <Globe size={20} strokeWidth={2} />
        </div>
        <h2 class="card-title">Localization</h2>
      </div>
      <div class="card-content">
        <div class="setting-item">
          <div class="setting-info">
            <span class="setting-label">{$t('settings.language')}</span>
            <span class="setting-desc">
              {languages.find(l => l.code === $currentLanguage)?.name || 'English'}
            </span>
          </div>
          <div class="language-select">
            <div class="language-select__icon">
              <Globe size={16} strokeWidth={2} />
            </div>
            <select 
              class="language-select__input"
              value={$currentLanguage}
              onchange={handleLanguageChange}
            >
              {#each languages as lang}
                <option value={lang.code}>
                  {lang.flag} {lang.name}
                </option>
              {/each}
            </select>
          </div>
        </div>
        
        <div class="setting-item">
          <div class="setting-info">
            <span class="setting-label">{$t('settings.currency')}</span>
            <span class="setting-desc">
              {currencyOptions.find(c => c.value === $currentCurrency)?.label || 'EUR'}
            </span>
          </div>
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
        <h2 class="card-title">{$t('settings.data')}</h2>
      </div>
      <div class="card-content">
        <div class="action-buttons">
          <button 
            class="action-button export"
            onclick={handleExportData}
          >
            <Download size={16} strokeWidth={2} />
            {$t('settings.export_data')}
          </button>
          
          <label class="action-button import {importing ? 'loading' : ''}">
            <input 
              type="file" 
              accept=".json"
              onchange={handleFileImport}
              style="display: none;"
              disabled={importing}
            />
            {#if importing}
              <div class="import-spinner"></div>
              Importing...
            {:else}
              <Upload size={16} strokeWidth={2} />
              Import Data
            {/if}
          </label>
          
          <button 
            class="action-button delete"
            onclick={handleDeleteAllData}
          >
            <Trash2 size={16} strokeWidth={2} />
            {$t('settings.clear_data')}
          </button>
        </div>
      </div>
    </div>
  </div>
</main>

<style>
  .settings-page {
    max-width: 1200px;
    margin: 0 auto;
    padding: 1.5rem;
    min-height: 100vh;
    background: var(--surface);
  }
  
  .settings-header {
    margin-bottom: 2rem;
  }
  
  .page-title {
    font-size: 1.875rem;
    font-weight: 300;
    color: var(--text-primary);
    margin: 0;
    letter-spacing: -0.025em;
  }
  
  /* Status Messages */
  .status-message {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 1rem 1.25rem;
    border-radius: 0.75rem;
    margin-bottom: 1.5rem;
    font-size: 0.875rem;
    font-weight: 500;
  }
  
  .status-message.success {
    background: rgba(122, 186, 165, 0.1);
    border: 1px solid rgba(122, 186, 165, 0.2);
    color: var(--acapulco);
  }
  
  .status-message.error {
    background: rgba(245, 121, 108, 0.1);
    border: 1px solid rgba(245, 121, 108, 0.2);
    color: #f5796c;
  }
  
  .status-message.info {
    background: rgba(254, 205, 44, 0.1);
    border: 1px solid rgba(254, 205, 44, 0.2);
    color: #fecd2c;
  }
  
  .settings-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
    gap: 1.5rem;
  }
  
  .settings-card {
    background: var(--surface-elevated);
    border-radius: 1rem;
    padding: 1.5rem;
    border: 1px solid var(--border-color);
    transition: all 0.2s ease;
  }
  
  .settings-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.05);
  }
  
  .card-header {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 1.5rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid var(--border-color);
  }
  
  .card-icon {
    width: 2.5rem;
    height: 2.5rem;
    border-radius: 0.75rem;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .card-icon.appearance {
    background: rgba(245, 121, 108, 0.1);
    color: #f5796c;
  }
  
  .card-icon.localization {
    background: rgba(122, 186, 165, 0.1);
    color: var(--acapulco);
  }
  
  .card-icon.data {
    background: rgba(254, 205, 44, 0.1);
    color: #fecd2c;
  }
  
  .card-title {
    font-size: 1.125rem;
    font-weight: 500;
    color: var(--text-primary);
    margin: 0;
  }
  
  .card-content {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }
  
  .setting-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
  }
  
  .setting-info {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    flex: 1;
  }
  
  .setting-label {
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--text-primary);
  }
  
  .setting-desc {
    font-size: 0.75rem;
    color: var(--text-muted);
  }

  /* DaisyUI Theme Toggle Container */
  .theme-toggle-container {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.5rem;
    background: var(--surface-muted);
    border: 1px solid var(--border-color);
    border-radius: 0.75rem;
    transition: all 0.2s ease;
  }
  
  .theme-option {
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--text-muted);
    font-size: 1.25rem;
    transition: all 0.2s ease;
    user-select: none;
  }
  
  .theme-option.active {
    color: var(--acapulco);
    transform: scale(1.1);
  }
  
  /* Custom DaisyUI toggle styling */
  .toggle:checked {
    background-color: var(--acapulco);
    border-color: var(--acapulco);
  }
  
  .toggle:checked:hover {
    background-color: rgba(122, 186, 165, 0.9);
    border-color: rgba(122, 186, 165, 0.9);
  }
  
  .toggle:focus {
    box-shadow: 0 0 0 2px var(--acapulco), 0 0 0 4px rgba(122, 186, 165, 0.2);
  }

  /* Language Select */
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
  
  .currency-select {
    padding: 0.5rem 0.75rem;
    border: 1px solid var(--border-color);
    border-radius: 0.5rem;
    background: var(--surface);
    color: var(--text-primary);
    font-size: 0.875rem;
    min-width: 140px;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  
  .currency-select:hover,
  .currency-select:focus {
    border-color: var(--acapulco);
    outline: none;
    box-shadow: 0 0 0 3px rgba(122, 186, 165, 0.1);
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
    border-radius: 0.5rem;
    font-weight: 500;
    font-size: 0.875rem;
    cursor: pointer;
    transition: all 0.2s ease;
    border: 1px solid;
    text-decoration: none;
  }
  
  .action-button.export {
    background: transparent;
    border-color: var(--acapulco);
    color: var(--acapulco);
  }
  
  .action-button.export:hover {
    background: var(--acapulco);
    color: var(--text-inverse);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(122, 186, 165, 0.3);
  }
  
  .action-button.import {
    background: transparent;
    border-color: #7abaa5;
    color: #7abaa5;
  }
  
  .action-button.import:hover:not(.loading) {
    background: #7abaa5;
    color: var(--text-inverse);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(122, 186, 165, 0.2);
  }
  
  .action-button.import.loading {
    opacity: 0.7;
    cursor: not-allowed;
  }
  
  .action-button.delete {
    background: transparent;
    border-color: #f5796c;
    color: #f5796c;
  }
  
  .action-button.delete:hover {
    background: #f5796c;
    color: var(--text-inverse);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(245, 121, 108, 0.3);
  }
  
  .action-button:focus {
    outline: none;
    box-shadow: 0 0 0 3px rgba(122, 186, 165, 0.3);
  }
  
  /* Import spinner */
  .import-spinner {
    width: 16px;
    height: 16px;
    border: 2px solid var(--text-muted);
    border-top: 2px solid var(--acapulco);
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
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
      gap: 1rem;
    }
    
    .setting-info {
      text-align: center;
    }
    
    .currency-select,
    .language-select {
      min-width: unset;
      width: 100%;
    }

    .theme-toggle-container {
      align-self: center;
      justify-self: center;
    }
  }
</style>
