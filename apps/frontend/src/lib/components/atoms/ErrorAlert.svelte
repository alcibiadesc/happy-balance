<script lang="ts">
  import { X, AlertTriangle } from 'lucide-svelte';

  interface Props {
    message: string;
    onClose: () => void;
  }

  let { message, onClose }: Props = $props();
</script>

{#if message}
  <div class="error-alert">
    <AlertTriangle size={20} class="error-icon" />
    <span class="error-message">{message}</span>
    <button class="error-close" onclick={onClose} aria-label="Close error message">
      <X size={16} />
    </button>
  </div>
{/if}

<style>
  .error-alert {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin: 1.5rem;
    padding: 1rem;
    background: rgba(245, 121, 108, 0.1);
    border: 1px solid rgba(245, 121, 108, 0.2);
    border-radius: 0.75rem;
    color: #f5796c;
  }

  .error-alert :global(.error-icon) {
    flex-shrink: 0;
  }

  .error-message {
    flex: 1;
    font-size: 0.875rem;
    font-weight: 500;
  }

  .error-close {
    padding: 0.5rem;
    border: none;
    background: transparent;
    color: inherit;
    border-radius: 0.5rem;
    cursor: pointer;
    transition: background-color 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .error-close:hover {
    background: rgba(245, 121, 108, 0.1);
  }
</style>
