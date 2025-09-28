<script lang="ts">
  import { ChevronLeft, ChevronRight } from 'lucide-svelte';

  interface Props {
    collapsed: boolean;
    onclick: () => void;
    size?: 'sm' | 'md';
  }

  let { collapsed, onclick, size = 'md' }: Props = $props();

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10'
  };
</script>

<button
  class="sidebar-toggle {sizeClasses[size]}"
  {onclick}
  aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
  title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
>
  {#if collapsed}
    <ChevronRight size={size === 'sm' ? 16 : 18} strokeWidth={2} />
  {:else}
    <ChevronLeft size={size === 'sm' ? 16 : 18} strokeWidth={2} />
  {/if}
</button>

<style>
  .sidebar-toggle {
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: var(--radius-lg);
    border: 1px solid var(--border-color);
    background: var(--surface);
    color: var(--text-secondary);
    cursor: pointer;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    flex-shrink: 0;
  }

  .sidebar-toggle:hover {
    background: var(--surface-muted);
    color: var(--text-primary);
    border-color: var(--primary);
    transform: translateY(-1px);
    box-shadow: var(--shadow-sm);
  }

  .sidebar-toggle:focus {
    outline: none;
    box-shadow: 0 0 0 2px var(--primary-light);
  }

  .sidebar-toggle:active {
    transform: translateY(0);
  }
</style>