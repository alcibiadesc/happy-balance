<script lang="ts">
  interface Props {
    title: string;
    description: string;
    children: any;
  }
  
  let { title, description, children }: Props = $props();
</script>

<div class="setting-card">
  <div class="setting-card__header">
    <h2 class="setting-card__title">{title}</h2>
    <p class="setting-card__description">{description}</p>
  </div>
  
  <div class="setting-card__content">
    {@render children?.()}
  </div>
</div>

<style>
  .setting-card {
    background: var(--surface-elevated);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-sm);
    border: 1px solid rgba(2, 60, 70, 0.08);
    transition: all 0.2s ease;
    overflow: hidden;
  }
  
  .setting-card:hover {
    transform: translateY(-1px);
    box-shadow: var(--shadow-md);
  }
  
  .setting-card__header {
    padding: var(--space-lg);
    border-bottom: 1px solid rgba(2, 60, 70, 0.08);
  }
  
  .setting-card__title {
    font-size: 1.125rem;
    font-weight: 500;
    color: var(--text-primary);
    margin: 0 0 0.5rem 0;
    line-height: 1.3;
  }
  
  .setting-card__description {
    font-size: 0.875rem;
    color: var(--text-muted);
    margin: 0;
    line-height: 1.5;
    font-weight: 300;
  }
  
  .setting-card__content {
    padding: var(--space-lg);
    display: flex;
    flex-direction: column;
    gap: var(--space-md);
  }
  
  /* Dark mode */
  html.dark .setting-card {
    border-color: rgba(254, 247, 238, 0.1);
  }
  
  html.dark .setting-card__header {
    border-bottom-color: rgba(254, 247, 238, 0.1);
  }
</style>
