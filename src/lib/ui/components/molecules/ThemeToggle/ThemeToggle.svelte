<script lang="ts">
  import { theme, toggleTheme } from '$lib/stores/theme';

  function handleToggle() {
    toggleTheme();
  }
</script>

<button
  on:click={handleToggle}
  class="p-2 rounded-lg transition-colors"
  style="border-radius: var(--radius-default); transition: var(--transition-default);"
  on:mouseenter={(e) => e.target.style.backgroundColor = 'var(--color-background-tertiary)'}
  on:mouseleave={(e) => e.target.style.backgroundColor = 'transparent'}
  title={$theme === 'light' ? 'Cambiar a modo oscuro' : 'Cambiar a modo claro'}
  aria-label={$theme === 'light' ? 'Cambiar a modo oscuro' : 'Cambiar a modo claro'}
>
  {#if $theme === 'light'}
    <!-- Moon icon for dark mode -->
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: var(--color-text-secondary);">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
    </svg>
  {:else}
    <!-- Sun icon for light mode -->
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: var(--color-text-secondary);">
      <circle cx="12" cy="12" r="5"></circle>
      <line x1="12" x2="12" y1="1" y2="3"></line>
      <line x1="12" x2="12" y1="21" y2="23"></line>
      <line x1="4.22" x2="5.64" y1="4.22" y2="5.64"></line>
      <line x1="18.36" x2="19.78" y1="18.36" y2="19.78"></line>
      <line x1="1" x2="3" y1="12" y2="12"></line>
      <line x1="21" x2="23" y1="12" y2="12"></line>
      <line x1="4.22" x2="5.64" y1="19.78" y2="18.36"></line>
      <line x1="18.36" x2="19.78" y1="5.64" y2="4.22"></line>
    </svg>
  {/if}
</button>