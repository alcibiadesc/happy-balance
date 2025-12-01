<script lang="ts">
  import { Download, Upload, Trash2, Clock, Calendar, HardDrive } from 'lucide-svelte';
  import { onMount } from 'svelte';
  import { getApiUrl } from '$lib/utils/api-url';
  import { authStore } from '$lib/modules/auth/presentation/stores/authStore.svelte';
  import { fly } from 'svelte/transition';
  import { t } from '$lib/stores/i18n';

  const API_BASE = getApiUrl();

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

  interface BackupPolicy {
    id: string;
    enabled: boolean;
    frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY';
    hourUtc: number;
    dayOfWeek: number | null;
    dayOfMonth: number | null;
    retentionDays: number;
    maxBackups: number;
  }

  // State
  let backups = $state<BackupInfo[]>([]);
  let policy = $state<BackupPolicy | null>(null);
  let loading = $state(true);
  let creating = $state(false);
  let savingPolicy = $state(false);
  let error = $state<string | null>(null);
  let success = $state<string | null>(null);

  // Policy form state
  let policyEnabled = $state(true);
  let policyFrequency = $state<'DAILY' | 'WEEKLY' | 'MONTHLY'>('DAILY');
  let policyHour = $state(3);
  let policyRetentionDays = $state(30);
  let policyMaxBackups = $state(10);

  function getAuthHeaders() {
    const token = authStore.getAccessToken();
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };
  }

  async function loadBackups() {
    try {
      const res = await fetch(`${API_BASE}/backups`, {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        backups = data.data || [];
      }
    } catch (e) {
      console.error('Failed to load backups:', e);
    }
  }

  async function loadPolicy() {
    try {
      const res = await fetch(`${API_BASE}/backups/policy/current`, {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        policy = data.data;
        if (policy) {
          policyEnabled = policy.enabled;
          policyFrequency = policy.frequency;
          policyHour = policy.hourUtc;
          policyRetentionDays = policy.retentionDays;
          policyMaxBackups = policy.maxBackups;
        }
      }
    } catch (e) {
      console.error('Failed to load policy:', e);
    }
  }

  onMount(async () => {
    await Promise.all([loadBackups(), loadPolicy()]);
    loading = false;
  });

  async function createBackup() {
    creating = true;
    error = null;
    success = null;

    try {
      const res = await fetch(`${API_BASE}/backups`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ description: 'Manual backup' }),
      });

      if (res.ok) {
        success = $t('settings.backup_created') || 'Backup created successfully';
        await loadBackups();
        setTimeout(() => (success = null), 5000);
      } else {
        const data = await res.json();
        error = data.error || 'Failed to create backup';
      }
    } catch (e) {
      error = 'Failed to create backup';
    } finally {
      creating = false;
    }
  }

  async function downloadBackup(id: string) {
    try {
      const res = await fetch(`${API_BASE}/backups/${id}/download`, {
        headers: getAuthHeaders(),
      });

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
    } catch (e) {
      error = 'Failed to download backup';
    }
  }

  async function deleteBackup(id: string) {
    if (!confirm($t('settings.backup_delete_confirm') || 'Delete this backup?')) return;

    try {
      const res = await fetch(`${API_BASE}/backups/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });

      if (res.ok) {
        await loadBackups();
        success = $t('settings.backup_deleted') || 'Backup deleted';
        setTimeout(() => (success = null), 3000);
      }
    } catch (e) {
      error = 'Failed to delete backup';
    }
  }

  async function savePolicy() {
    savingPolicy = true;
    error = null;

    try {
      const res = await fetch(`${API_BASE}/backups/policy`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          enabled: policyEnabled,
          frequency: policyFrequency,
          hourUtc: policyHour,
          retentionDays: policyRetentionDays,
          maxBackups: policyMaxBackups,
        }),
      });

      if (res.ok) {
        success = $t('settings.backup_policy_saved') || 'Backup policy saved';
        await loadPolicy();
        setTimeout(() => (success = null), 3000);
      } else {
        const data = await res.json();
        error = data.error || 'Failed to save policy';
      }
    } catch (e) {
      error = 'Failed to save policy';
    } finally {
      savingPolicy = false;
    }
  }

  function formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleString();
  }
</script>

<div class="backup-settings">
  {#if error}
    <div class="error-message" in:fly={{ y: -10, duration: 200 }}>
      {error}
    </div>
  {/if}

  {#if success}
    <div class="success-message" in:fly={{ y: -10, duration: 200 }}>
      {success}
    </div>
  {/if}

  <!-- Automatic Backup Policy -->
  <div class="section">
    <div class="section-header">
      <Clock size={18} />
      <h3>{$t('settings.backup_automatic') || 'Automatic Backups'}</h3>
    </div>

    <div class="policy-form">
      <label class="toggle-row">
        <span>{$t('settings.backup_enabled') || 'Enable automatic backups'}</span>
        <input type="checkbox" class="toggle" bind:checked={policyEnabled} />
      </label>

      {#if policyEnabled}
        <div class="policy-options" in:fly={{ y: -10, duration: 200 }}>
          <div class="form-row">
            <label>
              <span>{$t('settings.backup_frequency') || 'Frequency'}</span>
              <select bind:value={policyFrequency}>
                <option value="DAILY">{$t('settings.backup_daily') || 'Daily'}</option>
                <option value="WEEKLY">{$t('settings.backup_weekly') || 'Weekly'}</option>
                <option value="MONTHLY">{$t('settings.backup_monthly') || 'Monthly'}</option>
              </select>
            </label>

            <label>
              <span>{$t('settings.backup_hour') || 'Hour (UTC)'}</span>
              <select bind:value={policyHour}>
                {#each Array(24) as _, i}
                  <option value={i}>{i.toString().padStart(2, '0')}:00</option>
                {/each}
              </select>
            </label>
          </div>

          <div class="form-row">
            <label>
              <span>{$t('settings.backup_retention') || 'Keep for (days)'}</span>
              <input type="number" min="1" max="365" bind:value={policyRetentionDays} />
            </label>

            <label>
              <span>{$t('settings.backup_max') || 'Max backups'}</span>
              <input type="number" min="1" max="100" bind:value={policyMaxBackups} />
            </label>
          </div>

          <button class="save-btn" onclick={savePolicy} disabled={savingPolicy}>
            {#if savingPolicy}
              <div class="spinner"></div>
            {/if}
            {$t('common.save') || 'Save'}
          </button>
        </div>
      {/if}
    </div>
  </div>

  <!-- Manual Backup -->
  <div class="section">
    <div class="section-header">
      <HardDrive size={18} />
      <h3>{$t('settings.backup_manual') || 'Manual Backup'}</h3>
    </div>

    <button class="create-btn" onclick={createBackup} disabled={creating}>
      {#if creating}
        <div class="spinner"></div>
        {$t('settings.backup_creating') || 'Creating...'}
      {:else}
        <Download size={16} />
        {$t('settings.backup_create_now') || 'Create Backup Now'}
      {/if}
    </button>
  </div>

  <!-- Backup List -->
  <div class="section">
    <div class="section-header">
      <Calendar size={18} />
      <h3>{$t('settings.backup_history') || 'Backup History'}</h3>
    </div>

    {#if loading}
      <div class="loading">{$t('common.loading') || 'Loading...'}</div>
    {:else if backups.length === 0}
      <div class="empty">{$t('settings.backup_none') || 'No backups yet'}</div>
    {:else}
      <div class="backup-list">
        {#each backups as backup (backup.id)}
          <div class="backup-item">
            <div class="backup-info">
              <div class="backup-date">{formatDate(backup.createdAt)}</div>
              <div class="backup-meta">
                <span class="backup-type">{backup.type}</span>
                <span class="backup-size">{formatBytes(backup.sizeBytes)}</span>
                {#if backup.metadata}
                  <span class="backup-counts">
                    {backup.metadata.totalTransactions} txs, {backup.metadata.totalCategories} cats,
                    {backup.metadata.totalInvestments}
                    inv
                  </span>
                {/if}
              </div>
            </div>
            <div class="backup-actions">
              <button
                class="action-btn download"
                onclick={() => downloadBackup(backup.id)}
                title={$t('common.download') || 'Download'}
              >
                <Upload size={16} />
              </button>
              <button
                class="action-btn delete"
                onclick={() => deleteBackup(backup.id)}
                title={$t('common.delete') || 'Delete'}
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </div>
</div>

<style>
  .backup-settings {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .section {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .section-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: var(--text-primary);
    font-weight: 500;
    font-size: 0.875rem;
  }

  .section-header h3 {
    margin: 0;
    font-size: 0.875rem;
  }

  .toggle-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.75rem;
    background: var(--surface-muted);
    border-radius: 8px;
    cursor: pointer;
  }

  .toggle-row span {
    font-size: 0.875rem;
    color: var(--text-primary);
  }

  .toggle {
    width: 2.5rem;
    height: 1.25rem;
    accent-color: var(--primary);
  }

  .policy-options {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    padding: 1rem;
    background: var(--surface-muted);
    border-radius: 8px;
  }

  .form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
  }

  .form-row label {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .form-row label span {
    font-size: 0.75rem;
    color: var(--text-muted);
    font-weight: 500;
  }

  .form-row select,
  .form-row input {
    padding: 0.5rem;
    border: 1px solid var(--border-color);
    border-radius: 6px;
    background: var(--surface);
    color: var(--text-primary);
    font-size: 0.875rem;
  }

  .save-btn,
  .create-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    border: none;
    border-radius: 8px;
    font-weight: 500;
    font-size: 0.875rem;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .save-btn {
    background: var(--primary);
    color: white;
  }

  .save-btn:hover:not(:disabled) {
    background: var(--primary-dark);
  }

  .create-btn {
    background: var(--acapulco);
    color: white;
  }

  .create-btn:hover:not(:disabled) {
    filter: brightness(1.1);
  }

  .save-btn:disabled,
  .create-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .backup-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .backup-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.75rem;
    background: var(--surface-muted);
    border-radius: 8px;
    gap: 1rem;
  }

  .backup-info {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    min-width: 0;
    flex: 1;
  }

  .backup-date {
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--text-primary);
  }

  .backup-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    font-size: 0.75rem;
    color: var(--text-muted);
  }

  .backup-type {
    padding: 0.125rem 0.375rem;
    background: var(--primary-alpha, rgba(99, 102, 241, 0.1));
    color: var(--primary);
    border-radius: 4px;
    font-weight: 500;
    text-transform: uppercase;
    font-size: 0.625rem;
  }

  .backup-actions {
    display: flex;
    gap: 0.5rem;
    flex-shrink: 0;
  }

  .action-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2rem;
    height: 2rem;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .action-btn.download {
    background: var(--acapulco-alpha-10, rgba(0, 166, 153, 0.1));
    color: var(--acapulco);
  }

  .action-btn.download:hover {
    background: var(--acapulco);
    color: white;
  }

  .action-btn.delete {
    background: rgba(244, 63, 94, 0.1);
    color: #f43f5e;
  }

  .action-btn.delete:hover {
    background: #f43f5e;
    color: white;
  }

  .loading,
  .empty {
    text-align: center;
    padding: 2rem;
    color: var(--text-muted);
    font-size: 0.875rem;
  }

  .error-message {
    background: var(--danger-bg);
    border: 1px solid var(--danger-border);
    color: var(--danger-text);
    padding: 0.75rem 1rem;
    border-radius: 8px;
    font-size: 0.875rem;
  }

  .success-message {
    background: var(--success-bg);
    border: 1px solid var(--success-border);
    color: var(--success-text);
    padding: 0.75rem 1rem;
    border-radius: 8px;
    font-size: 0.875rem;
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

  @media (max-width: 768px) {
    .form-row {
      grid-template-columns: 1fr;
    }

    .backup-item {
      flex-direction: column;
      align-items: stretch;
    }

    .backup-actions {
      justify-content: flex-end;
    }
  }
</style>
