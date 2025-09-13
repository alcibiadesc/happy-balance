<script lang="ts">
  import { AlertCircle, CheckCircle, Info, XCircle, X } from 'lucide-svelte';
  import { createEventDispatcher } from 'svelte';
  
  export let type: 'success' | 'error' | 'warning' | 'info' = 'info';
  export let title: string = '';
  export let dismissible: boolean = true;
  export let autoHide: boolean = false;
  export let hideAfter: number = 5000;
  
  const dispatch = createEventDispatcher();
  
  let visible = true;
  
  const icons = {
    success: CheckCircle,
    error: XCircle,
    warning: AlertCircle,
    info: Info
  };
  
  const styles = {
    success: 'alert-success',
    error: 'alert-error',
    warning: 'alert-warning',
    info: 'alert-info'
  };
  
  function dismiss() {
    visible = false;
    dispatch('dismiss');
  }
  
  if (autoHide && hideAfter > 0) {
    setTimeout(dismiss, hideAfter);
  }
</script>

{#if visible}
  <div class="alert {styles[type]}" role="alert">
    <svelte:component this={icons[type]} class="w-5 h-5 flex-shrink-0" />
    
    <div class="flex-1">
      {#if title}
        <h3 class="font-medium">{title}</h3>
      {/if}
      
      <div class="text-sm">
        <slot />
      </div>
    </div>
    
    {#if dismissible}
      <button
        onclick={dismiss}
        class="btn btn-sm btn-circle btn-ghost"
        aria-label="Dismiss alert"
      >
        <X class="w-4 h-4" />
      </button>
    {/if}
  </div>
{/if}