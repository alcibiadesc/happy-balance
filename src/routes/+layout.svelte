<script>
  import { onMount } from "svelte";
  import "../app.css";
  import "../lib/styles/japan-palette.css";
  import NewNavbar from "../lib/components/organisms/NewNavbar.svelte";
  import { setLanguage } from "$lib/stores/i18n";
  import { setCurrency } from "$lib/stores/currency";
  import { setTheme, applyTheme } from "$lib/stores/theme";
  import { transactions, categories } from "$lib/stores/transactions";
  import { sidebarCollapsed } from "$lib/stores/sidebar";
  import { userPreferences } from "$lib/stores/user-preferences";
  import { authStore } from "$lib/modules/auth/presentation/stores/authStore.svelte";
  import { goto } from "$app/navigation";
  import { page } from "$app/stores";

  let { children } = $props();

  // Check authentication status for protected routes
  $effect(() => {
    const publicRoutes = ['/login', '/health'];
    const isPublicRoute = publicRoutes.some(route => $page.url.pathname.startsWith(route));

    if (!isPublicRoute && !authStore.isAuthenticated && !authStore.isLoading) {
      goto('/login');
    }
  });

  // Initialize stores and apply theme on mount
  onMount(async () => {
    // Load user preferences first (with localStorage fallback)
    await userPreferences.load();

    // Subscribe to user preferences and sync with individual stores
    userPreferences.subscribe((prefs) => {
      setLanguage(prefs.language);
      setCurrency(prefs.currency);
      setTheme(prefs.theme);
      applyTheme(prefs.theme);
    });

    // Load transaction data only once if authenticated
    if (authStore.isAuthenticated && typeof window !== "undefined" && !window.__transactions_loaded__) {
      transactions.load();
      window.__transactions_loaded__ = true;
    }
  });
</script>

<div class="app-shell">
  {#if authStore.isAuthenticated}
    <NewNavbar />
  {/if}

  <main class="main-content" class:main-content--collapsed={$sidebarCollapsed && authStore.isAuthenticated}>
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
