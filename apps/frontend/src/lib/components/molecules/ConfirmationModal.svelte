<script lang="ts">
  import { X } from 'lucide-svelte';
  import { modalKeyboard } from '$lib/actions/modalKeyboard';
  import { t } from '$lib/stores/i18n';

  interface Props {
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'warning' | 'info';
    onConfirm: () => void;
    onCancel: () => void;
  }

  let {
    isOpen,
    title,
    message,
    confirmText = $t('common.confirm'),
    cancelText = $t('common.cancel'),
    variant = 'danger',
    onConfirm,
    onCancel,
  }: Props = $props();
</script>

{#if isOpen}
  <div use:modalKeyboard={{ onConfirm, onCancel, isOpen }}></div>
  <div
    class="modal-overlay"
    onclick={onCancel}
    role="dialog"
    aria-modal="true"
    aria-labelledby="confirm-title"
    tabindex="-1"
  >
    <div class="modal-content" onclick={(e) => e.stopPropagation()} role="document">
      <div class="modal-header">
        <h2 id="confirm-title" class="modal-title">{title}</h2>
        <button class="btn-close" onclick={onCancel} aria-label="Close">
          <X size={18} />
        </button>
      </div>
      <div class="modal-body">
        <p class="modal-message">{message}</p>
      </div>
      <div class="modal-footer">
        <button class="btn-cancel" onclick={onCancel}>
          {cancelText}
        </button>
        <button class="btn-confirm {variant}" onclick={onConfirm}>
          {confirmText}
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  .modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(4px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
    padding: 1rem;
  }

  .modal-content {
    background: var(--surface-elevated);
    border: 1px solid var(--border-color);
    border-radius: 12px;
    width: 100%;
    max-width: 400px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.25rem 1.5rem;
    border-bottom: 1px solid var(--border-color);
  }

  .modal-title {
    margin: 0;
    font-size: 1.125rem;
    font-weight: 600;
    color: var(--text-primary);
  }

  .btn-close {
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--surface-muted);
    border: 1px solid var(--border-color);
    border-radius: 8px;
    color: var(--text-muted);
    cursor: pointer;
    transition: all 0.15s;
  }

  .btn-close:hover {
    background: var(--surface-hover);
    color: var(--text-primary);
  }

  .modal-body {
    padding: 1.5rem;
  }

  .modal-message {
    margin: 0;
    font-size: 0.9375rem;
    color: var(--text-secondary);
    line-height: 1.5;
  }

  .modal-footer {
    display: flex;
    gap: 0.75rem;
    padding: 1rem 1.5rem;
    border-top: 1px solid var(--border-color);
    justify-content: flex-end;
  }

  .btn-cancel,
  .btn-confirm {
    padding: 0.625rem 1.25rem;
    border-radius: 8px;
    font-weight: 500;
    font-size: 0.875rem;
    cursor: pointer;
    transition: all 0.15s;
  }

  .btn-cancel {
    background: var(--surface-muted);
    border: 1px solid var(--border-color);
    color: var(--text-secondary);
  }

  .btn-cancel:hover {
    background: var(--surface-hover);
    color: var(--text-primary);
  }

  .btn-confirm {
    border: none;
    color: white;
  }

  .btn-confirm.danger {
    background: #ef4444;
  }

  .btn-confirm.danger:hover {
    background: #dc2626;
  }

  .btn-confirm.warning {
    background: #f59e0b;
  }

  .btn-confirm.warning:hover {
    background: #d97706;
  }

  .btn-confirm.info {
    background: var(--primary);
  }

  .btn-confirm.info:hover {
    background: var(--primary-hover);
  }
</style>
