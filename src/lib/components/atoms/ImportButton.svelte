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
    md: 'px-4 py-2 text-sm'
  };
  
  const iconSizes = {
    sm: 14,
    md: 16
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
</a>

<style>
  .import-button {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    border-radius: var(--radius-md);
    text-decoration: none;
    font-weight: 500;
    transition: all 0.15s ease;
    
    /* Minimal style */
    background: var(--accent-light);
    color: var(--accent);
    border: 1px solid var(--accent);
  }
  
  .import-button:hover {
    background: var(--accent);
    color: var(--text-inverse);
    transform: translateY(-1px);
    box-shadow: var(--shadow-sm);
  }
  
  .import-button__icon {
    display: flex;
    align-items: center;
    justify-content: center;
    transition: transform 0.2s ease;
  }
  
  .import-button:hover .import-button__icon {
    transform: scale(1.05);
  }
  
  .import-button__text {
    font-weight: 500;
    letter-spacing: 0.025em;
  }
  
  /* Focus state */
  .import-button:focus {
    outline: none;
    box-shadow: 0 0 0 2px var(--accent-light), 0 0 0 4px var(--accent);
  }
  
  /* Dark mode */
  html.dark .import-button {
    background: rgba(245, 121, 108, 0.1);
    border-color: var(--accent);
  }
  
  html.dark .import-button:hover {
    background: var(--accent);
  }
</style>
