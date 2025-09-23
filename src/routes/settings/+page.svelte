<script lang="ts">
  import { DollarSign, Palette, Globe } from 'lucide-svelte';
  import ConfirmModal from '$lib/components/organisms/ConfirmModal.svelte';
  import SettingsStatusMessage from '$lib/components/molecules/SettingsStatusMessage.svelte';
  import SettingsCard from '$lib/components/organisms/SettingsCard.svelte';
  import SettingsThemeToggle from '$lib/components/molecules/SettingsThemeToggle.svelte';
  import SettingsLanguageSelect from '$lib/components/molecules/SettingsLanguageSelect.svelte';
  import SettingsCurrencySelect from '$lib/components/molecules/SettingsCurrencySelect.svelte';
  import SettingsActionButtons from '$lib/components/organisms/SettingsActionButtons.svelte';
  import { createSettingsStore } from '$lib/modules/settings/presentation/stores/settingsStore.svelte.ts';
  import { t } from '$lib/stores/i18n';
  import { currencies } from '$lib/stores/currency';
  import { userPreferences } from '$lib/stores/user-preferences';
  import { onMount } from 'svelte';

  // API Configuration
  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

  // Create settings store instance
  const store = createSettingsStore(API_BASE);

  const currencyOptions = Object.values(currencies).map(curr => ({
    value: curr.code,
    label: `${curr.symbol} ${curr.name}`,
    symbol: curr.symbol
  }));

  const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'es', name: 'Español', flag: '🇪🇸' }
  ];

  // Load user preferences on mount
  onMount(async () => {
    await userPreferences.load();
  });
</script>

<svelte:head>
  <title>{$t('settings.title')} - Happy Balance</title>
</svelte:head>

<main class="settings-page">
  <div class="settings-header">
    <h1 class="page-title">{$t('settings.title')}</h1>
  </div>
  
  <!-- Status Messages -->
  <SettingsStatusMessage
    message={store.importStatus}
    type={store.importSuccess ? 'success' : 'info'}
  />

  <SettingsStatusMessage
    message={store.importError}
    type="error"
  />
  
  <div class="settings-grid">
    <!-- Appearance Settings -->
    <SettingsCard
      title={$t('settings.theme')}
      icon={Palette}
      iconClass="appearance"
    >
        <div class="setting-item">
          <div class="setting-info">
            <span class="setting-label">{$t('settings.theme')}</span>
            <span class="setting-desc">
              {store.isDark ? $t('settings.themes.dark') : $t('settings.themes.light')}
            </span>
          </div>
          <SettingsThemeToggle
            isDark={store.isDark}
            onToggle={store.toggleTheme}
          />
        </div>
    </SettingsCard>

    <!-- Localization Settings -->
    <SettingsCard
      title="Localization"
      icon={Globe}
      iconClass="localization"
    >
        <div class="setting-item">
          <div class="setting-info">
            <span class="setting-label">{$t('settings.language')}</span>
            <span class="setting-desc">
              {store.currentLanguage.name}
            </span>
          </div>
          <SettingsLanguageSelect
            value={store.currentLanguage.code}
            {languages}
            onChange={async (e) => await store.changeLanguage((e.target as HTMLSelectElement).value)}
          />
        </div>

        <div class="setting-item">
          <div class="setting-info">
            <span class="setting-label">{$t('settings.currency')}</span>
            <span class="setting-desc">
              {currencyOptions.find(c => c.value === store.settings.currency)?.label || 'EUR'}
            </span>
          </div>
          <SettingsCurrencySelect
            value={store.settings.currency}
            options={currencyOptions}
            onChange={async (e) => await store.changeCurrency((e.target as HTMLSelectElement).value)}
          />
        </div>
    </SettingsCard>

    <!-- Data Management -->
    <SettingsCard
      title={$t('settings.data')}
      icon={DollarSign}
      iconClass="data"
    >
        <SettingsActionButtons
          onExport={store.exportData}
          onFileImport={store.handleFileImport}
          onReset={store.resetData}
          onDeleteAll={store.deleteAllData}
          importing={store.importing}
        />
    </SettingsCard>
  </div>
</main>

<!-- Import Confirmation Modal -->
<ConfirmModal
  bind:isOpen={store.showImportModal}
  title="Import Data"
  message="Are you sure you want to import {store.pendingImportData?.transactions?.length || 0} transactions from {store.pendingImportData?.settings?.exportDate ? new Date(store.pendingImportData.settings.exportDate).toLocaleDateString() : 'Unknown date'}? This will merge with your existing data."
  confirmText="Import"
  cancelText="Cancel"
  type="info"
  onConfirm={store.confirmImport}
  onCancel={() => store.showImportModal = false}
/>

<!-- Reset Data Confirmation Modal -->
<ConfirmModal
  bind:isOpen={store.showResetModal}
  title={$t('modal.reset_title')}
  message={$t('modal.reset_message')}
  confirmText={$t('modal.reset_everything')}
  cancelText={$t('common.cancel')}
  type="warning"
  onConfirm={store.confirmReset}
  onCancel={() => store.showResetModal = false}
/>

<!-- Delete All Data Confirmation Modal -->
<ConfirmModal
  bind:isOpen={store.showDeleteAllModal}
  title={$t('modal.delete_all_title')}
  message={$t('modal.delete_all_message')}
  confirmText={$t('modal.delete_everything')}
  cancelText={$t('common.cancel')}
  type="danger"
  onConfirm={store.confirmDeleteAll}
  onCancel={() => store.showDeleteAllModal = false}
/>

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

  .settings-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
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
  
  /* Mobile responsive */
  @media (max-width: 768px) {
    .settings-page {
      padding: 1rem;
    }

    .settings-grid {
      grid-template-columns: 1fr;
      gap: 1rem;
    }

    .setting-item {
      flex-direction: column;
      align-items: stretch;
      gap: 1rem;
    }

    .setting-info {
      text-align: center;
    }
  }
</style>
