<script lang="ts">
  import LoginForm from '$lib/components/organisms/LoginForm.svelte';
  import PasswordChangeForm from '$lib/components/organisms/PasswordChangeForm.svelte';
  import { authStore } from '$lib/modules/auth/presentation/stores/authStore.svelte';
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import { fade, fly } from 'svelte/transition';

  let mounted = $state(false);

  // Redirect if already authenticated
  onMount(() => {
    mounted = true;
    if (authStore.isAuthenticated) {
      goto('/');
    }
  });

  // Watch for authentication changes
  $effect(() => {
    if (authStore.isAuthenticated) {
      goto('/');
    }
  });
</script>

<svelte:head>
  <title>Login - Expense Tracker</title>
</svelte:head>

<div class="login-page">
  <div class="background-gradient"></div>
  <div class="background-pattern"></div>

  {#if mounted}
    <div class="login-container" in:fly={{ y: 30, duration: 600, delay: 200 }}>
      <div class="logo-wrapper" in:fade={{ duration: 400 }}>
        <div class="logo">
          <img src="/logo/happy-balance-logo-without-text.png" alt="Happy Balance" class="logo-image" />
        </div>
      </div>

      <div class="login-content" in:fade={{ duration: 400, delay: 100 }}>
        {#if authStore.requiresPasswordChange}
          <h1 class="login-title">Security Required</h1>
          <p class="login-subtitle">Complete your account setup</p>
        {:else}
          <h1 class="login-title">Welcome back</h1>
          <p class="login-subtitle">Sign in to your account</p>
        {/if}
      </div>

      <div in:fade={{ duration: 400, delay: 300 }}>
        {#if authStore.requiresPasswordChange}
          <PasswordChangeForm
            userId={authStore.requiresPasswordChange.userId}
            username={authStore.requiresPasswordChange.username}
          />
        {:else}
          <LoginForm />
        {/if}
      </div>

      <div class="login-footer" in:fade={{ duration: 400, delay: 400 }}>
        <p>Happy Balance</p>
      </div>
    </div>
  {/if}
</div>

<style>
  .login-page {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    overflow: hidden;
    background: var(--surface);
  }

  .background-gradient {
    position: absolute;
    inset: 0;
    background: var(--surface);
  }

  :global(html.dark) .background-gradient {
    background: var(--surface);
  }

  .background-pattern {
    position: absolute;
    inset: 0;
    /* Removed background pattern for cleaner look */
  }

  .login-container {
    position: relative;
    width: 100%;
    max-width: 540px;
    padding: 4rem 4rem;
    background: var(--surface-elevated);
    border-radius: 20px;
    box-shadow: 0 4px 24px rgba(0, 0, 0, 0.04);
    border: 1px solid var(--border-color);
    margin: 1rem;
  }

  .logo-wrapper {
    display: flex;
    justify-content: center;
    margin-bottom: 2rem;
  }

  .logo {
    width: 72px;
    height: 72px;
    border-radius: 18px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
    border: 1px solid var(--border-color);
    overflow: hidden;
    position: relative;
    background: var(--surface);
  }

  .logo-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: center;
  }

  .login-content {
    text-align: center;
    margin-bottom: 2rem;
  }

  .login-title {
    font-size: 2rem;
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: 0.5rem;
    letter-spacing: -0.03em;
    line-height: 1.2;
  }

  .login-subtitle {
    color: var(--text-tertiary);
    font-size: 1rem;
    font-weight: 400;
    opacity: 0.8;
  }

  .login-footer {
    text-align: center;
    margin-top: 2rem;
    padding-top: 2rem;
    border-top: 1px solid var(--border-color);
  }

  .login-footer p {
    color: var(--text-tertiary);
    font-size: 0.75rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    font-weight: 500;
    opacity: 0.5;
  }

  @media (max-width: 640px) {
    .login-container {
      padding: 3rem 2rem;
      margin: 1rem;
      max-width: 100%;
    }

    .logo {
      width: 64px;
      height: 64px;
      border-radius: 18px;
    }

    .login-title {
      font-size: 1.75rem;
    }

    .login-subtitle {
      font-size: 0.938rem;
    }
  }
</style>