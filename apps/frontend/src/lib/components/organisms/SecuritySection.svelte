<script lang="ts">
  import { Lock, ChevronDown, ChevronUp } from 'lucide-svelte';
  import { t } from '$lib/stores/i18n';
  import { authStore } from '$lib/modules/auth/presentation/stores/authStore.svelte';
  import { getApiUrl } from '$lib/utils/api-url';

  const API_BASE = getApiUrl();

  // Props
  interface Props {
    expanded?: boolean;
  }

  let { expanded = $bindable(false) }: Props = $props();

  // Password form state
  let currentPassword = $state('');
  let newPassword = $state('');
  let confirmPassword = $state('');
  let passwordError = $state<string | null>(null);
  let passwordSuccess = $state<string | null>(null);
  let isSubmitting = $state(false);

  async function handlePasswordChange(event: Event) {
    event.preventDefault();

    if (!currentPassword || !newPassword || !confirmPassword) {
      passwordError = $t('settings.all_fields_required') || 'All fields are required';
      return;
    }

    if (newPassword !== confirmPassword) {
      passwordError = $t('settings.passwords_no_match') || 'Passwords do not match';
      return;
    }

    if (newPassword.length < 4) {
      passwordError = $t('settings.password_min_length') || 'Minimum 4 characters';
      return;
    }

    isSubmitting = true;
    passwordError = null;

    try {
      const token = authStore.getAccessToken();
      const response = await fetch(`${API_BASE}/auth/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to change password');
      }

      passwordSuccess = $t('settings.password_changed') || 'Password changed';
      currentPassword = '';
      newPassword = '';
      confirmPassword = '';

      setTimeout(() => (passwordSuccess = null), 3000);
    } catch (err) {
      passwordError = err instanceof Error ? err.message : 'Failed';
    } finally {
      isSubmitting = false;
    }
  }

  function toggleExpanded() {
    expanded = !expanded;
  }
</script>

<section class="settings-section">
  <button class="section-title clickable" onclick={toggleExpanded}>
    <Lock size={18} />
    <span>{$t('settings.security') || 'Security'}</span>
    {#if expanded}<ChevronUp size={16} />{:else}<ChevronDown size={16} />{/if}
  </button>

  {#if expanded}
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
            <span class="label-text">{$t('settings.current_password') || 'Current password'}</span>
          </div>
          <input
            type="password"
            class="inline-input"
            bind:value={currentPassword}
            placeholder="••••••••"
            disabled={isSubmitting}
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
            disabled={isSubmitting}
          />
        </div>

        <div class="settings-row">
          <div class="row-label">
            <span class="label-text">{$t('settings.confirm_password') || 'Confirm password'}</span>
          </div>
          <input
            type="password"
            class="inline-input"
            bind:value={confirmPassword}
            placeholder="••••••••"
            disabled={isSubmitting}
          />
        </div>

        <div class="settings-row last">
          <div class="row-label"></div>
          <button
            type="submit"
            class="action-btn primary"
            disabled={isSubmitting || !currentPassword || !newPassword || !confirmPassword}
          >
            {isSubmitting
              ? $t('common.updating') || 'Updating...'
              : $t('settings.update_password') || 'Update Password'}
          </button>
        </div>
      </form>
    </div>
  {/if}
</section>

<style>
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
    margin: 0;
    padding: 0;
    background: none;
    border: none;
    width: 100%;
    text-align: left;
  }

  .section-title.clickable {
    cursor: pointer;
  }

  .section-title.clickable:hover {
    color: var(--primary);
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

  .password-form-inline {
    display: contents;
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

  @media (max-width: 640px) {
    .settings-section {
      padding: 1rem;
      border-radius: 8px;
    }

    .settings-row {
      flex-direction: column;
      align-items: flex-start;
      gap: 0.5rem;
    }

    .inline-input {
      width: 100%;
    }
  }

  @media (max-width: 480px) {
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
</style>
