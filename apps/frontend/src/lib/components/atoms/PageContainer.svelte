<script lang="ts">
  interface Props {
    children: any;
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
    padding: 1.5rem;
    width: 100%;
  }

  .page-container.narrow {
    max-width: 800px;
  }

  .page-container.wide {
    max-width: 1400px;
  }

  @media (min-width: 768px) {
    .page-container {
      padding: 2rem;
    }
  }
</style>
