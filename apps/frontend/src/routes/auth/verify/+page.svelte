<script lang="ts">
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import { fade } from 'svelte/transition';
  import { getApiUrl } from '$lib/utils/api-url';

  type VerifyState = 'verifying' | 'success' | 'error';

  let verifyState = $state<VerifyState>('verifying');
  let verifiedEmail = $state('');
  let errorMessage = $state('');

  onMount(async () => {
    const token = $page.url.searchParams.get('token');

    if (!token) {
      verifyState = 'error';
      errorMessage = 'No se encontro el token de verificacion.';
      return;
    }

    try {
      const apiBase = getApiUrl();
      const response = await fetch(`${apiBase}/auth/verify-magic-link`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Verification failed');
      }

      verifiedEmail = result.data.email;
      verifyState = 'success';
    } catch (err) {
      verifyState = 'error';
      errorMessage =
        err instanceof Error ? err.message : 'No se pudo verificar el enlace. Intenta de nuevo.';
    }
  });
</script>

<svelte:head>
  <title>Verificar acceso - Happy Balance</title>
</svelte:head>

<div class="verify-page">
  <div class="verify-container" in:fade={{ duration: 400 }}>
    <div class="logo-wrapper">
      <div class="logo">
        <img
          src="/logo/happy-balance-logo-without-text.png"
          alt="Happy Balance"
          class="logo-image"
        />
      </div>
    </div>

    {#if verifyState === 'verifying'}
      <div class="state-content" in:fade={{ duration: 300 }}>
        <div class="spinner-wrapper">
          <span class="verify-spinner"></span>
        </div>
        <h1 class="verify-title">Verificando...</h1>
        <p class="verify-text">Estamos comprobando tu enlace de acceso.</p>
      </div>
    {:else if verifyState === 'success'}
      <div class="state-content" in:fade={{ duration: 300 }}>
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
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
        </div>
        <h1 class="verify-title">Email verificado</h1>
        <p class="verify-text">
          <strong>{verifiedEmail}</strong> ha sido verificado correctamente. Te notificaremos cuando
          puedas acceder a Happy Balance.
        </p>
        <button type="button" class="primary-button" onclick={() => goto('/landing')}>
          Volver al inicio
        </button>
      </div>
    {:else}
      <div class="state-content" in:fade={{ duration: 300 }}>
        <div class="error-icon">
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
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
        </div>
        <h1 class="verify-title">Enlace no valido</h1>
        <p class="verify-text">{errorMessage}</p>
        <button type="button" class="primary-button" onclick={() => goto('/login')}>
          Solicitar nuevo enlace
        </button>
      </div>
    {/if}
  </div>
</div>

<style>
  .verify-page {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--surface);
    padding: 1rem;
  }

  .verify-container {
    width: 100%;
    max-width: 480px;
    padding: 3rem 2.5rem;
    background: var(--surface-elevated);
    border-radius: 20px;
    box-shadow: 0 4px 24px rgba(0, 0, 0, 0.04);
    border: 1px solid var(--border-color);
    text-align: center;
  }

  .logo-wrapper {
    display: flex;
    justify-content: center;
    margin-bottom: 2rem;
  }

  .logo {
    width: 56px;
    height: 56px;
    border-radius: 14px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
    border: 1px solid var(--border-color);
    overflow: hidden;
    background: var(--surface);
  }

  .logo-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: center;
  }

  .state-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
  }

  .verify-title {
    font-size: 1.5rem;
    font-weight: 600;
    color: var(--text-primary);
    margin: 0;
  }

  .verify-text {
    font-size: 0.938rem;
    line-height: 1.6;
    color: var(--text-secondary);
    margin: 0.25rem 0 1.5rem;
    max-width: 360px;
  }

  .verify-text strong {
    color: var(--text-primary);
    font-weight: 600;
  }

  .spinner-wrapper {
    margin-bottom: 0.5rem;
  }

  .verify-spinner {
    display: block;
    width: 32px;
    height: 32px;
    border: 3px solid var(--border-color);
    border-top-color: var(--primary);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  .success-icon {
    width: 56px;
    height: 56px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(34, 197, 94, 0.08);
    color: rgb(34, 197, 94);
    border-radius: 14px;
    margin-bottom: 0.5rem;
  }

  .error-icon {
    width: 56px;
    height: 56px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(239, 68, 68, 0.08);
    color: rgb(239, 68, 68);
    border-radius: 14px;
    margin-bottom: 0.5rem;
  }

  .primary-button {
    padding: 0.75rem 2rem;
    background: var(--evening-sea);
    color: var(--bridesmaid);
    border: none;
    border-radius: 12px;
    font-size: 0.938rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .primary-button:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(47, 117, 99, 0.15);
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  @media (max-width: 480px) {
    .verify-container {
      padding: 2rem 1.5rem;
    }
  }
</style>
