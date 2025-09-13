<script lang="ts">
  import type { HTMLButtonAttributes } from 'svelte/elements';
  import type { Snippet } from 'svelte';
  
  interface ButtonProps extends HTMLButtonAttributes {
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
    size?: 'xs' | 'sm' | 'md' | 'lg';
    fullWidth?: boolean;
    loading?: boolean;
    icon?: Snippet;
    children: Snippet;
  }
  
  let {
    variant = 'primary',
    size = 'md',
    fullWidth = false,
    loading = false,
    disabled = false,
    icon,
    children,
    class: className = '',
    onclick,
    ...restProps
  }: ButtonProps = $props();
  
  // Clases base japonesas
  const baseClasses = 'inline-flex items-center justify-center gap-2 font-medium transition-all duration-200 ease-out focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
  // Variantes usando nuestra paleta japonesa
  const variantClasses = {
    primary: 'bg-evening-sea text-snow hover:bg-acapulco focus:ring-acapulco',
    secondary: 'bg-transparent text-evening-sea border border-pebble hover:bg-ash focus:ring-evening-sea',
    ghost: 'bg-transparent text-slate hover:bg-ash hover:text-evening-sea focus:ring-evening-sea',
    danger: 'bg-froly text-snow hover:opacity-90 focus:ring-froly'
  };
  
  // Tamaños con proporciones japonesas
  const sizeClasses = {
    xs: 'h-7 px-3 text-xs rounded',
    sm: 'h-8 px-4 text-sm rounded-md',
    md: 'h-10 px-6 text-base rounded-md',
    lg: 'h-12 px-8 text-lg rounded-lg'
  };
  
  $: computedClasses = `
    ${baseClasses}
    ${variantClasses[variant]}
    ${sizeClasses[size]}
    ${fullWidth ? 'w-full' : ''}
    ${loading ? 'cursor-wait' : ''}
    ${className}
  `.trim().replace(/\s+/g, ' ');
</script>

<button
  class={computedClasses}
  disabled={disabled || loading}
  {onclick}
  {...restProps}
>
  {#if loading}
    <span class="inline-block w-4 h-4">
      <svg class="animate-spin" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" opacity="0.25"/>
        <path d="M12 2a10 10 0 0 1 0 20" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>
      </svg>
    </span>
  {:else if icon}
    {@render icon()}
  {/if}
  {@render children()}
</button>

<style>
  /* Estilos específicos para la paleta japonesa */
  .bg-evening-sea { background-color: var(--evening-sea); }
  .bg-froly { background-color: var(--froly); }
  .bg-ash { background-color: var(--ash); }
  .text-snow { color: var(--snow); }
  .text-evening-sea { color: var(--evening-sea); }
  .text-slate { color: var(--slate); }
  .border-pebble { border-color: var(--pebble); }
  .hover\:bg-acapulco:hover { background-color: var(--acapulco); }
  .hover\:bg-ash:hover { background-color: var(--ash); }
  .hover\:text-evening-sea:hover { color: var(--evening-sea); }
  .focus\:ring-acapulco:focus { --tw-ring-color: var(--acapulco); }
  .focus\:ring-evening-sea:focus { --tw-ring-color: var(--evening-sea); }
  .focus\:ring-froly:focus { --tw-ring-color: var(--froly); }
</style>
