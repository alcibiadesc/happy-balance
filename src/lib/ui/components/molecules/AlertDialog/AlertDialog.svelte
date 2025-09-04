<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { AlertTriangle, Info, CheckCircle, X, XCircle } from 'lucide-svelte';
  import { fly, scale } from 'svelte/transition';
  
  interface Props {
    show: boolean;
    title?: string;
    message: string;
    type?: 'info' | 'warning' | 'error' | 'success';
    buttonText?: string;
  }
  
  let { 
    show = false,
    title = '',
    message,
    type = 'info',
    buttonText = 'Entendido'
  }: Props = $props();
  
  let dialogRef: HTMLDivElement;
  
  const dispatch = createEventDispatcher();
  
  // Get icon and colors based on type
  const getTypeConfig = (dialogType: string) => {
    switch (dialogType) {
      case 'warning':
        return {
          icon: AlertTriangle,
          iconColor: 'text-orange-600',
          bgColor: 'bg-orange-100',
          borderColor: 'border-orange-200',
          titleColor: 'text-orange-800',
          buttonColor: 'bg-orange-600 hover:bg-orange-700 border-orange-600 hover:border-orange-700',
          defaultTitle: 'Advertencia'
        };
      case 'error':
        return {
          icon: XCircle,
          iconColor: 'text-red-600',
          bgColor: 'bg-red-100',
          borderColor: 'border-red-200',
          titleColor: 'text-red-800',
          buttonColor: 'bg-red-600 hover:bg-red-700 border-red-600 hover:border-red-700',
          defaultTitle: 'Error'
        };
      case 'success':
        return {
          icon: CheckCircle,
          iconColor: 'text-green-600',
          bgColor: 'bg-green-100',
          borderColor: 'border-green-200',
          titleColor: 'text-green-800',
          buttonColor: 'bg-green-600 hover:bg-green-700 border-green-600 hover:border-green-700',
          defaultTitle: 'Éxito'
        };
      default:
        return {
          icon: Info,
          iconColor: 'text-blue-600',
          bgColor: 'bg-blue-100',
          borderColor: 'border-blue-200',
          titleColor: 'text-blue-800',
          buttonColor: 'bg-blue-600 hover:bg-blue-700 border-blue-600 hover:border-blue-700',
          defaultTitle: 'Información'
        };
    }
  };
  
  let config = $derived(getTypeConfig(type));
  let displayTitle = $derived(title || config.defaultTitle);
  
  function handleClose() {
    dispatch('close');
  }
  
  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape' || event.key === 'Enter') {
      handleClose();
    }
  }
  
  function handleBackdropClick(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      handleClose();
    }
  }
</script>

<!-- Modal Backdrop -->
{#if show}
  <div 
    class="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
    transition:fly={{ duration: 200, opacity: 0 }}
    onclick={handleBackdropClick}
    onkeydown={handleKeydown}
    role="dialog"
    aria-modal="true"
    aria-labelledby="alert-title"
    tabindex="-1"
  >
    <!-- Dialog -->
    <div 
      bind:this={dialogRef}
      class="bg-white rounded-lg p-6 w-full max-w-md shadow-xl border-2 {config.borderColor}"
      transition:scale={{ duration: 200, start: 0.95 }}
      onclick={(e) => e.stopPropagation()}
    >
      <!-- Header with Icon -->
      <div class="flex items-start gap-4 mb-6">
        <div class="w-12 h-12 rounded-full {config.bgColor} flex items-center justify-center flex-shrink-0">
          {#if config.icon}
            {@const IconComponent = config.icon}
            <IconComponent class="w-6 h-6 {config.iconColor}" />
          {/if}
        </div>
        <div class="flex-1 min-w-0">
          <h3 id="alert-title" class="text-h5 font-semibold {config.titleColor} mb-2">
            {displayTitle}
          </h3>
          <p class="text-sm text-gray-600 leading-relaxed">
            {message}
          </p>
        </div>
      </div>
      
      <!-- Action Button -->
      <div class="flex justify-end">
        <button
          type="button"
          onclick={handleClose}
          class="btn-editorial text-white {config.buttonColor} px-6 py-2"
          autofocus
        >
          {buttonText}
        </button>
      </div>
    </div>
  </div>
{/if}