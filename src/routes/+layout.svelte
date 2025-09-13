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

<div class="min-h-screen" style="background-color: var(--color-background-primary); color: var(--color-text-primary);">
  <!-- Desktop Navigation Sidebar -->
  <div class="hidden md:fixed md:inset-y-0 md:flex {sidebarCollapsed ? 'md:w-20' : 'md:w-64'} md:flex-col transition-all duration-300">
    <div class="flex min-h-0 flex-1 flex-col border-r" style="background-color: var(--color-background-elevated); border-color: var(--color-border-primary);">
      <!-- Logo and Collapse Button -->
      <div class="flex h-16 items-center justify-between {sidebarCollapsed ? 'px-4' : 'px-6'} border-b" style="border-color: var(--color-border-primary);">
        {#if !sidebarCollapsed}
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 rounded-lg flex items-center justify-center shadow-sm" style="background: linear-gradient(135deg, var(--color-dusty-pink) 0%, var(--color-coral-pastel) 100%);">
              <TrendingUp class="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 class="text-lg font-bold" style="color: var(--color-text-primary);">Happy Balance</h1>
              <p class="text-xs" style="color: var(--color-text-tertiary);">Gestión Financiera</p>
            </div>
          </div>
        {:else}
          <div class="w-8 h-8 rounded-lg flex items-center justify-center shadow-sm" style="background: linear-gradient(135deg, var(--color-dusty-pink) 0%, var(--color-coral-pastel) 100%);">
            <TrendingUp class="w-5 h-5 text-white" />
          </div>
        {/if}
        <div class="flex items-center gap-1">
          <ThemeToggle />
          <button
            onclick={layoutStore.toggleSidebar}
            class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title={sidebarCollapsed ? 'Expandir sidebar' : 'Colapsar sidebar'}
          >
            {#if sidebarCollapsed}
              <ChevronRight class="w-5 h-5 text-gray-600 dark:text-gray-400" />
            {:else}
              <ChevronLeft class="w-5 h-5 text-gray-600 dark:text-gray-400" />
            {/if}
          </button>
        </div>
      </div>
      
      <!-- Navigation -->
      <nav class="flex-1 {sidebarCollapsed ? 'px-2' : 'px-4'} py-6 space-y-1">
        {#each navigation as item}
          <div class="space-y-1">
            <!-- Main Navigation Item -->
            <div class="flex items-center">
              <button
                onclick={() => {
                  if (item.subItems && !sidebarCollapsed) {
                    toggleExpanded(item.name);
                  } else {
                    goto(item.href);
                  }
                }}
                class="flex-1 flex items-center {sidebarCollapsed ? 'justify-center px-3 py-3' : 'gap-3 px-3 py-2'} text-sm font-medium rounded-lg transition-colors {
                  isActive(item.href, item.subItems)
                    ? 'bg-blue-50 text-blue-600 border border-blue-200'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }"
                title={sidebarCollapsed ? `${item.name} - ${item.description}` : item.description}
              >
                <item.icon class="w-5 h-5 flex-shrink-0" />
                {#if !sidebarCollapsed}
                  <span class="truncate flex-1 text-left">{item.name}</span>
                  {#if item.subItems}
                    <svg class="w-4 h-4 transition-transform {expandedItems.has(item.name) ? 'rotate-90' : ''}" 
                         fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                    </svg>
                  {/if}
                {/if}
              </button>
              
              <!-- Quick Access Button for items with subitems -->
              {#if item.subItems && !sidebarCollapsed}
                <button
                  onclick={() => goto(item.href)}
                  class="ml-1 p-1.5 text-gray-400 hover:text-gray-600 rounded transition-colors"
                  title="Ir a {item.name}"
                  aria-label="Ir a {item.name}"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </button>
              {/if}
            </div>
            
            <!-- Sub Navigation Items -->
            {#if item.subItems && !sidebarCollapsed && expandedItems.has(item.name)}
              <div class="ml-6 space-y-1 border-l border-gray-200 pl-4">
                {#each item.subItems as subItem}
                  <button
                    onclick={() => goto(subItem.href)}
                    class="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors {
                      $page.url.pathname === subItem.href || $page.url.pathname.startsWith(subItem.href + '/')
                        ? 'bg-blue-50 text-blue-600 font-medium'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                    }"
                  >
                    <div class="w-1.5 h-1.5 rounded-full bg-current opacity-50"></div>
                    <span class="truncate">{subItem.name}</span>
                  </button>
                {/each}
              </div>
            {/if}
          </div>
        {/each}
      </nav>
    </div>
  </div>

  <!-- Mobile Navigation -->
  <div class="md:hidden">
    <!-- Mobile header -->
    <div class="flex h-16 items-center justify-between px-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <div class="flex items-center gap-3">
        <div class="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-sm">
          <TrendingUp class="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 class="text-lg font-bold text-gray-900">Happy Balance</h1>
          <p class="text-xs text-gray-500">Gestión Financiera</p>
        </div>
      </div>
      <button
        onclick={layoutStore.toggleMobileMenu}
        class="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
      >
        {#if mobileMenuOpen}
          <X class="w-6 h-6" />
        {:else}
          <Menu class="w-6 h-6" />
        {/if}
      </button>
    </div>

    <!-- Mobile menu overlay -->
    {#if mobileMenuOpen}
      <div 
        class="fixed inset-0 z-20 bg-black bg-opacity-25" 
        onclick={layoutStore.closeMobileMenu}
        onkeydown={(e) => e.key === 'Escape' && layoutStore.closeMobileMenu()}
        role="button"
        aria-label="Close mobile menu"
        tabindex="0"
      ></div>
    {/if}

    <!-- Mobile menu -->
    <div class="fixed top-0 right-0 z-30 h-full w-64 bg-white transform transition-transform {
      mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
    }">
      <div class="flex h-16 items-center justify-between px-4 border-b border-gray-200">
        <h1 class="text-lg font-semibold text-gray-900">Menú</h1>
        <button
          onclick={layoutStore.closeMobileMenu}
          class="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
        >
          <X class="w-5 h-5" />
        </button>
      </div>
      <nav class="px-4 py-6 space-y-1">
        {#each navigation as item}
          <div class="space-y-1">
            <!-- Main Navigation Item -->
            <div class="flex items-center">
              <button
                onclick={() => {
                  if (item.subItems) {
                    toggleExpanded(item.name);
                  } else {
                    goto(item.href);
                    layoutStore.closeMobileMenu();
                  }
                }}
                class="flex-1 flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors {
                  isActive(item.href, item.subItems)
                    ? 'bg-blue-50 text-blue-600 border border-blue-200'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }"
              >
                <item.icon class="w-5 h-5 flex-shrink-0" />
                <span class="truncate flex-1 text-left">{item.name}</span>
                {#if item.subItems}
                  <svg class="w-4 h-4 transition-transform {expandedItems.has(item.name) ? 'rotate-90' : ''}" 
                       fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                  </svg>
                {/if}
              </button>
              
              <!-- Quick Access Button -->
              {#if item.subItems}
                <button
                  onclick={() => {
                    goto(item.href);
                    layoutStore.closeMobileMenu();
                  }}
                  class="ml-1 p-1.5 text-gray-400 hover:text-gray-600 rounded transition-colors"
                  title="Ir a {item.name}"
                  aria-label="Ir a {item.name}"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </button>
              {/if}
            </div>
            
            <!-- Sub Navigation Items -->
            {#if item.subItems && expandedItems.has(item.name)}
              <div class="ml-6 space-y-1 border-l border-gray-200 pl-4">
                {#each item.subItems as subItem}
                  <button
                    onclick={() => {
                      goto(subItem.href);
                      layoutStore.closeMobileMenu();
                    }}
                    class="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors {
                      $page.url.pathname === subItem.href || $page.url.pathname.startsWith(subItem.href + '/')
                        ? 'bg-blue-50 text-blue-600 font-medium'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                    }"
                  >
                    <div class="w-1.5 h-1.5 rounded-full bg-current opacity-50"></div>
                    <span class="truncate">{subItem.name}</span>
                  </button>
                {/each}
              </div>
            {/if}
          </div>
        {/each}
      </nav>
    </div>
  </div>

  <!-- Main content -->
  <div class="{sidebarCollapsed ? 'md:pl-20' : 'md:pl-64'} transition-all duration-300">
    <!-- Demo Banner -->
    {#if isDemoMode}
      <DemoBanner />
    {/if}
    
    {#if mobileMenuOpen}
      <!-- Overlay to prevent interaction when mobile menu is open -->
      <div class="md:hidden"></div>
    {/if}
    {@render children?.()}
  </div>

  <!-- Global notifications -->
  <NotificationContainer />
</div>