<script>
  import { onMount } from 'svelte';
  import '../app.css';
  import '../lib/styles/japan-palette.css';
  import Navbar from '../lib/components/organisms/Navbar.svelte';
  import { initLanguage } from '$lib/stores/i18n';
  import { initCurrency } from '$lib/stores/currency';
  import { theme, applyTheme } from '$lib/stores/theme';
  
  let { children } = $props();
  
  // Initialize stores and apply theme on mount
  onMount(() => {
    initLanguage();
    initCurrency();
    
    // Apply the current theme (this ensures consistency with the inline script)
    theme.subscribe(currentTheme => {
      applyTheme(currentTheme);
    });
  });
</script>

<div class="app-shell">
  <Navbar />
  
  <main class="main-content">
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
    padding-top: 64px;
    min-height: 100vh;
  }
  
  @media (min-width: 1024px) {
    .main-content {
      margin-left: 280px;
      padding-top: 0;
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
