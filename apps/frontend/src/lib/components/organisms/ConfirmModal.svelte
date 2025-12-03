<script lang="ts">
  import { AlertTriangle, Check } from 'lucide-svelte';
  import { t } from '$lib/stores/i18n';
  import Modal from '$lib/components/atoms/Modal.svelte';
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

  const finalTitle = $derived(title || $t('modal.confirm_action'));
  const finalMessage = $derived(message || $t('modal.are_you_sure'));
  const finalConfirmText = $derived(confirmText || $t('common.confirm'));
  const finalCancelText = $derived(cancelText || $t('common.cancel'));

  function closeModal() {
    onCancel();
  }

  function confirm() {
    onConfirm();
  }
</script>

<Modal open={isOpen} onclose={closeModal} showClose={false} size="sm">
  <div class="confirm-content">
    <div class="icon-container {type}">
      {#if type === 'danger' || type === 'warning'}
        <AlertTriangle size={32} />
      {:else}
        <Check size={32} />
      {/if}
    </div>

    <h3 class="confirm-title">{finalTitle}</h3>
    <p class="confirm-message">{finalMessage}</p>

    {#if children}
      {@render children()}
    {/if}

    <div class="confirm-actions">
      <button class="btn-cancel" onclick={closeModal}>
        {finalCancelText}
      </button>
      <button class="btn-confirm {type}" onclick={confirm}>
        {finalConfirmText}
      </button>
    </div>
  </div>
</Modal>

<style>
  .confirm-content {
    text-align: center;
    padding: 0.5rem 0;
  }

  .icon-container {
    width: 72px;
    height: 72px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 1rem;
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

  .confirm-title {
    font-size: 1.125rem;
    font-weight: 600;
    margin-bottom: 0.5rem;
    color: var(--text-primary);
  }

  .confirm-message {
    font-size: 0.875rem;
    color: var(--text-secondary);
    margin-bottom: 1.5rem;
    line-height: 1.5;
  }

  .confirm-actions {
    display: flex;
    justify-content: center;
    gap: 0.75rem;
  }

  .btn-cancel,
  .btn-confirm {
    padding: 0.625rem 1.25rem;
    border-radius: var(--radius-md);
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s;
  }

  .btn-cancel {
    background: transparent;
    border: 1px solid var(--border-color);
    color: var(--text-secondary);
  }

  .btn-cancel:hover {
    background: var(--surface-muted);
    color: var(--text-primary);
  }

  .btn-confirm {
    border: none;
    color: white;
  }

  .btn-confirm.danger {
    background: rgb(239, 68, 68);
  }

  .btn-confirm.danger:hover {
    background: rgb(220, 53, 53);
  }

  .btn-confirm.warning {
    background: rgb(245, 158, 11);
  }

  .btn-confirm.warning:hover {
    background: rgb(230, 145, 5);
  }

  .btn-confirm.info {
    background: var(--primary);
  }

  .btn-confirm.info:hover {
    opacity: 0.9;
  }
</style>
