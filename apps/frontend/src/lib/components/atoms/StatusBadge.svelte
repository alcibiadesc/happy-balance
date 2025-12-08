<script lang="ts">
  interface Props {
    variant:
      | 'ready'
      | 'duplicate'
      | 'duplicate-selected'
      | 'skipped'
      | 'warning'
      | 'success'
      | 'error';
    text: string;
    showDot?: boolean;
  }

  let { variant, text, showDot = true }: Props = $props();
</script>

<div class="status-badge {variant}">
  {#if showDot}
    <span class="status-dot"></span>
  {/if}
  <span class="status-text">{text}</span>
</div>

<style>
  .status-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    padding: 0.125rem 0.5rem;
    border-radius: 0.75rem;
    font-size: 0.6875rem;
    font-weight: 500;
  }

  .status-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .status-badge.ready {
    background: rgba(122, 186, 165, 0.1);
    color: var(--acapulco);
  }

  .status-badge.ready .status-dot {
    background: var(--acapulco);
  }

  .status-badge.duplicate {
    background: rgba(254, 205, 44, 0.1);
    color: #d4a000;
  }

  .status-badge.duplicate .status-dot {
    background: #fecd2c;
  }

  .status-badge.duplicate-selected {
    background: rgba(141, 195, 81, 0.2);
    color: #8dc351;
    border: 1px solid rgba(141, 195, 81, 0.3);
  }

  .status-badge.duplicate-selected .status-dot {
    background: #8dc351;
  }

  .status-badge.skipped {
    background: var(--surface-muted);
    color: var(--text-muted);
  }

  .status-badge.skipped .status-dot {
    background: var(--text-muted);
  }

  .status-badge.warning {
    background: rgba(254, 205, 44, 0.1);
    color: #d4a000;
  }

  .status-badge.warning .status-dot {
    background: #fecd2c;
  }

  .status-badge.success {
    background: rgba(34, 197, 94, 0.1);
    color: #22c55e;
  }

  .status-badge.success .status-dot {
    background: #22c55e;
  }

  .status-badge.error {
    background: rgba(239, 68, 68, 0.1);
    color: #ef4444;
  }

  .status-badge.error .status-dot {
    background: #ef4444;
  }

  @media (max-width: 768px) {
    .status-text {
      display: none;
    }
  }
</style>
