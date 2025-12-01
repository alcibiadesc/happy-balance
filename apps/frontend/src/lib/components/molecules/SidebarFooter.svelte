<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import NavItem from '../atoms/NavItem.svelte';
  import UserMenu from './UserMenu.svelte';
  import { getApiUrl } from '$lib/utils/api-url';
  import { sidebarConfig } from '$lib/stores/sidebarConfig';
  import { t } from '$lib/stores/i18n';

  interface Props {
    collapsed: boolean;
  }

  const { collapsed }: Props = $props();

  // Get bottom nav items (Import, Settings)
  const bottomItems = $derived(sidebarConfig.getBottomItems($sidebarConfig));
  const currentPath = $derived($page.url.pathname);

  let versionInfo = $state<{ version: string; commit: string; buildTimestamp: string } | null>(
    null
  );

  onMount(async () => {
    try {
      const API_BASE = getApiUrl();
      const response = await fetch(`${API_BASE}/version`);
      if (response.ok) {
        versionInfo = await response.json();
      }
    } catch (err) {
      console.error('Failed to load version:', err);
    }
  });

  function formatTimestamp(timestamp: string): string {
    return `v.${timestamp.replace('-', '')}`;
  }
</script>

<footer class="sidebar-footer" class:sidebar-footer--collapsed={collapsed}>
  <!-- Bottom nav items (Import, Settings) -->
  <div class="footer-nav" class:footer-nav--collapsed={collapsed}>
    {#each bottomItems as item (item.id)}
      <NavItem href={item.href} icon={item.icon} {collapsed} isActive={currentPath === item.href}>
        {collapsed ? '' : $t(item.labelKey)}
      </NavItem>
    {/each}
  </div>

  <!-- User profile -->
  <div class="user-section" class:user-section--collapsed={collapsed}>
    <UserMenu {collapsed} />
  </div>

  <!-- Version info -->
  {#if versionInfo}
    <div
      class="version-badge"
      title="Build: {versionInfo.buildTimestamp}&#10;Commit: {versionInfo.commit}"
    >
      {formatTimestamp(versionInfo.buildTimestamp)}
    </div>
  {/if}
</footer>

<style>
  .sidebar-footer {
    display: flex;
    flex-direction: column;
    gap: var(--space-sm);
    padding: var(--space-md) var(--space-lg);
    border-top: 1px solid var(--border-color);
    margin-top: auto;
  }

  .sidebar-footer--collapsed {
    align-items: center;
    padding: var(--space-md);
  }

  .footer-nav {
    display: flex;
    flex-direction: column;
    gap: var(--space-xs);
  }

  .footer-nav--collapsed {
    align-items: center;
    width: 100%;
  }

  .user-section {
    padding-top: var(--space-sm);
    border-top: 1px solid var(--border-color);
    margin-top: var(--space-xs);
  }

  .user-section--collapsed {
    display: flex;
    justify-content: center;
    width: 100%;
  }

  .version-badge {
    font-size: 0.625rem;
    color: var(--text-tertiary);
    font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Fira Code', monospace;
    padding: var(--space-xs);
    text-align: center;
    cursor: help;
    opacity: 0.7;
  }
</style>
