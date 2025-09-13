<script lang="ts">
  import '../app.css';
  import { Menu, X, TrendingUp, CreditCard, Upload, Settings, Brain, Cog } from 'lucide-svelte';
  import { page } from '$app/stores';
  import { browser } from '$app/environment';
  import { onMount } from 'svelte';
  import { env } from '$env/dynamic/public';

  let { children } = $props();
  
  // Simple mobile menu state
  let mobileMenuOpen = $state(false);
  
  // Navigation items
  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: TrendingUp },
    { name: 'Transacciones', href: '/transactions', icon: CreditCard },
    { name: 'Importar CSV', href: '/import', icon: Upload },
    { name: 'Gestión', href: '/manage', icon: Settings },
    { name: 'Inteligencia', href: '/intelligence', icon: Brain },
    { name: 'Configuración', href: '/settings', icon: Cog }
  ];

  function toggleMobileMenu() {
    mobileMenuOpen = !mobileMenuOpen;
  }

  function closeMobileMenu() {
    mobileMenuOpen = false;
  }

  function isActive(href: string) {
    if (href === '/dashboard' && $page.url.pathname === '/') {
      return true;
    }
    return $page.url.pathname === href || $page.url.pathname.startsWith(href + '/');
  }

  let isDemoMode = $derived(env.PUBLIC_DEMO_MODE === 'true');

  onMount(() => {
    if (browser) {
      const currentTheme = localStorage.getItem('theme') || 'light';
      document.documentElement.classList.toggle('dark', currentTheme === 'dark');
    }
  });
</script>

<div class="app">
  <!-- Mobile Header -->
  <header class="mobile-header lg:hidden">
    <div class="mobile-nav">
      <div class="mobile-nav-start">
        <!-- Mobile Menu Button -->
        <button
          class="mobile-menu-btn"
          onclick={toggleMobileMenu}
          aria-label="Abrir menú"
        >
          <Menu size={24} />
        </button>
        
        <div class="mobile-brand">
          <div class="brand-icon">
            <TrendingUp size={20} />
          </div>
          <span class="brand-text">Happy Balance</span>
        </div>
      </div>
      
      <div class="mobile-nav-end">
        <button class="theme-btn" onclick={() => {
          const html = document.documentElement;
          const isDark = html.classList.contains('dark');
          html.classList.toggle('dark', !isDark);
          localStorage.setItem('theme', isDark ? 'light' : 'dark');
        }}>
          🌙
        </button>
      </div>
    </div>
  </header>

  <div class="main-layout">
    <!-- Desktop Sidebar -->
    <aside class="desktop-sidebar hidden lg:flex">
      <div class="sidebar-content">
        <div class="sidebar-header">
          <div class="brand">
            <div class="brand-icon">
              <TrendingUp size={20} />
            </div>
            <div class="brand-info">
              <h1>Happy Balance</h1>
              <p>Gestión Financiera</p>
            </div>
          </div>
        </div>
        
        <nav class="sidebar-nav">
          {#each navigation as item}
            <a 
              href={item.href}
              class="nav-link {isActive(item.href) ? 'active' : ''}"
            >
              <item.icon size={20} />
              <span>{item.name}</span>
            </a>
          {/each}
        </nav>
      </div>
    </aside>

    <!-- Mobile Sidebar -->
    {#if mobileMenuOpen}
      <div class="mobile-overlay" onclick={closeMobileMenu}></div>
      <aside class="mobile-sidebar">
        <div class="mobile-sidebar-header">
          <div class="brand">
            <div class="brand-icon">
              <TrendingUp size={20} />
            </div>
            <div class="brand-info">
              <h1>Happy Balance</h1>
              <p>Gestión Financiera</p>
            </div>
          </div>
          <button class="close-btn" onclick={closeMobileMenu}>
            <X size={20} />
          </button>
        </div>
        
        <nav class="mobile-sidebar-nav">
          {#each navigation as item}
            <a 
              href={item.href}
              class="nav-link {isActive(item.href) ? 'active' : ''}"
              onclick={closeMobileMenu}
            >
              <item.icon size={20} />
              <span>{item.name}</span>
            </a>
          {/each}
        </nav>
      </aside>
    {/if}

    <!-- Main Content -->
    <main class="main-content">
      <!-- Demo Banner -->
      {#if isDemoMode}
        <div class="demo-banner">
          <p>🚀 Modo Demo - Los datos son ficticios</p>
        </div>
      {/if}
      
      {@render children?.()}
    </main>
  </div>
</div>

<style>
  .app {
    min-height: 100vh;
    background-color: hsl(var(--b1, 255 255 255));
    color: hsl(var(--bc, 0 0 0));
  }

  /* Mobile Header */
  .mobile-header {
    position: sticky;
    top: 0;
    z-index: 50;
    background-color: hsl(var(--b1, 255 255 255));
    border-bottom: 1px solid hsl(var(--b2, 240 240 240));
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }

  .mobile-nav {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 1rem;
    height: 4rem;
  }

  .mobile-nav-start {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .mobile-menu-btn {
    display: flex !important;
    align-items: center;
    justify-content: center;
    width: 3rem;
    height: 3rem;
    background: transparent;
    border: none;
    border-radius: 0.5rem;
    cursor: pointer;
    transition: background-color 0.2s;
  }

  .mobile-menu-btn:hover {
    background-color: hsl(var(--b2, 240 240 240));
  }

  .mobile-brand {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .brand-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2rem;
    height: 2rem;
    background: linear-gradient(135deg, #3b82f6, #8b5cf6);
    border-radius: 0.5rem;
    color: white;
  }

  .brand-text {
    font-weight: 700;
    font-size: 1.125rem;
  }

  .theme-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2.5rem;
    height: 2.5rem;
    background: transparent;
    border: none;
    border-radius: 0.5rem;
    cursor: pointer;
    font-size: 1.25rem;
  }

  .theme-btn:hover {
    background-color: hsl(var(--b2, 240 240 240));
  }

  /* Main Layout */
  .main-layout {
    display: flex;
    min-height: calc(100vh - 4rem);
  }

  @media (min-width: 1024px) {
    .main-layout {
      min-height: 100vh;
    }
  }

  /* Desktop Sidebar */
  .desktop-sidebar {
    width: 16rem;
    background-color: hsl(var(--b2, 248 248 248));
    border-right: 1px solid hsl(var(--b3, 230 230 230));
    flex-shrink: 0;
  }

  .sidebar-content {
    display: flex;
    flex-direction: column;
    height: 100%;
  }

  .sidebar-header {
    padding: 1.5rem 1rem;
    border-bottom: 1px solid hsl(var(--b3, 230 230 230));
  }

  .brand {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .brand-info h1 {
    font-weight: 700;
    font-size: 1.125rem;
    margin: 0;
  }

  .brand-info p {
    font-size: 0.75rem;
    opacity: 0.7;
    margin: 0;
  }

  .sidebar-nav {
    flex: 1;
    padding: 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  /* Mobile Sidebar */
  .mobile-overlay {
    position: fixed;
    inset: 0;
    background-color: rgba(0, 0, 0, 0.5);
    z-index: 40;
  }

  .mobile-sidebar {
    position: fixed;
    top: 0;
    left: 0;
    width: 16rem;
    height: 100%;
    background-color: hsl(var(--b2, 248 248 248));
    z-index: 50;
    animation: slideIn 0.3s ease-out;
  }

  .mobile-sidebar-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem;
    border-bottom: 1px solid hsl(var(--b3, 230 230 230));
  }

  .close-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2rem;
    height: 2rem;
    background: transparent;
    border: none;
    border-radius: 0.25rem;
    cursor: pointer;
    transition: background-color 0.2s;
  }

  .close-btn:hover {
    background-color: hsl(var(--b3, 230 230 230));
  }

  .mobile-sidebar-nav {
    padding: 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  /* Navigation Links */
  .nav-link {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem 1rem;
    border-radius: 0.5rem;
    text-decoration: none;
    color: inherit;
    transition: all 0.2s;
  }

  .nav-link:hover {
    background-color: hsl(var(--b3, 230 230 230));
  }

  .nav-link.active {
    background-color: #3b82f6;
    color: white;
  }

  /* Main Content */
  .main-content {
    flex: 1;
    overflow-x: auto;
  }

  .demo-banner {
    background: linear-gradient(135deg, #3b82f6, #8b5cf6);
    color: white;
    padding: 0.5rem 1rem;
    text-align: center;
    font-weight: 500;
  }

  /* Animations */
  @keyframes slideIn {
    from {
      transform: translateX(-100%);
    }
    to {
      transform: translateX(0);
    }
  }

  /* Dark Mode Support */
  :global(html.dark) .app {
    background-color: #1a1a1a;
    color: #ffffff;
  }

  :global(html.dark) .mobile-header {
    background-color: #1a1a1a;
    border-bottom-color: #333;
  }

  :global(html.dark) .desktop-sidebar,
  :global(html.dark) .mobile-sidebar {
    background-color: #2a2a2a;
    border-color: #444;
  }

  :global(html.dark) .mobile-menu-btn:hover,
  :global(html.dark) .theme-btn:hover {
    background-color: #333;
  }

  :global(html.dark) .nav-link:hover {
    background-color: #333;
  }

  :global(html.dark) .mobile-sidebar-header {
    border-bottom-color: #444;
  }
</style>
