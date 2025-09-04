<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { AlertTriangle, Info, CheckCircle, X, Trash2, AlertCircle } from 'lucide-svelte';
  import { fly, scale } from 'svelte/transition';
  
  interface Props {
    show: boolean;
    title: string;
    message: string;
    type?: 'info' | 'warning' | 'danger' | 'success';
    confirmText?: string;
    cancelText?: string;
    requiresTyping?: boolean;
    requiredText?: string;
    isLoading?: boolean;
  }
  
  let { 
    show = false,
    title,
    message,
    type = 'info',
    confirmText = 'Confirmar',
    cancelText = 'Cancelar',
    requiresTyping = false,
    requiredText = '',
    isLoading = false
  }: Props = $props();
  
  let typingInput = $state('');
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
          buttonColor: 'bg-orange-600 hover:bg-orange-700 border-orange-600 hover:border-orange-700'
        };
      case 'danger':
        return {
          icon: Trash2,
          iconColor: 'text-red-600',
          bgColor: 'bg-red-100',
          buttonColor: 'bg-red-600 hover:bg-red-700 border-red-600 hover:border-red-700'
        };
      case 'success':
        return {
          icon: CheckCircle,
          iconColor: 'text-green-600',
          bgColor: 'bg-green-100',
          buttonColor: 'bg-green-600 hover:bg-green-700 border-green-600 hover:border-green-700'
        };
      default:
        return {
          icon: Info,
          iconColor: 'text-blue-600',
          bgColor: 'bg-blue-100',
          buttonColor: 'bg-blue-600 hover:bg-blue-700 border-blue-600 hover:border-blue-700'
        };
    }
  };
  
  let config = $derived(getTypeConfig(type));
  let canConfirm = $derived(!requiresTyping || (requiresTyping && typingInput.toLowerCase() === requiredText.toLowerCase()));
  
  function handleConfirm() {
    if (canConfirm && !isLoading) {
      dispatch('confirm', { typedValue: typingInput });
    }
  }
  
  function handleCancel() {
    if (!isLoading) {
      typingInput = '';
      dispatch('cancel');
    }
  }
  
  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape' && !isLoading) {
      handleCancel();
    }
    if (event.key === 'Enter' && canConfirm && !isLoading) {
      handleConfirm();
    }
  }
  
  function handleBackdropClick(event: MouseEvent) {
    if (event.target === event.currentTarget && !isLoading) {
      handleCancel();
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
    aria-labelledby="dialog-title"
    tabindex="-1"
  >
    <!-- Dialog -->
    <div 
      bind:this={dialogRef}
      class="bg-white rounded-lg p-6 w-full max-w-md shadow-xl"
      transition:scale={{ duration: 200, start: 0.95 }}
      onclick={(e) => e.stopPropagation()}
    >
      <!-- Header with Icon -->
      <div class="flex items-start gap-4 mb-4">
        <div class="w-12 h-12 rounded-full {config.bgColor} flex items-center justify-center flex-shrink-0">
          {#if config.icon}
            {@const IconComponent = config.icon}
            <IconComponent class="w-6 h-6 {config.iconColor}" />
          {/if}
        </div>
        <div class="flex-1 min-w-0">
          <h3 id="dialog-title" class="text-h5 font-semibold text-gray-900 mb-2">
            {title}
          </h3>
          <p class="text-sm text-gray-600 leading-relaxed">
            {message}
          </p>
        </div>
      </div>
      
      <!-- Typing Input (if required) -->
      {#if requiresTyping}
        <div class="mb-6">
          <label for="confirmation-input" class="block text-sm font-medium text-gray-700 mb-2">
            Para confirmar, escribe: <code class="bg-gray-100 px-2 py-1 rounded text-sm font-mono text-red-600">{requiredText}</code>
          </label>
          <input
            id="confirmation-input"
            type="text"
            class="input-editorial w-full {canConfirm ? 'border-green-400 focus:border-green-500' : 'border-red-400 focus:border-red-500'}"
            placeholder={requiredText}
            bind:value={typingInput}
            disabled={isLoading}
            autocomplete="off"
            autofocus
          />
          {#if typingInput && !canConfirm}
            <p class="text-xs text-red-600 mt-1">Debe escribir exactamente "{requiredText}"</p>
          {/if}
        </div>
      {/if}
      
      <!-- Action Buttons -->
      <div class="flex gap-3">
        <button
          type="button"
          onclick={handleCancel}
          disabled={isLoading}
          class="btn-editorial btn-secondary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {cancelText}
        </button>
        <button
          type="button"
          onclick={handleConfirm}
          disabled={!canConfirm || isLoading}
          class="btn-editorial text-white {config.buttonColor} flex-1 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {#if isLoading}
            <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            Procesando...
          {:else}
            {confirmText}
          {/if}
        </button>
      </div>
    </div>
  </div>
{/if}