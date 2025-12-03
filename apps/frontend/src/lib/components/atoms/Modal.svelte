<script lang="ts">
  import { X } from 'lucide-svelte';
  import { t } from '$lib/stores/i18n';
  import type { Snippet } from 'svelte';

  interface Props {
    open: boolean;
    onclose: () => void;
    title?: string;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    showClose?: boolean;
    children: Snippet;
    footer?: Snippet;
  }

  const {
    open,
    onclose,
    title = '',
    size = 'md',
    showClose = true,
    children,
    footer,
  }: Props = $props();

  const sizeClasses: Record<string, string> = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
  };

  function handleBackdropClick(e: MouseEvent) {
    if (e.target === e.currentTarget) {
      onclose();
    }
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape' && open) {
      onclose();
    }
  }
</script>

<svelte:window onkeydown={handleKeydown} />

{#if open}
  <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
  <div class="modal-backdrop" onclick={handleBackdropClick}>
    <div
      class="modal-container {sizeClasses[size]}"
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
    >
      {#if title || showClose}
        <header class="modal-header">
          {#if title}
            <h2 id="modal-title" class="modal-title">{title}</h2>
          {:else}
            <div></div>
          {/if}
          {#if showClose}
            <button class="modal-close" onclick={onclose} aria-label={$t('common.close')}>
              <X size={20} strokeWidth={2} />
            </button>
          {/if}
        </header>
      {/if}

      <div class="modal-content">
        {@render children()}
      </div>

      {#if footer}
        <footer class="modal-footer">
          {@render footer()}
        </footer>
      {/if}
    </div>
  </div>
{/if}

<style>
  .modal-backdrop {
    position: fixed;
    inset: 0;
    z-index: 1100;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0, 0, 0, 0.4);
    backdrop-filter: blur(4px);
    -webkit-backdrop-filter: blur(4px);
    padding: 1rem;
    animation: fade-in 0.15s ease-out;
  }

  @keyframes fade-in {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  .modal-container {
    background: var(--surface);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-lg);
    width: 100%;
    max-height: 85vh;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    animation: modal-pop 0.2s ease-out;
  }

  @keyframes modal-pop {
    from {
      opacity: 0;
      transform: scale(0.95) translateY(-10px);
    }
    to {
      opacity: 1;
      transform: scale(1) translateY(0);
    }
  }

  .modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem 1.25rem;
    border-bottom: 1px solid var(--border-color);
    flex-shrink: 0;
  }

  .modal-title {
    font-size: 1rem;
    font-weight: 600;
    margin: 0;
    color: var(--text-primary);
  }

  .modal-close {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0.375rem;
    background: transparent;
    border: none;
    color: var(--text-tertiary);
    cursor: pointer;
    border-radius: var(--radius-sm);
    transition: all 0.15s;
  }

  .modal-close:hover {
    background: var(--surface-muted);
    color: var(--text-primary);
  }

  .modal-content {
    flex: 1;
    overflow-y: auto;
    padding: 1rem 1.25rem;
  }

  .modal-footer {
    padding: 0.75rem 1.25rem;
    border-top: 1px solid var(--border-color);
    flex-shrink: 0;
  }
</style>
