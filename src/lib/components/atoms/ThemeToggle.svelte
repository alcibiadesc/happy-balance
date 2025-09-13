<script lang="ts">
  import { Sun, Moon } from 'lucide-svelte';
  import { browser } from '$app/environment';
  import { onMount } from 'svelte';
  
  interface Props {
    size?: 'sm' | 'md';
  }
  
  let { size = 'md' }: Props = $props();
  
  let isDark = $state(false);
  
  const iconSizes = {
    sm: 16,
    md: 18
  };
  
  function toggleTheme() {
    isDark = !isDark;
    
    if (browser) {
      // Toggle dark class on document
      if (isDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      
      // Save preference
      localStorage.setItem('theme', isDark ? 'dark' : 'light');
      
      // Debug log
      console.log('Theme toggled to:', isDark ? 'dark' : 'light');
    }
  }
  
  onMount(() => {
    if (browser) {
      // Check saved theme
      const savedTheme = localStorage.getItem('theme');
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      
      // Determine initial state
      isDark = savedTheme ? savedTheme === 'dark' : prefersDark;
      
      // Apply initial theme
      if (isDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      
      console.log('Initial theme:', isDark ? 'dark' : 'light');
    }
  });
</script>

<button 
  class="theme-toggle theme-toggle--{size}"
  onclick={toggleTheme}
  aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
  title={isDark ? 'Light mode' : 'Dark mode'}
>
  <div class="theme-toggle__icon">
    {#if isDark}
      <Sun size={iconSizes[size]} strokeWidth={2} />
    {:else}
      <Moon size={iconSizes[size]} strokeWidth={2} />
    {/if}
  </div>
</button>

<style>
  .theme-toggle {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    border: 1px solid rgba(122, 186, 165, 0.2);
    background: var(--surface-elevated);
    color: var(--text-secondary);
    cursor: pointer;
    transition: all 0.2s ease;
    box-shadow: var(--shadow-sm);
  }
  
  .theme-toggle--sm {
    width: 2rem;
    height: 2rem;
  }
  
  .theme-toggle--md {
    width: 2.5rem;
    height: 2.5rem;
  }
  
  .theme-toggle:hover {
    background: var(--success-light);
    color: var(--success);
    border-color: var(--success);
    transform: translateY(-1px);
    box-shadow: var(--shadow-md);
  }
  
  .theme-toggle:active {
    transform: translateY(0);
    box-shadow: var(--shadow-sm);
  }
  
  .theme-toggle__icon {
    display: flex;
    align-items: center;
    justify-content: center;
    transition: transform 0.2s ease;
  }
  
  .theme-toggle:hover .theme-toggle__icon {
    transform: rotate(15deg);
  }
  
  /* Focus state */
  .theme-toggle:focus {
    outline: none;
    box-shadow: 0 0 0 2px var(--primary-light), 0 0 0 4px rgba(2, 60, 70, 0.1);
  }
</style>
