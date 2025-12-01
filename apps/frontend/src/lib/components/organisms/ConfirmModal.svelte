<script lang="ts">
  import { AlertTriangle, Check, X } from 'lucide-svelte';
  import { t } from '$lib/stores/i18n';
  import { modalKeyboard } from '$lib/actions/modalKeyboard';
  import type { Snippet } from 'svelte';

  interface Props {
    isOpen: boolean;
    title?: string;
    message?: string;
    confirmText?: string;
    cancelText?: string;
    type?: 'warning' | 'danger' | 'info';
    onConfirm?: () => void;
    onCancel?: () => void;
    children?: Snippet;
  }

  const {
    isOpen = false,
    title = '',
    message = '',
    confirmText = '',
    cancelText = '',
    type = 'warning',
    onConfirm = () => {},
    onCancel = () => {},
    children,
  }: Props = $props();

  // Use i18n for default values
  const finalTitle = $derived(title || $t('modal.confirm_action'));
  const finalMessage = $derived(message || $t('modal.are_you_sure'));
  const finalConfirmText = $derived(confirmText || $t('common.confirm'));
  const finalCancelText = $derived(cancelText || $t('common.cancel'));

  // Close modal function
  function closeModal() {
    onCancel();
  }

  // Confirm action
  function confirm() {
    onConfirm();
  }

  // Handle backdrop click
  function handleBackdropClick(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      closeModal();
    }
  }
</script>

<div use:modalKeyboard={{ onConfirm: confirm, onCancel: closeModal, isOpen }}></div>

{#if isOpen}
  <!-- DaisyUI Modal -->
  <div class="modal modal-open" onclick={handleBackdropClick} role="dialog">
    <div class="modal-box relative max-w-md">
      <!-- Close button -->
      <button class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2" onclick={closeModal}>
        <X size={18} />
      </button>

      <!-- Icon based on type -->
      <div class="mb-4 flex justify-center">
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
      <h3 class="mb-2 text-center text-lg font-bold">{finalTitle}</h3>

      <!-- Message -->
      <p class="text-base-content/80 mb-6 text-center">{finalMessage}</p>

      <!-- Slot for additional content -->
      {#if children}
        {@render children()}
      {/if}

      <!-- Action buttons -->
      <div class="modal-action flex justify-center gap-3">
        <button class="btn btn-outline" onclick={closeModal}>
          {finalCancelText}
        </button>
        <button
          class="btn {type === 'danger'
            ? 'btn-error'
            : type === 'warning'
              ? 'btn-warning'
              : 'btn-primary'}"
          onclick={confirm}
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
