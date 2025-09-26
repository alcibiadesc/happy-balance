<script lang="ts">
  import LoginForm from '$lib/components/organisms/LoginForm.svelte';
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
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <path d="M12 2v20M2 12h20"/>
            <path d="M7 7l10 10M17 7L7 17"/>
          </svg>
        </div>
      </div>

      <div class="login-content" in:fade={{ duration: 400, delay: 100 }}>
        <h1 class="login-title">Welcome Back</h1>
        <p class="login-subtitle">Track your expenses with elegance</p>
      </div>

      <div in:fade={{ duration: 400, delay: 300 }}>
        <LoginForm />
      </div>

      <div class="login-footer" in:fade={{ duration: 400, delay: 400 }}>
        <p>Secure • Private • Minimal</p>
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
    background: linear-gradient(135deg,
      hsl(var(--primary-hue) 40% 95%) 0%,
      hsl(var(--primary-hue) 30% 90%) 50%,
      hsl(var(--primary-hue) 20% 95%) 100%);
  }

  :global(html.dark) .background-gradient {
    background: linear-gradient(135deg,
      hsl(var(--primary-hue) 20% 10%) 0%,
      hsl(var(--primary-hue) 15% 8%) 50%,
      hsl(var(--primary-hue) 10% 12%) 100%);
  }

  .background-pattern {
    position: absolute;
    inset: 0;
    opacity: 0.03;
    background-image:
      radial-gradient(circle at 25% 25%, var(--primary) 0%, transparent 50%),
      radial-gradient(circle at 75% 75%, var(--primary) 0%, transparent 50%);
  }

  .login-container {
    position: relative;
    width: 100%;
    max-width: 420px;
    padding: 3rem 2rem;
    background: var(--surface-elevated);
    border-radius: 24px;
    box-shadow: var(--shadow-xl);
    border: 1px solid var(--border-color);
    margin: 1rem;
  }

  .logo-wrapper {
    display: flex;
    justify-content: center;
    margin-bottom: 2rem;
  }

  .logo {
    width: 80px;
    height: 80px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, var(--primary), var(--primary-dark));
    color: white;
    border-radius: 20px;
    box-shadow: 0 10px 40px rgba(var(--primary-rgb), 0.3);
    transform: rotate(45deg);
    position: relative;
  }

  .logo svg {
    transform: rotate(-45deg);
  }

  .login-content {
    text-align: center;
    margin-bottom: 2rem;
  }

  .login-title {
    font-size: 1.875rem;
    font-weight: 700;
    color: var(--text-primary);
    margin-bottom: 0.5rem;
    letter-spacing: -0.025em;
  }

  .login-subtitle {
    color: var(--text-secondary);
    font-size: 0.938rem;
  }

  .login-footer {
    text-align: center;
    margin-top: 2rem;
    padding-top: 2rem;
    border-top: 1px solid var(--border-color);
  }

  .login-footer p {
    color: var(--text-tertiary);
    font-size: 0.813rem;
    letter-spacing: 0.05em;
    text-transform: uppercase;
  }

  @media (max-width: 640px) {
    .login-container {
      padding: 2rem 1.5rem;
      margin: 1rem;
    }

    .logo {
      width: 64px;
      height: 64px;
    }

    .login-title {
      font-size: 1.5rem;
    }
  }
</style>