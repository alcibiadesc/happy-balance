<script lang="ts">
  import { DollarSign, Palette, Globe, Lock, Info, RefreshCw, Menu } from 'lucide-svelte';
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
  import { sidebarConfig } from '$lib/stores/sidebarConfig';
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { fly } from 'svelte/transition';

  // API Configuration
  import { getApiUrl } from '$lib/utils/api-url';
  const API_BASE = getApiUrl();

  // Create settings store instance
  const store = createSettingsStore(API_BASE);

  const currencyOptions = Object.values(currencies).map((curr) => ({
    value: curr.code,
    label: `${curr.symbol} ${curr.name}`,
    symbol: curr.symbol,
  }));

  const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
  ];

  // Password change form state
  let currentPassword = $state('');
  let newPassword = $state('');
  let confirmPassword = $state('');
  let passwordError = $state<string | null>(null);
  let passwordSuccess = $state<string | null>(null);
  let isSubmittingPassword = $state(false);

  // Version and update state
  let versionInfo = $state<any>(null);
  let updateInfo = $state<any>(null);
  let checkingUpdates = $state(false);
  let updatingSystem = $state(false);
  let updateMessage = $state<string | null>(null);
  let updateError = $state<string | null>(null);

  // Load user preferences on mount
  onMount(async () => {
    await userPreferences.load();

    // Redirect if not authenticated
    if (!authStore.isAuthenticated) {
      goto('/login');
    }

    // Load version info
    await loadVersionInfo();
  });

  async function loadVersionInfo() {
    try {
      const response = await fetch(`${API_BASE}/version`);
      if (response.ok) {
        versionInfo = await response.json();
      }
    } catch (err) {
      console.error('Failed to load version info:', err);
    }
  }

  async function checkForUpdates() {
    checkingUpdates = true;
    updateError = null;
    updateMessage = null;

    try {
      const token = authStore.getAccessToken();
      const response = await fetch(`${API_BASE}/system/check-updates`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        updateInfo = await response.json();
        if (updateInfo.updateAvailable) {
          updateMessage = `New version available! Latest commit: ${updateInfo.latest.commit}`;
        } else {
          updateMessage = 'You are running the latest version';
        }
      }
    } catch (err) {
      updateError = 'Failed to check for updates';
    } finally {
      checkingUpdates = false;
    }
  }

  async function applyUpdate() {
    updatingSystem = true;
    updateError = null;
    updateMessage = null;

    try {
      const token = authStore.getAccessToken();
      const response = await fetch(`${API_BASE}/system/update`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const _result = await response.json();

      if (response.ok) {
        updateMessage = 'Update initiated! The application will restart shortly...';
        // Reload after a delay to give containers time to restart
        setTimeout(() => {
          window.location.reload();
        }, 15000);
      } else {
        updateError = _result.note || _result.error || 'Update failed';
      }
    } catch (err) {
      updateError = 'Failed to apply update. Try running manually: ./scripts/update-docker.sh';
    } finally {
      updatingSystem = false;
    }
  }

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
      const response = await fetch(`${API_BASE}/auth/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
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

  // Compute import message based on data format
  function getImportMessage(): string {
    const data = store.pendingImportData;
    if (!data) return '';

    // New complete format
    if (data.data) {
      const txCount = data.data.transactions?.length || 0;
      const catCount = data.data.categories?.length || 0;
      const invCount = data.data.investments?.length || 0;
      const hasSettings = !!data.frontendSettings;
      const exportDate = data.exportDate
        ? new Date(data.exportDate).toLocaleDateString()
        : 'Unknown date';

      let message = `Import ${txCount} transactions, ${catCount} categories, ${invCount} investments`;
      if (hasSettings) {
        message += ' and user settings';
      }
      message += ` from ${exportDate}?`;
      return message;
    }

    // Legacy format
    const txCount = data.transactions?.length || 0;
    const exportDate = data.settings?.exportDate
      ? new Date(data.settings.exportDate).toLocaleDateString()
      : 'Unknown date';
    return `Import ${txCount} transactions from ${exportDate}?`;
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

  <SettingsStatusMessage message={store.importError} type="error" />

  <div class="settings-grid">
    <!-- Appearance Settings -->
    <SettingsCard title={$t('settings.theme')} icon={Palette} iconClass="appearance">
      <div class="setting-item">
        <div class="setting-info">
          <span class="setting-label">{$t('settings.theme')}</span>
          <span class="setting-desc">
            {store.isDark ? $t('settings.themes.dark') : $t('settings.themes.light')}
          </span>
        </div>
        <SettingsThemeToggle isDark={store.isDark} onToggle={store.toggleTheme} />
      </div>
    </SettingsCard>

    <!-- Localization Settings -->
    <SettingsCard title="Localization" icon={Globe} iconClass="localization">
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
            {currencyOptions.find((c) => c.value === store.settings.currency)?.label || 'EUR'}
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
    <SettingsCard title="Security" icon={Lock} iconClass="security">
      <form onsubmit={handlePasswordChange} class="password-form">
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

    <!-- System Information & Updates -->
    <SettingsCard title="System Information" icon={Info} iconClass="system">
      <div class="version-info">
        {#if versionInfo}
          <div class="setting-item">
            <div class="setting-info">
              <span class="setting-label">Version</span>
              <span class="setting-desc">{versionInfo.version}</span>
            </div>
          </div>
          <div class="setting-item">
            <div class="setting-info">
              <span class="setting-label">Commit</span>
              <span class="setting-desc">{versionInfo.commit}</span>
            </div>
          </div>
          {#if versionInfo.buildTimestamp}
            <div class="setting-item">
              <div class="setting-info">
                <span class="setting-label">Build Date</span>
                <span class="setting-desc"
                  >{new Date(versionInfo.buildTimestamp).toLocaleString()}</span
                >
              </div>
            </div>
          {/if}
        {:else}
          <div class="setting-item">
            <div class="setting-info">
              <span class="setting-desc">Loading version information...</span>
            </div>
          </div>
        {/if}

        {#if updateMessage}
          <div class="success-message" in:fly={{ y: -10, duration: 200 }}>
            {updateMessage}
          </div>
        {/if}

        {#if updateError}
          <div class="error-message" in:fly={{ y: -10, duration: 200 }}>
            {updateError}
          </div>
        {/if}

        <div class="update-actions">
          <button
            class="update-btn"
            onclick={checkForUpdates}
            disabled={checkingUpdates || updatingSystem}
          >
            {#if checkingUpdates}
              <div class="spinner"></div>
              Checking...
            {:else}
              <RefreshCw size={16} />
              Check for Updates
            {/if}
          </button>

          {#if updateInfo?.updateAvailable}
            <button
              class="update-btn primary"
              onclick={applyUpdate}
              disabled={updatingSystem || checkingUpdates}
            >
              {#if updatingSystem}
                <div class="spinner"></div>
                Updating...
              {:else}
                <RefreshCw size={16} />
                Apply Update
              {/if}
            </button>
          {/if}
        </div>
      </div>
    </SettingsCard>

    <!-- Sidebar Settings -->
    <SettingsCard title={$t('settings.sidebar') || 'Sidebar'} icon={Menu} iconClass="sidebar">
      <div class="setting-item sidebar-header">
        <div class="setting-info">
          <span class="setting-label"
            >{$t('settings.sidebar_sections') || 'Navigation Sections'}</span
          >
          <span class="setting-desc"
            >{$t('settings.sidebar_sections_desc') ||
              'Choose which sections to show in the sidebar'}</span
          >
        </div>
      </div>

      <div class="sidebar-items">
        {#each $sidebarConfig.items as item (item.id)}
          <div class="sidebar-item">
            <label class="sidebar-item-label">
              <input
                type="checkbox"
                checked={item.visible}
                disabled={item.required}
                onchange={() => sidebarConfig.toggleItem(item.id)}
              />
              <span class="sidebar-item-name">{$t(item.labelKey)}</span>
              {#if item.required}
                <span class="required-badge">{$t('common.required') || 'Required'}</span>
              {/if}
            </label>
          </div>
        {/each}
      </div>
    </SettingsCard>

    <!-- Data Management -->
    <SettingsCard title={$t('settings.data')} icon={DollarSign} iconClass="data">
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
  message={getImportMessage() + ' This will merge with your existing data.'}
  confirmText="Import"
  cancelText="Cancel"
  type="info"
  onConfirm={store.confirmImport}
  onCancel={() => (store.showImportModal = false)}
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
  onCancel={() => (store.showResetModal = false)}
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
  onCancel={() => (store.showDeleteAllModal = false)}
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

  /* Version info and update styles */
  .version-info {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .update-actions {
    display: flex;
    gap: 0.75rem;
    margin-top: 0.5rem;
    flex-wrap: wrap;
  }

  .update-btn {
    background: var(--surface-alt);
    color: var(--text-primary);
    border: 1px solid var(--border-color);
    padding: 0.625rem 1.25rem;
    border-radius: 8px;
    font-weight: 500;
    font-size: 0.875rem;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    min-height: 40px;
    flex: 1;
    min-width: 140px;
  }

  .update-btn:hover:not(:disabled) {
    background: var(--surface-hover);
    transform: translateY(-1px);
    box-shadow: var(--shadow-sm);
  }

  .update-btn.primary {
    background: var(--primary);
    color: white;
    border-color: var(--primary);
  }

  .update-btn.primary:hover:not(:disabled) {
    background: var(--primary-dark);
    box-shadow: var(--shadow-md);
  }

  .update-btn:disabled {
    background: var(--border-color);
    color: var(--text-tertiary);
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }

  /* Sidebar settings styles */
  .sidebar-header {
    border-bottom: 1px solid var(--border-color);
    padding-bottom: 1rem;
    margin-bottom: 1rem;
  }

  .sidebar-items {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .sidebar-item {
    display: flex;
    align-items: center;
  }

  .sidebar-item-label {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    cursor: pointer;
    width: 100%;
    padding: 0.5rem;
    border-radius: 8px;
    transition: background 0.15s ease;
  }

  .sidebar-item-label:hover {
    background: var(--surface-muted);
  }

  .sidebar-item-label input[type='checkbox'] {
    width: 1.125rem;
    height: 1.125rem;
    accent-color: var(--primary);
    cursor: pointer;
  }

  .sidebar-item-label input[type='checkbox']:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .sidebar-item-name {
    flex: 1;
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--text-primary);
  }

  .required-badge {
    font-size: 0.6875rem;
    font-weight: 500;
    color: var(--text-muted);
    background: var(--surface-muted);
    padding: 0.125rem 0.5rem;
    border-radius: 4px;
    text-transform: uppercase;
    letter-spacing: 0.025em;
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
