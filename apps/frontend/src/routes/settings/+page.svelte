<script lang="ts">
  import { Sun, Moon, Globe, Database, Download, Upload, Trash2, RotateCcw } from 'lucide-svelte';
  import ConfirmModal from '$lib/components/organisms/ConfirmModal.svelte';
  import SettingsStatusMessage from '$lib/components/molecules/SettingsStatusMessage.svelte';
  import PageContainer from '$lib/components/atoms/PageContainer.svelte';
  import PageHeader from '$lib/components/molecules/PageHeader.svelte';
  import SecuritySection from '$lib/components/organisms/SecuritySection.svelte';
  import BackupSection from '$lib/components/organisms/BackupSection.svelte';
  import SidebarConfigSection from '$lib/components/organisms/SidebarConfigSection.svelte';
  import GofireImport from '$lib/components/molecules/GofireImport.svelte';
  import { createSettingsStore } from '$lib/modules/settings/presentation/stores/settingsStore.svelte.ts';
  import { authStore } from '$lib/modules/auth/presentation/stores/authStore.svelte';
  import { t } from '$lib/stores/i18n';
  import { currencies } from '$lib/stores/currency';
  import { userPreferences } from '$lib/stores/user-preferences';
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { getApiUrl } from '$lib/utils/api-url';

  const API_BASE = getApiUrl();
  const store = createSettingsStore(API_BASE);

  const currencyOptions = Object.values(currencies).map((curr) => ({
    value: curr.code,
    label: `${curr.symbol} ${curr.code}`,
    symbol: curr.symbol,
  }));

  const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
  ];

  // Collapsible sections
  let securityExpanded = $state(false);
  let sidebarExpanded = $state(false);
  let backupExpanded = $state(false);

  // Version
  let versionInfo = $state<{ version: string; commit?: string } | null>(null);

  onMount(async () => {
    await userPreferences.load();
    if (!authStore.isAuthenticated) {
      goto('/login');
    }
    try {
      const response = await fetch(`${API_BASE}/version`);
      if (response.ok) versionInfo = await response.json();
    } catch {
      // Version fetch is non-critical, silently ignore
    }
  });

  function getImportMessage(): string {
    const data = store.pendingImportData;
    if (!data) return '';
    if (data.data) {
      const tx = data.data.transactions?.length || 0;
      const cat = data.data.categories?.length || 0;
      const inv = data.data.investments?.length || 0;
      return `Import ${tx} transactions, ${cat} categories, ${inv} investments?`;
    }
    return `Import ${data.transactions?.length || 0} transactions?`;
  }
</script>

<svelte:head>
  <title>{$t('settings.title')} - Happy Balance</title>
</svelte:head>

<PageContainer>
  <PageHeader title={$t('settings.title')} />

  <SettingsStatusMessage
    message={store.importStatus}
    type={store.importSuccess ? 'success' : 'info'}
  />
  <SettingsStatusMessage message={store.importError} type="error" />

  <div class="settings-content">
    <!-- SECTION: Preferences -->
    <section class="settings-section">
      <h2 class="section-title">
        <Globe size={18} />
        {$t('settings.preferences') || 'Preferences'}
      </h2>

      <div class="settings-row">
        <div class="row-label">
          <span class="label-text">{$t('settings.theme')}</span>
        </div>
        <button class="theme-toggle" onclick={() => store.toggleTheme()} aria-label="Toggle theme">
          {#if store.isDark}
            <Moon size={18} />
          {:else}
            <Sun size={18} />
          {/if}
          <span>{store.isDark ? 'Dark' : 'Light'}</span>
        </button>
      </div>

      <div class="settings-row">
        <div class="row-label">
          <span class="label-text">{$t('settings.language')}</span>
        </div>
        <select
          class="select-control"
          value={store.currentLanguage.code}
          onchange={async (e) => await store.changeLanguage((e.target as HTMLSelectElement).value)}
        >
          {#each languages as lang (lang.code)}
            <option value={lang.code}>{lang.flag} {lang.name}</option>
          {/each}
        </select>
      </div>

      <div class="settings-row">
        <div class="row-label">
          <span class="label-text">{$t('settings.currency')}</span>
        </div>
        <select
          class="select-control"
          value={store.settings.currency}
          onchange={async (e) => await store.changeCurrency((e.target as HTMLSelectElement).value)}
        >
          {#each currencyOptions as curr (curr.value)}
            <option value={curr.value}>{curr.label}</option>
          {/each}
        </select>
      </div>
    </section>

    <!-- SECTION: Data -->
    <section class="settings-section">
      <h2 class="section-title">
        <Database size={18} />
        {$t('settings.data') || 'Data'}
      </h2>

      <div class="data-actions">
        <button class="action-btn" onclick={store.exportData}>
          <Download size={16} />
          Export
        </button>
        <label class="action-btn">
          <Upload size={16} />
          Import
          <input
            type="file"
            accept=".json"
            class="hidden-input"
            onchange={store.handleFileImport}
          />
        </label>
        <button class="action-btn warning" onclick={store.resetData}>
          <RotateCcw size={16} />
          Reset
        </button>
        <button class="action-btn danger" onclick={store.deleteAllData}>
          <Trash2 size={16} />
          Delete All
        </button>
      </div>

      <!-- GoFire Import -->
      <GofireImport />

      <!-- Backups (collapsible) -->
      <BackupSection bind:expanded={backupExpanded} />
    </section>

    <!-- SECTION: Security -->
    <SecuritySection bind:expanded={securityExpanded} />

    <!-- SECTION: Sidebar -->
    <SidebarConfigSection bind:expanded={sidebarExpanded} />

    <!-- Footer: Version -->
    {#if versionInfo}
      <footer class="version-footer">
        <span>v{versionInfo.version}</span>
        <span class="separator">·</span>
        <span class="commit">{versionInfo.commit?.slice(0, 7)}</span>
      </footer>
    {/if}
  </div>
</PageContainer>

<!-- Modals -->
<ConfirmModal
  bind:isOpen={store.showImportModal}
  title="Import Data"
  message={getImportMessage()}
  confirmText="Import"
  cancelText="Cancel"
  type="info"
  onConfirm={store.confirmImport}
  onCancel={() => (store.showImportModal = false)}
>
  <div class="import-mode-options">
    <label class="import-option">
      <input
        type="radio"
        name="mode"
        value="merge"
        checked={store.importMode === 'merge'}
        onchange={() => (store.importMode = 'merge')}
      />
      <div>
        <strong>Merge</strong>
        <small>Add to existing</small>
      </div>
    </label>
    <label class="import-option">
      <input
        type="radio"
        name="mode"
        value="replace"
        checked={store.importMode === 'replace'}
        onchange={() => (store.importMode = 'replace')}
      />
      <div>
        <strong>Replace</strong>
        <small>Delete existing first</small>
      </div>
    </label>
  </div>
</ConfirmModal>

<ConfirmModal
  bind:isOpen={store.showResetModal}
  title={$t('modal.reset_title')}
  message={$t('modal.reset_message')}
  confirmText={$t('modal.reset_everything')}
  cancelText={$t('common.cancel')}
  type="warning"
  onConfirm={store.confirmReset}
  onCancel={() => (store.showResetModal = false)}
/>

<ConfirmModal
  bind:isOpen={store.showDeleteAllModal}
  title={$t('modal.delete_all_title')}
  message={$t('modal.delete_all_message')}
  confirmText={$t('modal.delete_everything')}
  cancelText={$t('common.cancel')}
  type="danger"
  onConfirm={store.confirmDeleteAll}
  onCancel={() => (store.showDeleteAllModal = false)}
/>

<style>
  .settings-content {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1.5rem;
    align-items: start;
  }

  @media (max-width: 768px) {
    .settings-content {
      grid-template-columns: 1fr;
    }
  }

  /* Sections */
  .settings-section {
    background: var(--surface-elevated);
    border: 1px solid var(--border-color);
    border-radius: 12px;
    padding: 1.5rem;
  }

  .section-title {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--text-primary);
    text-transform: uppercase;
    letter-spacing: 0.03em;
    margin: 0 0 1rem 0;
  }

  /* Settings rows */
  .settings-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.75rem 0;
    border-bottom: 1px solid var(--border-color);
  }

  .settings-row:last-child {
    border-bottom: none;
  }

  .row-label {
    display: flex;
    flex-direction: column;
    gap: 0.125rem;
  }

  .label-text {
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--text-primary);
  }

  /* Controls */
  .theme-toggle {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 0.875rem;
    background: var(--surface-muted);
    border: 1px solid var(--border-color);
    border-radius: 8px;
    font-size: 0.8125rem;
    font-weight: 500;
    color: var(--text-primary);
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .theme-toggle:hover {
    background: var(--surface-hover);
    border-color: var(--primary);
  }

  .select-control {
    padding: 0.5rem 0.75rem;
    background: var(--surface-muted);
    border: 1px solid var(--border-color);
    border-radius: 8px;
    font-size: 0.8125rem;
    color: var(--text-primary);
    cursor: pointer;
    min-width: 120px;
  }

  .select-control:hover {
    border-color: var(--primary);
  }

  /* Data actions */
  .data-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-bottom: 1.25rem;
  }

  .action-btn {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    padding: 0.5rem 0.75rem;
    background: var(--surface-muted);
    border: 1px solid var(--border-color);
    border-radius: 6px;
    font-size: 0.75rem;
    font-weight: 500;
    color: var(--text-primary);
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .action-btn:hover {
    background: var(--surface-hover);
    border-color: var(--primary);
  }

  .action-btn.warning:hover {
    border-color: var(--warning);
    color: var(--warning);
  }

  .action-btn.danger:hover {
    border-color: var(--danger);
    color: var(--danger);
  }

  .hidden-input {
    display: none;
  }

  /* Version footer */
  .version-footer {
    grid-column: 1 / -1;
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 0.5rem;
    padding-top: 0.5rem;
    font-size: 0.6875rem;
    color: var(--text-muted);
  }

  .separator {
    opacity: 0.5;
  }

  .commit {
    font-family: monospace;
    opacity: 0.7;
  }

  /* Import modal options */
  .import-mode-options {
    display: flex;
    gap: 0.75rem;
  }

  .import-option {
    flex: 1;
    display: flex;
    align-items: flex-start;
    gap: 0.5rem;
    padding: 0.75rem;
    border: 2px solid var(--border-color);
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .import-option:hover {
    border-color: var(--primary);
  }

  .import-option:has(input:checked) {
    border-color: var(--primary);
    background: var(--primary-bg, rgba(122, 186, 165, 0.08));
  }

  .import-option input {
    accent-color: var(--primary);
    margin-top: 2px;
  }

  .import-option div {
    display: flex;
    flex-direction: column;
    gap: 0.125rem;
  }

  .import-option strong {
    font-size: 0.8125rem;
    color: var(--text-primary);
  }

  .import-option small {
    font-size: 0.6875rem;
    color: var(--text-muted);
  }

  /* Mobile */
  @media (max-width: 640px) {
    .data-actions {
      flex-direction: column;
    }

    .action-btn {
      justify-content: center;
    }

    .import-mode-options {
      flex-direction: column;
    }

    .settings-section {
      padding: 1rem;
      border-radius: 8px;
    }

    .settings-row {
      flex-direction: column;
      align-items: flex-start;
      gap: 0.5rem;
    }

    .select-control,
    .theme-toggle {
      width: 100%;
    }
  }

  @media (max-width: 480px) {
    .settings-content {
      gap: 1rem;
    }

    .settings-section {
      padding: 0.875rem;
    }

    .section-title {
      font-size: 0.8125rem;
    }

    .label-text {
      font-size: 0.8125rem;
    }
  }

  @media (max-width: 360px) {
    .settings-section {
      padding: 0.75rem;
      border-radius: 6px;
    }

    .action-btn {
      font-size: 0.6875rem;
      padding: 0.375rem 0.5rem;
    }
  }
</style>
