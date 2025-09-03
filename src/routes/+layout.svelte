<script lang="ts">
  import '../app.css';
  import { Home, BarChart2, CreditCard, Upload, Tag, Menu, X } from 'lucide-svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';

  let { children } = $props();
  let mobileMenuOpen = $state(false);

  const navigation = [
    { name: 'Dashboard', href: '/', icon: Home },
    { name: 'Transacciones', href: '/transactions', icon: CreditCard },
    { name: 'Flujos', href: '/flows', icon: BarChart2 },
    { name: 'Categorías', href: '/categories', icon: Tag },
    { name: 'Importar', href: '/import', icon: Upload }
  ];

  function isActive(href: string) {
    if (href === '/') {
      return $page.url.pathname === '/';
    }
    return $page.url.pathname.startsWith(href);
  }
</script>

<div class="min-h-screen bg-gray-50">
  <!-- Desktop Navigation Sidebar -->
  <div class="hidden md:fixed md:inset-y-0 md:flex md:w-64 md:flex-col">
    <div class="flex min-h-0 flex-1 flex-col bg-white border-r border-gray-200">
      <!-- Logo -->
      <div class="flex h-16 items-center px-6 border-b border-gray-200">
        <h1 class="text-xl font-semibold text-gray-900">Expense Tracker</h1>
      </div>
      
      <!-- Navigation -->
      <nav class="flex-1 px-4 py-6 space-y-2">
        {#each navigation as item}
          <button
            onclick={() => goto(item.href)}
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
  <div class="md:pl-64">
    {#if mobileMenuOpen}
      <!-- Overlay to prevent interaction when mobile menu is open -->
      <div class="md:hidden"></div>
    {/if}
    {@render children?.()}
  </div>
</div>