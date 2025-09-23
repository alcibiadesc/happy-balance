<script lang="ts">
  import type { ComponentType } from 'svelte';

  interface Props {
    title: string;
    icon: ComponentType;
    iconClass?: string;
    children?: any;
  }

  let {
    title,
    icon: Icon,
    iconClass = '',
    children
  }: Props = $props();
</script>

<div class="settings-card">
  <div class="card-header">
    <div class="card-icon {iconClass}">
      <Icon size={20} strokeWidth={2} />
    </div>
    <h2 class="card-title">{title}</h2>
  </div>
  <div class="card-content">
    {@render children?.()}
  </div>
</div>

<style>
  /* Settings Card - Exact copy from settings page */
  .settings-card {
    background: var(--surface-elevated);
    border-radius: 1rem;
    padding: 1.5rem;
    border: 1px solid var(--border-color);
    transition: all 0.2s ease;
  }

  .settings-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.05);
  }

  .card-header {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 1.5rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid var(--border-color);
  }

  .card-icon {
    width: 2.5rem;
    height: 2.5rem;
    border-radius: 0.75rem;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .card-icon.appearance {
    background: rgba(245, 121, 108, 0.1);
    color: #f5796c;
  }

  .card-icon.localization {
    background: rgba(122, 186, 165, 0.1);
    color: var(--acapulco);
  }

  .card-icon.data {
    background: rgba(254, 205, 44, 0.1);
    color: #fecd2c;
  }

  .card-title {
    font-size: 1.125rem;
    font-weight: 500;
    color: var(--text-primary);
    margin: 0;
  }

  .card-content {
    /* Content styles handled by children */
  }
</style>