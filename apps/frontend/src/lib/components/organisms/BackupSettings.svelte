<script lang="ts">
  import { Download, Trash2, Clock, Calendar, HardDrive } from 'lucide-svelte';
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

<div class="backup-settings" style="background: #f0f0f0; padding: 1rem; border: 2px solid blue;">
  <p style="color: black; font-size: 16px; margin-bottom: 1rem;">
    🔧 BackupSettings component loaded!
  </p>

  {#if error}
    <div class="message error" in:fly={{ y: -10, duration: 200 }}>
      {error}
    </div>
  {/if}

  {#if success}
    <div class="message success" in:fly={{ y: -10, duration: 200 }}>
      {success}
    </div>
  {/if}

  <!-- Automatic Backup Policy -->
  <div class="section">
    <div class="section-header">
      <Clock size={16} />
      <span>Automatic Backups</span>
    </div>

    <label class="toggle-row">
      <span>Enable automatic backups</span>
      <input type="checkbox" bind:checked={policyEnabled} />
    </label>

    {#if policyEnabled}
      <div class="policy-options" in:fly={{ y: -10, duration: 200 }}>
        <div class="form-grid">
          <label class="field">
            <span>Frequency</span>
            <select bind:value={policyFrequency}>
              <option value="DAILY">Daily</option>
              <option value="WEEKLY">Weekly</option>
              <option value="MONTHLY">Monthly</option>
            </select>
          </label>

          <label class="field">
            <span>Hour (UTC)</span>
            <select bind:value={policyHour}>
              {#each Array(24) as _, i}
                <option value={i}>{i.toString().padStart(2, '0')}:00</option>
              {/each}
            </select>
          </label>

          <label class="field">
            <span>Keep for (days)</span>
            <input type="number" min="1" max="365" bind:value={policyRetentionDays} />
          </label>

          <label class="field">
            <span>Max backups</span>
            <input type="number" min="1" max="100" bind:value={policyMaxBackups} />
          </label>
        </div>

        <button class="btn primary" onclick={savePolicy} disabled={savingPolicy}>
          {#if savingPolicy}
            <span class="spinner"></span>
          {/if}
          Save
        </button>
      </div>
    {/if}
  </div>

  <!-- Manual Backup -->
  <div class="section">
    <div class="section-header">
      <HardDrive size={16} />
      <span>Manual Backup</span>
    </div>

    <button class="btn accent" onclick={createBackup} disabled={creating}>
      {#if creating}
        <span class="spinner"></span>
        Creating...
      {:else}
        <Download size={16} />
        Create Backup Now
      {/if}
    </button>
  </div>

  <!-- Backup List -->
  <div class="section">
    <div class="section-header">
      <Calendar size={16} />
      <span>Backup History</span>
    </div>

    {#if loading}
      <p class="muted">Loading...</p>
    {:else if backups.length === 0}
      <p class="muted">No backups yet</p>
    {:else}
      <div class="backup-list">
        {#each backups as backup (backup.id)}
          <div class="backup-item">
            <div class="backup-info">
              <div class="backup-date">{formatDate(backup.createdAt)}</div>
              <div class="backup-meta">
                <span class="tag">{backup.type}</span>
                <span>{formatBytes(backup.sizeBytes)}</span>
                {#if backup.metadata}
                  <span>{backup.metadata.totalTransactions} txs</span>
                {/if}
              </div>
            </div>
            <div class="backup-actions">
              <button class="icon-btn" onclick={() => downloadBackup(backup.id)} title="Download">
                <Download size={16} />
              </button>
              <button
                class="icon-btn danger"
                onclick={() => deleteBackup(backup.id)}
                title="Delete"
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
    gap: 1.25rem;
  }

  .message {
    padding: 0.75rem 1rem;
    border-radius: 8px;
    font-size: 0.875rem;
  }

  .message.error {
    background: rgba(239, 68, 68, 0.1);
    color: #ef4444;
  }

  .message.success {
    background: rgba(16, 185, 129, 0.1);
    color: #10b981;
  }

  .section {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .section-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.8125rem;
    font-weight: 600;
    color: inherit;
  }

  .toggle-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.75rem;
    background: rgba(0, 0, 0, 0.03);
    border-radius: 8px;
    cursor: pointer;
    font-size: 0.875rem;
    color: inherit;
  }

  :global(html.dark) .toggle-row {
    background: rgba(255, 255, 255, 0.05);
  }

  .toggle-row input {
    width: 18px;
    height: 18px;
    accent-color: #7abaa5;
  }

  .policy-options {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    padding: 1rem;
    background: rgba(0, 0, 0, 0.03);
    border-radius: 8px;
  }

  :global(html.dark) .policy-options {
    background: rgba(255, 255, 255, 0.05);
  }

  .form-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.75rem;
  }

  .field {
    display: flex;
    flex-direction: column;
    gap: 0.375rem;
  }

  .field span {
    font-size: 0.75rem;
    opacity: 0.7;
    font-weight: 500;
  }

  .field select,
  .field input {
    padding: 0.5rem;
    border: 1px solid rgba(128, 128, 128, 0.3);
    border-radius: 6px;
    background: transparent;
    color: inherit;
    font-size: 0.8125rem;
  }

  .btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.625rem 1rem;
    border: none;
    border-radius: 6px;
    font-weight: 500;
    font-size: 0.8125rem;
    cursor: pointer;
    transition: opacity 0.15s;
  }

  .btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .btn.primary {
    background: #023c46;
    color: white;
  }

  :global(html.dark) .btn.primary {
    background: #7abaa5;
    color: #1c1917;
  }

  .btn.accent {
    background: #7abaa5;
    color: white;
  }

  .muted {
    font-size: 0.8125rem;
    opacity: 0.6;
    text-align: center;
    padding: 1rem;
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
    background: rgba(0, 0, 0, 0.03);
    border-radius: 8px;
    gap: 0.75rem;
  }

  :global(html.dark) .backup-item {
    background: rgba(255, 255, 255, 0.05);
  }

  .backup-info {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    min-width: 0;
    flex: 1;
  }

  .backup-date {
    font-size: 0.8125rem;
    font-weight: 500;
  }

  .backup-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    font-size: 0.75rem;
    opacity: 0.7;
  }

  .tag {
    padding: 0.125rem 0.375rem;
    background: rgba(122, 186, 165, 0.15);
    color: #7abaa5;
    border-radius: 4px;
    font-weight: 500;
    text-transform: uppercase;
    font-size: 0.625rem;
  }

  .backup-actions {
    display: flex;
    gap: 0.375rem;
    flex-shrink: 0;
  }

  .icon-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2rem;
    height: 2rem;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    background: rgba(122, 186, 165, 0.15);
    color: #7abaa5;
    transition: all 0.15s;
  }

  .icon-btn:hover {
    background: #7abaa5;
    color: white;
  }

  .icon-btn.danger {
    background: rgba(244, 63, 94, 0.1);
    color: #f43f5e;
  }

  .icon-btn.danger:hover {
    background: #f43f5e;
    color: white;
  }

  .spinner {
    width: 14px;
    height: 14px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-radius: 50%;
    border-top-color: white;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  @media (max-width: 480px) {
    .form-grid {
      grid-template-columns: 1fr;
    }
  }
</style>
