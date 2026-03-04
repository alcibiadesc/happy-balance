<script lang="ts">
  import '../../app.css';
  import '../../lib/styles/japan-palette.css';
  import Brand from '$lib/components/atoms/Brand.svelte';
  import { authStore } from '$lib/modules/auth/presentation/stores/authStore.svelte';
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';

  const { children } = $props();

  // If already authenticated, go to dashboard
  onMount(() => {
    if (authStore.isAuthenticated) {
      goto('/');
    }
  });
</script>

<div class="public-shell">
  <nav class="public-navbar">
    <div class="navbar-inner">
      <a href="/landing" class="navbar-brand">
        <Brand size="sm" />
      </a>
      <a href="/login" class="acceder-btn">Acceder</a>
    </div>
  </nav>

  <main class="public-content">
    {@render children?.()}
  </main>

  <footer class="public-footer">
    <p>Happy Balance &middot; Financial harmony</p>
  </footer>
</div>

<style>
  .public-shell {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    background: var(--surface);
    color: var(--text-primary);
  }

  .public-navbar {
    position: sticky;
    top: 0;
    z-index: 100;
    background: var(--surface-elevated);
    border-bottom: 1px solid var(--border-color);
    backdrop-filter: blur(12px);
  }

  .navbar-inner {
    max-width: 1100px;
    margin: 0 auto;
    padding: 0.75rem 1.5rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .navbar-brand {
    text-decoration: none;
    color: inherit;
  }

  .acceder-btn {
    display: inline-flex;
    align-items: center;
    padding: 0.5rem 1.25rem;
    background: var(--primary);
    color: var(--primary-foreground, #fff);
    border-radius: 8px;
    font-weight: 500;
    font-size: 0.875rem;
    text-decoration: none;
    transition: all 0.15s ease;
    letter-spacing: 0.01em;
  }

  .acceder-btn:hover {
    background: var(--primary-hover);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }

  .public-content {
    flex: 1;
  }

  .public-footer {
    text-align: center;
    padding: 2rem 1rem;
    font-size: 0.8125rem;
    color: var(--text-muted);
    border-top: 1px solid var(--border-color);
  }
</style>
