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
      document.documentElement.classList.toggle('dark', isDark);
      localStorage.setItem('theme', isDark ? 'dark' : 'light');
    }
  }
  
  onMount(() => {
    if (browser) {
      const savedTheme = localStorage.getItem('theme');
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      isDark = savedTheme ? savedTheme === 'dark' : prefersDark;
      document.documentElement.classList.toggle('dark', isDark);
    }
  });
</script>

<button 
  class="theme-toggle theme-toggle--{size}"
  onclick={toggleTheme}
  aria-label={isDark ? 'ライトモードに切り替え' : 'ダークモードに切り替え'}
  title={isDark ? 'ライトモード' : 'ダークモード'}
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
    @apply relative flex items-center justify-center rounded-full border-0 cursor-pointer;
    background: var(--surface-elevated);
    border: 1px solid rgba(122, 186, 165, 0.2);
    color: var(--text-secondary);
    transition: all 0.2s ease;
    box-shadow: var(--shadow-sm);
  }
  
  .theme-toggle--sm {
    @apply w-8 h-8;
  }
  
  .theme-toggle--md {
    @apply w-10 h-10;
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
    @apply flex items-center justify-center;
    transition: transform 0.2s ease;
  }
  
  .theme-toggle:hover .theme-toggle__icon {
    transform: rotate(15deg);
  }
  
  /* Focus state */
  .theme-toggle:focus {
    @apply focus-zen;
  }
  
  /* Dark mode styles */
  @media (prefers-color-scheme: dark) {
    .theme-toggle {
      background: var(--surface-elevated);
      border-color: rgba(122, 186, 165, 0.3);
    }
  }
</style>
