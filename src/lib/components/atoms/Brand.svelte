<script lang="ts">
  import { TrendingUp } from 'lucide-svelte';
  
  interface Props {
    showText?: boolean;
    size?: 'sm' | 'md' | 'lg';
  }
  
  let { showText = true, size = 'md' }: Props = $props();
  
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10', 
    lg: 'h-12 w-12'
  };
  
  const iconSizes = {
    sm: 18,
    md: 22,
    lg: 26
  };
  
  const textSizes = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  };
</script>

<div class="flex items-center gap-3">
  <!-- Logo Icon -->
  <div class="brand-icon {sizeClasses[size]}">
    <TrendingUp size={iconSizes[size]} strokeWidth={2} />
  </div>
  
  <!-- Brand Text -->
  {#if showText}
    <div class="brand-text">
      <div class="brand-name {textSizes[size]}">
        Happy Balance
      </div>
      <div class="brand-tagline text-xs">
        和の家計簿
      </div>
    </div>
  {/if}
</div>

<style>
  .brand-icon {
    @apply flex items-center justify-center rounded-lg;
    background: linear-gradient(135deg, var(--primary), var(--success));
    color: var(--text-inverse);
    box-shadow: var(--shadow-sm);
    transition: all 0.2s ease;
  }
  
  .brand-icon:hover {
    transform: translateY(-1px);
    box-shadow: var(--shadow-md);
  }
  
  .brand-text {
    @apply flex flex-col leading-none;
  }
  
  .brand-name {
    @apply font-medium text-zen;
    color: var(--text-primary);
    letter-spacing: 0.01em;
  }
  
  .brand-tagline {
    color: var(--text-muted);
    font-weight: 300;
    margin-top: 2px;
  }
</style>
