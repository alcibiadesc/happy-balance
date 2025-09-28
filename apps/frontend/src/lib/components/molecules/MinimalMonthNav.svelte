<script lang="ts">
  import { ChevronLeft, ChevronRight } from 'lucide-svelte';

  interface Props {
    currentPeriod: string;
    availablePeriods: Array<{ year: number; month: number }>;
    loading?: boolean;
    onNavigate: (offset: number) => void;
    canGoForward?: boolean;
    canGoBack?: boolean;
  }

  let {
    currentPeriod,
    availablePeriods,
    loading = false,
    onNavigate,
    canGoForward = true,
    canGoBack = true
  }: Props = $props();

  const goBack = () => {
    if (canGoBack) onNavigate(-1);
  };

  const goForward = () => {
    if (canGoForward) onNavigate(1);
  };
</script>

<div class="month-nav">
  <button
    class="nav-arrow"
    onclick={goBack}
    disabled={loading || !canGoBack}
    aria-label="Mes anterior"
  >
    <ChevronLeft size={18} />
  </button>

  <span class="current-month">{currentPeriod}</span>

  <button
    class="nav-arrow"
    onclick={goForward}
    disabled={loading || !canGoForward}
    aria-label="Mes siguiente"
  >
    <ChevronRight size={18} />
  </button>
</div>

<style>
  .month-nav {
    display: inline-flex;
    align-items: center;
    gap: 1rem;
    padding: 0.5rem 1rem;
    background: var(--surface-elevated);
    border-radius: 0.5rem;
  }

  .nav-arrow {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border: none;
    background: transparent;
    color: var(--text-secondary);
    cursor: pointer;
    border-radius: 0.25rem;
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

  .current-month {
    min-width: 140px;
    text-align: center;
    font-size: 0.9375rem;
    font-weight: 500;
    color: var(--text-primary);
    text-transform: capitalize;
  }
</style>