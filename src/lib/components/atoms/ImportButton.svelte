<script lang="ts">
  import { Upload } from 'lucide-svelte';
  
  interface Props {
    href?: string;
    onclick?: () => void;
    size?: 'sm' | 'md';
  }
  
  let { href = '/import', onclick, size = 'md' }: Props = $props();
  
  const sizeClasses = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-3 text-base'
  };
  
  const iconSizes = {
    sm: 16,
    md: 18
  };
</script>

<a 
  {href}
  class="import-button {sizeClasses[size]}"
  {onclick}
  aria-label="Import financial data"
>
  <div class="import-button__icon">
    <Upload size={iconSizes[size]} strokeWidth={2} />
  </div>
  <span class="import-button__text">Import</span>
  <div class="import-button__badge"></div>
</a>

<style>
  .import-button {
    position: relative;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    border-radius: var(--radius-lg);
    text-decoration: none;
    font-weight: 500;
    transition: all 0.15s ease;
    
    /* Gradient background */
    background: linear-gradient(135deg, var(--accent), var(--warning));
    color: var(--text-inverse);
    box-shadow: var(--shadow-md);
    
    /* Import emphasis */
    border: 2px solid rgba(255, 255, 255, 0.2);
  }
  
  .import-button:hover {
    transform: translateY(-2px) scale(1.02);
    box-shadow: var(--shadow-lg);
    
    /* Enhanced gradient on hover */
    background: linear-gradient(135deg, var(--accent-hover), var(--warning-hover));
  }
  
  .import-button:active {
    transform: translateY(-1px) scale(1.01);
    box-shadow: var(--shadow-md);
  }
  
  .import-button__icon {
    display: flex;
    align-items: center;
    justify-content: center;
    transition: transform 0.2s ease;
  }
  
  .import-button:hover .import-button__icon {
    transform: rotate(-5deg) scale(1.1);
  }
  
  .import-button__text {
    font-weight: 600;
    letter-spacing: 0.025em;
  }
  
  .import-button__badge {
    position: absolute;
    top: -4px;
    right: -4px;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--success);
    border: 2px solid var(--text-inverse);
    animation: pulse 2s infinite;
  }
  
  @keyframes pulse {
    0%, 100% {
      opacity: 1;
      transform: scale(1);
    }
    50% {
      opacity: 0.7;
      transform: scale(1.1);
    }
  }
  
  /* Focus state */
  .import-button:focus {
    outline: none;
    box-shadow: 0 0 0 2px var(--surface-elevated), 0 0 0 4px var(--accent), var(--shadow-lg);
  }
</style>
