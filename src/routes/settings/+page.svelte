<script>
  import { Download, Upload, Trash2, AlertTriangle } from 'lucide-svelte';
  import ThemeToggle from '../../lib/components/atoms/ThemeToggle.svelte';
  import LanguageSelect from '../../lib/components/atoms/LanguageSelect.svelte';
  import ActionButton from '../../lib/components/atoms/ActionButton.svelte';
  
  let currentLanguage = $state('en');
  let showDeleteConfirm = $state(false);
  
  function handleLanguageChange(lang) {
    currentLanguage = lang;
    console.log('Language changed to:', lang);
  }
  
  function handleExport() {
    console.log('Exporting data...');
  }
  
  function handleImport() {
    console.log('Importing data...');
  }
  
  function handleDeleteConfirm() {
    showDeleteConfirm = true;
  }
  
  function handleDeleteCancel() {
    showDeleteConfirm = false;
  }
  
  function handleDeleteAll() {
    console.log('Deleting all data...');
    showDeleteConfirm = false;
  }
</script>

<div class="settings-page">
  <header class="settings-header">
    <h1 class="text-3xl font-medium text-emphasis">Settings</h1>
    <p class="text-light text-subtle">Manage your preferences and data</p>
  </header>
  
  <div class="settings-grid">
    <!-- Appearance -->
    <div class="setting-card">
      <div class="setting-card__header">
        <h2 class="setting-card__title">Appearance</h2>
        <p class="setting-card__description">Customize the look and feel of your dashboard</p>
      </div>
      <div class="setting-card__content">
        <div class="setting-item">
          <div class="setting-item__content">
            <h3 class="setting-item__title">Theme</h3>
            <p class="setting-item__description">Switch between light and dark mode</p>
          </div>
          <div class="setting-item__control">
            <ThemeToggle size="md" />
          </div>
        </div>
        
        <div class="setting-item">
          <div class="setting-item__content">
            <h3 class="setting-item__title">Language</h3>
            <p class="setting-item__description">Choose your preferred language</p>
          </div>
          <div class="setting-item__control">
            <LanguageSelect value={currentLanguage} onchange={handleLanguageChange} />
          </div>
        </div>
      </div>
    </div>
    
    <!-- Data Management -->
    <div class="setting-card">
      <div class="setting-card__header">
        <h2 class="setting-card__title">Data Management</h2>
        <p class="setting-card__description">Import, export, and manage your financial data</p>
      </div>
      <div class="setting-card__content">
        <div class="setting-item">
          <div class="setting-item__content">
            <h3 class="setting-item__title">Export Data</h3>
            <p class="setting-item__description">Download all your financial data as CSV</p>
          </div>
          <div class="setting-item__control">
            <ActionButton icon={Download} label="Export" variant="secondary" onclick={handleExport} />
          </div>
        </div>
        
        <div class="setting-item">
          <div class="setting-item__content">
            <h3 class="setting-item__title">Import Data</h3>
            <p class="setting-item__description">Upload financial data from CSV file</p>
          </div>
          <div class="setting-item__control">
            <ActionButton icon={Upload} label="Import" variant="primary" onclick={handleImport} />
          </div>
        </div>
      </div>
    </div>
    
    <!-- Danger Zone -->
    <div class="setting-card">
      <div class="setting-card__header">
        <h2 class="setting-card__title">Danger Zone</h2>
        <p class="setting-card__description">Irreversible actions that affect all your data</p>
      </div>
      <div class="setting-card__content">
        <div class="setting-item">
          <div class="setting-item__content">
            <h3 class="setting-item__title">Delete All Data</h3>
            <p class="setting-item__description">Permanently remove all financial data</p>
          </div>
          <div class="setting-item__control">
            <ActionButton 
              icon={showDeleteConfirm ? AlertTriangle : Trash2}
              label={showDeleteConfirm ? "Confirm" : "Delete All"}
              variant="danger"
              onclick={showDeleteConfirm ? handleDeleteAll : handleDeleteConfirm}
            />
          </div>
        </div>
        
        {#if showDeleteConfirm}
          <div class="delete-confirmation">
            <div class="delete-confirmation__content">
              <AlertTriangle size={20} />
              <div>
                <p class="delete-confirmation__title">Are you sure?</p>
                <p class="delete-confirmation__text">This action cannot be undone.</p>
              </div>
            </div>
            <div class="delete-confirmation__actions">
              <ActionButton icon={AlertTriangle} label="Yes, Delete All" variant="danger" onclick={handleDeleteAll} />
              <ActionButton icon={AlertTriangle} label="Cancel" variant="secondary" onclick={handleDeleteCancel} />
            </div>
          </div>
        {/if}
      </div>
    </div>
  </div>
</div>

<style>
  .settings-page {
    animation: fadeInUp 0.3s ease-out;
    max-width: 800px;
    margin: 0 auto;
  }
  
  .settings-header {
    margin-bottom: var(--space-2xl);
  }
  
  .settings-header h1 {
    margin-bottom: var(--space-xs);
  }
  
  .settings-grid {
    display: flex;
    flex-direction: column;
    gap: var(--space-xl);
  }
  
  .setting-card {
    background: var(--surface-elevated);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-sm);
    border: 1px solid rgba(2, 60, 70, 0.08);
    transition: all 0.2s ease;
    overflow: hidden;
  }
  
  .setting-card:hover {
    transform: translateY(-1px);
    box-shadow: var(--shadow-md);
  }
  
  .setting-card__header {
    padding: var(--space-lg);
    border-bottom: 1px solid rgba(2, 60, 70, 0.08);
  }
  
  .setting-card__title {
    font-size: 1.125rem;
    font-weight: 500;
    color: var(--text-primary);
    margin: 0 0 0.5rem 0;
    line-height: 1.3;
  }
  
  .setting-card__description {
    font-size: 0.875rem;
    color: var(--text-muted);
    margin: 0;
    line-height: 1.5;
    font-weight: 300;
  }
  
  .setting-card__content {
    padding: var(--space-lg);
    display: flex;
    flex-direction: column;
    gap: var(--space-md);
  }
  
  .setting-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-md);
    padding: var(--space-md);
    border-radius: var(--radius-md);
    background: var(--surface-muted);
    border: 1px solid rgba(2, 60, 70, 0.05);
    transition: all 0.15s ease;
  }
  
  .setting-item:hover {
    background: var(--surface-elevated);
    border-color: rgba(2, 60, 70, 0.1);
    box-shadow: var(--shadow-sm);
  }
  
  .setting-item__content {
    flex: 1;
    min-width: 0;
  }
  
  .setting-item__title {
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--text-primary);
    margin: 0 0 0.25rem 0;
    line-height: 1.3;
  }
  
  .setting-item__description {
    font-size: 0.75rem;
    color: var(--text-muted);
    margin: 0;
    line-height: 1.4;
  }
  
  .setting-item__control {
    flex-shrink: 0;
  }
  
  .delete-confirmation {
    padding: var(--space-md);
    border-radius: var(--radius-md);
    background: var(--accent-light);
    border: 1px solid var(--accent);
    animation: slideDown 0.2s ease-out;
  }
  
  .delete-confirmation__content {
    display: flex;
    align-items: flex-start;
    gap: var(--space-sm);
    margin-bottom: var(--space-md);
    color: var(--accent);
  }
  
  .delete-confirmation__title {
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--accent);
    margin: 0 0 0.25rem 0;
  }
  
  .delete-confirmation__text {
    font-size: 0.75rem;
    color: var(--accent);
    margin: 0;
    line-height: 1.4;
  }
  
  .delete-confirmation__actions {
    display: flex;
    gap: var(--space-sm);
    justify-content: flex-end;
  }
  
  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(16px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translateY(-8px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  /* Dark mode */
  html.dark .setting-card {
    border-color: rgba(254, 247, 238, 0.1);
  }
  
  html.dark .setting-card__header {
    border-bottom-color: rgba(254, 247, 238, 0.1);
  }
  
  html.dark .setting-item {
    border-color: rgba(254, 247, 238, 0.05);
  }
  
  html.dark .setting-item:hover {
    border-color: rgba(254, 247, 238, 0.1);
  }
  
  html.dark .delete-confirmation {
    background: rgba(245, 121, 108, 0.1);
  }
</style>
