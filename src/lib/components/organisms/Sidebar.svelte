<script lang="ts">
  import { onMount } from 'svelte';
  import SidebarHeader from '../molecules/SidebarHeader.svelte';
  import SidebarNavigation from '../molecules/SidebarNavigation.svelte';
  import SidebarFooter from '../molecules/SidebarFooter.svelte';
  import { sidebarCollapsed, toggleSidebar, initSidebar } from '$lib/stores/sidebar';

  onMount(() => {
    initSidebar();
  });
</script>

<!-- Desktop Sidebar -->
<aside class="sidebar" class:sidebar--collapsed={$sidebarCollapsed}>
  <div class="sidebar-container">
    <SidebarHeader collapsed={$sidebarCollapsed} onToggle={toggleSidebar} />
    <SidebarNavigation collapsed={$sidebarCollapsed} />
    <SidebarFooter collapsed={$sidebarCollapsed} />
  </div>
</aside>

<style>
  .sidebar {
    position: fixed;
    left: 0;
    top: 0;
    height: 100vh;
    width: 280px;
    z-index: 30;
    display: none;
    background: var(--surface-elevated);
    border-right: 1px solid var(--border-color);
    box-shadow: var(--shadow-sm);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .sidebar--collapsed {
    width: 80px;
  }

  .sidebar-container {
    display: flex;
    flex-direction: column;
    height: 100%;
    width: 100%;
    overflow: hidden;
  }

  /* Show sidebar on desktop */
  @media (min-width: 1024px) {
    .sidebar {
      display: block;
    }
  }

  /* Improved visual hierarchy */
  .sidebar::before {
    content: '';
    position: absolute;
    top: 0;
    right: 0;
    width: 1px;
    height: 100%;
    background: linear-gradient(
      180deg,
      transparent 0%,
      var(--border-color) 20%,
      var(--border-color) 80%,
      transparent 100%
    );
    z-index: 1;
  }

  /* Smooth hover states */
  .sidebar:hover {
    box-shadow: var(--shadow-md);
  }

  /* Handle reduced motion */
  @media (prefers-reduced-motion: reduce) {
    .sidebar {
      transition: none;
    }
  }
</style>