<script lang="ts">
  import { Sparkles } from 'lucide-svelte';
  import { formatCurrency } from '$lib/stores/currency';
  import { t } from '$lib/stores/i18n';
  import type { TinderSuggestion } from '$lib/modules/transactions/application/services/TinderService';

  interface Props {
    suggestion: TinderSuggestion;
    dragX: number;
    isDragging: boolean;
  }

  const { suggestion, dragX, isDragging }: Props = $props();

  const tx = $derived(suggestion.transaction);
  const sug = $derived(suggestion.suggestion);

  // Determine transaction type from explicit type or amount
  const txType = $derived.by(() => {
    if (tx.type) return tx.type;
    return tx.amount > 0 ? 'INCOME' : 'EXPENSE';
  });

  const isIncome = $derived(txType === 'INCOME');
  const isInvestment = $derived(txType === 'INVESTMENT');

  // Signed amount for display
  const displayAmount = $derived.by(() => {
    const raw = tx.amount ?? 0;
    if (txType === 'EXPENSE') return -Math.abs(raw);
    return Math.abs(raw);
  });

  // Format date
  const formattedDate = $derived.by(() => {
    if (!tx.date) return '';
    const d = new Date(tx.date);
    return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
  });

  // Card rotation based on drag
  const rotation = $derived(isDragging ? dragX * 0.05 : 0);

  // Overlay opacity based on drag direction
  const acceptOpacity = $derived(Math.max(0, Math.min(1, dragX / 150)));
  const rejectOpacity = $derived(Math.max(0, Math.min(1, -dragX / 150)));

  // Confidence display
  const confidencePercent = $derived(sug ? Math.round(sug.confidence * 100) : 0);
</script>

<div
  class="tinder-card"
  class:dragging={isDragging}
  style="transform: translateX({dragX}px) rotate({rotation}deg);"
>
  <!-- Accept overlay -->
  {#if acceptOpacity > 0}
    <div class="swipe-overlay accept-overlay" style="opacity: {acceptOpacity};">
      <span class="overlay-label accept-label">{$t('tinder.accept_label')}</span>
    </div>
  {/if}

  <!-- Reject overlay -->
  {#if rejectOpacity > 0}
    <div class="swipe-overlay reject-overlay" style="opacity: {rejectOpacity};">
      <span class="overlay-label reject-label">{$t('tinder.reject_label')}</span>
    </div>
  {/if}

  <!-- Card content -->
  <div class="card-body">
    <div class="merchant-name">{tx.merchant || 'Unknown'}</div>

    <div class="amount-row">
      <span class="amount" class:income={isIncome} class:investment={isInvestment}>
        {displayAmount < 0 ? '-' : '+'}{formatCurrency(displayAmount)}
      </span>
    </div>

    <div class="meta-row">
      <span class="date">{formattedDate}</span>
      <span class="type-badge" class:income-badge={isIncome} class:investment-badge={isInvestment}>
        {isIncome
          ? $t('transactions.type.income')
          : isInvestment
            ? $t('transactions.type.investment')
            : $t('transactions.type.expense')}
      </span>
    </div>

    {#if tx.description}
      <div class="description">{tx.description}</div>
    {/if}

    <!-- Suggestion -->
    {#if sug}
      <div class="suggestion-section">
        <div
          class="suggestion-badge"
          style="background-color: {sug.categoryColor}20; border-color: {sug.categoryColor};"
        >
          <span class="suggestion-icon">{sug.categoryIcon}</span>
          <div class="suggestion-info">
            <span class="suggestion-name">{sug.categoryName}</span>
            <span class="suggestion-confidence">
              <Sparkles size={12} />
              {confidencePercent}% {$t('tinder.confidence')}
            </span>
          </div>
        </div>
      </div>
    {:else}
      <div class="suggestion-section">
        <div class="no-suggestion">
          <span class="no-suggestion-text">{$t('tinder.no_suggestion')}</span>
        </div>
      </div>
    {/if}
  </div>
</div>

<style>
  .tinder-card {
    position: relative;
    background: var(--surface-elevated);
    border-radius: var(--radius-xl, 1rem);
    box-shadow: var(--shadow-lg, 0 10px 40px rgba(0, 0, 0, 0.1));
    width: 100%;
    max-width: 380px;
    min-height: 320px;
    overflow: hidden;
    will-change: transform;
    transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  .tinder-card.dragging {
    transition: none;
    cursor: grabbing;
  }

  .swipe-overlay {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: var(--radius-xl, 1rem);
    pointer-events: none;
    z-index: 2;
  }

  .accept-overlay {
    background: rgba(122, 186, 165, 0.15);
    border: 3px solid var(--acapulco, #7abaa5);
  }

  .reject-overlay {
    background: rgba(245, 121, 108, 0.15);
    border: 3px solid var(--froly, #f5796c);
  }

  .overlay-label {
    font-size: 1.5rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 2px;
    padding: 0.5rem 1.5rem;
    border-radius: var(--radius-md, 0.5rem);
    transform: rotate(-15deg);
  }

  .accept-label {
    color: var(--acapulco, #7abaa5);
    border: 3px solid var(--acapulco, #7abaa5);
    background: rgba(122, 186, 165, 0.1);
  }

  .reject-label {
    color: var(--froly, #f5796c);
    border: 3px solid var(--froly, #f5796c);
    background: rgba(245, 121, 108, 0.1);
    transform: rotate(15deg);
  }

  .card-body {
    padding: var(--space-2xl, 2rem);
    display: flex;
    flex-direction: column;
    gap: var(--space-md, 0.75rem);
    position: relative;
    z-index: 1;
  }

  .merchant-name {
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--text-primary);
    line-height: 1.2;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .amount-row {
    display: flex;
    align-items: baseline;
  }

  .amount {
    font-family: var(--font-mono, 'JetBrains Mono', monospace);
    font-size: 2rem;
    font-weight: 700;
    color: var(--froly, #f5796c);
    letter-spacing: -0.02em;
  }

  .amount.income {
    color: var(--acapulco, #7abaa5);
  }

  .amount.investment {
    color: var(--primary, #023c46);
  }

  .meta-row {
    display: flex;
    align-items: center;
    gap: var(--space-sm, 0.5rem);
  }

  .date {
    font-size: 0.875rem;
    color: var(--text-secondary);
  }

  .type-badge {
    font-size: 0.6875rem;
    font-weight: 600;
    padding: 0.2rem 0.5rem;
    border-radius: 4px;
    text-transform: uppercase;
    letter-spacing: 0.3px;
    background: var(--froly-alpha-15, rgba(245, 121, 108, 0.15));
    color: var(--froly, #f5796c);
  }

  .type-badge.income-badge {
    background: var(--acapulco-alpha-15, rgba(122, 186, 165, 0.15));
    color: var(--acapulco, #7abaa5);
  }

  .type-badge.investment-badge {
    background: var(--primary-alpha-15, rgba(2, 60, 70, 0.15));
    color: var(--primary, #023c46);
  }

  .description {
    font-size: 0.8125rem;
    color: var(--text-secondary);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .suggestion-section {
    margin-top: var(--space-md, 0.75rem);
  }

  .suggestion-badge {
    display: flex;
    align-items: center;
    gap: var(--space-sm, 0.5rem);
    padding: var(--space-md, 0.75rem);
    border: 1.5px solid;
    border-radius: var(--radius-md, 0.5rem);
    background: var(--surface-muted);
  }

  .suggestion-icon {
    font-size: 1.5rem;
    flex-shrink: 0;
  }

  .suggestion-info {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }

  .suggestion-name {
    font-size: 0.9375rem;
    font-weight: 600;
    color: var(--text-primary);
  }

  .suggestion-confidence {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 0.75rem;
    color: var(--text-secondary);
  }

  .no-suggestion {
    padding: var(--space-md, 0.75rem);
    border: 1.5px dashed var(--border-color);
    border-radius: var(--radius-md, 0.5rem);
    text-align: center;
  }

  .no-suggestion-text {
    font-size: 0.875rem;
    color: var(--text-muted);
  }

  @media (max-width: 480px) {
    .tinder-card {
      max-width: 100%;
      min-height: 280px;
    }

    .card-body {
      padding: var(--space-xl, 1.5rem);
    }

    .merchant-name {
      font-size: 1.25rem;
    }

    .amount {
      font-size: 1.75rem;
    }
  }
</style>
