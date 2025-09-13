<script lang="ts">
  import NavList from './NavList.svelte';

  interface Props {
    collapsed: boolean;
  }

  let { collapsed }: Props = $props();
</script>

<nav class="sidebar-navigation" class:sidebar-navigation--collapsed={collapsed}>
  <NavList {collapsed} />
</nav>

<style>
  .sidebar-navigation {
    flex: 1;
    padding: var(--space-lg) var(--space-lg) 0;
    overflow-y: auto;
    overflow-x: hidden;
    scrollbar-width: thin;
    scrollbar-color: var(--text-muted) transparent;
  }

  .sidebar-navigation--collapsed {
    padding: var(--space-md) var(--space-sm) 0;
  }

  .sidebar-navigation::-webkit-scrollbar {
    width: 4px;
  }

  .sidebar-navigation::-webkit-scrollbar-track {
    background: transparent;
  }

  .sidebar-navigation::-webkit-scrollbar-thumb {
    background: var(--text-muted);
    border-radius: 2px;
    opacity: 0.3;
  }

  .sidebar-navigation::-webkit-scrollbar-thumb:hover {
    opacity: 0.6;
  }
</style>