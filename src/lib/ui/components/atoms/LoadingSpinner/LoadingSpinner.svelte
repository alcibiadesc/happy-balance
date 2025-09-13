<script lang="ts">
  export let size: 'xs' | 'sm' | 'md' | 'lg' = 'md';
  export let type: 'spinner' | 'dots' | 'ring' | 'ball' | 'bars' | 'infinity' = 'spinner';
  export let text: string | undefined = undefined;

  // DaisyUI size configurations
  const sizeConfig = {
    xs: 'loading-xs',
    sm: 'loading-sm',
    md: 'loading-md',
    lg: 'loading-lg'
  };

  // DaisyUI loading type configurations
  const typeConfig = {
    spinner: 'loading-spinner',
    dots: 'loading-dots',
    ring: 'loading-ring',
    ball: 'loading-ball',
    bars: 'loading-bars',
    infinity: 'loading-infinity'
  };

  $: sizeClasses = sizeConfig[size];
  $: typeClasses = typeConfig[type];
</script>

<div class="flex items-center justify-center">
  <div class="flex items-center gap-3">
    <span 
      class="loading {typeClasses} {sizeClasses}"
      role="status" 
      aria-label="Cargando"
    ></span>
    {#if text}
      <span class="text-base-content/70">{text}</span>
    {/if}
  </div>
</div>