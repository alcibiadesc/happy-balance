<script lang="ts">
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
  
  const textSizes = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  };
</script>

<div class="flex items-center gap-3">
  <!-- Logo Icon -->
  <div class="brand-icon {sizeClasses[size]}">
    <img
      src="/logo/happy-balance-logo-without-text.png"
      alt="Happy Balance Logo"
      class="logo-image {sizeClasses[size]}"
    />
  </div>
  
  <!-- Brand Text -->
  {#if showText}
    <div class="brand-text">
      <div class="brand-name {textSizes[size]}">
        Happy Balance
      </div>
      <div class="brand-tagline text-xs text-subtle">
        Financial harmony
      </div>
    </div>
  {/if}
</div>

<style>
  .brand-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: var(--radius-lg);
    background: linear-gradient(135deg, rgba(122, 186, 165, 0.1), rgba(122, 186, 165, 0.05));
    padding: 4px;
    transition: all 0.3s ease;
    border: 1px solid rgba(122, 186, 165, 0.2);
  }

  .logo-image {
    object-fit: contain;
    border-radius: 6px;
  }
  
  .brand-icon:hover {
    transform: translateY(-1px) scale(1.05);
    background: linear-gradient(135deg, rgba(122, 186, 165, 0.15), rgba(122, 186, 165, 0.1));
    border-color: rgba(122, 186, 165, 0.3);
    box-shadow: 0 4px 12px rgba(122, 186, 165, 0.15);
  }
  
  .brand-text {
    display: flex;
    flex-direction: column;
    line-height: 1.2;
  }
  
  .brand-name {
    font-weight: 500;
    color: var(--text-primary);
    letter-spacing: 0.01em;
    font-family: 'Noto Sans JP', 'Inter', sans-serif;
  }
  
  .brand-tagline {
    font-weight: 300;
    margin-top: 2px;
    color: var(--text-muted);
    font-style: italic;
  }
</style>
