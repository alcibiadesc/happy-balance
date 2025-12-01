<script lang="ts">
  import NavItem from '../atoms/NavItem.svelte';
  import { t } from '$lib/stores/i18n';
  import { page } from '$app/stores';
  import { sidebarConfig } from '$lib/stores/sidebarConfig';

  interface Props {
    isMobile?: boolean;
    collapsed?: boolean;
    onItemClick?: () => void;
  }

  const { isMobile = false, collapsed = false, onItemClick }: Props = $props();

  // Get visible top nav items (main navigation area)
  const topItems = $derived(sidebarConfig.getTopItems($sidebarConfig));

  // Get current path to highlight active item
  const currentPath = $derived($page.url.pathname);
</script>

<nav class="nav-list" class:nav-list--mobile={isMobile} class:nav-list--collapsed={collapsed}>
  {#each topItems as item (item.id)}
    <NavItem
      href={item.href}
      icon={item.icon}
      {collapsed}
      isActive={currentPath === item.href}
      onclick={onItemClick}
    >
      {collapsed ? '' : $t(item.labelKey)}
    </NavItem>
  {/each}
</nav>

<style>
  .nav-list {
    display: flex;
    flex-direction: column;
    gap: var(--space-xs);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .nav-list--mobile {
    gap: var(--space-sm);
  }

  .nav-list--collapsed {
    align-items: center;
  }

  .nav-list--mobile :global(.nav-item) {
    padding: var(--space-md) var(--space-lg);
    border-radius: 0;
  }
</style>
