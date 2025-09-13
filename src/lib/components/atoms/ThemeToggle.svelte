<script lang="ts">
  import { Sun, Moon } from 'lucide-svelte';
  import { browser } from '$app/environment';
  import { onMount } from 'svelte';
  import { theme, setTheme, effectiveTheme } from '$lib/stores/theme';
  
  interface Props {
    size?: 'sm' | 'md';
    collapsed?: boolean;
  }
  
  let { size = 'md', collapsed = false }: Props = $props();
  
  let mounted = $state(false);
  
  const iconSizes = {
    sm: 16,
    md: 18
  };
  
  // Get current effective theme (reactive)
  let isDark = $derived($effectiveTheme === 'dark');
  
  function toggleTheme() {
    // Toggle between light and dark (not system)
    const newTheme = isDark ? 'light' : 'dark';
    setTheme(newTheme);
    
    if (browser && mounted) {
      // Visual feedback - briefly change the button
      const button = document.querySelector('.theme-toggle');
      button?.classList.add('theme-toggle--active');
      setTimeout(() => {
        button?.classList.remove('theme-toggle--active');
      }, 200);
    }
  }
  
  onMount(() => {
    mounted = true;
  });
</script>

<button 
  class="theme-toggle theme-toggle--{size}"
  class:theme-toggle--collapsed={collapsed}
  onclick={toggleTheme}
  aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
  title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
  disabled={!mounted}
>
  <div class="theme-toggle__icon">
    {#if mounted}
      {#if isDark}
        <Sun size={iconSizes[size]} strokeWidth={2} />
      {:else}
        <Moon size={iconSizes[size]} strokeWidth={2} />
      {/if}
    {:else}
      <!-- Loading state -->
      <div class="theme-toggle__loading"></div>
    {/if}
  </div>
</button>

<style>
  .theme-toggle {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50% !important;
    border: 1px solid rgba(122, 186, 165, 0.2);
    background: var(--surface-elevated);
    color: var(--text-secondary);
    cursor: pointer;
    transition: all 0.2s ease;
    box-shadow: var(--shadow-sm);
    aspect-ratio: 1 / 1;
  }
  
  .theme-toggle:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  .theme-toggle--sm {
    width: 2rem;
    height: 2rem;
  }
  
  .theme-toggle--md {
    width: 2.5rem;
    height: 2.5rem;
  }
  
  .theme-toggle--collapsed {
    width: 2.5rem !important;
    height: 2.5rem !important;
    border-radius: var(--radius-lg) !important;
    margin: 0 auto;
  }
  
  .theme-toggle:hover:not(:disabled) {
    background: var(--success-light);
    color: var(--success);
    border-color: var(--success);
    transform: translateY(-1px);
    box-shadow: var(--shadow-md);
  }
  
  .theme-toggle--collapsed:hover:not(:disabled) {
    transform: translateY(-2px) scale(1.05);
    box-shadow: 0 4px 12px rgba(122, 186, 165, 0.25);
  }
  
  .theme-toggle:active:not(:disabled) {
    transform: translateY(0);
    box-shadow: var(--shadow-sm);
  }
  
  .theme-toggle--collapsed:active:not(:disabled) {
    transform: translateY(-1px) scale(1.02);
  }
  
  .theme-toggle--active {
    background: var(--warning-light) !important;
    color: var(--warning) !important;
    border-color: var(--warning) !important;
    transform: scale(1.1) !important;
  }
  
  .theme-toggle__icon {
    display: flex;
    align-items: center;
    justify-content: center;
    transition: transform 0.3s ease;
  }
  
  .theme-toggle:hover:not(:disabled) .theme-toggle__icon {
    transform: rotate(15deg);
  }
  
  .theme-toggle--collapsed:hover:not(:disabled) .theme-toggle__icon {
    transform: rotate(25deg) scale(1.1);
  }
  
  .theme-toggle__loading {
    width: 12px;
    height: 12px;
    border: 2px solid var(--text-muted);
    border-top: 2px solid var(--primary);
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  /* Focus state */
  .theme-toggle:focus {
    outline: none;
    box-shadow: 0 0 0 2px var(--primary-light), 0 0 0 4px rgba(2, 60, 70, 0.1);
  }
  
  .theme-toggle--collapsed:focus {
    box-shadow: 0 0 0 2px var(--acapulco), 0 0 0 4px rgba(122, 186, 165, 0.2);
  }
  
  /* Dark mode specific styles */
  html.dark .theme-toggle {
    background: var(--surface-elevated);
    border-color: rgba(122, 186, 165, 0.3);
  }
  
  html.dark .theme-toggle:hover:not(:disabled) {
    background: var(--warning-light);
    color: var(--warning);
    border-color: var(--warning);
  }
  
  html.dark .theme-toggle--collapsed {
    background: var(--surface-muted);
    border-color: rgba(122, 186, 165, 0.4);
  }
  
  html.dark .theme-toggle--collapsed:hover:not(:disabled) {
    background: var(--warning-light);
    border-color: var(--warning);
    box-shadow: 0 4px 12px rgba(254, 205, 44, 0.3);
  }
</style>
