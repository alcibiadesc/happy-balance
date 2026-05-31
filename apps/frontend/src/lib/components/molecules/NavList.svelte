<script lang="ts">
  import NavItem from '../atoms/NavItem.svelte';
  import { t } from '$lib/stores/i18n';
  import { page } from '$app/stores';
  import { sidebarConfig } from '$lib/stores/sidebarConfig';

  interface Props {
    isMobile?: boolean;
    collapsed?: boolean;
    onItemClick?: () => void;
    /** When true, also render bottom-positioned items (Import, Settings) inline. */
    includeBottom?: boolean;
  }

  const {
    isMobile = false,
    collapsed = false,
    onItemClick,
    includeBottom = false,
  }: Props = $props();

  // Get visible top nav items (main navigation area)
  const topItems = $derived(sidebarConfig.getTopItems($sidebarConfig));
  const bottomItems = $derived(includeBottom ? sidebarConfig.getBottomItems($sidebarConfig) : []);

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

  {#if includeBottom && bottomItems.length > 0}
    <div class="nav-list__divider" aria-hidden="true"></div>
    {#each bottomItems as item (item.id)}
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
  {/if}
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

  .nav-list__divider {
    height: 1px;
    margin: var(--space-sm) 0;
    background: var(--border-color);
    opacity: 0.6;
  }
</style>
