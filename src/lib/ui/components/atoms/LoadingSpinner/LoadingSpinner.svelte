<script lang="ts">
  export let size: 'sm' | 'md' | 'lg' | 'xl' = 'md';
  export let color: 'primary' | 'white' | 'gray' | 'green' | 'red' = 'primary';
  export let text: string | undefined = undefined;

  // Size configuration
  const sizeConfig = {
    sm: { spinner: 'w-4 h-4', border: 'border-2' },
    md: { spinner: 'w-6 h-6', border: 'border-2' },
    lg: { spinner: 'w-8 h-8', border: 'border-3' },
    xl: { spinner: 'w-12 h-12', border: 'border-4' }
  };

  // Color configuration
  const colorConfig = {
    primary: 'border-blue-200 border-t-blue-600',
    white: 'border-white/30 border-t-white',
    gray: 'border-gray-200 border-t-gray-600',
    green: 'border-green-200 border-t-green-600',
    red: 'border-red-200 border-t-red-600'
  };

  $: sizeClasses = sizeConfig[size];
  $: colorClasses = colorConfig[color];
</script>

<div class="flex items-center justify-center">
  <div class="flex items-center space-x-3">
    <div 
      class="{sizeClasses.spinner} {sizeClasses.border} {colorClasses} rounded-full animate-spin"
      role="status"
      aria-label="Loading"
    ></div>
    {#if text}
      <span class="text-gray-600">{text}</span>
    {/if}
  </div>
</div>