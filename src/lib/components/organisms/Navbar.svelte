<script lang="ts">
  import { Menu, X, ChevronLeft, ChevronRight, Upload } from 'lucide-svelte';
  import { browser } from '$app/environment';
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';

  import Brand from '../atoms/Brand.svelte';
  import ThemeToggle from '../atoms/ThemeToggle.svelte';
  import NavList from '../molecules/NavList.svelte';
  import { sidebarCollapsed, toggleSidebar, initSidebar } from '$lib/stores/sidebar';

  // Mobile sidebar state
  let isMobileSidebarOpen = $state(false);

  function toggleMobileSidebar() {
    isMobileSidebarOpen = !isMobileSidebarOpen;
  }

  function closeMobileSidebar() {
    isMobileSidebarOpen = false;
  }

  function handleImportClick() {
    goto('/import');
  }

  // Close sidebar on escape key
  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape' && isMobileSidebarOpen) {
      closeMobileSidebar();
    }
  }

  onMount(() => {
    // Initialize sidebar state
    initSidebar();
    // Close sidebar when clicking outside
    const handleOutsideClick = (event: Event) => {
      if (isMobileSidebarOpen) {
        const sidebar = document.querySelector('.mobile-sidebar');
        const toggle = document.querySelector('.mobile-menu-toggle');

        if (sidebar && toggle &&
            !sidebar.contains(event.target as Node) &&
            !toggle.contains(event.target as Node)) {
          closeMobileSidebar();
        }
      }
    };

    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  });
</script>

<!-- Mobile Header -->
<header class="mobile-header" class:mobile-header--blur={isMobileSidebarOpen}>
  <div class="mobile-header__content">
    <div class="mobile-header__start">
      <button
        class="mobile-menu-toggle"
        onclick={toggleMobileSidebar}
        aria-label="Open menu"
        aria-expanded={isMobileSidebarOpen}
        aria-controls="mobile-sidebar"
      >
        <Menu size={20} strokeWidth={2} />
      </button>
      <Brand showText={false} size="sm" />
    </div>

    <div class="mobile-header__end">
      <ThemeToggle size="sm" />
    </div>
  </div>
</header>

<!-- Desktop Sidebar -->
<aside class="desktop-sidebar" class:desktop-sidebar--collapsed={$sidebarCollapsed}>
  <div class="sidebar-container">
    <!-- Sidebar Header -->
    <header class="sidebar-header">
      {#if !$sidebarCollapsed}
        <Brand size="md" />
        <div class="sidebar-header-controls">
          <ThemeToggle size="sm" />
          <button
            class="sidebar-collapse-toggle"
            onclick={toggleSidebar}
            aria-label="Collapse sidebar"
          >
            <ChevronLeft size={18} strokeWidth={2} />
          </button>
        </div>
      {:else}
        <button
          class="sidebar-expand-toggle"
          onclick={toggleSidebar}
          aria-label="Expand sidebar"
          title="Expand sidebar"
        >
          <ChevronRight size={18} strokeWidth={2} />
        </button>
      {/if}
    </header>

    <!-- Navigation -->
    <div class="sidebar-content">
      <NavList collapsed={$sidebarCollapsed} />
    </div>

    <!-- Sidebar Footer (solo cuando está colapsado) -->
    {#if $sidebarCollapsed}
      <div class="sidebar-footer">
        <button
          class="collapsed-import-btn"
          onclick={handleImportClick}
          aria-label="Import transactions"
          title="Import transactions"
        >
          <Upload size={18} strokeWidth={2} />
        </button>
        
        <ThemeToggle size="sm" collapsed={true} />
      </div>
    {/if}
  </div>
</aside>

<!-- Mobile Sidebar Overlay -->
{#if isMobileSidebarOpen}
  <div
    class="mobile-overlay"
    onclick={closeMobileSidebar}
    aria-hidden="true"
  ></div>
{/if}

<!-- Mobile Sidebar -->
<aside
  class="mobile-sidebar"
  class:mobile-sidebar--open={isMobileSidebarOpen}
  id="mobile-sidebar"
  aria-hidden={!isMobileSidebarOpen}
>
  <div class="mobile-sidebar__container">
    <!-- Mobile Sidebar Header -->
    <header class="mobile-sidebar__header">
      <Brand size="sm" />
      <button
        class="mobile-sidebar__close"
        onclick={closeMobileSidebar}
        aria-label="Close menu"
      >
        <X size={18} strokeWidth={2} />
      </button>
    </header>

    <!-- Mobile Navigation -->
    <div class="mobile-sidebar__content">
      <NavList />
    </div>
  </div>
</aside>

<!-- Handle keyboard events -->
<svelte:window onkeydown={handleKeydown} />

<style>
  /* Mobile Header */
  .mobile-header {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 40;
    display: block;
    background: var(--surface-elevated);
    backdrop-filter: blur(20px);
    border-bottom: 1px solid rgba(2, 60, 70, 0.1);
    box-shadow: var(--shadow-sm);
    transition: all 0.2s ease;
  }

  .mobile-header--blur {
    backdrop-filter: blur(8px);
    opacity: 0.95;
  }

  .mobile-header__content {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.75rem 1rem;
    max-width: 100%;
  }

  .mobile-header__start {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .mobile-header__end {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .mobile-menu-toggle {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2.5rem;
    height: 2.5rem;
    border-radius: var(--radius-lg);
    border: 0;
    background: transparent;
    color: var(--text-secondary);
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .mobile-menu-toggle:hover {
    background: var(--surface-muted);
    color: var(--text-primary);
    transform: translateY(-1px);
  }

  .mobile-menu-toggle:focus {
    outline: none;
    box-shadow: 0 0 0 2px var(--primary-light), 0 0 0 4px rgba(2, 60, 70, 0.1);
  }

  /* Desktop Sidebar */
  .desktop-sidebar {
    position: fixed;
    left: 0;
    top: 0;
    height: 100%;
    width: 280px;
    z-index: 30;
    display: none;
    background: var(--surface-elevated);
    border-right: 1px solid rgba(2, 60, 70, 0.08);
    box-shadow: var(--shadow-sm);
    transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .desktop-sidebar--collapsed {
    width: 80px;
  }

  .sidebar-container {
    display: flex;
    flex-direction: column;
    height: 100%;
    width: 100%;
    padding: var(--space-lg);
    overflow: hidden;
  }

  .sidebar-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-bottom: var(--space-lg);
    border-bottom: 1px solid rgba(2, 60, 70, 0.08);
    margin-bottom: var(--space-lg);
    min-height: 60px;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .sidebar-header-controls {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .sidebar-collapse-toggle,
  .sidebar-expand-toggle {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2rem;
    height: 2rem;
    border-radius: var(--radius-md);
    border: 1px solid var(--border-color);
    background: var(--surface);
    color: var(--text-secondary);
    cursor: pointer;
    transition: all 0.2s ease;
    flex-shrink: 0;
  }

  .sidebar-expand-toggle {
    width: 2.5rem;
    height: 2.5rem;
    border-radius: var(--radius-lg);
    margin: 0 auto;
  }

  .sidebar-collapse-toggle:hover,
  .sidebar-expand-toggle:hover {
    background: var(--surface-muted);
    color: var(--text-primary);
    border-color: var(--acapulco);
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(122, 186, 165, 0.15);
  }

  .sidebar-collapse-toggle:focus,
  .sidebar-expand-toggle:focus {
    outline: none;
    box-shadow: 0 0 0 2px var(--acapulco), 0 0 0 4px rgba(122, 186, 165, 0.2);
  }

  .sidebar-content {
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
    /* Custom scrollbar */
    scrollbar-width: thin;
    scrollbar-color: var(--text-muted) transparent;
  }

  .sidebar-content::-webkit-scrollbar {
    width: 4px;
  }

  .sidebar-content::-webkit-scrollbar-track {
    background: transparent;
  }

  .sidebar-content::-webkit-scrollbar-thumb {
    background: var(--text-muted);
    border-radius: 2px;
    opacity: 0.3;
  }

  .sidebar-footer {
    padding-top: var(--space-md);
    border-top: 1px solid rgba(2, 60, 70, 0.08);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-sm);
    margin-top: auto;
  }

  .collapsed-import-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2.5rem;
    height: 2.5rem;
    border-radius: var(--radius-lg);
    border: 1px solid var(--acapulco);
    background: var(--acapulco);
    color: var(--bridesmaid);
    cursor: pointer;
    transition: all 0.2s ease;
    margin: 0 auto;
  }

  .collapsed-import-btn:hover {
    background: #6ba696;
    border-color: #6ba696;
    transform: translateY(-1px) scale(1.05);
    box-shadow: 0 4px 12px rgba(122, 186, 165, 0.3);
  }

  .collapsed-import-btn:focus {
    outline: none;
    box-shadow: 0 0 0 2px var(--acapulco), 0 0 0 4px rgba(122, 186, 165, 0.2);
  }

  /* Mobile Overlay */
  .mobile-overlay {
    position: fixed;
    inset: 0;
    z-index: 40;
    background: rgba(2, 60, 70, 0.4);
    backdrop-filter: blur(4px);
    animation: fadeIn 0.2s ease-out;
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  /* Mobile Sidebar */
  .mobile-sidebar {
    position: fixed;
    top: 0;
    left: 0;
    height: 100%;
    width: 280px;
    z-index: 50;
    background: var(--surface-elevated);
    box-shadow: var(--shadow-lg);
    transform: translateX(-100%);
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .mobile-sidebar--open {
    transform: translateX(0);
  }

  .mobile-sidebar__container {
    display: flex;
    flex-direction: column;
    height: 100%;
    padding: var(--space-md);
  }

  .mobile-sidebar__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-bottom: var(--space-md);
    margin-bottom: var(--space-md);
    border-bottom: 1px solid rgba(2, 60, 70, 0.08);
  }

  .mobile-sidebar__close {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2.25rem;
    height: 2.25rem;
    border-radius: var(--radius-lg);
    border: 0;
    background: transparent;
    color: var(--text-secondary);
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .mobile-sidebar__close:hover {
    background: var(--surface-muted);
    color: var(--text-primary);
  }

  .mobile-sidebar__content {
    flex: 1;
    overflow-y: auto;
  }

  /* Responsive visibility */
  @media (min-width: 1024px) {
    .mobile-header {
      display: none;
    }
    
    .desktop-sidebar {
      display: block;
    }
  }

  @media (max-width: 1023px) {
    .desktop-sidebar {
      display: none;
    }
  }
</style>
