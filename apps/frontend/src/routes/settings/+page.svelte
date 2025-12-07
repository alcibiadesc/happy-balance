<script lang="ts">
  import {
    Sun,
    Moon,
    Globe,
    Lock,
    ChevronDown,
    ChevronUp,
    Database,
    Flame,
    Menu,
    Download,
    Upload,
    Trash2,
    RotateCcw,
    ExternalLink,
    GripVertical,
  } from 'lucide-svelte';
  import ConfirmModal from '$lib/components/organisms/ConfirmModal.svelte';
  import SettingsStatusMessage from '$lib/components/molecules/SettingsStatusMessage.svelte';
  import PageContainer from '$lib/components/atoms/PageContainer.svelte';
  import PageHeader from '$lib/components/molecules/PageHeader.svelte';
  import { createSettingsStore } from '$lib/modules/settings/presentation/stores/settingsStore.svelte.ts';
  import { authStore } from '$lib/modules/auth/presentation/stores/authStore.svelte';
  import { t } from '$lib/stores/i18n';
  import { currencies } from '$lib/stores/currency';
  import { userPreferences } from '$lib/stores/user-preferences';
  import { sidebarConfig } from '$lib/stores/sidebarConfig';
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { investmentsApi } from '$lib/modules/investments/infrastructure/api/investmentsApi';

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

  // Password form
  let currentPassword = $state('');
  let newPassword = $state('');
  let confirmPassword = $state('');
  let passwordError = $state<string | null>(null);
  let passwordSuccess = $state<string | null>(null);
  let isSubmittingPassword = $state(false);

  // Version
  let versionInfo = $state<any>(null);

  // Backup state
  interface BackupInfo {
    id: string;
    type: string;
    status: string;
    filename: string;
    sizeBytes: number;
    description: string | null;
    metadata: {
      totalTransactions: number;
      totalCategories: number;
      totalInvestments: number;
    } | null;
    createdAt: string;
    expiresAt: string | null;
  }

  let backups = $state<BackupInfo[]>([]);
  let backupPolicy = $state<{
    enabled: boolean;
    frequency: string;
    hourUtc: number;
    retentionDays: number;
    maxBackups: number;
  } | null>(null);
  let creatingBackup = $state(false);
  let savingPolicy = $state(false);
  let backupError = $state<string | null>(null);
  let backupSuccess = $state<string | null>(null);

  // Policy form
  let policyEnabled = $state(true);
  let policyHour = $state(3);

  // Sidebar drag state
  let sidebarDraggedId = $state<string | null>(null);
  let sidebarDragOverId = $state<string | null>(null);

  // GoFire
  let gofireFile = $state<File | null>(null);
  let gofireLoading = $state(false);
  let gofireError = $state('');
  let gofireSuccess = $state(false);
  let gofireImportResult = $state<{ imported: number; historyCount: number } | null>(null);

  function getAuthHeaders() {
    const token = authStore.getAccessToken();
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };
  }

  async function loadBackups() {
    try {
      const res = await fetch(`${API_BASE}/backups`, { headers: getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        backups = data.data || [];
      }
    } catch (e) {
      console.error('Failed to load backups:', e);
    }
  }

  async function loadBackupPolicy() {
    try {
      const res = await fetch(`${API_BASE}/backups/policy/current`, { headers: getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        backupPolicy = data.data;
        if (backupPolicy) {
          policyEnabled = backupPolicy.enabled;
          policyHour = backupPolicy.hourUtc;
        }
      }
    } catch (e) {
      console.error('Failed to load policy:', e);
    }
  }

  async function createBackup() {
    creatingBackup = true;
    backupError = null;
    backupSuccess = null;

    try {
      const res = await fetch(`${API_BASE}/backups`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ description: 'Manual backup' }),
      });

      if (res.ok) {
        backupSuccess = 'Backup created successfully';
        await loadBackups();
        setTimeout(() => (backupSuccess = null), 3000);
      } else {
        const data = await res.json();
        backupError = data.error || 'Failed to create backup';
      }
    } catch {
      backupError = 'Failed to create backup';
    } finally {
      creatingBackup = false;
    }
  }

  async function downloadBackup(id: string) {
    try {
      const res = await fetch(`${API_BASE}/backups/${id}/download`, { headers: getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `backup-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch {
      backupError = 'Failed to download backup';
    }
  }

  async function deleteBackup(id: string) {
    if (!confirm('Delete this backup?')) return;
    try {
      const res = await fetch(`${API_BASE}/backups/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        await loadBackups();
        backupSuccess = 'Backup deleted';
        setTimeout(() => (backupSuccess = null), 3000);
      }
    } catch {
      backupError = 'Failed to delete backup';
    }
  }

  async function saveBackupPolicy() {
    savingPolicy = true;
    backupError = null;

    try {
      const res = await fetch(`${API_BASE}/backups/policy`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          enabled: policyEnabled,
          frequency: 'DAILY',
          hourUtc: policyHour,
          retentionDays: 30,
          maxBackups: 10,
        }),
      });

      if (res.ok) {
        backupSuccess = 'Policy saved';
        await loadBackupPolicy();
        setTimeout(() => (backupSuccess = null), 3000);
      } else {
        const data = await res.json();
        backupError = data.error || 'Failed to save policy';
      }
    } catch {
      backupError = 'Failed to save policy';
    } finally {
      savingPolicy = false;
    }
  }

  function formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  function formatBackupDate(dateStr: string): string {
    return new Date(dateStr).toLocaleString();
  }

  // Sidebar drag handlers
  function handleSidebarDragStart(e: DragEvent, id: string) {
    sidebarDraggedId = id;
    e.dataTransfer!.effectAllowed = 'move';
    e.dataTransfer!.setData('sidebar-item', id);
  }

  function handleSidebarDragEnd() {
    sidebarDraggedId = null;
    sidebarDragOverId = null;
  }

  function handleSidebarDragOver(e: DragEvent, id: string) {
    e.preventDefault();
    if (sidebarDraggedId && sidebarDraggedId !== id) {
      sidebarDragOverId = id;
    }
  }

  function handleSidebarDragLeave() {
    sidebarDragOverId = null;
  }

  function handleSidebarDrop(e: DragEvent, toId: string) {
    e.preventDefault();
    const fromId = e.dataTransfer!.getData('sidebar-item');
    if (fromId && fromId !== toId) {
      sidebarConfig.reorderItems(fromId, toId);
    }
    sidebarDraggedId = null;
    sidebarDragOverId = null;
  }

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

    // Load backups
    await Promise.all([loadBackups(), loadBackupPolicy()]);
  });

  async function handlePasswordChange(event: Event) {
    event.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      passwordError = 'All fields are required';
      return;
    }
    if (newPassword !== confirmPassword) {
      passwordError = 'Passwords do not match';
      return;
    }
    if (newPassword.length < 4) {
      passwordError = 'Minimum 4 characters';
      return;
    }

    isSubmittingPassword = true;
    passwordError = null;

    try {
      const token = authStore.getAccessToken();
      const response = await fetch(`${API_BASE}/auth/change-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      if (!response.ok) throw new Error((await response.json()).error || 'Failed');
      passwordSuccess = 'Password changed';
      currentPassword = '';
      newPassword = '';
      confirmPassword = '';
      setTimeout(() => (passwordSuccess = null), 3000);
    } catch (err) {
      passwordError = err instanceof Error ? err.message : 'Failed';
    } finally {
      isSubmittingPassword = false;
    }
  }

  async function handleGofireFileSelect(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.json')) {
      gofireError = 'Must be a JSON file';
      return;
    }
    gofireFile = file;
    gofireError = '';
  }

  async function importGofire() {
    if (!gofireFile) return;
    gofireLoading = true;
    gofireError = '';
    try {
      const data = JSON.parse(await gofireFile.text());
      if (!data.data || !Array.isArray(data.data)) throw new Error('Invalid format');
      gofireImportResult = await investmentsApi.importFromGofire({ data: data.data });
      gofireSuccess = true;
    } catch (err) {
      gofireError = err instanceof Error ? err.message : 'Import failed';
    } finally {
      gofireLoading = false;
    }
  }

  function resetGofire() {
    gofireFile = null;
    gofireError = '';
    gofireSuccess = false;
    gofireImportResult = null;
  }

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
    <!-- ROW 1: Preferences + Data -->
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
      <div class="gofire-section">
        <div class="gofire-header">
          <Flame size={16} class="gofire-icon" />
          <span>Import from</span>
          <a href="https://www.alci.dev/es/tools/gofire" target="_blank" rel="noopener">
            GoFire <ExternalLink size={12} />
          </a>
        </div>

        {#if gofireError}
          <div class="inline-error">{gofireError}</div>
        {/if}

        {#if gofireSuccess && gofireImportResult}
          <div class="gofire-result">
            <span class="result-text">
              ✓ {gofireImportResult.imported} investments, {gofireImportResult.historyCount} entries
            </span>
            <button class="text-btn" onclick={resetGofire}>Import another</button>
          </div>
        {:else}
          <div class="gofire-upload">
            <input
              type="file"
              id="gofire-input"
              accept=".json"
              class="hidden-input"
              onchange={handleGofireFileSelect}
              disabled={gofireLoading}
            />
            <label
              for="gofire-input"
              class="upload-zone"
              class:selected={gofireFile}
              class:loading={gofireLoading}
            >
              {#if gofireLoading}
                <span class="spinner-small"></span> Importing...
              {:else if gofireFile}
                ✓ {gofireFile.name}
              {:else}
                Select JSON file
              {/if}
            </label>
            {#if gofireFile && !gofireLoading}
              <button class="import-btn" onclick={importGofire}>Import</button>
            {/if}
          </div>
        {/if}
      </div>

      <!-- Backups (collapsible) -->
      <button class="collapse-trigger" onclick={() => (backupExpanded = !backupExpanded)}>
        <span>Automatic Backups</span>
        {#if backupExpanded}<ChevronUp size={16} />{:else}<ChevronDown size={16} />{/if}
      </button>
      {#if backupExpanded}
        <div class="expanded-content">
          {#if backupError}
            <div class="status-message error">{backupError}</div>
          {/if}
          {#if backupSuccess}
            <div class="status-message success">{backupSuccess}</div>
          {/if}

          <div class="settings-row">
            <div class="row-label">
              <span class="label-text">Enable automatic backups</span>
              <span class="label-hint"
                >Daily at {policyHour.toString().padStart(2, '0')}:00 UTC</span
              >
            </div>
            <div class="row-controls">
              <label class="toggle-switch">
                <input
                  type="checkbox"
                  bind:checked={policyEnabled}
                  onchange={saveBackupPolicy}
                  disabled={savingPolicy}
                />
                <span class="toggle-slider"></span>
              </label>
            </div>
          </div>

          <div class="settings-row">
            <div class="row-label">
              <span class="label-text">Create backup</span>
              <span class="label-hint">Download a snapshot now</span>
            </div>
            <button class="action-btn" onclick={createBackup} disabled={creatingBackup}>
              {#if creatingBackup}
                <span class="spinner-small"></span>
              {:else}
                <Download size={16} />
              {/if}
              {creatingBackup ? 'Creating...' : 'Backup'}
            </button>
          </div>

          <div class="settings-row last">
            <div class="row-label">
              <span class="label-text">Backup history</span>
            </div>
            {#if backups.length === 0}
              <span class="muted-text">No backups yet</span>
            {/if}
          </div>

          {#if backups.length > 0}
            <div class="backup-list">
              {#each backups as backup (backup.id)}
                <div class="backup-item">
                  <div class="backup-info">
                    <span class="backup-date">{formatBackupDate(backup.createdAt)}</span>
                    <span class="backup-meta">
                      <span class="backup-type">{backup.type}</span>
                      <span>{formatBytes(backup.sizeBytes)}</span>
                    </span>
                  </div>
                  <div class="backup-actions">
                    <button
                      class="icon-btn"
                      onclick={() => downloadBackup(backup.id)}
                      title="Download"
                    >
                      <Download size={14} />
                    </button>
                    <button
                      class="icon-btn danger"
                      onclick={() => deleteBackup(backup.id)}
                      title="Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              {/each}
            </div>
          {/if}
        </div>
      {/if}
    </section>

    <!-- ROW 2: Security + Sidebar -->
    <!-- SECTION: Security (collapsible) -->
    <section class="settings-section">
      <button
        class="section-title clickable"
        onclick={() => (securityExpanded = !securityExpanded)}
      >
        <Lock size={18} />
        <span>{$t('settings.security') || 'Security'}</span>
        {#if securityExpanded}<ChevronUp size={16} />{:else}<ChevronDown size={16} />{/if}
      </button>

      {#if securityExpanded}
        <div class="expanded-content">
          {#if passwordError}
            <div class="status-message error">{passwordError}</div>
          {/if}
          {#if passwordSuccess}
            <div class="status-message success">{passwordSuccess}</div>
          {/if}

          <form onsubmit={handlePasswordChange} class="password-form-inline">
            <div class="settings-row">
              <div class="row-label">
                <span class="label-text"
                  >{$t('settings.current_password') || 'Current password'}</span
                >
              </div>
              <input
                type="password"
                class="inline-input"
                bind:value={currentPassword}
                placeholder="••••••••"
                disabled={isSubmittingPassword}
              />
            </div>

            <div class="settings-row">
              <div class="row-label">
                <span class="label-text">{$t('settings.new_password') || 'New password'}</span>
              </div>
              <input
                type="password"
                class="inline-input"
                bind:value={newPassword}
                placeholder="••••••••"
                disabled={isSubmittingPassword}
              />
            </div>

            <div class="settings-row">
              <div class="row-label">
                <span class="label-text"
                  >{$t('settings.confirm_password') || 'Confirm password'}</span
                >
              </div>
              <input
                type="password"
                class="inline-input"
                bind:value={confirmPassword}
                placeholder="••••••••"
                disabled={isSubmittingPassword}
              />
            </div>

            <div class="settings-row last">
              <div class="row-label"></div>
              <button
                type="submit"
                class="action-btn primary"
                disabled={isSubmittingPassword ||
                  !currentPassword ||
                  !newPassword ||
                  !confirmPassword}
              >
                {isSubmittingPassword
                  ? $t('common.updating') || 'Updating...'
                  : $t('settings.update_password') || 'Update Password'}
              </button>
            </div>
          </form>
        </div>
      {/if}
    </section>

    <!-- SECTION: Sidebar (collapsible) -->
    <section class="settings-section">
      <button class="section-title clickable" onclick={() => (sidebarExpanded = !sidebarExpanded)}>
        <Menu size={18} />
        <span>{$t('settings.sidebar') || 'Sidebar'}</span>
        {#if sidebarExpanded}<ChevronUp size={16} />{:else}<ChevronDown size={16} />{/if}
      </button>

      {#if sidebarExpanded}
        <div class="sidebar-config">
          <!-- Main Navigation -->
          <p class="sidebar-group-label">Main Navigation</p>
          <div class="sidebar-list">
            {#each sidebarConfig.getTopItems($sidebarConfig) as item (item.id)}
              <div
                class="sidebar-item"
                class:disabled={!item.visible && !item.required}
                class:dragging={sidebarDraggedId === item.id}
                class:drag-over={sidebarDragOverId === item.id}
                draggable="true"
                ondragstart={(e) => handleSidebarDragStart(e, item.id)}
                ondragend={handleSidebarDragEnd}
                ondragover={(e) => handleSidebarDragOver(e, item.id)}
                ondragleave={handleSidebarDragLeave}
                ondrop={(e) => handleSidebarDrop(e, item.id)}
                role="listitem"
              >
                <div class="sidebar-item-left">
                  <span class="drag-handle">
                    <GripVertical size={16} />
                  </span>
                  <span class="item-name">{$t(item.labelKey)}</span>
                  {#if item.required}
                    <span class="item-badge required">Required</span>
                  {:else if !item.visible}
                    <span class="item-badge hidden">Hidden</span>
                  {/if}
                </div>

                <label class="toggle-switch">
                  <input
                    type="checkbox"
                    checked={item.visible}
                    disabled={item.required}
                    onchange={() => sidebarConfig.toggleItem(item.id)}
                  />
                  <span class="toggle-slider"></span>
                </label>
              </div>
            {/each}
          </div>

          <!-- Footer Items -->
          <p class="sidebar-group-label">Footer</p>
          <div class="sidebar-list">
            {#each sidebarConfig.getBottomItems($sidebarConfig) as item (item.id)}
              <div
                class="sidebar-item"
                class:disabled={!item.visible && !item.required}
                class:dragging={sidebarDraggedId === item.id}
                class:drag-over={sidebarDragOverId === item.id}
                draggable="true"
                ondragstart={(e) => handleSidebarDragStart(e, item.id)}
                ondragend={handleSidebarDragEnd}
                ondragover={(e) => handleSidebarDragOver(e, item.id)}
                ondragleave={handleSidebarDragLeave}
                ondrop={(e) => handleSidebarDrop(e, item.id)}
                role="listitem"
              >
                <div class="sidebar-item-left">
                  <span class="drag-handle">
                    <GripVertical size={16} />
                  </span>
                  <span class="item-name">{$t(item.labelKey)}</span>
                  {#if item.required}
                    <span class="item-badge required">Required</span>
                  {:else if !item.visible}
                    <span class="item-badge hidden">Hidden</span>
                  {/if}
                </div>

                <label class="toggle-switch">
                  <input
                    type="checkbox"
                    checked={item.visible}
                    disabled={item.required}
                    onchange={() => sidebarConfig.toggleItem(item.id)}
                  />
                  <span class="toggle-slider"></span>
                </label>
              </div>
            {/each}
          </div>
        </div>
      {/if}
    </section>

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

  /* Sections */
  .settings-section {
    background: var(--surface-elevated);
    border: 1px solid var(--border-color);
    border-radius: 12px;
    padding: 1.5rem;
  }

  @media (max-width: 768px) {
    .settings-content {
      grid-template-columns: 1fr;
    }
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
    padding: 0;
    background: none;
    border: none;
    width: 100%;
    text-align: left;
  }

  .section-title.clickable {
    cursor: pointer;
    margin-bottom: 0;
  }

  .section-title.clickable:hover {
    color: var(--primary);
  }

  .section-desc {
    font-size: 0.75rem;
    color: var(--text-muted);
    margin: 0.75rem 0;
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

  /* GoFire */
  .gofire-section {
    padding: 1rem;
    background: var(--surface-muted);
    border-radius: 8px;
    margin-bottom: 1rem;
  }

  .gofire-header {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    font-size: 0.8125rem;
    color: var(--text-secondary);
    margin-bottom: 0.75rem;
  }

  .gofire-header :global(.gofire-icon) {
    color: #f59e0b;
  }

  .gofire-header a {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    color: var(--primary);
    text-decoration: none;
    font-weight: 500;
  }

  .gofire-header a:hover {
    text-decoration: underline;
  }

  .gofire-upload {
    display: flex;
    gap: 0.5rem;
  }

  .upload-zone {
    flex: 1;
    padding: 0.625rem 1rem;
    border: 1px dashed var(--border-color);
    border-radius: 6px;
    font-size: 0.8125rem;
    color: var(--text-muted);
    text-align: center;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .upload-zone:hover {
    border-color: var(--primary);
    color: var(--text-primary);
  }

  .upload-zone.selected {
    border-style: solid;
    border-color: var(--primary);
    color: var(--primary);
    background: var(--primary-bg, rgba(122, 186, 165, 0.08));
  }

  .import-btn {
    padding: 0.625rem 1rem;
    background: var(--primary);
    color: white;
    border: none;
    border-radius: 6px;
    font-size: 0.8125rem;
    font-weight: 500;
    cursor: pointer;
  }

  .import-btn:hover {
    background: var(--primary-dark);
  }

  .gofire-result {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 0.8125rem;
  }

  .result-text {
    color: var(--success-text, #10b981);
  }

  .text-btn {
    background: none;
    border: none;
    color: var(--primary);
    font-size: 0.75rem;
    cursor: pointer;
    text-decoration: underline;
  }

  /* Collapsible */
  .collapse-trigger {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    padding: 0.75rem 0;
    background: none;
    border: none;
    border-top: 1px solid var(--border-color);
    font-size: 0.8125rem;
    font-weight: 500;
    color: var(--text-secondary);
    cursor: pointer;
    margin-top: 0.5rem;
  }

  .collapse-trigger:hover {
    color: var(--text-primary);
  }

  .collapse-content {
    padding-top: 0.75rem;
  }

  /* Expanded content for collapsible sections */
  .expanded-content {
    padding-top: 0.5rem;
  }

  .expanded-content .settings-row:first-child {
    border-top: none;
  }

  /* Label hint (subtitle) */
  .label-hint {
    display: block;
    font-size: 0.6875rem;
    font-weight: 400;
    color: var(--text-muted);
    margin-top: 0.125rem;
  }

  /* Label badge */
  .label-badge {
    display: inline-block;
    font-size: 0.5625rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.03em;
    padding: 0.125rem 0.375rem;
    background: var(--surface-muted);
    color: var(--text-muted);
    border-radius: 3px;
    margin-top: 0.25rem;
  }

  /* Muted text */
  .muted-text {
    font-size: 0.75rem;
    color: var(--text-muted);
    font-style: italic;
  }

  /* Sidebar Config */
  .sidebar-config {
    padding-top: 0.5rem;
  }

  .sidebar-group-label {
    font-size: 0.6875rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: var(--text-muted);
    margin: 0 0 0.5rem 0;
  }

  .sidebar-group-label:not(:first-child) {
    margin-top: 1rem;
  }

  .sidebar-list {
    display: flex;
    flex-direction: column;
    gap: 0.375rem;
  }

  .sidebar-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.625rem 0.75rem;
    background: var(--surface-muted);
    border: 1px solid var(--border-color);
    border-radius: 8px;
    transition: all 0.15s ease;
    cursor: grab;
  }

  .sidebar-item:hover {
    border-color: var(--primary-alpha, rgba(122, 186, 165, 0.4));
  }

  .sidebar-item:active {
    cursor: grabbing;
  }

  .sidebar-item.disabled {
    opacity: 0.5;
  }

  .sidebar-item.dragging {
    opacity: 0.4;
    transform: scale(0.98);
  }

  .sidebar-item.drag-over {
    border-color: var(--primary);
    background: var(--primary-alpha, rgba(122, 186, 165, 0.08));
  }

  .sidebar-item-left {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .drag-handle {
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--text-muted);
    cursor: grab;
  }

  .drag-handle:active {
    cursor: grabbing;
  }

  .item-name {
    font-size: 0.8125rem;
    font-weight: 500;
    color: var(--text-primary);
  }

  .item-badge {
    display: inline-block;
    font-size: 0.5625rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.03em;
    padding: 0.125rem 0.375rem;
    border-radius: 3px;
    margin-left: 0.375rem;
  }

  .item-badge.required {
    background: var(--primary-alpha, rgba(122, 186, 165, 0.15));
    color: var(--primary);
  }

  .item-badge.hidden {
    background: var(--surface);
    color: var(--text-muted);
  }

  /* Backup List */
  .backup-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin-top: 0.5rem;
  }

  .backup-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.625rem 0.75rem;
    background: var(--surface-muted);
    border: 1px solid var(--border-color);
    border-radius: 6px;
  }

  .backup-info {
    display: flex;
    flex-direction: column;
    gap: 0.125rem;
  }

  .backup-date {
    font-size: 0.8125rem;
    font-weight: 500;
    color: var(--text-primary);
  }

  .backup-meta {
    display: flex;
    gap: 0.5rem;
    font-size: 0.6875rem;
    color: var(--text-muted);
  }

  .backup-type {
    text-transform: uppercase;
    font-weight: 600;
    color: var(--primary);
  }

  .backup-actions {
    display: flex;
    gap: 0.375rem;
  }

  .icon-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    background: var(--surface);
    border: 1px solid var(--border-color);
    border-radius: 6px;
    cursor: pointer;
    color: var(--text-muted);
    transition: all 0.15s;
  }

  .icon-btn:hover {
    background: var(--primary);
    border-color: var(--primary);
    color: white;
  }

  .icon-btn.danger:hover {
    background: var(--danger);
    border-color: var(--danger);
  }

  /* Toggle Switch */
  .toggle-switch {
    position: relative;
    display: inline-block;
    width: 36px;
    height: 20px;
    flex-shrink: 0;
  }

  .toggle-switch input {
    opacity: 0;
    width: 0;
    height: 0;
  }

  .toggle-slider {
    position: absolute;
    cursor: pointer;
    inset: 0;
    background: var(--border-color);
    border-radius: 20px;
    transition: 0.2s;
  }

  .toggle-slider::before {
    content: '';
    position: absolute;
    height: 14px;
    width: 14px;
    left: 3px;
    bottom: 3px;
    background: white;
    border-radius: 50%;
    transition: 0.2s;
  }

  .toggle-switch input:checked + .toggle-slider {
    background: var(--acapulco);
  }

  .toggle-switch input:checked + .toggle-slider::before {
    transform: translateX(16px);
  }

  .toggle-switch input:disabled + .toggle-slider {
    opacity: 0.5;
    cursor: not-allowed;
  }

  /* Inline input for password form */
  .inline-input {
    padding: 0.5rem 0.75rem;
    border: 1px solid var(--border-color);
    border-radius: 6px;
    background: var(--surface-muted);
    color: var(--text-primary);
    font-size: 0.8125rem;
    min-width: 160px;
    transition: border-color 0.15s;
  }

  .inline-input:focus {
    outline: none;
    border-color: var(--primary);
    background: var(--surface);
  }

  .inline-input:disabled {
    opacity: 0.6;
  }

  .inline-input::placeholder {
    color: var(--text-muted);
  }

  /* Password form inline */
  .password-form-inline {
    display: contents;
  }

  /* Status message */
  .status-message {
    padding: 0.625rem 0.875rem;
    border-radius: 6px;
    font-size: 0.75rem;
    font-weight: 500;
    margin-bottom: 0.5rem;
  }

  .status-message.error {
    background: var(--error-bg);
    color: var(--error);
  }

  .status-message.success {
    background: var(--success-light);
    color: var(--success);
  }

  /* Action button primary variant */
  .action-btn.primary {
    background: var(--primary);
    color: var(--primary-foreground);
    border-color: var(--primary);
  }

  .action-btn.primary:hover:not(:disabled) {
    background: var(--primary-hover);
    border-color: var(--primary-hover);
  }

  .action-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
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

  /* Spinner */
  .spinner-small {
    display: inline-block;
    width: 12px;
    height: 12px;
    border: 2px solid var(--border-color);
    border-top-color: var(--primary);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
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
    .settings-page {
      padding: 1rem;
    }

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
    .theme-toggle,
    .inline-input {
      width: 100%;
    }
  }

  @media (max-width: 480px) {
    .settings-page {
      padding: 0.75rem;
    }

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

    .gofire-section {
      padding: 0.75rem;
    }

    .gofire-upload {
      flex-direction: column;
    }

    .upload-zone {
      width: 100%;
    }
  }

  @media (max-width: 360px) {
    .settings-page {
      padding: 0.5rem;
    }

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
