<script lang="ts">
  import { Menu, X } from 'lucide-svelte';
  import { browser } from '$app/environment';
  import { onMount } from 'svelte';
  
  import Brand from '../atoms/Brand.svelte';
  import ThemeToggle from '../atoms/ThemeToggle.svelte';
  import ImportButton from '../atoms/ImportButton.svelte';
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
        aria-label="Open menu"
        aria-expanded={isMobileSidebarOpen}
        aria-controls="mobile-sidebar"
      >
        <Menu size={20} strokeWidth={2} />
      </button>
      <Brand showText={false} size="sm" />
    </div>
    
    <div class="mobile-header__end">
      <ImportButton href="/import" size="sm" />
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
      <ThemeToggle size="md" />
    </header>
    
    <!-- Navigation -->
    <div class="sidebar-content">
      <NavList />
    </div>
    
    <!-- Import Action -->
    <div class="sidebar-action">
      <ImportButton href="/import" size="md" />
    </div>
    
    <!-- Sidebar Footer -->
    <footer class="sidebar-footer">
      <div class="quote">
        <p class="quote__text">Simplicity is the ultimate sophistication</p>
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
        aria-label="Close menu"
      >
        <X size={18} strokeWidth={2} />
      </button>
    </header>
    
    <!-- Mobile Navigation -->
    <div class="mobile-sidebar__content">
      <NavList />
    </div>
    
    <!-- Mobile Import Action -->
    <div class="mobile-sidebar__action">
      <ImportButton href="/import" size="md" onclick={closeMobileSidebar} />
    </div>
    
    <!-- Mobile Footer -->
    <footer class="mobile-sidebar__footer">
      <div class="quote quote--small">
        <p class="quote__text">Less is more</p>
      </div>
    </footer>
  </div>
</aside>

<!-- Handle keyboard events -->
<svelte:window on:keydown={handleKeydown} />

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
  }
  
  .sidebar-container {
    display: flex;
    flex-direction: column;
    height: 100%;
    width: 100%;
    padding: var(--space-lg);
  }
  
  .sidebar-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-bottom: var(--space-lg);
    border-bottom: 1px solid rgba(2, 60, 70, 0.08);
    margin-bottom: var(--space-lg);
  }
  
  .sidebar-content {
    flex: 1;
    overflow-y: auto;
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
  
  .sidebar-action {
    margin: var(--space-lg) 0;
    padding: var(--space-lg) 0;
    border-top: 1px solid rgba(2, 60, 70, 0.08);
    border-bottom: 1px solid rgba(2, 60, 70, 0.08);
  }
  
  .sidebar-footer {
    margin-top: var(--space-lg);
    padding-top: var(--space-lg);
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
  
  .mobile-sidebar__action {
    margin: var(--space-md) 0;
    padding: var(--space-md) 0;
    border-top: 1px solid rgba(2, 60, 70, 0.08);
    border-bottom: 1px solid rgba(2, 60, 70, 0.08);
  }
  
  .mobile-sidebar__footer {
    margin-top: var(--space-md);
    padding-top: var(--space-md);
  }
  
  /* Quote */
  .quote {
    text-align: center;
    padding: var(--space-sm);
  }
  
  .quote--small {
    padding: var(--space-xs);
  }
  
  .quote__text {
    font-size: 0.75rem;
    font-weight: 300;
    color: var(--text-muted);
    font-style: italic;
    letter-spacing: 0.025em;
    line-height: 1.4;
  }
  
  /* Responsive Design */
  @media (max-width: 1023px) {
    .mobile-header {
      display: block;
    }
    
    .desktop-sidebar {
      display: none;
    }
  }
  
  @media (min-width: 1024px) {
    .mobile-header {
      display: none;
    }
    
    .desktop-sidebar {
      display: flex;
    }
    
    .mobile-sidebar,
    .mobile-overlay {
      display: none;
    }
  }
  
  /* Animation for mobile sidebar */
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
    .sidebar-action,
    .sidebar-footer,
    .mobile-sidebar__header,
    .mobile-sidebar__action,
    .mobile-sidebar__footer {
      border-color: rgba(254, 247, 238, 0.1);
    }
  }
</style>
