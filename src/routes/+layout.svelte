<script lang="ts">
  import '../app.css';
  import { Home, BarChart2, CreditCard, Upload, Tag, Menu, X, TrendingUp, ChevronLeft, ChevronRight, Target, Settings, Cog, PiggyBank, Brain } from 'lucide-svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { browser } from '$app/environment';
  import { onMount } from 'svelte';
  import { env } from '$env/dynamic/public';
  import DemoBanner from '$lib/ui/DemoBanner.svelte';
  import { NotificationContainer } from '$lib/ui/components/organisms/NotificationContainer/index.js';
  import ThemeToggle from '$lib/ui/components/molecules/ThemeToggle/ThemeToggle.svelte';
  import { theme } from '$lib/stores/theme';
  import { layoutStore } from '$lib/stores/layout';

  let { children } = $props();
  
  // Use the layout store for global state
  let sidebarCollapsed = $derived($layoutStore.sidebarCollapsed);
  let mobileMenuOpen = $derived($layoutStore.mobileMenuOpen);
  
  // Load sidebar and navigation state from localStorage
  onMount(() => {
    if (browser) {
      // Load expanded menu items
      const expandedSaved = localStorage.getItem('navigation-expanded');
      if (expandedSaved) {
        expandedItems = new Set(JSON.parse(expandedSaved));
      }
      
      // Auto-expand menu containing current page
      const currentPath = window.location.pathname;
      navigation.forEach(item => {
        if (item.subItems?.some(sub => currentPath === sub.href || currentPath.startsWith(sub.href + '/'))) {
          expandedItems = new Set([...expandedItems, item.name]);
        }
      });
      
      // Ensure theme is properly initialized
      const currentTheme = localStorage.getItem('theme') || 'light';
      document.documentElement.classList.toggle('dark', currentTheme === 'dark');
    }
  });

  const navigation = [
    { 
      name: 'Dashboard', 
      href: '/dashboard', 
      icon: TrendingUp,
      description: 'Resumen y análisis financiero'
    },
    { 
      name: 'Transacciones', 
      href: '/transactions', 
      icon: CreditCard,
      description: 'Ver y gestionar transacciones'
    },
    { 
      name: 'Importar CSV', 
      href: '/import', 
      icon: Upload,
      description: 'Importar transacciones desde archivo CSV'
    },
    { 
      name: 'Gestión', 
      href: '/manage', 
      icon: Settings,
      description: 'Categorías, presupuestos y ahorros',
      subItems: [
        { name: 'Panel de Gestión', href: '/manage' },
        { name: 'Categorías', href: '/categories' },
        { name: 'Presupuestos', href: '/budgets' },
        { name: 'Ahorros', href: '/savings' }
      ]
    },
    { 
      name: 'Inteligencia', 
      href: '/intelligence', 
      icon: Brain,
      description: 'Categorización automática y reglas inteligentes'
    },
    { 
      name: 'Configuración', 
      href: '/settings', 
      icon: Cog,
      description: 'Ajustes y preferencias'
    }
  ];

  let expandedItems = $state<Set<string>>(new Set());

  function isActive(href: string, subItems?: Array<{ href: string }>) {
    // Check main route
    if (href === '/dashboard' && $page.url.pathname === '/') {
      return true;
    }
    if ($page.url.pathname === href || $page.url.pathname.startsWith(href + '/')) {
      return true;
    }
    
    // Check sub-items if they exist
    if (subItems) {
      return subItems.some(sub => 
        $page.url.pathname === sub.href || 
        $page.url.pathname.startsWith(sub.href + '/')
      );
    }
    
    return false;
  }

  function toggleExpanded(itemName: string) {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemName)) {
      newExpanded.delete(itemName);
    } else {
      newExpanded.add(itemName);
    }
    expandedItems = newExpanded;
    
    // Save to localStorage
    if (browser) {
      localStorage.setItem('navigation-expanded', JSON.stringify([...expandedItems]));
    }
  }

  let isDemoMode = $derived(env.PUBLIC_DEMO_MODE === 'true');
</script>

<!-- DaisyUI Drawer System -->
<div class="drawer lg:drawer-open min-h-screen">
  <!-- Mobile drawer toggle -->
  <input id="mobile-drawer" type="checkbox" class="drawer-toggle" bind:checked={mobileMenuOpen} />
  
  <!-- Main content -->
  <div class="drawer-content flex flex-col">
    <!-- Mobile navbar -->
    <div class="navbar bg-base-100 border-b lg:hidden">
      <div class="navbar-start">
        <label for="mobile-drawer" class="btn btn-square btn-ghost drawer-button">
          <Menu class="w-6 h-6" />
        </label>
        <div class="flex items-center gap-3 ml-2">
          <div class="w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-br from-primary to-secondary shadow-sm">
            <TrendingUp class="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 class="text-lg font-bold">Happy Balance</h1>
          </div>
        </div>
      </div>
      <div class="navbar-end">
        <ThemeToggle />
      </div>
    </div>
    <!-- Demo Banner -->
    {#if isDemoMode}
      <DemoBanner />
    {/if}
    
    <!-- Page content -->
    <main class="flex-1 overflow-auto">
      {@render children?.()}
    </main>
  </div>
  
  <!-- Drawer sidebar -->
  <div class="drawer-side">
    <label for="mobile-drawer" class="drawer-overlay"></label>
    <aside class="w-64 lg:w-{sidebarCollapsed ? '20' : '64'} min-h-full bg-base-200 transition-all duration-300">
      <!-- Desktop sidebar header -->
      <div class="navbar bg-base-100 border-b lg:flex hidden">
        <div class="navbar-start">
          {#if !sidebarCollapsed}
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-br from-primary to-secondary shadow-sm">
                <TrendingUp class="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 class="text-lg font-bold">Happy Balance</h1>
                <p class="text-xs opacity-70">Gestión Financiera</p>
              </div>
            </div>
          {:else}
            <div class="w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-br from-primary to-secondary shadow-sm">
              <TrendingUp class="w-5 h-5 text-white" />
            </div>
          {/if}
        </div>
        <div class="navbar-end">
          <ThemeToggle />
          <button
            onclick={layoutStore.toggleSidebar}
            class="btn btn-ghost btn-sm"
            title={sidebarCollapsed ? 'Expandir sidebar' : 'Colapsar sidebar'}
          >
            {#if sidebarCollapsed}
              <ChevronRight class="w-4 h-4" />
            {:else}
              <ChevronLeft class="w-4 h-4" />
            {/if}
          </button>
        </div>
      </div>

      <!-- Navigation menu -->
      <nav class="p-4">
        <ul class="menu menu-vertical w-full">
          {#each navigation as item}
            <li>
              {#if item.subItems && !sidebarCollapsed}
                <!-- Collapsible menu item -->
                <details class="{expandedItems.has(item.name) ? 'open' : ''}">
                  <summary 
                    class="{isActive(item.href, item.subItems) ? 'active' : ''}"
                    onclick={() => toggleExpanded(item.name)}
                  >
                    <item.icon class="w-5 h-5" />
                    <span>{item.name}</span>
                  </summary>
                  <ul>
                    {#each item.subItems as subItem}
                      <li>
                        <a 
                          href={subItem.href}
                          class="{$page.url.pathname === subItem.href ? 'active' : ''}"
                          onclick={() => layoutStore.closeMobileMenu()}
                        >
                          {subItem.name}
                        </a>
                      </li>
                    {/each}
                  </ul>
                </details>
              {:else}
                <!-- Regular menu item -->
                <a 
                  href={item.href}
                  class="{isActive(item.href, item.subItems) ? 'active' : ''} {sidebarCollapsed ? 'tooltip tooltip-right' : ''}"
                  data-tip={sidebarCollapsed ? `${item.name} - ${item.description}` : item.description}
                  onclick={() => layoutStore.closeMobileMenu()}
                >
                  <item.icon class="w-5 h-5" />
                  {#if !sidebarCollapsed}
                    <span>{item.name}</span>
                  {/if}
                </a>
              {/if}
            </li>
          {/each}
        </ul>
      </nav>
    </aside>
  </div>
</div>

<!-- Global notifications -->
<NotificationContainer />