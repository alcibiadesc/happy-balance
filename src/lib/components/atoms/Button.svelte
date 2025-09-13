<script lang="ts">
  export let variant: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline' = 'primary';
  export let size: 'sm' | 'md' | 'lg' = 'md';
  export let disabled = false;
  export let loading = false;
  export let type: 'button' | 'submit' | 'reset' = 'button';
  export let fullWidth = false;

  const baseClasses = 'inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg';
  
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  };
  
  const variantClasses = {
    primary: 'bg-evening-sea text-bridesmaid hover:bg-opacity-90 focus:ring-evening-sea',
    secondary: 'bg-acapulco text-bridesmaid hover:bg-opacity-90 focus:ring-acapulco',
    danger: 'bg-froly text-bridesmaid hover:bg-opacity-90 focus:ring-froly',
    ghost: 'text-evening-sea hover:bg-evening-sea hover:bg-opacity-10 focus:ring-evening-sea',
    outline: 'border border-evening-sea text-evening-sea hover:bg-evening-sea hover:text-bridesmaid focus:ring-evening-sea'
  };
  
  $: classes = [
    baseClasses,
    sizeClasses[size],
    variantClasses[variant],
    fullWidth ? 'w-full' : ''
  ].join(' ');
</script>

<button
  {type}
  {disabled}
  class={classes}
  on:click
  {...$$restProps}
>
  {#if loading}
    <svg class="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
  {/if}
  <slot />
</button>
