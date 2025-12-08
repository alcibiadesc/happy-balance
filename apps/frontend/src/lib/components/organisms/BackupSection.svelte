<script lang="ts">
  import { ChevronDown, ChevronUp, Download, Trash2 } from 'lucide-svelte';
  import { onMount } from 'svelte';
  import { authStore } from '$lib/modules/auth/presentation/stores/authStore.svelte';
  import { getApiUrl } from '$lib/utils/api-url';

  const API_BASE = getApiUrl();

  // Props
  interface Props {
    expanded?: boolean;
  }

  let { expanded = $bindable(false) }: Props = $props();

  // Types
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
    enabled: boolean;
    frequency: string;
    hourUtc: number;
    retentionDays: number;
    maxBackups: number;
  }

  // State
  let backups = $state<BackupInfo[]>([]);
  let backupPolicy = $state<BackupPolicy | null>(null);
  let creatingBackup = $state(false);
  let savingPolicy = $state(false);
  let error = $state<string | null>(null);
  let success = $state<string | null>(null);

  // Policy form
  let policyEnabled = $state(true);
  let policyHour = $state(3);

  function getAuthHeaders(): Record<string, string> {
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
    error = null;
    success = null;

    try {
      const res = await fetch(`${API_BASE}/backups`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ description: 'Manual backup' }),
      });

      if (res.ok) {
        success = 'Backup created successfully';
        await loadBackups();
        setTimeout(() => (success = null), 3000);
      } else {
        const data = await res.json();
        error = data.error || 'Failed to create backup';
      }
    } catch {
      error = 'Failed to create backup';
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
      error = 'Failed to download backup';
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
        success = 'Backup deleted';
        setTimeout(() => (success = null), 3000);
      }
    } catch {
      error = 'Failed to delete backup';
    }
  }

  async function saveBackupPolicy() {
    savingPolicy = true;
    error = null;

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
        success = 'Policy saved';
        await loadBackupPolicy();
        setTimeout(() => (success = null), 3000);
      } else {
        const data = await res.json();
        error = data.error || 'Failed to save policy';
      }
    } catch {
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

  function formatBackupDate(dateStr: string): string {
    return new Date(dateStr).toLocaleString();
  }

  function toggleExpanded() {
    expanded = !expanded;
  }

  onMount(async () => {
    await Promise.all([loadBackups(), loadBackupPolicy()]);
  });
</script>

<button class="collapse-trigger" onclick={toggleExpanded}>
  <span>Automatic Backups</span>
  {#if expanded}<ChevronUp size={16} />{:else}<ChevronDown size={16} />{/if}
</button>

{#if expanded}
  <div class="expanded-content">
    {#if error}
      <div class="status-message error">{error}</div>
    {/if}
    {#if success}
      <div class="status-message success">{success}</div>
    {/if}

    <div class="settings-row">
      <div class="row-label">
        <span class="label-text">Enable automatic backups</span>
        <span class="label-hint">Daily at {policyHour.toString().padStart(2, '0')}:00 UTC</span>
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
              <button class="icon-btn" onclick={() => downloadBackup(backup.id)} title="Download">
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

<style>
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

  .expanded-content {
    padding-top: 0.5rem;
  }

  .settings-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.75rem 0;
    border-bottom: 1px solid var(--border-color);
  }

  .settings-row:last-child,
  .settings-row.last {
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

  .label-hint {
    display: block;
    font-size: 0.6875rem;
    font-weight: 400;
    color: var(--text-muted);
    margin-top: 0.125rem;
  }

  .muted-text {
    font-size: 0.75rem;
    color: var(--text-muted);
    font-style: italic;
  }

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

  .action-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
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

  @media (max-width: 640px) {
    .settings-row {
      flex-direction: column;
      align-items: flex-start;
      gap: 0.5rem;
    }
  }
</style>
