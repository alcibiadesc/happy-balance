<script lang="ts">
  import { ChevronLeft, ChevronRight, Calendar } from 'lucide-svelte';

  interface Props {
    currentMonth: string;
    currentYear: number;
    availablePeriods: Array<{ year: number; month: number; label: string }>;
    loading?: boolean;
    onMonthChange: (year: number, month: number) => void;
  }

  let {
    currentMonth,
    currentYear,
    availablePeriods,
    loading = false,
    onMonthChange
  }: Props = $props();

  // Generate last 12 months for quick selection
  const generateMonthOptions = () => {
    const options = [];
    const now = new Date();

    for (let i = 0; i < 12; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      options.push({
        year: date.getFullYear(),
        month: date.getMonth() + 1,
        label: date.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }),
        hasData: availablePeriods.some(p =>
          p.year === date.getFullYear() && p.month === date.getMonth() + 1
        )
      });
    }

    return options;
  };

  $: monthOptions = generateMonthOptions();
  $: currentMonthNum = new Date(`${currentMonth} 1, ${currentYear}`).getMonth() + 1;

  const navigatePrevious = () => {
    const current = new Date(currentYear, currentMonthNum - 1, 1);
    current.setMonth(current.getMonth() - 1);
    onMonthChange(current.getFullYear(), current.getMonth() + 1);
  };

  const navigateNext = () => {
    const current = new Date(currentYear, currentMonthNum - 1, 1);
    current.setMonth(current.getMonth() + 1);
    const now = new Date();

    // Don't navigate to future months
    if (current <= now) {
      onMonthChange(current.getFullYear(), current.getMonth() + 1);
    }
  };

  const handleQuickSelect = (event: Event) => {
    const select = event.target as HTMLSelectElement;
    const [year, month] = select.value.split('-').map(Number);
    onMonthChange(year, month);
  };

  const canGoNext = () => {
    const current = new Date(currentYear, currentMonthNum - 1, 1);
    const next = new Date(current);
    next.setMonth(next.getMonth() + 1);
    const now = new Date();
    return next <= now;
  };
</script>

<div class="month-navigator">
  <!-- Main Navigation -->
  <div class="nav-controls">
    <button
      class="nav-btn prev"
      onclick={navigatePrevious}
      disabled={loading}
      aria-label="Mes anterior"
    >
      <ChevronLeft size={20} />
    </button>

    <div class="current-display">
      <Calendar size={18} />
      <span class="month-name">{currentMonth}</span>
      <span class="year">{currentYear}</span>
      {#if availablePeriods.some(p => p.year === currentYear && p.month === currentMonthNum)}
        <span class="has-data-indicator" title="Este período tiene datos">●</span>
      {:else}
        <span class="no-data-indicator" title="Sin datos en este período">○</span>
      {/if}
    </div>

    <button
      class="nav-btn next"
      onclick={navigateNext}
      disabled={loading || !canGoNext()}
      aria-label="Mes siguiente"
    >
      <ChevronRight size={20} />
    </button>
  </div>

  <!-- Quick Month Selector -->
  <div class="quick-selector">
    <select
      onchange={handleQuickSelect}
      disabled={loading}
      value="{currentYear}-{currentMonthNum}"
      class="month-select"
    >
      <optgroup label="Selección rápida">
        {#each monthOptions as option}
          <option
            value="{option.year}-{option.month}"
            class:has-data={option.hasData}
          >
            {option.label} {option.hasData ? '●' : ''}
          </option>
        {/each}
      </optgroup>
    </select>
  </div>

  <!-- Quick Jump to Data -->
  {#if availablePeriods.length > 0}
    <div class="quick-jumps">
      <span class="label">Ir a:</span>
      <div class="jump-buttons">
        {#each availablePeriods.slice(0, 3) as period}
          <button
            class="jump-btn"
            onclick={() => onMonthChange(period.year, period.month)}
            disabled={loading || (period.year === currentYear && period.month === currentMonthNum)}
          >
            {new Date(period.year, period.month - 1).toLocaleDateString('es-ES', { month: 'short', year: '2-digit' })}
          </button>
        {/each}
      </div>
    </div>
  {/if}
</div>

<style>
  .month-navigator {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    padding: 1rem;
    background: var(--surface-elevated);
    border-radius: 0.75rem;
    border: 1px solid var(--border);
  }

  /* Main Navigation Controls */
  .nav-controls {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 1.5rem;
  }

  .nav-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border: 1px solid var(--border);
    border-radius: 0.5rem;
    background: var(--surface);
    color: var(--text-primary);
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .nav-btn:hover:not(:disabled) {
    background: var(--primary);
    color: white;
    border-color: var(--primary);
    transform: scale(1.05);
  }

  .nav-btn:active:not(:disabled) {
    transform: scale(0.95);
  }

  .nav-btn:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }

  .current-display {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 1.125rem;
    font-weight: 600;
    color: var(--text-primary);
    min-width: 200px;
    justify-content: center;
  }

  .month-name {
    text-transform: capitalize;
  }

  .year {
    color: var(--text-secondary);
  }

  .has-data-indicator {
    color: var(--success);
    font-size: 0.75rem;
  }

  .no-data-indicator {
    color: var(--text-tertiary);
    font-size: 0.75rem;
  }

  /* Quick Selector */
  .quick-selector {
    width: 100%;
  }

  .month-select {
    width: 100%;
    padding: 0.625rem 0.875rem;
    border: 1px solid var(--border);
    border-radius: 0.5rem;
    background: var(--surface);
    color: var(--text-primary);
    font-size: 0.9375rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .month-select:hover:not(:disabled) {
    border-color: var(--primary);
  }

  .month-select:focus {
    outline: none;
    border-color: var(--primary);
    box-shadow: 0 0 0 3px rgba(var(--primary-rgb), 0.1);
  }

  .month-select:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  /* Quick Jumps */
  .quick-jumps {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .quick-jumps .label {
    font-size: 0.875rem;
    color: var(--text-secondary);
    font-weight: 500;
  }

  .jump-buttons {
    display: flex;
    gap: 0.5rem;
    flex: 1;
  }

  .jump-btn {
    padding: 0.375rem 0.75rem;
    border: 1px solid var(--border);
    border-radius: 0.375rem;
    background: var(--surface);
    color: var(--text-secondary);
    font-size: 0.8125rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .jump-btn:hover:not(:disabled) {
    background: var(--primary);
    color: white;
    border-color: var(--primary);
  }

  .jump-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    background: var(--surface-muted);
  }

  /* Responsive */
  @media (max-width: 640px) {
    .month-navigator {
      padding: 0.75rem;
    }

    .current-display {
      min-width: auto;
      font-size: 1rem;
    }

    .nav-controls {
      gap: 1rem;
    }

    .quick-jumps {
      flex-direction: column;
      align-items: stretch;
    }

    .jump-buttons {
      justify-content: space-between;
    }
  }
</style>