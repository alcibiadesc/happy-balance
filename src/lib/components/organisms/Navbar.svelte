<script lang="ts">
  import { Menu, X } from 'lucide-svelte';
  import { browser } from '$app/environment';
  import { onMount } from 'svelte';
  
  import Brand from '../atoms/Brand.svelte';
  import ThemeToggle from '../atoms/ThemeToggle.svelte';
  import NavList from '../molecules/NavList.svelte';
  
  // Mobile sidebar state
  let isMobileSidebarOpen = $state(false);
  
  function toggleMobileSidebar() {
    isMobileSidebarOpen = !isMobileSidebarOpen;
  }
  
  function closeMobileSidebar() {
    isMobileSidebarOpen = false;
  }
  
  // Close sidebar on escape key
  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape' && isMobileSidebarOpen) {
      closeMobileSidebar();
    }
  }
  
  onMount(() => {
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
        aria-label="メニューを開く"
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
<aside class="desktop-sidebar">
  <div class="sidebar-container">
    <!-- Sidebar Header -->
    <header class="sidebar-header">
      <Brand size="md" />
      <ThemeToggle size="sm" />
    </header>
    
    <!-- Navigation -->
    <div class="sidebar-content">
      <NavList />
    </div>
    
    <!-- Sidebar Footer -->
    <footer class="sidebar-footer">
      <div class="zen-quote">
        <p class="zen-quote__text">シンプルは美しい</p>
        <p class="zen-quote__translation">Simplicity is beautiful</p>
      </div>
    </footer>
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
        aria-label="メニューを閉じる"
      >
        <X size={18} strokeWidth={2} />
      </button>
    </header>
    
    <!-- Mobile Navigation -->
    <div class="mobile-sidebar__content">
      <NavList />
    </div>
    
    <!-- Mobile Footer -->
    <footer class="mobile-sidebar__footer">
      <div class="zen-quote zen-quote--small">
        <p class="zen-quote__text">和</p>
        <p class="zen-quote__translation">Harmony</p>
      </div>
    </footer>
  </div>
</aside>

<!-- Handle keyboard events -->
<svelte:window on:keydown={handleKeydown} />

<style>
  /* Mobile Header */
  .mobile-header {
    @apply fixed top-0 left-0 right-0 z-40 lg:hidden;
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
    @apply flex items-center justify-between px-4 py-3;
    max-width: 100%;
  }
  
  .mobile-header__start {
    @apply flex items-center gap-3;
  }
  
  .mobile-header__end {
    @apply flex items-center;
  }
  
  .mobile-menu-toggle {
    @apply flex items-center justify-center w-10 h-10 rounded-lg border-0 cursor-pointer;
    background: transparent;
    color: var(--text-secondary);
    transition: all 0.15s ease;
  }
  
  .mobile-menu-toggle:hover {
    background: var(--surface-muted);
    color: var(--text-primary);
    transform: translateY(-1px);
  }
  
  .mobile-menu-toggle:focus {
    @apply focus-zen;
  }
  
  /* Desktop Sidebar */
  .desktop-sidebar {
    @apply hidden lg:flex fixed left-0 top-0 h-full z-30;
    width: 280px;
    background: var(--surface-elevated);
    border-right: 1px solid rgba(2, 60, 70, 0.08);
    box-shadow: var(--shadow-sm);
  }
  
  .sidebar-container {
    @apply flex flex-col h-full w-full;
    padding: var(--space-lg);
  }
  
  .sidebar-header {
    @apply flex items-center justify-between pb-6;
    border-bottom: 1px solid rgba(2, 60, 70, 0.08);
    margin-bottom: var(--space-lg);
  }
  
  .sidebar-content {
    @apply flex-1 overflow-y-auto;
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
    @apply mt-6 pt-6;
    border-top: 1px solid rgba(2, 60, 70, 0.08);
  }
  
  /* Mobile Overlay */
  .mobile-overlay {
    @apply fixed inset-0 z-40 lg:hidden;
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
    @apply fixed top-0 left-0 h-full z-50 lg:hidden;
    width: 280px;
    background: var(--surface-elevated);
    box-shadow: var(--shadow-lg);
    transform: translateX(-100%);
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }
  
  .mobile-sidebar--open {
    transform: translateX(0);
  }
  
  .mobile-sidebar__container {
    @apply flex flex-col h-full;
    padding: var(--space-md);
  }
  
  .mobile-sidebar__header {
    @apply flex items-center justify-between pb-4 mb-4;
    border-bottom: 1px solid rgba(2, 60, 70, 0.08);
  }
  
  .mobile-sidebar__close {
    @apply flex items-center justify-center w-9 h-9 rounded-lg border-0 cursor-pointer;
    background: transparent;
    color: var(--text-secondary);
    transition: all 0.15s ease;
  }
  
  .mobile-sidebar__close:hover {
    background: var(--surface-muted);
    color: var(--text-primary);
  }
  
  .mobile-sidebar__content {
    @apply flex-1 overflow-y-auto;
  }
  
  .mobile-sidebar__footer {
    @apply mt-4 pt-4;
    border-top: 1px solid rgba(2, 60, 70, 0.08);
  }
  
  /* Zen Quote */
  .zen-quote {
    @apply text-center;
    padding: var(--space-sm);
  }
  
  .zen-quote--small {
    padding: var(--space-xs);
  }
  
  .zen-quote__text {
    @apply text-lg font-light mb-1;
    color: var(--primary);
    font-family: 'Noto Sans JP', sans-serif;
    letter-spacing: 0.1em;
  }
  
  .zen-quote--small .zen-quote__text {
    @apply text-base;
  }
  
  .zen-quote__translation {
    @apply text-xs font-light;
    color: var(--text-muted);
    font-style: italic;
    letter-spacing: 0.05em;
  }
  
  /* Responsive adjustments */
  @media (max-width: 1023px) {
    body {
      padding-top: 64px; /* Account for fixed mobile header */
    }
  }
  
  /* Focus trap for mobile sidebar */
  .mobile-sidebar--open {
    /* Ensure sidebar is accessible when open */
  }
  
  /* Animation for better UX */
  .mobile-sidebar__container {
    animation: slideInFromLeft 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }
  
  @keyframes slideInFromLeft {
    from {
      transform: translateX(-20px);
      opacity: 0.8;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  
  /* Dark mode adjustments */
  @media (prefers-color-scheme: dark) {
    .desktop-sidebar,
    .mobile-sidebar {
      border-color: rgba(254, 247, 238, 0.1);
    }
    
    .sidebar-header,
    .sidebar-footer,
    .mobile-sidebar__header,
    .mobile-sidebar__footer {
      border-color: rgba(254, 247, 238, 0.1);
    }
  }
</style>
