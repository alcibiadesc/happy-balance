<script lang="ts">
  import { AlertTriangle, Check, X } from 'lucide-svelte';
  import { t } from '$lib/stores/i18n';

  // Props
  export let isOpen = false;
  export let title = '';
  export let message = '';
  export let confirmText = '';
  export let cancelText = '';
  export let type: 'warning' | 'danger' | 'info' = 'warning';
  export let onConfirm: () => void = () => {};
  export let onCancel: () => void = () => {};

  // Use i18n for default values
  $: finalTitle = title || $t('modal.confirm_action');
  $: finalMessage = message || $t('modal.are_you_sure');
  $: finalConfirmText = confirmText || $t('common.confirm');
  $: finalCancelText = cancelText || $t('common.cancel');

  // Close modal function
  function closeModal() {
    isOpen = false;
    onCancel();
  }

  // Confirm action
  function confirm() {
    onConfirm();
    isOpen = false;
  }

  // Handle backdrop click
  function handleBackdropClick(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      closeModal();
    }
  }

  // Handle escape key
  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      closeModal();
    }
  }
</script>

<svelte:window on:keydown={handleKeydown} />

{#if isOpen}
  <!-- DaisyUI Modal -->
  <div class="modal modal-open" on:click={handleBackdropClick} role="dialog">
    <div class="modal-box relative max-w-md">
      <!-- Close button -->
      <button class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2" on:click={closeModal}>
        <X size={18} />
      </button>

      <!-- Icon based on type -->
      <div class="flex justify-center mb-4">
        <div class="icon-container {type}">
          {#if type === 'danger'}
            <AlertTriangle size={32} />
          {:else if type === 'warning'}
            <AlertTriangle size={32} />
          {:else}
            <Check size={32} />
          {/if}
        </div>
      </div>

      <!-- Title -->
      <h3 class="font-bold text-lg text-center mb-2">{finalTitle}</h3>

      <!-- Message -->
      <p class="text-center text-base-content/80 mb-6">{finalMessage}</p>

      <!-- Action buttons -->
      <div class="modal-action flex gap-3 justify-center">
        <button class="btn btn-outline" on:click={closeModal}>
          {finalCancelText}
        </button>
        <button
          class="btn {type === 'danger' ? 'btn-error' : type === 'warning' ? 'btn-warning' : 'btn-primary'}"
          on:click={confirm}
        >
          {finalConfirmText}
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  .icon-container {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto;
  }

  .icon-container.danger {
    background-color: rgba(239, 68, 68, 0.1);
    color: rgb(239, 68, 68);
  }

  .icon-container.warning {
    background-color: rgba(245, 158, 11, 0.1);
    color: rgb(245, 158, 11);
  }

  .icon-container.info {
    background-color: rgba(59, 130, 246, 0.1);
    color: rgb(59, 130, 246);
  }

  .modal-box {
    animation: modal-pop 0.2s ease-out;
  }

  @keyframes modal-pop {
    0% {
      opacity: 0;
      transform: scale(0.9) translateY(-20px);
    }
    100% {
      opacity: 1;
      transform: scale(1) translateY(0);
    }
  }
</style>