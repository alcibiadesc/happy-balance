<script lang="ts">
  import { X } from 'lucide-svelte';
  import { modalKeyboard } from '$lib/actions/modalKeyboard';
  import { t } from '$lib/stores/i18n';

  interface Props {
    isOpen: boolean;
    loading?: boolean;
    onSave: (user: {
      username: string;
      password: string;
      role: 'admin' | 'user' | 'viewer';
    }) => void;
    onCancel: () => void;
  }

  let { isOpen, loading = false, onSave, onCancel }: Props = $props();

  let username = $state('');
  let password = $state('');
  let role = $state<'admin' | 'user' | 'viewer'>('user');

  function handleSubmit(e: Event) {
    e.preventDefault();
    if (username.length >= 3 && password.length >= 4) {
      onSave({ username, password, role });
    }
  }

  function resetForm() {
    username = '';
    password = '';
    role = 'user';
  }

  function handleCancel() {
    resetForm();
    onCancel();
  }

  // Reset form when modal closes
  $effect(() => {
    if (!isOpen) {
      resetForm();
    }
  });
</script>

{#if isOpen}
  <div use:modalKeyboard={{ onConfirm: () => {}, onCancel: handleCancel, isOpen }}></div>
  <div
    class="modal-overlay"
    onclick={handleCancel}
    role="dialog"
    aria-modal="true"
    aria-labelledby="create-user-title"
    tabindex="-1"
  >
    <div class="modal-content" onclick={(e) => e.stopPropagation()} role="document">
      <div class="modal-header">
        <h2 id="create-user-title" class="modal-title">{$t('admin.users.create_user')}</h2>
        <button class="btn-close" onclick={handleCancel} aria-label="Close">
          <X size={18} />
        </button>
      </div>

      <form class="modal-body" onsubmit={handleSubmit}>
        <div class="form-group">
          <label for="username" class="form-label">
            {$t('admin.users.username')}
            <span class="required">*</span>
          </label>
          <input
            id="username"
            type="text"
            class="form-input"
            bind:value={username}
            placeholder={$t('admin.users.username_placeholder')}
            required
            minlength="3"
            maxlength="50"
            disabled={loading}
          />
          {#if username && username.length < 3}
            <p class="form-error">{$t('admin.users.username_min_error')}</p>
          {/if}
        </div>

        <div class="form-group">
          <label for="password" class="form-label">
            {$t('admin.users.password')}
            <span class="required">*</span>
          </label>
          <input
            id="password"
            type="password"
            class="form-input"
            bind:value={password}
            placeholder={$t('admin.users.password_placeholder')}
            required
            minlength="4"
            maxlength="100"
            disabled={loading}
          />
          {#if password && password.length < 4}
            <p class="form-error">{$t('admin.users.password_min_error')}</p>
          {/if}
        </div>

        <div class="form-group">
          <label for="role" class="form-label">{$t('admin.users.role')}</label>
          <select id="role" class="form-select" bind:value={role} disabled={loading}>
            <option value="user">{$t('admin.users.role_user')}</option>
            <option value="viewer">{$t('admin.users.role_viewer')}</option>
            <option value="admin">{$t('admin.users.role_admin')}</option>
          </select>
        </div>

        <div class="modal-footer">
          <button type="button" class="btn-cancel" onclick={handleCancel} disabled={loading}>
            {$t('common.cancel')}
          </button>
          <button
            type="submit"
            class="btn-save"
            disabled={loading || username.length < 3 || password.length < 4}
          >
            {#if loading}
              <span class="spinner"></span>
              {$t('common.saving')}
            {:else}
              {$t('admin.users.create_user')}
            {/if}
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}

<style>
  .modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(4px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
    padding: 1rem;
  }

  .modal-content {
    background: var(--surface-elevated);
    border: 1px solid var(--border-color);
    border-radius: 12px;
    width: 100%;
    max-width: 450px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.25rem 1.5rem;
    border-bottom: 1px solid var(--border-color);
  }

  .modal-title {
    margin: 0;
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--text-primary);
  }

  .btn-close {
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--surface-muted);
    border: 1px solid var(--border-color);
    border-radius: 8px;
    color: var(--text-muted);
    cursor: pointer;
    transition: all 0.15s;
  }

  .btn-close:hover {
    background: var(--surface-hover);
    color: var(--text-primary);
  }

  .modal-body {
    padding: 1.5rem;
  }

  .form-group {
    margin-bottom: 1.25rem;
  }

  .form-label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 500;
    font-size: 0.875rem;
    color: var(--text-primary);
  }

  .required {
    color: #ef4444;
    margin-left: 0.25rem;
  }

  .form-input,
  .form-select {
    width: 100%;
    padding: 0.75rem;
    border: 2px solid var(--border-color);
    border-radius: 8px;
    font-size: 0.875rem;
    background: var(--surface);
    color: var(--text-primary);
    transition: border-color 0.2s;
  }

  .form-input:focus,
  .form-select:focus {
    outline: none;
    border-color: var(--primary);
  }

  .form-input:disabled,
  .form-select:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .form-error {
    margin: 0.25rem 0 0 0;
    font-size: 0.75rem;
    color: #ef4444;
  }

  .modal-footer {
    display: flex;
    gap: 0.75rem;
    justify-content: flex-end;
    padding-top: 1rem;
    border-top: 1px solid var(--border-color);
    margin-top: 0.5rem;
  }

  .btn-cancel,
  .btn-save {
    padding: 0.75rem 1.5rem;
    border-radius: 8px;
    font-weight: 500;
    font-size: 0.875rem;
    cursor: pointer;
    transition: all 0.15s;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .btn-cancel {
    background: var(--surface-muted);
    border: 1px solid var(--border-color);
    color: var(--text-secondary);
  }

  .btn-cancel:hover:not(:disabled) {
    background: var(--surface-hover);
    color: var(--text-primary);
  }

  .btn-save {
    background: var(--primary);
    border: none;
    color: white;
  }

  .btn-save:hover:not(:disabled) {
    background: var(--primary-hover);
  }

  .btn-save:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .spinner {
    width: 16px;
    height: 16px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top-color: white;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
</style>
