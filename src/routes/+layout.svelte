<script lang="ts">
  import '../app.css';
  import { Home, BarChart2, CreditCard, Upload, Tag, Menu, X, TrendingUp, ChevronLeft, ChevronRight, Target, Settings, Cog, PiggyBank } from 'lucide-svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { browser } from '$app/environment';
  import { onMount } from 'svelte';
  import { env } from '$env/dynamic/public';
  import DemoBanner from '$lib/ui/DemoBanner.svelte';
  import { NotificationContainer } from '$lib/ui/components/organisms/NotificationContainer/index.js';

  let { children } = $props();
  let mobileMenuOpen = $state(false);
  let sidebarCollapsed = $state(false);
  
  // Load sidebar state from localStorage
  onMount(() => {
    if (browser) {
      const saved = localStorage.getItem('sidebar-collapsed');
      if (saved !== null) {
        sidebarCollapsed = JSON.parse(saved);
      }
    }
  });
  
  // Save sidebar state when it changes
  function toggleSidebar() {
    sidebarCollapsed = !sidebarCollapsed;
    if (browser) {
      localStorage.setItem('sidebar-collapsed', JSON.stringify(sidebarCollapsed));
    }
  }

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: TrendingUp },
    { name: 'Transacciones', href: '/transactions', icon: CreditCard },
    { name: 'Ahorros', href: '/savings', icon: PiggyBank },
    { name: 'Gestión', href: '/manage', icon: Settings },
    { name: 'Categorías', href: '/categories', icon: Tag },
    { name: 'Presupuestos', href: '/budgets', icon: Target },
    { name: 'Importar', href: '/import', icon: Upload },
    { name: 'Configuración', href: '/settings', icon: Cog }
  ];

  function isActive(href: string) {
    if (href === '/') {
      return $page.url.pathname === '/';
    }
    return $page.url.pathname.startsWith(href);
  }

  let isDemoMode = $derived(env.PUBLIC_DEMO_MODE === 'true');
</script>

<div class="min-h-screen bg-gray-50">
  <!-- Desktop Navigation Sidebar -->
  <div class="hidden md:fixed md:inset-y-0 md:flex {sidebarCollapsed ? 'md:w-20' : 'md:w-64'} md:flex-col transition-all duration-300">
    <div class="flex min-h-0 flex-1 flex-col bg-white border-r border-gray-200">
      <!-- Logo and Collapse Button -->
      <div class="flex h-16 items-center justify-between {sidebarCollapsed ? 'px-4' : 'px-6'} border-b border-gray-200">
        {#if !sidebarCollapsed}
          <h1 class="text-xl font-semibold text-gray-900">Expense Tracker</h1>
        {:else}
          <div class="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
            <TrendingUp class="w-5 h-5 text-indigo-600" />
          </div>
        {/if}
        <button
          onclick={toggleSidebar}
          class="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          title={sidebarCollapsed ? 'Expandir sidebar' : 'Colapsar sidebar'}
        >
          {#if sidebarCollapsed}
            <ChevronRight class="w-5 h-5 text-gray-600" />
          {:else}
            <ChevronLeft class="w-5 h-5 text-gray-600" />
          {/if}
        </button>
      </div>
      
      <!-- Navigation -->
      <nav class="flex-1 {sidebarCollapsed ? 'px-2' : 'px-4'} py-6 space-y-2">
        {#each navigation as item}
          <button
            onclick={() => goto(item.href)}
            class="w-full flex items-center {sidebarCollapsed ? 'justify-center px-3 py-3' : 'gap-3 px-3 py-2'} text-sm font-medium rounded-lg transition-colors {
              isActive(item.href)
                ? 'bg-blue-50 text-blue-600 border border-blue-200'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }"
            title={sidebarCollapsed ? item.name : ''}
          >
            <item.icon class="w-5 h-5" />
            {#if !sidebarCollapsed}
              <span class="truncate">{item.name}</span>
            {/if}
          </button>
        {/each}
      </nav>
    </div>
  </div>

  <!-- Mobile Navigation -->
  <div class="md:hidden">
    <!-- Mobile header -->
    <div class="flex h-16 items-center justify-between px-4 bg-white border-b border-gray-200">
      <h1 class="text-lg font-semibold text-gray-900">Expense Tracker</h1>
      <button
        onclick={() => mobileMenuOpen = !mobileMenuOpen}
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
        onclick={() => mobileMenuOpen = false}
        onkeydown={(e) => e.key === 'Escape' && (mobileMenuOpen = false)}
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
          onclick={() => mobileMenuOpen = false}
          class="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
        >
          <X class="w-5 h-5" />
        </button>
      </div>
      <nav class="px-4 py-6 space-y-2">
        {#each navigation as item}
          <button
            onclick={() => {
              goto(item.href);
              mobileMenuOpen = false;
            }}
            class="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors {
              isActive(item.href)
                ? 'bg-blue-50 text-blue-600 border border-blue-200'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }"
          >
<item.icon class="w-5 h-5" />
            {item.name}
          </button>
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