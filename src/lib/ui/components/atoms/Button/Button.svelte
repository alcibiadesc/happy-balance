<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  export let variant: 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info' | 'ghost' | 'outline' = 'primary';
  export let size: 'xs' | 'sm' | 'md' | 'lg' = 'md';
  export let disabled: boolean = false;
  export let loading: boolean = false;
  export let fullWidth: boolean = false;
  export let type: 'button' | 'submit' | 'reset' = 'button';
  export let onclick: (() => void) | undefined = undefined;

  const dispatch = createEventDispatcher();

  // DaisyUI variant mapping
  const variantConfig = {
    primary: 'btn-primary',
    secondary: 'btn-secondary', 
    success: 'btn-success',
    error: 'btn-error',
    warning: 'btn-warning',
    info: 'btn-info',
    ghost: 'btn-ghost',
    outline: 'btn-outline'
  };

  // DaisyUI size mapping
  const sizeConfig = {
    xs: 'btn-xs',
    sm: 'btn-sm',
    md: '',  // default size
    lg: 'btn-lg'
  };

  $: baseClasses = 'btn';
  $: variantClasses = variantConfig[variant];
  $: sizeClasses = sizeConfig[size];
  $: widthClasses = fullWidth ? 'btn-block' : '';
  $: loadingClasses = loading ? 'loading' : '';
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
  class="{baseClasses} {variantClasses} {sizeClasses} {widthClasses} {loadingClasses}"
  onclick={handleClick}
>
  {#if loading}
    <span class="loading loading-spinner"></span>
    <slot name="loading">Cargando...</slot>
  {:else}
    <slot />
  {/if}
</button>