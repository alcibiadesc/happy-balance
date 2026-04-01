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

  const txType = $derived.by(() => {
    if (tx.type) return tx.type;
    return tx.amount > 0 ? 'INCOME' : 'EXPENSE';
  });

  const isIncome = $derived(txType === 'INCOME');
  const isInvestment = $derived(txType === 'INVESTMENT');

  const displayAmount = $derived.by(() => {
    const raw = tx.amount ?? 0;
    if (txType === 'EXPENSE') return -Math.abs(raw);
    return Math.abs(raw);
  });

  const formattedDate = $derived.by(() => {
    if (!tx.date) return '';
    const d = new Date(tx.date);
    return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
  });

  // 3D card rotation based on drag
  const rotateY = $derived(isDragging ? dragX * 0.08 : 0);
  const rotateZ = $derived(isDragging ? dragX * 0.04 : 0);
  const translateX = $derived(dragX);
  const scale = $derived(isDragging ? 1.02 : 1);

  // Overlay opacity based on drag direction
  const acceptOpacity = $derived(Math.max(0, Math.min(1, dragX / 120)));
  const rejectOpacity = $derived(Math.max(0, Math.min(1, -dragX / 120)));

  // Card glow effect
  const glowColor = $derived.by(() => {
    if (acceptOpacity > 0.1) return `rgba(122, 186, 165, ${acceptOpacity * 0.4})`;
    if (rejectOpacity > 0.1) return `rgba(245, 121, 108, ${rejectOpacity * 0.4})`;
    return 'transparent';
  });

  // Confidence display
  const confidencePercent = $derived(sug ? Math.round(sug.confidence * 100) : 0);

  // Confidence bar color
  const confidenceColor = $derived.by(() => {
    if (confidencePercent >= 80) return 'var(--acapulco, #7abaa5)';
    if (confidencePercent >= 50) return 'var(--warning, #fecd2c)';
    return 'var(--text-muted)';
  });
</script>

<div class="tinder-card-wrapper" style="perspective: 1000px;">
  <div
    class="tinder-card"
    class:dragging={isDragging}
    style="
      transform: translateX({translateX}px) rotateY({rotateY}deg) rotateZ({rotateZ}deg) scale({scale});
      box-shadow: 0 20px 60px rgba(0,0,0,0.12), 0 0 40px {glowColor};
    "
  >
    <!-- Accept overlay -->
    {#if acceptOpacity > 0.05}
      <div class="swipe-overlay accept-overlay" style="opacity: {acceptOpacity};">
        <span class="overlay-label accept-label">
          {$t('tinder.accept_label')}
        </span>
      </div>
    {/if}

    <!-- Reject overlay -->
    {#if rejectOpacity > 0.05}
      <div class="swipe-overlay reject-overlay" style="opacity: {rejectOpacity};">
        <span class="overlay-label reject-label">
          {$t('tinder.reject_label')}
        </span>
      </div>
    {/if}

    <!-- Shine effect -->
    <div
      class="card-shine"
      style="opacity: {isDragging ? 0.08 : 0}; transform: translateX({dragX * 0.3}px);"
    ></div>

    <!-- Card content -->
    <div class="card-body">
      <!-- Top section: merchant + type -->
      <div class="card-header">
        <div class="merchant-name">{tx.merchant || 'Unknown'}</div>
        <span
          class="type-badge"
          class:income-badge={isIncome}
          class:investment-badge={isInvestment}
        >
          {isIncome
            ? $t('transactions.type.income')
            : isInvestment
              ? $t('transactions.type.investment')
              : $t('transactions.type.expense')}
        </span>
      </div>

      <!-- Amount (hero) -->
      <div class="amount-section">
        <span class="amount" class:income={isIncome} class:investment={isInvestment}>
          {displayAmount < 0 ? '-' : '+'}{formatCurrency(displayAmount)}
        </span>
      </div>

      <!-- Date + description -->
      <div class="details-section">
        <span class="date">{formattedDate}</span>
        {#if tx.description}
          <span class="description">{tx.description}</span>
        {/if}
      </div>

      <!-- Divider -->
      <div class="divider"></div>

      <!-- Suggestion -->
      {#if sug}
        <div class="suggestion-section">
          <div class="suggestion-label">
            <Sparkles size={12} />
            <span>{$t('tinder.suggested_category')}</span>
          </div>
          <div
            class="suggestion-badge"
            style="background-color: {sug.categoryColor}15; border-color: {sug.categoryColor}40;"
          >
            <span class="suggestion-icon">{sug.categoryIcon}</span>
            <div class="suggestion-info">
              <span class="suggestion-name">{sug.categoryName}</span>
              <div class="confidence-bar-container">
                <div
                  class="confidence-bar"
                  style="width: {confidencePercent}%; background: {confidenceColor};"
                ></div>
              </div>
              <span class="suggestion-confidence">{confidencePercent}%</span>
            </div>
          </div>
        </div>
      {:else}
        <div class="suggestion-section">
          <div class="no-suggestion">
            <span class="no-suggestion-icon">?</span>
            <span class="no-suggestion-text">{$t('tinder.no_suggestion')}</span>
          </div>
        </div>
      {/if}
    </div>
  </div>
</div>

<style>
  .tinder-card-wrapper {
    width: 100%;
    max-width: 400px;
    margin: 0 auto;
  }

  .tinder-card {
    position: relative;
    background: var(--surface-elevated);
    border-radius: 1.25rem;
    width: 100%;
    overflow: hidden;
    will-change: transform;
    transform-style: preserve-3d;
    transition:
      transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1),
      box-shadow 0.3s ease;
    border: 1px solid var(--border-color, rgba(0, 0, 0, 0.06));
  }

  .tinder-card.dragging {
    transition: none;
    cursor: grabbing;
  }

  .card-shine {
    position: absolute;
    inset: 0;
    background: linear-gradient(
      105deg,
      transparent 40%,
      rgba(255, 255, 255, 0.5) 50%,
      transparent 60%
    );
    pointer-events: none;
    z-index: 3;
    transition: opacity 0.2s;
  }

  .swipe-overlay {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 1.25rem;
    pointer-events: none;
    z-index: 2;
    backdrop-filter: blur(2px);
  }

  .accept-overlay {
    background: rgba(122, 186, 165, 0.12);
    border: 3px solid var(--acapulco, #7abaa5);
  }

  .reject-overlay {
    background: rgba(245, 121, 108, 0.12);
    border: 3px solid var(--froly, #f5796c);
  }

  .overlay-label {
    font-size: 1.75rem;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 3px;
    padding: 0.5rem 1.75rem;
    border-radius: 0.5rem;
  }

  .accept-label {
    color: var(--acapulco, #7abaa5);
    border: 3px solid var(--acapulco, #7abaa5);
    background: rgba(255, 255, 255, 0.8);
    transform: rotate(-12deg);
  }

  .reject-label {
    color: var(--froly, #f5796c);
    border: 3px solid var(--froly, #f5796c);
    background: rgba(255, 255, 255, 0.8);
    transform: rotate(12deg);
  }

  .card-body {
    padding: 2rem 1.75rem;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    position: relative;
    z-index: 1;
  }

  .card-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 0.5rem;
  }

  .merchant-name {
    font-size: 1.375rem;
    font-weight: 700;
    color: var(--text-primary);
    line-height: 1.2;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    flex: 1;
  }

  .type-badge {
    font-size: 0.625rem;
    font-weight: 700;
    padding: 0.25rem 0.5rem;
    border-radius: 6px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    background: var(--froly-alpha-15, rgba(245, 121, 108, 0.15));
    color: var(--froly, #f5796c);
    flex-shrink: 0;
    margin-top: 0.125rem;
  }

  .type-badge.income-badge {
    background: rgba(122, 186, 165, 0.15);
    color: var(--acapulco, #7abaa5);
  }

  .type-badge.investment-badge {
    background: rgba(2, 60, 70, 0.12);
    color: var(--primary, #023c46);
  }

  .amount-section {
    margin: 0.25rem 0;
  }

  .amount {
    font-family: var(--font-mono, 'JetBrains Mono', monospace);
    font-size: 2.25rem;
    font-weight: 700;
    color: var(--froly, #f5796c);
    letter-spacing: -0.03em;
    line-height: 1;
  }

  .amount.income {
    color: var(--acapulco, #7abaa5);
  }

  .amount.investment {
    color: var(--primary, #023c46);
  }

  .details-section {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex-wrap: wrap;
  }

  .date {
    font-size: 0.8125rem;
    color: var(--text-secondary);
    font-weight: 500;
  }

  .description {
    font-size: 0.8125rem;
    color: var(--text-muted);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-width: 200px;
  }

  .divider {
    height: 1px;
    background: var(--border-color, rgba(0, 0, 0, 0.08));
    margin: 0.25rem 0;
  }

  .suggestion-section {
    margin-top: 0.25rem;
  }

  .suggestion-label {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    font-size: 0.6875rem;
    font-weight: 600;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 0.5rem;
  }

  .suggestion-badge {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.875rem 1rem;
    border: 1.5px solid;
    border-radius: 0.75rem;
  }

  .suggestion-icon {
    font-size: 1.75rem;
    flex-shrink: 0;
  }

  .suggestion-info {
    display: flex;
    flex-direction: column;
    gap: 0.375rem;
    flex: 1;
    min-width: 0;
  }

  .suggestion-name {
    font-size: 1rem;
    font-weight: 600;
    color: var(--text-primary);
  }

  .confidence-bar-container {
    height: 4px;
    background: var(--surface-muted, rgba(0, 0, 0, 0.06));
    border-radius: 2px;
    overflow: hidden;
    width: 100%;
  }

  .confidence-bar {
    height: 100%;
    border-radius: 2px;
    transition: width 0.5s ease;
  }

  .suggestion-confidence {
    font-size: 0.6875rem;
    font-weight: 600;
    color: var(--text-secondary);
  }

  .no-suggestion {
    padding: 1rem;
    border: 2px dashed var(--border-color);
    border-radius: 0.75rem;
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.375rem;
  }

  .no-suggestion-icon {
    font-size: 1.5rem;
    color: var(--text-muted);
    opacity: 0.5;
  }

  .no-suggestion-text {
    font-size: 0.8125rem;
    color: var(--text-muted);
  }

  @media (max-width: 480px) {
    .tinder-card-wrapper {
      max-width: 100%;
      padding: 0 0.5rem;
    }

    .card-body {
      padding: 1.5rem 1.25rem;
    }

    .merchant-name {
      font-size: 1.125rem;
    }

    .amount {
      font-size: 1.875rem;
    }
  }
</style>
