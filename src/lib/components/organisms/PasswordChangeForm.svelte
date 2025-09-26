<script lang="ts">
  import { authStore } from '$lib/modules/auth/presentation/stores/authStore.svelte';
  import Input from '$lib/components/atoms/Input.svelte';
  import { fly } from 'svelte/transition';

  interface Props {
    userId: string;
    username: string;
  }

  let { userId, username }: Props = $props();

  let currentPassword = $state('');
  let newPassword = $state('');
  let confirmPassword = $state('');
  let error = $state<string | null>(null);
  let isSubmitting = $state(false);

  async function handleSubmit(event: Event) {
    event.preventDefault();

    if (!currentPassword || !newPassword || !confirmPassword) {
      error = 'All fields are required';
      return;
    }

    if (newPassword !== confirmPassword) {
      error = 'New passwords do not match';
      return;
    }

    if (newPassword.length < 4) {
      error = 'New password must be at least 4 characters long';
      return;
    }

    if (newPassword === currentPassword) {
      error = 'New password must be different from current password';
      return;
    }

    isSubmitting = true;
    error = null;

    try {
      await authStore.resetPasswordChange(userId, currentPassword, newPassword);
    } catch (err) {
      error = err instanceof Error ? err.message : 'Password change failed';
    } finally {
      isSubmitting = false;
    }
  }

  function clearError() {
    error = null;
  }
</script>

<div class="password-change-form" in:fly={{ y: 20, duration: 400 }}>
  <div class="form-header">
    <h2>Password Change Required</h2>
    <p>Hello <strong>{username}</strong>, you must change your temporary password to continue.</p>
  </div>

  <form on:submit={handleSubmit} class="form">
    {#if error}
      <div class="error-message" in:fly={{ y: -10, duration: 200 }}>
        {error}
      </div>
    {/if}

    <div class="form-group">
      <label for="currentPassword">Current Password (Temporary)</label>
      <Input
        id="currentPassword"
        type="password"
        bind:value={currentPassword}
        placeholder="Enter your temporary password"
        required
        disabled={isSubmitting}
        oninput={clearError}
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
        disabled={isSubmitting}
        oninput={clearError}
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
        disabled={isSubmitting}
        oninput={clearError}
      />
    </div>

    <button
      type="submit"
      class="submit-button"
      disabled={isSubmitting || !currentPassword || !newPassword || !confirmPassword}
    >
      {#if isSubmitting}
        <div class="spinner"></div>
        Changing Password...
      {:else}
        Change Password
      {/if}
    </button>
  </form>
</div>

<style>
  .password-change-form {
    width: 100%;
    max-width: 420px;
    margin: 0 auto;
  }

  .form-header {
    text-align: center;
    margin-bottom: 2rem;
  }

  .form-header h2 {
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--text-primary);
    margin-bottom: 0.5rem;
  }

  .form-header p {
    color: var(--text-secondary);
    font-size: 0.938rem;
    line-height: 1.5;
  }

  .form {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
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

  .submit-button {
    background: var(--primary);
    color: white;
    border: none;
    padding: 0.875rem 1.5rem;
    border-radius: 12px;
    font-weight: 600;
    font-size: 0.938rem;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    min-height: 48px;
  }

  .submit-button:hover:not(:disabled) {
    background: var(--primary-dark);
    transform: translateY(-1px);
    box-shadow: var(--shadow-lg);
  }

  .submit-button:disabled {
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

  @media (max-width: 640px) {
    .password-change-form {
      padding: 0 1rem;
    }

    .form-header h2 {
      font-size: 1.25rem;
    }
  }
</style>