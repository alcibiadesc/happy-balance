<script lang="ts">
  interface NavigationOption {
    offset: number;
    label: string;
    fullLabel: string;
  }

  interface Props {
    selectedPeriod: string;
    periodOffset: number;
    loading?: boolean;
    navigationOptions: NavigationOption[];
    currentPeriodLabel: string;
    onPeriodNavigation: (offset: number) => void;
  }

  let {
    selectedPeriod,
    periodOffset,
    loading = false,
    navigationOptions,
    currentPeriodLabel,
    onPeriodNavigation
  }: Props = $props();
</script>

{#if selectedPeriod !== 'custom'}
  <div class="period-navigation">
    <div class="period-selector-dropdown">
      <select
        bind:value={periodOffset}
        onchange={() => onPeriodNavigation(periodOffset)}
        disabled={loading}
        class="period-select"
      >
        {#each navigationOptions as option}
          <option value={option.offset}>{option.label}</option>
        {/each}
      </select>
    </div>

    <div class="period-nav-buttons">
      <button
        class="nav-button"
        onclick={() => onPeriodNavigation(periodOffset + 1)}
        disabled={loading}
        title="Período anterior"
      >
        ←
      </button>
      <span class="current-period-label">{currentPeriodLabel}</span>
      <button
        class="nav-button"
        onclick={() => onPeriodNavigation(Math.max(0, periodOffset - 1))}
        disabled={loading || periodOffset === 0}
        title="Período siguiente"
      >
        →
      </button>
    </div>
  </div>
{/if}

<style>
  .period-navigation {
    margin-top: 1rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
    padding: 0.75rem;
    background: var(--surface-muted);
    border-radius: 8px;
    border: 1px solid var(--border-color, transparent);
  }

  .period-selector-dropdown {
    flex: 1;
    max-width: 200px;
  }

  .period-select {
    width: 100%;
    padding: 0.5rem 0.75rem;
    border: 1px solid var(--border-color);
    border-radius: 6px;
    background: var(--surface);
    color: var(--text-primary);
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .period-select:hover:not(:disabled) {
    border-color: var(--primary);
  }

  .period-select:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .period-nav-buttons {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .nav-button {
    width: 32px;
    height: 32px;
    border: 1px solid var(--border-color);
    border-radius: 6px;
    background: var(--surface);
    color: var(--text-secondary);
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .nav-button:hover:not(:disabled) {
    background: var(--primary);
    color: white;
    border-color: var(--primary);
  }

  .nav-button:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }

  .current-period-label {
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--text-primary);
    min-width: 120px;
    text-align: center;
  }

  /* Responsive */
  @media (max-width: 768px) {
    .period-navigation {
      flex-direction: column;
      gap: 0.75rem;
    }

    .period-selector-dropdown {
      max-width: none;
      width: 100%;
    }

    .current-period-label {
      min-width: auto;
      font-size: 0.8125rem;
    }
  }
</style>