<script lang="ts">
  interface Props {
    width?: string;
    height?: string;
    rounded?: 'sm' | 'md' | 'lg' | 'full';
    class?: string;
  }

  let { width = '100%', height = '1rem', rounded = 'sm', class: className = '' }: Props = $props();
  
  const roundedClasses = {
    sm: 'rounded-sm',
    md: 'rounded-md', 
    lg: 'rounded-lg',
    full: 'rounded-full'
  };
</script>

<div 
  class="skeleton {roundedClasses[rounded]} {className}"
  style="width: {width}; height: {height};"
></div>

<style>
  .skeleton {
    background: linear-gradient(
      90deg,
      var(--skeleton-base) 0%,
      var(--skeleton-highlight) 50%,
      var(--skeleton-base) 100%
    );
    background-size: 200% 100%;
    animation: loading 1.5s ease-in-out infinite;
    border-radius: var(--radius-sm);
  }
  
  .skeleton.rounded-sm { border-radius: var(--radius-sm); }
  .skeleton.rounded-md { border-radius: var(--radius-md); }
  .skeleton.rounded-lg { border-radius: var(--radius-lg); }
  .skeleton.rounded-full { border-radius: 50%; }
  
  @keyframes loading {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }
  
  /* Light mode skeleton colors */
  :root {
    --skeleton-base: var(--gray-200);
    --skeleton-highlight: var(--gray-100);
  }
  
  /* Dark mode skeleton colors */
  html.dark {
    --skeleton-base: var(--gray-700);
    --skeleton-highlight: var(--gray-600);
  }
</style>