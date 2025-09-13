<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  export let variant: 'primary' | 'secondary' | 'success' | 'danger' | 'ghost' | 'outline' = 'primary';
  export let size: 'sm' | 'md' | 'lg' = 'md';
  export let disabled: boolean = false;
  export let loading: boolean = false;
  export let fullWidth: boolean = false;
  export let type: 'button' | 'submit' | 'reset' = 'button';
  export let onclick: (() => void) | undefined = undefined;

  const dispatch = createEventDispatcher();

  // Variant styles
  const variantConfig = {
    primary: 'bg-blue-500 text-white hover:bg-blue-600 focus:ring-blue-500 disabled:bg-blue-300',
    secondary: 'bg-gray-500 text-white hover:bg-gray-600 focus:ring-gray-500 disabled:bg-gray-300',
    success: 'bg-green-500 text-white hover:bg-green-600 focus:ring-green-500 disabled:bg-green-300',
    danger: 'bg-red-500 text-white hover:bg-red-600 focus:ring-red-500 disabled:bg-red-300',
    ghost: 'bg-transparent text-gray-700 hover:bg-gray-100 focus:ring-gray-500 disabled:text-gray-400',
    outline: 'border-2 border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-gray-500 disabled:border-gray-200 disabled:text-gray-400'
  };

  // Size styles
  const sizeConfig = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  };

  $: baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed';
  $: variantClasses = variantConfig[variant];
  $: sizeClasses = sizeConfig[size];
  $: widthClasses = fullWidth ? 'w-full' : '';
  $: isDisabled = disabled || loading;

  function handleClick() {
    if (!isDisabled) {
      if (onclick) {
        onclick();
      }
      dispatch('click');
    }
  }
</script>

<button
  {type}
  disabled={isDisabled}
  class="{baseClasses} {variantClasses} {sizeClasses} {widthClasses}"
  onclick={handleClick}
>
  {#if loading}
    <div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
    <slot name="loading">Cargando...</slot>
  {:else}
    <slot />
  {/if}
</button>