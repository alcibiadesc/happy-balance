<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    children: Snippet;
    /** Maximum width variant */
    size?: 'default' | 'narrow' | 'wide';
  }

  const { children, size = 'default' }: Props = $props();
</script>

<div class="page-container" class:narrow={size === 'narrow'} class:wide={size === 'wide'}>
  {@render children?.()}
</div>

<style>
  .page-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: clamp(1rem, 4vw, 2rem);
    width: 100%;
    box-sizing: border-box;
  }

  .page-container.narrow {
    max-width: 800px;
  }

  .page-container.wide {
    max-width: 1400px;
  }

  /* Extra small screens */
  @media (max-width: 360px) {
    .page-container {
      padding: 0.75rem;
    }
  }
</style>
