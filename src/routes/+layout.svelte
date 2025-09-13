<script lang="ts">
  import '../app.css';
  import { Menu, X, TrendingUp, CreditCard, Upload, Settings, Brain, Cog, Sun, Moon } from 'lucide-svelte';
  import { page } from '$app/stores';
  import { browser } from '$app/environment';
  import { onMount } from 'svelte';
  import { env } from '$env/dynamic/public';

  let { children } = $props();
  
  // Theme and menu state
  let mobileMenuOpen = $state(false);
  let isDarkMode = $state(false);
  
  // Navigation items with updated icons and descriptions
  const navigation = [
    { 
      name: 'Dashboard', 
      href: '/dashboard', 
      icon: TrendingUp,
      description: 'Vista general y métricas'
    },
    { 
      name: 'Transacciones', 
      href: '/transactions', 
      icon: CreditCard,
      description: 'Historial y gestión'
    },
    { 
      name: 'Importar', 
      href: '/import', 
      icon: Upload,
      description: 'Subir archivos CSV'
    },
    { 
      name: 'Gestión', 
      href: '/manage', 
      icon: Settings,
      description: 'Categorías y presupuestos'
    },
    { 
      name: 'Inteligencia', 
      href: '/intelligence', 
      icon: Brain,
      description: 'Análisis automático'
    },
    { 
      name: 'Configuración', 
      href: '/settings', 
      icon: Cog,
      description: 'Ajustes del sistema'
    }
  ];

  function toggleMobileMenu() {
    mobileMenuOpen = !mobileMenuOpen;
  }

  function closeMobileMenu() {
    mobileMenuOpen = false;
  }

  function toggleTheme() {
    isDarkMode = !isDarkMode;
    document.documentElement.classList.toggle('dark', isDarkMode);
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
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
      const savedTheme = localStorage.getItem('theme') || 'light';
      isDarkMode = savedTheme === 'dark';
      document.documentElement.classList.toggle('dark', isDarkMode);
    }
  });
</script>

<div class="app-container">
  <!-- Mobile Header -->
  <header class="mobile-header">
    <div class="mobile-nav">
      <div class="mobile-nav-start">
        <button
          class="mobile-menu-button"
          onclick={toggleMobileMenu}
          aria-label="Abrir menú de navegación"
        >
          <Menu size={22} strokeWidth={2.5} />
        </button>
        
        <div class="mobile-brand">
          <div class="brand-logo">
            <TrendingUp size={20} strokeWidth={2.5} />
          </div>
          <div class="brand-text">
            <span class="brand-name">Happy Balance</span>
            <span class="brand-tagline">Finanzas inteligentes</span>
          </div>
        </div>
      </div>
      
      <div class="mobile-nav-end">
        <button class="theme-toggle-mobile" onclick={toggleTheme}>
          {#if isDarkMode}
            <Sun size={20} strokeWidth={2.5} />
          {:else}
            <Moon size={20} strokeWidth={2.5} />
          {/if}
        </button>
      </div>
    </div>
  </header>

  <div class="main-layout">
    <!-- Desktop Sidebar -->
    <aside class="desktop-sidebar">
      <div class="sidebar-container">
        <!-- Sidebar Header -->
        <div class="sidebar-header">
          <div class="brand-section">
            <div class="brand-logo">
              <TrendingUp size={24} strokeWidth={2.5} />
            </div>
            <div class="brand-text">
              <span class="brand-name">Happy Balance</span>
              <span class="brand-tagline">Finanzas inteligentes</span>
            </div>
          </div>
          
          <button class="theme-toggle-desktop" onclick={toggleTheme}>
            {#if isDarkMode}
              <Sun size={18} strokeWidth={2.5} />
            {:else}
              <Moon size={18} strokeWidth={2.5} />
            {/if}
          </button>
        </div>
        
        <!-- Navigation -->
        <nav class="sidebar-nav">
          <div class="nav-section">
            <span class="nav-section-title">Principal</span>
            {#each navigation.slice(0, 3) as item}
              <a 
                href={item.href}
                class="nav-item {isActive(item.href) ? 'nav-item-active' : ''}"
                title={item.description}
              >
                <div class="nav-item-icon">
                  <item.icon size={20} strokeWidth={2.5} />
                </div>
                <div class="nav-item-content">
                  <span class="nav-item-title">{item.name}</span>
                  <span class="nav-item-description">{item.description}</span>
                </div>
              </a>
            {/each}
          </div>
          
          <div class="nav-section">
            <span class="nav-section-title">Gestión</span>
            {#each navigation.slice(3) as item}
              <a 
                href={item.href}
                class="nav-item {isActive(item.href) ? 'nav-item-active' : ''}"
                title={item.description}
              >
                <div class="nav-item-icon">
                  <item.icon size={20} strokeWidth={2.5} />
                </div>
                <div class="nav-item-content">
                  <span class="nav-item-title">{item.name}</span>
                  <span class="nav-item-description">{item.description}</span>
                </div>
              </a>
            {/each}
          </div>
        </nav>
        
        <!-- Sidebar Footer -->
        <div class="sidebar-footer">
          <div class="user-section">
            <div class="user-avatar">
              <span>U</span>
            </div>
            <div class="user-info">
              <span class="user-name">Usuario</span>
              <span class="user-status">Cuenta activa</span>
            </div>
          </div>
        </div>
      </div>
    </aside>

    <!-- Mobile Sidebar -->
    {#if mobileMenuOpen}
      <div class="mobile-overlay" onclick={closeMobileMenu}></div>
      <aside class="mobile-sidebar">
        <div class="mobile-sidebar-header">
          <div class="brand-section">
            <div class="brand-logo">
              <TrendingUp size={20} strokeWidth={2.5} />
            </div>
            <div class="brand-text">
              <span class="brand-name">Happy Balance</span>
              <span class="brand-tagline">Finanzas inteligentes</span>
            </div>
          </div>
          <button class="close-button" onclick={closeMobileMenu}>
            <X size={20} strokeWidth={2.5} />
          </button>
        </div>
        
        <nav class="mobile-sidebar-nav">
          {#each navigation as item}
            <a 
              href={item.href}
              class="nav-item {isActive(item.href) ? 'nav-item-active' : ''}"
              onclick={closeMobileMenu}
            >
              <div class="nav-item-icon">
                <item.icon size={20} strokeWidth={2.5} />
              </div>
              <div class="nav-item-content">
                <span class="nav-item-title">{item.name}</span>
                <span class="nav-item-description">{item.description}</span>
              </div>
            </a>
          {/each}
        </nav>
        
        <div class="mobile-sidebar-footer">
          <div class="user-section">
            <div class="user-avatar">
              <span>U</span>
            </div>
            <div class="user-info">
              <span class="user-name">Usuario</span>
              <span class="user-status">Cuenta activa</span>
            </div>
          </div>
        </div>
      </aside>
    {/if}

    <!-- Main Content Area -->
    <main class="main-content">
      <!-- Demo Banner -->
      {#if isDemoMode}
        <div class="demo-banner">
          <div class="demo-content">
            <div class="demo-icon">🚀</div>
            <div class="demo-text">
              <strong>Modo Demostración</strong>
              <span>Todos los datos mostrados son ficticios para propósitos de prueba</span>
            </div>
          </div>
        </div>
      {/if}
      
      <!-- Page Content -->
      <div class="content-area">
        {@render children?.()}
      </div>
    </main>
  </div>
</div>

<style>
  /* CSS Variables for Modern Design System */
  :root {
    --color-primary: #2563eb;
    --color-primary-hover: #1d4ed8;
    --color-primary-light: #eff6ff;
    
    --color-secondary: #7c3aed;
    --color-secondary-hover: #6d28d9;
    --color-secondary-light: #f3e8ff;
    
    --color-success: #059669;
    --color-warning: #d97706;
    --color-error: #dc2626;
    --color-info: #0284c7;
    
    --color-gray-50: #f9fafb;
    --color-gray-100: #f3f4f6;
    --color-gray-200: #e5e7eb;
    --color-gray-300: #d1d5db;
    --color-gray-400: #9ca3af;
    --color-gray-500: #6b7280;
    --color-gray-600: #4b5563;
    --color-gray-700: #374151;
    --color-gray-800: #1f2937;
    --color-gray-900: #111827;
    
    --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
    --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
    --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
    --shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);
    
    --radius-sm: 6px;
    --radius-md: 8px;
    --radius-lg: 12px;
    --radius-xl: 16px;
    
    --font-sans: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    --font-mono: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, monospace;
  }

  /* Dark mode variables */
  :global(html.dark) {
    --color-gray-50: #1f2937;
    --color-gray-100: #374151;
    --color-gray-200: #4b5563;
    --color-gray-300: #6b7280;
    --color-gray-400: #9ca3af;
    --color-gray-500: #d1d5db;
    --color-gray-600: #e5e7eb;
    --color-gray-700: #f3f4f6;
    --color-gray-800: #f9fafb;
    --color-gray-900: #ffffff;
  }

  /* Base Styles */
  .app-container {
    min-height: 100vh;
    background-color: var(--color-gray-50);
    font-family: var(--font-sans);
    color: var(--color-gray-900);
    line-height: 1.6;
  }

  /* Mobile Header */
  .mobile-header {
    display: none;
    position: sticky;
    top: 0;
    z-index: 50;
    background-color: white;
    border-bottom: 1px solid var(--color-gray-200);
    box-shadow: var(--shadow-sm);
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

  .mobile-menu-button {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2.5rem;
    height: 2.5rem;
    background: transparent;
    border: none;
    border-radius: var(--radius-md);
    color: var(--color-gray-700);
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .mobile-menu-button:hover {
    background-color: var(--color-gray-100);
    color: var(--color-gray-900);
  }

  .mobile-brand {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .brand-logo {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2.5rem;
    height: 2.5rem;
    background: linear-gradient(135deg, var(--color-primary), var(--color-secondary));
    border-radius: var(--radius-lg);
    color: white;
    box-shadow: var(--shadow-md);
  }

  .brand-text {
    display: flex;
    flex-direction: column;
  }

  .brand-name {
    font-weight: 700;
    font-size: 1.125rem;
    color: var(--color-gray-900);
    line-height: 1.2;
  }

  .brand-tagline {
    font-size: 0.75rem;
    color: var(--color-gray-500);
    line-height: 1;
  }

  .theme-toggle-mobile {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2.5rem;
    height: 2.5rem;
    background: transparent;
    border: none;
    border-radius: var(--radius-md);
    color: var(--color-gray-700);
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .theme-toggle-mobile:hover {
    background-color: var(--color-gray-100);
    color: var(--color-gray-900);
  }

  /* Main Layout */
  .main-layout {
    display: flex;
    min-height: calc(100vh - 4rem);
  }

  /* Desktop Sidebar */
  .desktop-sidebar {
    display: none;
    width: 20rem;
    background-color: white;
    border-right: 1px solid var(--color-gray-200);
    box-shadow: var(--shadow-sm);
    flex-shrink: 0;
  }

  .sidebar-container {
    display: flex;
    flex-direction: column;
    height: 100%;
    padding: 1.5rem;
  }

  .sidebar-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 2rem;
    padding-bottom: 1.5rem;
    border-bottom: 1px solid var(--color-gray-200);
  }

  .brand-section {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .theme-toggle-desktop {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2rem;
    height: 2rem;
    background: transparent;
    border: none;
    border-radius: var(--radius-md);
    color: var(--color-gray-600);
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .theme-toggle-desktop:hover {
    background-color: var(--color-gray-100);
    color: var(--color-gray-900);
  }

  /* Navigation */
  .sidebar-nav {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .nav-section {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .nav-section-title {
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--color-gray-500);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: 0.5rem;
    padding: 0 0.75rem;
  }

  .nav-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem;
    border-radius: var(--radius-lg);
    text-decoration: none;
    color: var(--color-gray-700);
    transition: all 0.2s ease;
    position: relative;
  }

  .nav-item:hover {
    background-color: var(--color-gray-100);
    color: var(--color-gray-900);
    transform: translateY(-1px);
  }

  .nav-item-active {
    background: linear-gradient(135deg, var(--color-primary-light), var(--color-secondary-light));
    color: var(--color-primary);
    box-shadow: var(--shadow-sm);
  }

  .nav-item-active:hover {
    background: linear-gradient(135deg, var(--color-primary-light), var(--color-secondary-light));
    transform: translateY(-2px);
    box-shadow: var(--shadow-md);
  }

  .nav-item-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2rem;
    height: 2rem;
    flex-shrink: 0;
  }

  .nav-item-content {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }

  .nav-item-title {
    font-weight: 600;
    font-size: 0.875rem;
    line-height: 1.2;
  }

  .nav-item-description {
    font-size: 0.75rem;
    color: var(--color-gray-500);
    line-height: 1.2;
  }

  .nav-item-active .nav-item-description {
    color: var(--color-primary);
    opacity: 0.8;
  }

  /* Sidebar Footer */
  .sidebar-footer {
    margin-top: auto;
    padding-top: 1.5rem;
    border-top: 1px solid var(--color-gray-200);
  }

  .user-section {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem;
    border-radius: var(--radius-lg);
    background-color: var(--color-gray-50);
  }

  .user-avatar {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2rem;
    height: 2rem;
    background: linear-gradient(135deg, var(--color-primary), var(--color-secondary));
    border-radius: 50%;
    color: white;
    font-weight: 600;
    font-size: 0.875rem;
  }

  .user-info {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }

  .user-name {
    font-weight: 600;
    font-size: 0.875rem;
    color: var(--color-gray-900);
    line-height: 1.2;
  }

  .user-status {
    font-size: 0.75rem;
    color: var(--color-gray-500);
    line-height: 1.2;
  }

  /* Mobile Sidebar */
  .mobile-overlay {
    position: fixed;
    inset: 0;
    background-color: rgba(0, 0, 0, 0.5);
    z-index: 40;
    backdrop-filter: blur(4px);
  }

  .mobile-sidebar {
    position: fixed;
    top: 0;
    left: 0;
    width: 20rem;
    height: 100%;
    background-color: white;
    z-index: 50;
    box-shadow: var(--shadow-xl);
    animation: slideIn 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .mobile-sidebar-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem;
    border-bottom: 1px solid var(--color-gray-200);
  }

  .close-button {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2rem;
    height: 2rem;
    background: transparent;
    border: none;
    border-radius: var(--radius-md);
    color: var(--color-gray-600);
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .close-button:hover {
    background-color: var(--color-gray-100);
    color: var(--color-gray-900);
  }

  .mobile-sidebar-nav {
    padding: 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    flex: 1;
  }

  .mobile-sidebar-footer {
    padding: 1rem;
    border-top: 1px solid var(--color-gray-200);
    margin-top: auto;
  }

  /* Main Content */
  .main-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-height: 0;
  }

  .demo-banner {
    background: linear-gradient(135deg, var(--color-primary), var(--color-secondary));
    color: white;
    padding: 1rem;
  }

  .demo-content {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    max-width: 1200px;
    margin: 0 auto;
  }

  .demo-icon {
    font-size: 1.25rem;
  }

  .demo-text {
    display: flex;
    flex-direction: column;
    gap: 0.125rem;
  }

  .demo-text strong {
    font-weight: 600;
  }

  .demo-text span {
    font-size: 0.875rem;
    opacity: 0.9;
  }

  .content-area {
    flex: 1;
    padding: 2rem;
    max-width: 1200px;
    margin: 0 auto;
    width: 100%;
  }

  /* Animations */
  @keyframes slideIn {
    from {
      transform: translateX(-100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }

  /* Responsive Design */
  @media (max-width: 1023px) {
    .mobile-header {
      display: block;
    }
    
    .main-layout {
      min-height: calc(100vh - 4rem);
    }
    
    .desktop-sidebar {
      display: none;
    }
    
    .content-area {
      padding: 1rem;
    }
  }

  @media (min-width: 1024px) {
    .mobile-header {
      display: none;
    }
    
    .main-layout {
      min-height: 100vh;
    }
    
    .desktop-sidebar {
      display: flex;
    }
  }

  /* Dark Mode Styles */
  :global(html.dark) .app-container {
    background-color: var(--color-gray-50);
    color: var(--color-gray-900);
  }

  :global(html.dark) .mobile-header,
  :global(html.dark) .desktop-sidebar,
  :global(html.dark) .mobile-sidebar {
    background-color: #1f2937;
    border-color: #374151;
  }

  :global(html.dark) .sidebar-header,
  :global(html.dark) .mobile-sidebar-header,
  :global(html.dark) .sidebar-footer,
  :global(html.dark) .mobile-sidebar-footer {
    border-color: #374151;
  }

  :global(html.dark) .user-section {
    background-color: #374151;
  }

  :global(html.dark) .nav-item-active {
    background: linear-gradient(135deg, rgba(37, 99, 235, 0.2), rgba(124, 58, 237, 0.2));
    color: #60a5fa;
  }

  :global(html.dark) .mobile-menu-button:hover,
  :global(html.dark) .theme-toggle-mobile:hover,
  :global(html.dark) .theme-toggle-desktop:hover,
  :global(html.dark) .close-button:hover {
    background-color: #374151;
  }

  :global(html.dark) .nav-item:hover {
    background-color: #374151;
  }
</style>
