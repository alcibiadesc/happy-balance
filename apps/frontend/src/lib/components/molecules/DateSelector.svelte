<script lang="ts">
  import {
    ChevronLeft,
    ChevronRight,
    ChevronDown,
    CalendarDays,
    CalendarRange,
    Layers,
    Eye,
    EyeOff
  } from 'lucide-svelte';
  import { t } from '$lib/stores/i18n';

  interface DateSelectorProps {
    selectedPeriod: string;
    showAllTransactions: boolean;
    showHiddenTransactions: boolean;
    dateRangeMode: 'month' | 'custom';
    customStartDate: string;
    customEndDate: string;
    showDatePicker: boolean;
    onPreviousPeriod: () => void;
    onNextPeriod: () => void;
    onToggleAllTransactions: () => void;
    onToggleHiddenTransactions: () => void;
    onToggleDateRangeMode: () => void;
    onToggleDatePicker: () => void;
    onUpdatePeriod: (period: string) => void;
    onUpdateCustomStartDate: (date: string) => void;
    onUpdateCustomEndDate: (date: string) => void;
  }

  let {
    selectedPeriod = $bindable(),
    showAllTransactions = $bindable(),
    showHiddenTransactions = $bindable(),
    dateRangeMode = $bindable(),
    customStartDate = $bindable(),
    customEndDate = $bindable(),
    showDatePicker = $bindable(),
    onPreviousPeriod,
    onNextPeriod,
    onToggleAllTransactions,
    onToggleHiddenTransactions,
    onToggleDateRangeMode,
    onToggleDatePicker,
    onUpdatePeriod,
    onUpdateCustomStartDate,
    onUpdateCustomEndDate
  }: DateSelectorProps = $props();

  function formatPeriodDisplay(period: string): string {
    if (!period) return 'Seleccionar mes';
    const date = new Date(period + '-01');
    return date.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
  }

  function navigateYear(direction: number) {
    const [year, month] = selectedPeriod.split('-');
    const newYear = parseInt(year) + direction;
    onUpdatePeriod(`${newYear}-${month}`);
  }

  function selectMonth(month: string) {
    const year = selectedPeriod.split('-')[0];
    onUpdatePeriod(`${year}-${month}`);
    showDatePicker = false;
  }
</script>

<div class="date-selector-section" class:show-all={showAllTransactions}>
  <!-- All transactions toggle -->
  <button
    class="all-toggle-btn"
    class:active={showAllTransactions}
    onclick={onToggleAllTransactions}
    title={showAllTransactions ? 'Mostrar período seleccionado' : 'Mostrar todas las transacciones'}
    aria-label={showAllTransactions ? $t('accessibility.show_period') : $t('accessibility.show_all')}
  >
    <Layers size={14} />
  </button>

  <!-- Date controls -->
  {#if dateRangeMode === 'month'}
    <button
      class="date-nav-btn"
      class:disabled={showAllTransactions}
      onclick={showAllTransactions ? null : onPreviousPeriod}
    >
      <ChevronLeft size={14} />
    </button>
    <button
      class="date-display"
      class:disabled={showAllTransactions}
      onclick={showAllTransactions ? null : onToggleDatePicker}
    >
      <CalendarDays size={14} />
      <span>{showAllTransactions ? '----' : formatPeriodDisplay(selectedPeriod)}</span>
      <ChevronDown size={14} />
    </button>
    <button
      class="date-nav-btn"
      class:disabled={showAllTransactions}
      onclick={showAllTransactions ? null : onNextPeriod}
    >
      <ChevronRight size={14} />
    </button>
  {:else}
    <div class="custom-date-range" class:disabled={showAllTransactions}>
      <input
        type="date"
        class="date-input"
        value={customStartDate}
        oninput={(e) => onUpdateCustomStartDate(e.currentTarget.value)}
        placeholder={$t('accessibility.date_from')}
        disabled={showAllTransactions}
      />
      <span class="date-separator">-</span>
      <input
        type="date"
        class="date-input"
        value={customEndDate}
        oninput={(e) => onUpdateCustomEndDate(e.currentTarget.value)}
        placeholder={$t('accessibility.date_to')}
        disabled={showAllTransactions}
      />
    </div>
  {/if}

  <button
    class="date-mode-btn"
    class:disabled={showAllTransactions}
    onclick={showAllTransactions ? null : onToggleDateRangeMode}
    title={showAllTransactions ? 'Deshabilitado al mostrar todas las transacciones' : (dateRangeMode === 'month' ? 'Cambiar a rango personalizado' : 'Cambiar a selección de mes')}
  >
    <CalendarRange size={14} />
  </button>

  <!-- Hidden transactions toggle -->
  <button
    class="hidden-toggle-btn"
    class:active={showHiddenTransactions}
    onclick={onToggleHiddenTransactions}
    title={showHiddenTransactions ? 'Ocultar gastos excluidos' : 'Mostrar gastos excluidos'}
  >
    {#if showHiddenTransactions}
      <EyeOff size={14} />
    {:else}
      <Eye size={14} />
    {/if}
  </button>
</div>

<!-- Month Picker Dropdown -->
{#if showDatePicker && dateRangeMode === 'month' && !showAllTransactions}
  <div class="month-picker-dropdown">
    <div class="month-picker-header">
      <button class="year-nav-btn" onclick={() => navigateYear(-1)}>
        <ChevronLeft size={14} />
      </button>
      <span class="year-label">{selectedPeriod.split('-')[0]}</span>
      <button class="year-nav-btn" onclick={() => navigateYear(1)}>
        <ChevronRight size={14} />
      </button>
    </div>
    <div class="month-grid">
      {#each ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'] as month}
        {@const monthDate = `${selectedPeriod.split('-')[0]}-${month}`}
        <button
          class="month-option"
          class:selected={selectedPeriod === monthDate}
          onclick={() => selectMonth(month)}
        >
          {new Date(`${monthDate}-01`).toLocaleDateString('es-ES', { month: 'short' })}
        </button>
      {/each}
    </div>
  </div>
{/if}

<style>
  .date-selector-section {
    display: flex;
    gap: 0.5rem;
    align-items: center;
  }

  .date-selector-section.show-all .date-display,
  .date-selector-section.show-all .date-nav-btn,
  .date-selector-section.show-all .date-mode-btn,
  .date-selector-section.show-all .custom-date-range {
    opacity: 0.3;
  }

  .all-toggle-btn,
  .date-nav-btn,
  .date-mode-btn,
  .hidden-toggle-btn {
    padding: 0.5rem;
    background: var(--surface);
    border: 1px solid var(--border-color);
    border-radius: 8px;
    color: var(--text-secondary);
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .all-toggle-btn:hover,
  .date-nav-btn:hover,
  .date-mode-btn:hover,
  .hidden-toggle-btn:hover {
    background: var(--surface-hover);
    border-color: var(--border-hover);
  }

  .all-toggle-btn:hover:not(.active),
  .hidden-toggle-btn:hover:not(.active) {
    border-color: var(--acapulco);
    color: var(--acapulco);
  }

  .all-toggle-btn.active,
  .hidden-toggle-btn.active {
    background: var(--acapulco);
    color: white;
    border-color: var(--acapulco);
  }

  .date-nav-btn.disabled,
  .date-mode-btn.disabled {
    cursor: not-allowed;
    pointer-events: none;
  }

  .date-display {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 0.75rem;
    background: var(--surface);
    border: 1px solid var(--border-color);
    border-radius: 8px;
    color: var(--text-primary);
    cursor: pointer;
    transition: all 0.2s ease;
    font-size: 0.875rem;
    min-width: 180px;
    justify-content: center;
  }

  .date-display:hover {
    background: var(--surface-hover);
    border-color: var(--border-hover);
  }

  .date-display.disabled {
    cursor: not-allowed;
    pointer-events: none;
  }

  .custom-date-range {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    padding: 0.25rem 0.5rem;
    background: var(--surface);
    border: 1px solid var(--border-color);
    border-radius: 8px;
  }

  .custom-date-range.disabled {
    pointer-events: none;
  }

  .date-input {
    padding: 0.25rem;
    background: transparent;
    border: none;
    color: var(--text-primary);
    font-size: 0.8125rem;
    outline: none;
    width: 100px;
  }

  .date-separator {
    color: var(--text-muted);
    font-size: 0.75rem;
  }

  /* Month Picker Dropdown */
  .month-picker-dropdown {
    position: absolute;
    top: calc(100% + 0.5rem);
    left: 50%;
    transform: translateX(-50%);
    background: var(--surface);
    border: 1px solid var(--border-color);
    border-radius: 12px;
    padding: 1rem;
    box-shadow: var(--shadow-lg);
    z-index: 100;
    min-width: 280px;
  }

  .month-picker-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
    padding: 0 0.5rem;
  }

  .year-nav-btn {
    padding: 0.25rem 0.5rem;
    background: transparent;
    border: none;
    color: var(--text-secondary);
    cursor: pointer;
    border-radius: 4px;
    transition: all 0.2s ease;
  }

  .year-nav-btn:hover {
    background: var(--surface-hover);
  }

  .year-label {
    font-size: 1rem;
    font-weight: 500;
    color: var(--text-primary);
  }

  .month-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 0.5rem;
  }

  .month-option {
    padding: 0.5rem;
    background: transparent;
    border: 1px solid transparent;
    border-radius: 6px;
    color: var(--text-primary);
    cursor: pointer;
    transition: all 0.2s ease;
    font-size: 0.875rem;
    text-align: center;
  }

  .month-option:hover {
    background: var(--surface-hover);
  }

  .month-option.selected {
    background: var(--primary);
    color: white;
    font-weight: 500;
  }

  @media (min-width: 768px) and (max-width: 1023px) {
    .date-selector-section {
      gap: 0.375rem;
    }

    .date-display {
      min-width: 140px;
      font-size: 0.8125rem;
      padding: 0.5rem;
    }

    .date-display span {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .custom-date-range {
      padding: 0.25rem 0.375rem;
    }

    .date-input {
      width: 90px;
      font-size: 0.75rem;
    }

    .all-toggle-btn,
    .date-nav-btn,
    .date-mode-btn,
    .hidden-toggle-btn {
      padding: 0.4rem;
    }
  }

  @media (max-width: 767px) {
    .date-selector-section {
      flex-wrap: wrap;
      gap: 0.375rem;
    }

    .date-display {
      min-width: unset;
      font-size: 0.8125rem;
    }
  }
</style>