<script lang="ts">
  import { authStore } from '$lib/modules/auth/presentation/stores/authStore.svelte';
  import { fade } from 'svelte/transition';

  let username = $state('');
  let password = $state('');
  let error = $state('');
  let isLoading = $state(false);
  let focusedField = $state<'username' | 'password' | null>(null);

  async function handleSubmit(event: Event) {
    event.preventDefault();
    error = '';
    isLoading = true;

    try {
      await authStore.login(username, password);
      // Redirect will be handled by the page/layout
    } catch (err) {
      error = err instanceof Error ? err.message : 'Login failed. Please try again.';
    } finally {
      isLoading = false;
    }
  }

  function handleUsernameInput(event: Event) {
    const target = event.target as HTMLInputElement;
    username = target.value;
    error = ''; // Clear error on input
  }

  function handlePasswordInput(event: Event) {
    const target = event.target as HTMLInputElement;
    password = target.value;
    error = ''; // Clear error on input
  }
</script>

<form onsubmit={handleSubmit} class="login-form">
  {#if error}
    <div class="error-message" in:fade={{ duration: 200 }}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="8" x2="12" y2="12"/>
        <line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
      <span>{error}</span>
    </div>
  {/if}

  <div class="form-field">
    <label for="username" class="form-label">Username</label>
    <div class="input-wrapper" class:focused={focusedField === 'username'}>
      <svg class="input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
        <circle cx="12" cy="7" r="4"/>
      </svg>
      <input
        id="username"
        type="text"
        class="form-input"
        placeholder="Enter your username"
        bind:value={username}
        oninput={handleUsernameInput}
        onfocus={() => focusedField = 'username'}
        onblur={() => focusedField = null}
        required
        disabled={isLoading}
        autocomplete="username"
      />
    </div>
  </div>

  <div class="form-field">
    <label for="password" class="form-label">Password</label>
    <div class="input-wrapper" class:focused={focusedField === 'password'}>
      <svg class="input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
        <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
      </svg>
      <input
        id="password"
        type="password"
        class="form-input"
        placeholder="Enter your password"
        bind:value={password}
        oninput={handlePasswordInput}
        onfocus={() => focusedField = 'password'}
        onblur={() => focusedField = null}
        required
        disabled={isLoading}
        autocomplete="current-password"
      />
    </div>
  </div>

  <button
    type="submit"
    class="submit-button"
    disabled={isLoading || !username || !password}
  >
    {#if isLoading}
      <span class="loading-spinner"></span>
      Logging in...
    {:else}
      Sign In
    {/if}
  </button>

</form>

<style>
  .login-form {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
  }

  .form-field {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .form-label {
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--text-secondary);
    letter-spacing: 0.025em;
  }

  .input-wrapper {
    position: relative;
    display: flex;
    align-items: center;
    background: var(--surface);
    border: 2px solid var(--border-color);
    border-radius: 12px;
    transition: all 0.2s ease;
    overflow: hidden;
  }

  .input-wrapper:hover {
    border-color: var(--border-color-hover);
  }

  .input-wrapper.focused {
    border-color: var(--primary);
    box-shadow: 0 0 0 4px rgba(var(--primary-rgb), 0.1);
  }

  .input-icon {
    position: absolute;
    left: 1rem;
    color: var(--text-tertiary);
    pointer-events: none;
    transition: color 0.2s ease;
  }

  .input-wrapper.focused .input-icon {
    color: var(--primary);
  }

  .form-input {
    flex: 1;
    padding: 0.875rem 1rem 0.875rem 3rem;
    background: transparent;
    border: none;
    outline: none;
    font-size: 0.938rem;
    color: var(--text-primary);
    width: 100%;
  }

  .form-input::placeholder {
    color: var(--text-tertiary);
  }

  .form-input:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .error-message {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    background: linear-gradient(135deg,
      rgba(239, 68, 68, 0.05) 0%,
      rgba(239, 68, 68, 0.02) 100%);
    color: rgb(239, 68, 68);
    padding: 0.875rem 1rem;
    border-radius: 12px;
    border: 1px solid rgba(239, 68, 68, 0.15);
    font-size: 0.875rem;
    font-weight: 500;
  }

  .submit-button {
    width: 100%;
    padding: 0.875rem;
    background: var(--evening-sea);
    color: var(--bridesmaid);
    border: none;
    border-radius: 12px;
    font-size: 0.938rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    letter-spacing: 0.025em;
  }

  .submit-button:hover:not(:disabled) {
    transform: translateY(-2px);
    background: #2a6a5b;
    box-shadow: 0 10px 30px rgba(47, 117, 99, 0.35);
    filter: brightness(0.95);
  }

  .submit-button:active:not(:disabled) {
    transform: translateY(0);
  }

  .submit-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    background: var(--surface-muted);
    color: var(--text-primary);
  }

  .loading-spinner {
    width: 18px;
    height: 18px;
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