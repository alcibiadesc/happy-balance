<script lang="ts">
  import type { ComponentType } from 'svelte';
  
  interface Props {
    href: string;
    icon: ComponentType;
    label: string;
    isActive?: boolean;
    isImportant?: boolean;
    onclick?: () => void;
  }
  
  let { 
    href, 
    icon: Icon, 
    label, 
    isActive = false, 
    isImportant = false,
    onclick 
  }: Props = $props();
</script>

<a 
  {href}
  class="nav-item {isActive ? 'nav-item--active' : ''} {isImportant ? 'nav-item--important' : ''}"
  onclick={onclick}
  aria-current={isActive ? 'page' : undefined}
>
  <div class="nav-item__icon">
    <Icon size={18} strokeWidth={2} />
  </div>
  <span class="nav-item__label">
    {label}
  </span>
  {#if isImportant}
    <div class="nav-item__badge"></div>
  {/if}
</a>

<style>
  .nav-item {
    @apply relative flex items-center gap-3 px-3 py-2 rounded-md text-sm;
    color: var(--text-secondary);
    text-decoration: none;
    transition: all 0.15s ease;
    min-height: 44px; /* Touch target size */
    font-weight: 400;
  }
  
  .nav-item:hover {
    color: var(--text-primary);
    background-color: var(--surface-muted);
    transform: translateX(2px);
  }
  
  .nav-item--active {
    color: var(--primary);
    background-color: var(--primary-light);
    font-weight: 500;
    box-shadow: var(--shadow-sm);
  }
  
  .nav-item--active::before {
    content: '';
    position: absolute;
    left: 0;
    top: 50%;
    transform: translateY(-50%);
    width: 3px;
    height: 20px;
    background: var(--primary);
    border-radius: 0 2px 2px 0;
  }
  
  .nav-item--important {
    border: 1px solid var(--accent-light);
    background: linear-gradient(135deg, var(--accent-light), transparent);
  }
  
  .nav-item--important:hover {
    background: var(--accent-light);
    color: var(--accent);
    border-color: var(--accent);
    transform: translateX(3px) translateY(-1px);
  }
  
  .nav-item__icon {
    @apply flex items-center justify-center flex-shrink-0;
    width: 20px;
    height: 20px;
  }
  
  .nav-item__label {
    @apply truncate;
    line-height: 1.4;
  }
  
  .nav-item__badge {
    @apply flex-shrink-0 w-2 h-2 rounded-full ml-auto;
    background: var(--accent);
    animation: pulse 2s infinite;
  }
  
  @keyframes pulse {
    0%, 100% {
      opacity: 1;
    }
    50% {
      opacity: 0.6;
    }
  }
  
  /* Focus states for accessibility */
  .nav-item:focus {
    @apply focus-zen;
  }
  
  /* Ma (間) - respecting Japanese spacing */
  .nav-item + .nav-item {
    margin-top: var(--space-xs);
  }
</style>
