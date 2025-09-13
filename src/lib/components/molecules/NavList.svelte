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
    {#if !collapsed}
      <div class="import-divider"></div>
    {/if}
    
    <button 
      class="import-button"
      class:import-button--collapsed={collapsed}
      onclick={handleImportClick}
      title={$t('navigation.import')}
      aria-label={$t('navigation.import')}
    >
      <div class="import-button__icon">
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
      </div>
      {#if !collapsed}
        <span class="import-button__text">{$t('navigation.import')}</span>
        <div class="import-button__arrow">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </div>
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
  
  .nav-list--collapsed .import-section {
    margin-top: var(--space-md);
    padding-top: 0;
  }
  
  .import-divider {
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(122, 186, 165, 0.3), transparent);
    margin-bottom: var(--space-md);
  }
  
  .import-button {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: flex-start;
    width: 100%;
    padding: 0.875rem 1rem;
    background: linear-gradient(135deg, var(--acapulco), #6ba696);
    color: var(--bridesmaid);
    border: 1px solid var(--acapulco);
    border-radius: var(--radius-lg);
    font-size: 0.875rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    gap: 0.75rem;
    white-space: nowrap;
    overflow: hidden;
    box-shadow: 0 2px 8px rgba(122, 186, 165, 0.2);
  }
  
  .import-button--collapsed {
    width: 2.5rem;
    height: 2.5rem;
    padding: 0.5rem;
    border-radius: 0.75rem;
    justify-content: center;
  }
  
  .import-button__icon {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    width: 1.125rem;
    height: 1.125rem;
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }
  
  .import-button--collapsed .import-button__icon {
    width: 1.25rem;
    height: 1.25rem;
  }
  
  .import-button__icon svg {
    width: 100%;
    height: 100%;
  }
  
  .import-button__text {
    flex: 1;
    text-align: left;
    opacity: 1;
    transform: translateX(0);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }
  
  .import-button__arrow {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 1rem;
    height: 1rem;
    opacity: 0.7;
    transform: translateX(0);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }
  
  .import-button__arrow svg {
    width: 100%;
    height: 100%;
  }
  
  /* Hover effects */
  .import-button:hover {
    background: linear-gradient(135deg, #8fc4af, var(--acapulco));
    border-color: #8fc4af;
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(122, 186, 165, 0.4);
  }
  
  .import-button--collapsed:hover {
    transform: translateY(-2px) scale(1.05);
    box-shadow: 0 4px 16px rgba(122, 186, 165, 0.5);
  }
  
  .import-button:hover .import-button__icon {
    transform: scale(1.1) rotate(5deg);
  }
  
  .import-button--collapsed:hover .import-button__icon {
    transform: scale(1.2) rotate(10deg);
  }
  
  .import-button:hover .import-button__arrow {
    opacity: 1;
    transform: translateX(4px);
  }
  
  .import-button:active {
    transform: translateY(0);
    box-shadow: 0 2px 8px rgba(122, 186, 165, 0.3);
  }
  
  .import-button--collapsed:active {
    transform: translateY(-1px) scale(1.02);
  }
  
  .import-button:focus {
    outline: none;
    box-shadow: 0 0 0 3px rgba(122, 186, 165, 0.4), 0 2px 8px rgba(122, 186, 165, 0.2);
  }
  
  .import-button--collapsed:focus {
    box-shadow: 0 0 0 3px rgba(122, 186, 165, 0.5), 0 4px 16px rgba(122, 186, 165, 0.3);
  }
  
  /* Dark mode adjustments */
  html.dark .import-divider {
    background: linear-gradient(90deg, transparent, rgba(122, 186, 165, 0.4), transparent);
  }
  
  html.dark .import-button {
    background: linear-gradient(135deg, var(--acapulco), #8fc4af);
    color: var(--evening-sea);
    border-color: rgba(122, 186, 165, 0.6);
    box-shadow: 0 2px 8px rgba(122, 186, 165, 0.3);
  }
  
  html.dark .import-button:hover {
    background: linear-gradient(135deg, #9ac7b3, var(--acapulco));
    border-color: #9ac7b3;
    box-shadow: 0 6px 20px rgba(122, 186, 165, 0.5);
  }
  
  html.dark .import-button--collapsed:hover {
    box-shadow: 0 4px 16px rgba(122, 186, 165, 0.6);
  }
</style>
