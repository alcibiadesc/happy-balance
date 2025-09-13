<script lang="ts">
  import { theme, toggleTheme } from '$lib/stores/theme';
  import { Sun, Moon } from 'lucide-svelte';

  function handleToggle() {
    toggleTheme();
  }
</script>

<button
  on:click={handleToggle}
  class="btn btn-ghost btn-circle"
  title={$theme === 'light' ? 'Cambiar a modo oscuro' : 'Cambiar a modo claro'}
  aria-label={$theme === 'light' ? 'Cambiar a modo oscuro' : 'Cambiar a modo claro'}
>
  {#if $theme === 'light'}
    <Moon class="w-5 h-5" />
  {:else}
    <Sun class="w-5 h-5" />
  {/if}
</button>