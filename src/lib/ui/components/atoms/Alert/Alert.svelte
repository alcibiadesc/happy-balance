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
    success: 'bg-green-50 border-green-200 text-green-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    warning: 'bg-orange-50 border-orange-200 text-orange-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800'
  };
  
  const iconStyles = {
    success: 'text-green-500',
    error: 'text-red-500', 
    warning: 'text-orange-500',
    info: 'text-blue-500'
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
  <div class="rounded-lg border p-4 {styles[type]}" role="alert">
    <div class="flex items-start gap-3">
      <svelte:component this={icons[type]} class="w-5 h-5 flex-shrink-0 mt-0.5 {iconStyles[type]}" />
      
      <div class="flex-1 min-w-0">
        {#if title}
          <p class="font-medium mb-1">{title}</p>
        {/if}
        
        <div class="text-sm">
          <slot />
        </div>
      </div>
      
      {#if dismissible}
        <button
          onclick={dismiss}
          class="flex-shrink-0 p-1 rounded-md hover:bg-black/10 transition-colors"
          aria-label="Dismiss alert"
        >
          <X class="w-4 h-4" />
        </button>
      {/if}
    </div>
  </div>
{/if}