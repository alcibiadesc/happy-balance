<script lang="ts">
  import { X, Check, ArrowDown } from 'lucide-svelte';
  import { t } from '$lib/stores/i18n';

  interface Props {
    hasSuggestion: boolean;
    onAccept: () => void;
    onReject: () => void;
    onSkip: () => void;
  }

  const { hasSuggestion, onAccept, onReject, onSkip }: Props = $props();

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'ArrowRight' && hasSuggestion) {
      e.preventDefault();
      onAccept();
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      onReject();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      onSkip();
    }
  }
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="tinder-actions">
  <button
    class="action-btn reject-btn"
    onclick={onReject}
    title="{$t('tinder.reject')} (←)"
    aria-label={$t('tinder.reject')}
  >
    <X size={24} strokeWidth={2.5} />
  </button>

  <button
    class="action-btn skip-btn"
    onclick={onSkip}
    title="{$t('tinder.skip')} (↓)"
    aria-label={$t('tinder.skip')}
  >
    <ArrowDown size={20} strokeWidth={2.5} />
  </button>

  <button
    class="action-btn accept-btn"
    onclick={onAccept}
    disabled={!hasSuggestion}
    title="{$t('tinder.accept')} (→)"
    aria-label={$t('tinder.accept')}
  >
    <Check size={24} strokeWidth={2.5} />
  </button>
</div>

<style>
  .tinder-actions {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-xl, 1.5rem);
    padding: var(--space-lg, 1rem) 0;
  }

  .action-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    border: 2px solid;
    border-radius: 50%;
    cursor: pointer;
    transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
    background: var(--surface-elevated);
  }

  .action-btn:hover:not(:disabled) {
    transform: scale(1.15);
  }

  .action-btn:active:not(:disabled) {
    transform: scale(0.95);
  }

  .reject-btn {
    width: 56px;
    height: 56px;
    border-color: var(--froly, #f5796c);
    color: var(--froly, #f5796c);
  }

  .reject-btn:hover {
    background: rgba(245, 121, 108, 0.1);
    box-shadow: 0 4px 16px rgba(245, 121, 108, 0.3);
  }

  .skip-btn {
    width: 44px;
    height: 44px;
    border-color: var(--text-muted);
    color: var(--text-muted);
  }

  .skip-btn:hover {
    background: var(--surface-muted);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  .accept-btn {
    width: 56px;
    height: 56px;
    border-color: var(--acapulco, #7abaa5);
    color: var(--acapulco, #7abaa5);
  }

  .accept-btn:hover:not(:disabled) {
    background: rgba(122, 186, 165, 0.1);
    box-shadow: 0 4px 16px rgba(122, 186, 165, 0.3);
  }

  .accept-btn:disabled {
    opacity: 0.3;
    cursor: not-allowed;
    border-color: var(--text-muted);
    color: var(--text-muted);
  }

  @media (max-width: 480px) {
    .tinder-actions {
      gap: var(--space-lg, 1rem);
    }

    .reject-btn,
    .accept-btn {
      width: 50px;
      height: 50px;
    }

    .skip-btn {
      width: 40px;
      height: 40px;
    }
  }
</style>
