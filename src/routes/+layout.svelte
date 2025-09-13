<script>
  import { onMount } from 'svelte';
  import '../app.css';
  import '../lib/styles/japan-palette.css';
  import NewNavbar from '../lib/components/organisms/NewNavbar.svelte';
  import { initLanguage } from '$lib/stores/i18n';
  import { initCurrency } from '$lib/stores/currency';
  import { theme, applyTheme } from '$lib/stores/theme';
  import { transactions, categories } from '$lib/stores/transactions';
  import { sidebarCollapsed } from '$lib/stores/sidebar';

  let { children } = $props();

  // Initialize stores and apply theme on mount
  onMount(() => {
    initLanguage();
    initCurrency();

    // Load transaction data only once
    if (typeof window !== 'undefined' && !window.__transactions_loaded__) {
      transactions.load();
      window.__transactions_loaded__ = true;
    }

    // Apply the current theme (this ensures consistency with the inline script)
    theme.subscribe(currentTheme => {
      applyTheme(currentTheme);
    });
  });
</script>

<div class="app-shell">
  <NewNavbar />

  <main class="main-content" class:main-content--collapsed={$sidebarCollapsed}>
    <div class="content-container">
      {@render children?.()}
    </div>
  </main>
</div>

<style>
  .app-shell {
    min-height: 100vh;
    background: var(--surface);
    color: var(--text-primary);
  }
  
  .main-content {
    margin-left: 0;
    padding-top: 72px;
    min-height: 100vh;
    transition: margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  @media (min-width: 1024px) {
    .main-content {
      margin-left: 280px;
      padding-top: 0;
    }

    .main-content--collapsed {
      margin-left: 80px;
    }
  }
  
  .content-container {
    padding: 1rem;
    max-width: 1200px;
    margin: 0 auto;
    width: 100%;
  }
  
  @media (min-width: 768px) {
    .content-container {
      padding: 2rem;
    }
  }
</style>
