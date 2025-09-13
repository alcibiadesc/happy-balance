<script lang="ts">
  import NavItem from '../atoms/NavItem.svelte';
  import { t, currentLanguage } from '$lib/stores/i18n';
  import { goto } from '$app/navigation';
  
  interface Props {
    isMobile?: boolean;
    collapsed?: boolean;
    onItemClick?: () => void;
  }
  
  let { isMobile = false, collapsed = false, onItemClick }: Props = $props();
  
  const navItems = [
    { href: '/', icon: 'layout-dashboard', labelKey: 'navigation.dashboard' },
    { href: '/settings', icon: 'settings', labelKey: 'navigation.settings' }
  ];
  
  function handleImportClick() {
    if (onItemClick) onItemClick();
    goto('/import');
  }
</script>

<nav class="nav-list" class:nav-list--mobile={isMobile} class:nav-list--collapsed={collapsed}>
  <!-- Main Navigation -->
  {#each navItems as item}
    <NavItem 
      href={item.href} 
      icon={item.icon} 
      {collapsed}
      onclick={onItemClick}
    >
      {collapsed ? '' : $t(item.labelKey)}
    </NavItem>
  {/each}
  
  <!-- Import Button -->
  <div class="import-section">
    <div class="import-divider"></div>
    <button 
      class="import-button"
      class:import-button--collapsed={collapsed}
      onclick={handleImportClick}
      title={collapsed ? $t('navigation.import') : ''}
    >
      <svg class="import-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
      </svg>
      {#if !collapsed}
        <span class="import-text">{$t('navigation.import')}</span>
      {/if}
    </button>
  </div>
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
  
  .import-section {
    margin-top: var(--space-lg);
    padding-top: var(--space-md);
    width: 100%;
  }
  
  .import-divider {
    height: 1px;
    background: rgba(2, 60, 70, 0.08);
    margin-bottom: var(--space-md);
  }
  
  .import-button {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    padding: 0.75rem 1rem;
    background: var(--acapulco);
    color: var(--bridesmaid);
    border: none;
    border-radius: 0.5rem;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    gap: 0.5rem;
    white-space: nowrap;
    overflow: hidden;
  }
  
  .import-button--collapsed {
    width: 2.5rem;
    height: 2.5rem;
    padding: 0.5rem;
    border-radius: 0.75rem;
  }
  
  .import-icon {
    width: 1rem;
    height: 1rem;
    flex-shrink: 0;
  }
  
  .import-text {
    opacity: 1;
    transition: opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }
  
  .import-button--collapsed .import-text {
    opacity: 0;
    width: 0;
    overflow: hidden;
  }
  
  .import-button:hover {
    background: #6ba696;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(122, 186, 165, 0.3);
  }
  
  .import-button:focus {
    outline: none;
    box-shadow: 0 0 0 3px rgba(122, 186, 165, 0.3);
  }
  
  /* Dark mode adjustments */
  @media (prefers-color-scheme: dark) {
    .import-divider {
      background: rgba(254, 247, 238, 0.1);
    }
  }
  
  html.dark .import-divider {
    background: rgba(254, 247, 238, 0.1);
  }
</style>
