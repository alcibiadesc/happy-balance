<script lang="ts">
  interface Props {
    title: string;
    description: string;
    children: any;
  }
  
  let { title, description, children }: Props = $props();
</script>

<div class="setting-item">
  <div class="setting-item__content">
    <h3 class="setting-item__title">{title}</h3>
    <p class="setting-item__description">{description}</p>
  </div>
  <div class="setting-item__control">
    {@render children?.()}
  </div>
</div>

<style>
  .setting-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-md);
    padding: var(--space-md);
    border-radius: var(--radius-md);
    background: var(--surface-muted);
    border: 1px solid rgba(2, 60, 70, 0.05);
    transition: all 0.15s ease;
  }
  
  .setting-item:hover {
    background: var(--surface-elevated);
    border-color: rgba(2, 60, 70, 0.1);
    box-shadow: var(--shadow-sm);
  }
  
  .setting-item__content {
    flex: 1;
    min-width: 0;
  }
  
  .setting-item__title {
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--text-primary);
    margin: 0 0 0.25rem 0;
    line-height: 1.3;
  }
  
  .setting-item__description {
    font-size: 0.75rem;
    color: var(--text-muted);
    margin: 0;
    line-height: 1.4;
  }
  
  .setting-item__control {
    flex-shrink: 0;
  }
  
  /* Dark mode */
  html.dark .setting-item {
    border-color: rgba(254, 247, 238, 0.05);
  }
  
  html.dark .setting-item:hover {
    border-color: rgba(254, 247, 238, 0.1);
  }
</style>
