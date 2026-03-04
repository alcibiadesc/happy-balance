<script lang="ts">
  import { fade } from 'svelte/transition';
  import { getApiUrl } from '$lib/utils/api-url';

  type FormState = 'input' | 'sending' | 'sent' | 'error';

  let email = $state('');
  let formState = $state<FormState>('input');
  let errorMessage = $state('');
  let focusedField = $state(false);

  async function handleSubmit(event: Event) {
    event.preventDefault();
    if (!email) return;

    formState = 'sending';
    errorMessage = '';

    try {
      const apiBase = getApiUrl();
      const response = await fetch(`${apiBase}/auth/magic-link`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to send magic link');
      }

      formState = 'sent';
    } catch (err) {
      errorMessage = err instanceof Error ? err.message : 'Something went wrong. Please try again.';
      formState = 'error';
    }
  }

  function resetForm() {
    formState = 'input';
    errorMessage = '';
  }
</script>

{#if formState === 'sent'}
  <div class="success-state" in:fade={{ duration: 300 }}>
    <div class="success-icon">
      <svg
        width="32"
        height="32"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <rect width="20" height="16" x="2" y="4" rx="2" />
        <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
      </svg>
    </div>
    <h3 class="success-title">Revisa tu email</h3>
    <p class="success-text">
      Hemos enviado un enlace de acceso a <strong>{email}</strong>. Revisa tu bandeja de entrada.
    </p>
    <button type="button" class="link-button" onclick={resetForm}> Usar otro email </button>
  </div>
{:else}
  <form onsubmit={handleSubmit} class="magic-link-form">
    {#if formState === 'error' && errorMessage}
      <div class="error-message" in:fade={{ duration: 200 }}>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        <span>{errorMessage}</span>
      </div>
    {/if}

    <div class="form-field">
      <label for="magic-email" class="form-label">Email</label>
      <div class="input-wrapper" class:focused={focusedField}>
        <svg
          class="input-icon"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <rect width="20" height="16" x="2" y="4" rx="2" />
          <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
        </svg>
        <input
          id="magic-email"
          type="email"
          class="form-input"
          placeholder="tu@email.com"
          bind:value={email}
          onfocus={() => (focusedField = true)}
          onblur={() => (focusedField = false)}
          required
          disabled={formState === 'sending'}
          autocomplete="email"
        />
      </div>
    </div>

    <button type="submit" class="submit-button" disabled={formState === 'sending' || !email}>
      {#if formState === 'sending'}
        <span class="loading-spinner"></span>
        Enviando...
      {:else}
        Enviar enlace de acceso
      {/if}
    </button>
  </form>
{/if}

<style>
  .magic-link-form {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .form-field {
    display: flex;
    flex-direction: column;
    gap: 0.625rem;
  }

  .form-label {
    font-size: 0.813rem;
    font-weight: 500;
    color: var(--text-tertiary);
    letter-spacing: 0.03em;
    text-transform: uppercase;
  }

  .input-wrapper {
    position: relative;
    display: flex;
    align-items: center;
    background: var(--surface);
    border: 1.5px solid var(--border-color);
    border-radius: 14px;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    overflow: hidden;
  }

  .input-wrapper:hover {
    border-color: var(--border-color-hover);
    background: var(--surface-elevated);
  }

  .input-wrapper.focused {
    border-color: var(--primary);
    box-shadow: 0 0 0 3px rgba(var(--primary-rgb), 0.05);
    background: var(--surface-elevated);
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
    padding: 1rem 1.25rem 1rem 3.25rem;
    background: transparent;
    border: none;
    outline: none;
    font-size: 0.938rem;
    color: var(--text-primary);
    width: 100%;
    font-weight: 500;
  }

  .form-input::placeholder {
    color: var(--text-tertiary);
    font-weight: 400;
  }

  .form-input:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .error-message {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    background: linear-gradient(135deg, rgba(239, 68, 68, 0.05) 0%, rgba(239, 68, 68, 0.02) 100%);
    color: rgb(239, 68, 68);
    padding: 0.875rem 1rem;
    border-radius: 12px;
    border: 1px solid rgba(239, 68, 68, 0.15);
    font-size: 0.875rem;
    font-weight: 500;
  }

  .submit-button {
    width: 100%;
    padding: 1rem;
    background: var(--evening-sea);
    color: var(--bridesmaid);
    border: none;
    border-radius: 14px;
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
    margin-top: 0.5rem;
  }

  .submit-button:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 4px 16px rgba(47, 117, 99, 0.15);
  }

  .submit-button:active:not(:disabled) {
    transform: translateY(0);
    box-shadow: 0 2px 8px rgba(47, 117, 99, 0.1);
  }

  .submit-button:disabled {
    opacity: 0.4;
    cursor: not-allowed;
    background: var(--text-tertiary);
  }

  .loading-spinner {
    width: 18px;
    height: 18px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top-color: white;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  /* Success state */
  .success-state {
    text-align: center;
    padding: 1rem 0;
  }

  .success-icon {
    width: 56px;
    height: 56px;
    margin: 0 auto 1.25rem;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--primary-light, rgba(2, 60, 70, 0.08));
    color: var(--primary);
    border-radius: 14px;
  }

  .success-title {
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: 0.5rem;
  }

  .success-text {
    font-size: 0.875rem;
    line-height: 1.6;
    color: var(--text-secondary);
    margin-bottom: 1.5rem;
  }

  .success-text strong {
    color: var(--text-primary);
    font-weight: 600;
  }

  .link-button {
    background: none;
    border: none;
    color: var(--primary);
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    padding: 0.25rem 0;
    text-decoration: underline;
    text-underline-offset: 2px;
  }

  .link-button:hover {
    opacity: 0.8;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
</style>
