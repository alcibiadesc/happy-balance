<script lang="ts">
  interface Props {
    isOpen: boolean;
    icons: string[];
    position: { top: number; left: number };
    onSelect: (icon: string) => void;
    onClose: () => void;
  }

  let { isOpen, icons, position, onSelect, onClose }: Props = $props();
</script>

{#if isOpen}
  <div class="picker-overlay" onclick={onClose} role="dialog" aria-modal="true">
    <div
      class="icon-picker"
      style="top: {position.top}px; left: {position.left}px;"
      onclick={(e) => e.stopPropagation()}
    >
      {#each icons as icon (icon)}
        <button class="icon-option" onclick={() => onSelect(icon)}>
          {icon}
        </button>
      {/each}
    </div>
  </div>
{/if}

<style>
  .picker-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.3);
    z-index: 100;
  }

  .icon-picker {
    position: fixed;
    display: grid;
    grid-template-columns: repeat(6, 1fr);
    gap: 0.25rem;
    padding: 0.75rem;
    background: var(--surface-elevated);
    border: 1px solid var(--border-color);
    border-radius: 12px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
    max-width: 280px;
    z-index: 101;
  }

  .icon-option {
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.25rem;
    background: var(--surface-muted);
    border: 1px solid var(--border-color);
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .icon-option:hover {
    background: var(--primary);
    border-color: var(--primary);
    transform: scale(1.1);
  }
</style>
