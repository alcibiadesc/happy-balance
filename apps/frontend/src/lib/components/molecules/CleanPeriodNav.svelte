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

  let showDropdown = $state(false);
  let dropdownRef: HTMLDivElement;

  // Period type options
  const periodTypes = [
    { value: 'month', label: 'Mensual' },
    { value: 'quarter', label: 'Trimestral' },
    { value: 'year', label: 'Anual' }
  ];

  // Generate quick navigation options based on period type
  const navigationOptions = $derived(() => {
    const options = [];
    const now = new Date();

    if (selectedPeriodType === 'month') {
      for (let i = 0; i > -24; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() + i, 1);
        options.push({
          offset: i,
          label: date.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })
        });
      }
    } else if (selectedPeriodType === 'quarter') {
      for (let i = 0; i > -12; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() + (i * 3), 1);
        const quarter = Math.floor(date.getMonth() / 3) + 1;
        options.push({
          offset: i,
          label: `Q${quarter} ${date.getFullYear()}`
        });
      }
    } else if (selectedPeriodType === 'year') {
      for (let i = 0; i > -5; i--) {
        options.push({
          offset: i,
          label: (now.getFullYear() + i).toString()
        });
      }
    }

    return options;
  });

  // Navigate to past
  const goToPast = () => onNavigate(-1);

  // Navigate to future
  const goToFuture = () => {
    if (periodOffset < 0) onNavigate(1);
  };

  // Toggle dropdown
  const toggleDropdown = () => {
    showDropdown = !showDropdown;
  };

  // Handle selection from dropdown
  const handleSelection = (newOffset: number) => {
    const relativeChange = newOffset - periodOffset;
    onNavigate(relativeChange);
    showDropdown = false;
  };

  // Handle period type change
  const changePeriodType = (type: string) => {
    onPeriodTypeChange(type);
    showDropdown = false;
  };

  // Close dropdown when clicking outside
  const handleClickOutside = (event: MouseEvent) => {
    if (dropdownRef && !dropdownRef.contains(event.target as Node)) {
      showDropdown = false;
    }
  };

  $effect(() => {
    if (showDropdown) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  });
</script>

<div class="period-nav">
  <button
    class="nav-arrow"
    onclick={goToPast}
    disabled={loading}
    title="Período anterior"
  >
    <ChevronLeft size={18} />
  </button>

  <div class="period-selector" bind:this={dropdownRef}>
    <button
      class="current-period"
      onclick={toggleDropdown}
      disabled={loading}
    >
      {currentPeriod}
    </button>

    {#if showDropdown}
      <div class="dropdown">
        <!-- Period Type Tabs -->
        <div class="period-tabs">
          {#each periodTypes as type}
            <button
              class="tab"
              class:active={selectedPeriodType === type.value}
              onclick={() => changePeriodType(type.value)}
            >
              {type.label}
            </button>
          {/each}
        </div>

        <!-- Period Options -->
        <div class="period-options">
          {#each navigationOptions() as option}
            <button
              class="option"
              class:selected={periodOffset === option.offset}
              onclick={() => handleSelection(option.offset)}
            >
              {option.label}
            </button>
          {/each}
        </div>
      </div>
    {/if}
  </div>

  <button
    class="nav-arrow"
    onclick={goToFuture}
    disabled={loading || periodOffset >= 0}
    title="Período siguiente"
  >
    <ChevronRight size={18} />
  </button>
</div>

<style>
  .period-nav {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
  }

  .nav-arrow {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border: none;
    background: var(--surface-elevated);
    color: var(--text-secondary);
    cursor: pointer;
    border-radius: 0.375rem;
    transition: all 0.15s ease;
  }

  .nav-arrow:hover:not(:disabled) {
    background: var(--surface-muted);
    color: var(--text-primary);
  }

  .nav-arrow:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }

  .period-selector {
    position: relative;
  }

  .current-period {
    padding: 0.5rem 1rem;
    background: var(--surface-elevated);
    border: none;
    border-radius: 0.375rem;
    font-size: 0.9375rem;
    font-weight: 500;
    color: var(--text-primary);
    cursor: pointer;
    transition: all 0.15s ease;
    text-transform: capitalize;
    min-width: 180px;
  }

  .current-period:hover:not(:disabled) {
    background: var(--surface-muted);
  }

  .current-period:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .dropdown {
    position: absolute;
    top: calc(100% + 0.5rem);
    left: 50%;
    transform: translateX(-50%);
    min-width: 240px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 0.5rem;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    z-index: 1000;
    overflow: hidden;
  }

  .period-tabs {
    display: flex;
    border-bottom: 1px solid var(--border);
  }

  .tab {
    flex: 1;
    padding: 0.5rem;
    background: transparent;
    border: none;
    font-size: 0.8125rem;
    font-weight: 500;
    color: var(--text-secondary);
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .tab:hover {
    background: var(--surface-elevated);
  }

  .tab.active {
    color: var(--primary);
    border-bottom: 2px solid var(--primary);
    margin-bottom: -1px;
  }

  .period-options {
    max-height: 280px;
    overflow-y: auto;
    padding: 0.25rem;
  }

  .option {
    display: block;
    width: 100%;
    padding: 0.5rem 0.75rem;
    background: transparent;
    border: none;
    border-radius: 0.25rem;
    text-align: left;
    font-size: 0.875rem;
    color: var(--text-primary);
    cursor: pointer;
    transition: all 0.15s ease;
    text-transform: capitalize;
  }

  .option:hover {
    background: var(--surface-elevated);
  }

  .option.selected {
    background: var(--primary);
    color: white;
  }

  /* Scrollbar styling */
  .period-options::-webkit-scrollbar {
    width: 6px;
  }

  .period-options::-webkit-scrollbar-track {
    background: var(--surface-elevated);
  }

  .period-options::-webkit-scrollbar-thumb {
    background: var(--border);
    border-radius: 3px;
  }

  .period-options::-webkit-scrollbar-thumb:hover {
    background: var(--text-tertiary);
  }

  /* Responsive */
  @media (max-width: 640px) {
    .current-period {
      min-width: 140px;
      font-size: 0.875rem;
    }

    .dropdown {
      min-width: 200px;
    }
  }
</style>