<script lang="ts">
  import NavItem from '../atoms/NavItem.svelte';
  import { t, currentLanguage } from '$lib/stores/i18n';
  
  interface Props {
    isMobile?: boolean;
    onItemClick?: () => void;
  }
  
  let { isMobile = false, onItemClick }: Props = $props();
  
  const navItems = [
    { href: '/', icon: 'layout-dashboard', labelKey: 'nav.dashboard' },
    { href: '/settings', icon: 'settings', labelKey: 'nav.settings' }
  ];
</script>

<nav class="nav-list" class:nav-list--mobile={isMobile}>
  {#each navItems as item}
    <NavItem 
      href={item.href} 
      icon={item.icon} 
      onclick={onItemClick}
    >
      {$t(item.labelKey)}
    </NavItem>
  {/each}
</nav>

<style>
  .nav-list {
    display: flex;
    flex-direction: column;
    gap: var(--space-xs);
  }
  
  .nav-list--mobile {
    gap: var(--space-sm);
  }
  
  .nav-list--mobile :global(.nav-item) {
    padding: var(--space-md) var(--space-lg);
    border-radius: 0;
  }
</style>
