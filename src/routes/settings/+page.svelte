<script lang="ts">
  import { DollarSign, Palette, Globe, Lock } from 'lucide-svelte';
  import ConfirmModal from '$lib/components/organisms/ConfirmModal.svelte';
  import SettingsStatusMessage from '$lib/components/molecules/SettingsStatusMessage.svelte';
  import SettingsCard from '$lib/components/organisms/SettingsCard.svelte';
  import SettingsThemeToggle from '$lib/components/molecules/SettingsThemeToggle.svelte';
  import SettingsLanguageSelect from '$lib/components/molecules/SettingsLanguageSelect.svelte';
  import SettingsCurrencySelect from '$lib/components/molecules/SettingsCurrencySelect.svelte';
  import SettingsActionButtons from '$lib/components/organisms/SettingsActionButtons.svelte';
  import Input from '$lib/components/atoms/Input.svelte';
  import { createSettingsStore } from '$lib/modules/settings/presentation/stores/settingsStore.svelte.ts';
  import { authStore } from '$lib/modules/auth/presentation/stores/authStore.svelte';
  import { t } from '$lib/stores/i18n';
  import { currencies } from '$lib/stores/currency';
  import { userPreferences } from '$lib/stores/user-preferences';
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { fly } from 'svelte/transition';

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

  // Password change form state
  let currentPassword = $state('');
  let newPassword = $state('');
  let confirmPassword = $state('');
  let passwordError = $state<string | null>(null);
  let passwordSuccess = $state<string | null>(null);
  let isSubmittingPassword = $state(false);

  // Load user preferences on mount
  onMount(async () => {
    await userPreferences.load();

    // Redirect if not authenticated
    if (!authStore.isAuthenticated) {
      goto('/login');
    }
  });

  async function handlePasswordChange(event: Event) {
    event.preventDefault();

    if (!currentPassword || !newPassword || !confirmPassword) {
      passwordError = 'All fields are required';
      return;
    }

    if (newPassword !== confirmPassword) {
      passwordError = 'New passwords do not match';
      return;
    }

    if (newPassword.length < 4) {
      passwordError = 'New password must be at least 4 characters long';
      return;
    }

    if (newPassword === currentPassword) {
      passwordError = 'New password must be different from current password';
      return;
    }

    isSubmittingPassword = true;
    passwordError = null;
    passwordSuccess = null;

    try {
      const token = authStore.getAccessToken();
      const response = await fetch('http://localhost:3004/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          currentPassword,
          newPassword
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Password change failed');
      }

      // Success
      passwordSuccess = 'Password changed successfully';
      currentPassword = '';
      newPassword = '';
      confirmPassword = '';

      // Auto-hide success message after 5 seconds
      setTimeout(() => {
        passwordSuccess = null;
      }, 5000);

    } catch (err) {
      passwordError = err instanceof Error ? err.message : 'Password change failed';
    } finally {
      isSubmittingPassword = false;
    }
  }

  function clearPasswordMessages() {
    passwordError = null;
    passwordSuccess = null;
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

    <!-- Security Settings -->
    <SettingsCard
      title="Security"
      icon={Lock}
      iconClass="security"
    >
        <form on:submit={handlePasswordChange} class="password-form">
          {#if passwordError}
            <div class="error-message" in:fly={{ y: -10, duration: 200 }}>
              {passwordError}
            </div>
          {/if}

          {#if passwordSuccess}
            <div class="success-message" in:fly={{ y: -10, duration: 200 }}>
              {passwordSuccess}
            </div>
          {/if}

          <div class="setting-item password-setting">
            <div class="setting-info">
              <span class="setting-label">Change Password</span>
              <span class="setting-desc">Update your password to keep your account secure</span>
            </div>
          </div>

          <div class="password-fields">
            <div class="form-group">
              <label for="currentPassword">Current Password</label>
              <Input
                id="currentPassword"
                type="password"
                bind:value={currentPassword}
                placeholder="Enter your current password"
                required
                disabled={isSubmittingPassword}
                oninput={clearPasswordMessages}
              />
            </div>

            <div class="form-group">
              <label for="newPassword">New Password</label>
              <Input
                id="newPassword"
                type="password"
                bind:value={newPassword}
                placeholder="Enter your new password"
                required
                disabled={isSubmittingPassword}
                oninput={clearPasswordMessages}
              />
              <small class="field-hint">Minimum 4 characters</small>
            </div>

            <div class="form-group">
              <label for="confirmPassword">Confirm New Password</label>
              <Input
                id="confirmPassword"
                type="password"
                bind:value={confirmPassword}
                placeholder="Confirm your new password"
                required
                disabled={isSubmittingPassword}
                oninput={clearPasswordMessages}
              />
            </div>

            <button
              type="submit"
              class="password-submit-btn"
              disabled={isSubmittingPassword || !currentPassword || !newPassword || !confirmPassword}
            >
              {#if isSubmittingPassword}
                <div class="spinner"></div>
                Changing...
              {:else}
                Change Password
              {/if}
            </button>
          </div>
        </form>
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
  
  /* Password form styles */
  .password-form {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .password-setting {
    border-bottom: 1px solid var(--border-color);
    padding-bottom: 1rem;
    margin-bottom: 0.5rem;
  }

  .password-fields {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .form-group label {
    font-weight: 500;
    color: var(--text-primary);
    font-size: 0.875rem;
  }

  .field-hint {
    color: var(--text-tertiary);
    font-size: 0.75rem;
    margin-top: 0.25rem;
  }

  .error-message {
    background: var(--danger-bg);
    border: 1px solid var(--danger-border);
    color: var(--danger-text);
    padding: 0.75rem 1rem;
    border-radius: 8px;
    font-size: 0.875rem;
    font-weight: 500;
  }

  .success-message {
    background: var(--success-bg);
    border: 1px solid var(--success-border);
    color: var(--success-text);
    padding: 0.75rem 1rem;
    border-radius: 8px;
    font-size: 0.875rem;
    font-weight: 500;
  }

  .password-submit-btn {
    background: var(--primary);
    color: white;
    border: none;
    padding: 0.75rem 1.5rem;
    border-radius: 8px;
    font-weight: 500;
    font-size: 0.875rem;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    min-height: 44px;
    margin-top: 0.5rem;
  }

  .password-submit-btn:hover:not(:disabled) {
    background: var(--primary-dark);
    transform: translateY(-1px);
    box-shadow: var(--shadow-md);
  }

  .password-submit-btn:disabled {
    background: var(--border-color);
    color: var(--text-tertiary);
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }

  .spinner {
    width: 16px;
    height: 16px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-radius: 50%;
    border-top-color: white;
    animation: spin 1s ease-in-out infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
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

    .password-fields {
      gap: 1rem;
    }

    .password-submit-btn {
      width: 100%;
    }
  }
</style>
