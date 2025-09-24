<script lang="ts">
  import { X } from 'lucide-svelte';
  import { t } from '$lib/stores/i18n';

  interface PickerPosition {
    top: number;
    left: number;
    width: number;
    position: string;
  }

  interface Props {
    isOpen: boolean;
    position: PickerPosition;
    availableEmojis: string[];
    onSelect: (emoji: string) => void;
    onClose: () => void;
  }

  let {
    isOpen,
    position,
    availableEmojis,
    onSelect,
    onClose
  }: Props = $props();
</script>

{#if isOpen}
  <!-- Modal backdrop for better UX -->
  <div class="emoji-picker-backdrop" onclick={onClose}></div>

  <!-- Positioned picker container -->
  <div
    class="emoji-picker-overlay"
    class:position-top={position.position === 'top'}
    class:position-center={position.position === 'center'}
    style="
      top: {position.top}px;
      left: {position.left}px;
      width: {position.width}px;
    "
    role="dialog"
    aria-modal="true"
    aria-label={$t('accessibility.select_icon')}
  >
    <!-- Picker header for better UX -->
    <div class="emoji-picker-header">
      <span class="emoji-picker-title">Seleccionar icono</span>
      <button
        class="emoji-picker-close"
        onclick={onClose}
        aria-label={$t('accessibility.close_selector')}
      >
        <X size={14} />
      </button>
    </div>

    <!-- Scrollable grid of emojis -->
    <div
      class="emoji-picker-content"
      role="listbox"
      aria-label={$t('accessibility.icon_list')}
    >
      {#each availableEmojis as emoji}
        <button
          class="emoji-option"
          onclick={() => onSelect(emoji)}
          role="option"
          aria-label={emoji}
        >
          {emoji}
        </button>
      {/each}
    </div>
  </div>
{/if}

<style>
  /* Backdrop - Exact copy from categories page */
  .emoji-picker-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.1);
    z-index: 998;
    animation: fadeIn 0.15s ease;
  }

  /* Main picker overlay */
  .emoji-picker-overlay {
    position: fixed;
    z-index: 999;
    background: var(--surface-elevated);
    border: 1px solid var(--gray-200);
    border-radius: var(--radius-lg);
    box-shadow:
      0 20px 25px -5px rgba(0, 0, 0, 0.1),
      0 10px 10px -5px rgba(0, 0, 0, 0.04),
      0 0 0 1px rgba(0, 0, 0, 0.05);
    animation: modalSlideIn 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    transform-origin: var(--transform-origin, center bottom);
    max-width: 90vw;
    max-height: 80vh;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    box-sizing: border-box;
  }

  /* Animation variants based on position */
  .emoji-picker-overlay.position-top {
    --transform-origin: center bottom;
    animation: modalSlideInFromTop 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  }

  .emoji-picker-overlay.position-center {
    --transform-origin: center center;
    animation: modalSlideInCenter 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  }

  /* Picker header */
  .emoji-picker-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--space-sm) var(--space-md);
    border-bottom: 1px solid var(--gray-200);
    background: var(--gray-50);
    border-radius: var(--radius-lg) var(--radius-lg) 0 0;
  }

  .emoji-picker-title {
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--text-primary);
  }

  .emoji-picker-close {
    width: 1.5rem;
    height: 1.5rem;
    border: none;
    background: none;
    color: var(--text-muted);
    cursor: pointer;
    border-radius: var(--radius-sm);
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.15s ease;
  }

  .emoji-picker-close:hover {
    background: var(--gray-200);
    color: var(--text-primary);
  }

  /* Scrollable content area */
  .emoji-picker-content {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 8px;
    padding: var(--space-md);
    overflow-y: auto;
    overflow-x: hidden; /* Prevent horizontal scroll */
    scroll-behavior: smooth;
    scrollbar-width: thin;
    scrollbar-color: var(--gray-300) transparent;
    flex: 1;
    min-height: 0; /* Important for flex child scrolling */
    box-sizing: border-box;
  }

  .emoji-picker-content::-webkit-scrollbar {
    width: 6px;
  }

  .emoji-picker-content::-webkit-scrollbar-track {
    background: transparent;
  }

  .emoji-picker-content::-webkit-scrollbar-thumb {
    background-color: var(--gray-300);
    border-radius: 3px;
  }

  .emoji-picker-content::-webkit-scrollbar-thumb:hover {
    background-color: var(--gray-400);
  }

  .emoji-option {
    width: 100%;
    min-width: 0; /* Allow shrinking */
    aspect-ratio: 1;
    border: none;
    background: none;
    font-size: 1.25rem;
    cursor: pointer;
    border-radius: var(--radius-sm);
    transition: all 0.15s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    box-sizing: border-box;
    overflow: hidden; /* Prevent emoji overflow */
  }

  .emoji-option:hover {
    background: var(--gray-100);
    transform: scale(1.1);
  }

  .emoji-option:active {
    transform: scale(0.95);
  }

  /* Modal animations for different positions */
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  @keyframes modalSlideIn {
    from {
      opacity: 0;
      transform: translateY(10px) scale(0.95);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }

  @keyframes modalSlideInFromTop {
    from {
      opacity: 0;
      transform: translateY(-10px) scale(0.95);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }

  @keyframes modalSlideInCenter {
    from {
      opacity: 0;
      transform: scale(0.9);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }
</style>