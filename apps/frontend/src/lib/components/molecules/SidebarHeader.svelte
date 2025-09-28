<script lang="ts">
  import Brand from '../atoms/Brand.svelte';
  import ThemeToggle from '../atoms/ThemeToggle.svelte';
  import SidebarToggle from '../atoms/SidebarToggle.svelte';

  interface Props {
    collapsed: boolean;
    onToggle: () => void;
  }

  let { collapsed, onToggle }: Props = $props();
</script>

<header class="sidebar-header" class:sidebar-header--collapsed={collapsed}>
  {#if !collapsed}
    <div class="sidebar-brand">
      <Brand size="md" />
    </div>

    <div class="sidebar-controls">
      <ThemeToggle size="sm" />
      <SidebarToggle {collapsed} onclick={onToggle} size="sm" />
    </div>
  {:else}
    <div class="sidebar-collapsed-header">
      <SidebarToggle {collapsed} onclick={onToggle} size="md" />
      <ThemeToggle size="sm" collapsed={true} />
    </div>
  {/if}
</header>

<style>
  .sidebar-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--space-lg);
    border-bottom: 1px solid var(--border-color);
    min-height: 80px;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .sidebar-header--collapsed {
    padding: var(--space-md);
    justify-content: center;
  }

  .sidebar-brand {
    flex: 1;
  }

  .sidebar-controls {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
  }

  .sidebar-collapsed-header {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-md);
  }
</style>