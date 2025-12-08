<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    title: string;
    subtitle?: string;
    children?: Snippet;
  }

  const { title, subtitle, children }: Props = $props();
</script>

<header class="page-header">
  <div class="page-header__content">
    <div class="page-header__text">
      <h1 class="page-header__title">{title}</h1>
      {#if subtitle}
        <p class="page-header__subtitle">{subtitle}</p>
      {/if}
    </div>
    {#if children}
      <div class="page-header__actions">
        {@render children?.()}
      </div>
    {/if}
  </div>
</header>

<style>
  .page-header {
    margin-bottom: 1.5rem;
  }

  .page-header__content {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-start;
    justify-content: space-between;
    gap: 1rem;
  }

  .page-header__text {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .page-header__title {
    font-size: 1.5rem;
    font-weight: 600;
    color: var(--text-primary);
    margin: 0;
    letter-spacing: -0.02em;
    line-height: 1.2;
  }

  .page-header__subtitle {
    font-size: 0.875rem;
    color: var(--text-secondary);
    margin: 0;
    line-height: 1.4;
  }

  .page-header__actions {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-shrink: 0;
  }

  @media (max-width: 640px) {
    .page-header__content {
      flex-direction: column;
      align-items: stretch;
    }

    .page-header__title {
      font-size: 1.25rem;
    }

    .page-header__actions {
      width: 100%;
      justify-content: flex-start;
    }
  }
</style>
