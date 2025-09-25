<script lang="ts">
  import { ChevronLeft, ChevronRight } from 'lucide-svelte';

  interface Props {
    currentPeriod: string;
    selectedPeriodType: string;
    periodOffset: number;
    availablePeriods: Array<{ year: number; month: number; label: string }>;
    loading?: boolean;
    onNavigate: (offset: number) => void;
    onPeriodTypeChange: (type: string) => void;
  }

  let {
    currentPeriod,
    selectedPeriodType,
    periodOffset,
    availablePeriods,
    loading = false,
    onNavigate,
    onPeriodTypeChange
  }: Props = $props();

  // Period type options
  const periodTypes = [
    { value: 'month', label: 'Mes' },
    { value: 'quarter', label: 'Trimestre' },
    { value: 'year', label: 'Año' }
  ];

  // Quick navigation options for months
  const quickMonths = $derived(() => {
    const months = [];
    const now = new Date();
    for (let i = 0; i > -12; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() + i, 1);
      months.push({
        offset: i,
        label: date.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' }),
        fullLabel: date.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })
      });
    }
    return months;
  });

  // Navigate to past (negative offset)
  const goToPast = () => {
    onNavigate(-1);
  };

  // Navigate to future (positive offset, max 0)
  const goToFuture = () => {
    if (periodOffset < 0) {
      onNavigate(1);
    }
  };

  const handlePeriodTypeChange = (event: Event) => {
    const select = event.target as HTMLSelectElement;
    onPeriodTypeChange(select.value);
  };

  const handleQuickJump = (event: Event) => {
    const select = event.target as HTMLSelectElement;
    const newOffset = parseInt(select.value);
    // Calculate relative change
    const relativeChange = newOffset - periodOffset;
    onNavigate(relativeChange);
  };
</script>

<div class="period-navigator">
  <!-- Period Type Selector -->
  <div class="period-type">
    <select
      value={selectedPeriodType}
      onchange={handlePeriodTypeChange}
      disabled={loading}
      class="type-select"
    >
      {#each periodTypes as type}
        <option value={type.value}>{type.label}</option>
      {/each}
    </select>
  </div>

  <!-- Navigation Controls -->
  <div class="nav-controls">
    <button
      class="nav-btn"
      onclick={goToPast}
      disabled={loading || periodOffset <= -24}
      title="Período anterior"
    >
      <ChevronLeft size={18} />
    </button>

    <div class="current-period">
      {currentPeriod}
    </div>

    <button
      class="nav-btn"
      onclick={goToFuture}
      disabled={loading || periodOffset >= 0}
      title="Período siguiente"
    >
      <ChevronRight size={18} />
    </button>
  </div>

  <!-- Quick Jump Selector (only for months) -->
  {#if selectedPeriodType === 'month'}
    <div class="quick-select">
      <select
        value={periodOffset}
        onchange={handleQuickJump}
        disabled={loading}
        class="month-select"
      >
        {#each quickMonths() as month}
          <option value={month.offset}>
            {month.label}
          </option>
        {/each}
      </select>
    </div>
  {/if}
</div>

<style>
  .period-navigator {
    display: flex;
    align-items: center;
    gap: 1rem;
    flex-wrap: wrap;
  }

  /* Period Type Selector */
  .period-type {
    display: flex;
  }

  .type-select {
    padding: 0.375rem 0.75rem;
    border: 1px solid var(--border);
    border-radius: 0.375rem;
    background: var(--surface);
    color: var(--text-primary);
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .type-select:hover:not(:disabled) {
    border-color: var(--primary);
  }

  .type-select:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  /* Navigation Controls */
  .nav-controls {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    background: var(--surface-elevated);
    padding: 0.25rem;
    border-radius: 0.5rem;
  }

  .nav-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border: none;
    background: transparent;
    color: var(--text-secondary);
    cursor: pointer;
    border-radius: 0.25rem;
    transition: all 0.15s ease;
  }

  .nav-btn:hover:not(:disabled) {
    background: var(--surface-muted);
    color: var(--text-primary);
  }

  .nav-btn:active:not(:disabled) {
    transform: scale(0.95);
  }

  .nav-btn:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }

  .current-period {
    min-width: 140px;
    text-align: center;
    font-size: 0.9375rem;
    font-weight: 500;
    color: var(--text-primary);
    text-transform: capitalize;
    padding: 0 0.5rem;
  }

  /* Quick Month Selector */
  .quick-select {
    display: flex;
  }

  .month-select {
    padding: 0.375rem 0.5rem;
    border: 1px solid var(--border);
    border-radius: 0.375rem;
    background: var(--surface);
    color: var(--text-secondary);
    font-size: 0.8125rem;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .month-select:hover:not(:disabled) {
    border-color: var(--primary);
  }

  .month-select:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  /* Responsive */
  @media (max-width: 640px) {
    .period-navigator {
      justify-content: center;
    }

    .current-period {
      min-width: 100px;
      font-size: 0.875rem;
    }
  }
</style>