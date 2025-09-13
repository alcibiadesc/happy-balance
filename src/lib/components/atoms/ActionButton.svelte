<script lang="ts">
  import type { ComponentType } from 'svelte';
  
  interface Props {
    icon: ComponentType;
    label: string;
    variant?: 'primary' | 'secondary' | 'danger';
    onclick?: () => void;
    disabled?: boolean;
  }
  
  let { 
    icon: Icon, 
    label, 
    variant = 'secondary', 
    onclick,
    disabled = false 
  }: Props = $props();
</script>

<button 
  class="action-button action-button--{variant}"
  {onclick}
  {disabled}
  aria-label={label}
>
  <div class="action-button__icon">
    <Icon size={16} strokeWidth={2} />
  </div>
  <span class="action-button__text">{label}</span>
</button>

<style>
  .action-button {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    border-radius: var(--radius-md);
    border: 1px solid;
    background: transparent;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s ease;
    letter-spacing: 0.025em;
  }
  
  .action-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  .action-button--primary {
    border-color: var(--primary);
    color: var(--primary);
  }
  
  .action-button--primary:hover:not(:disabled) {
    background: var(--primary);
    color: var(--text-inverse);
    transform: translateY(-1px);
    box-shadow: var(--shadow-sm);
  }
  
  .action-button--secondary {
    border-color: var(--text-muted);
    color: var(--text-secondary);
  }
  
  .action-button--secondary:hover:not(:disabled) {
    background: var(--surface-muted);
    color: var(--text-primary);
    border-color: var(--text-secondary);
  }
  
  .action-button--danger {
    border-color: var(--accent);
    color: var(--accent);
  }
  
  .action-button--danger:hover:not(:disabled) {
    background: var(--accent);
    color: var(--text-inverse);
    transform: translateY(-1px);
    box-shadow: var(--shadow-sm);
  }
  
  .action-button__icon {
    display: flex;
    align-items: center;
    justify-content: center;
    transition: transform 0.2s ease;
  }
  
  .action-button:hover:not(:disabled) .action-button__icon {
    transform: scale(1.05);
  }
  
  .action-button__text {
    white-space: nowrap;
  }
  
  /* Focus state */
  .action-button:focus {
    outline: none;
    box-shadow: 0 0 0 2px var(--surface-elevated), 0 0 0 4px currentColor;
  }
</style>
