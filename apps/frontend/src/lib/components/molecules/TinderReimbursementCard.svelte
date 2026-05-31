<script lang="ts">
  import { Link2, ArrowLeftRight } from 'lucide-svelte';
  import { formatCurrency } from '$lib/stores/currency';
  import { t } from '$lib/stores/i18n';
  import type { ReimbursementSuggestion } from '$lib/modules/transactions/application/services/TinderService';

  interface Props {
    reimbursement: ReimbursementSuggestion;
    dragX: number;
    isDragging: boolean;
  }

  const { reimbursement, dragX, isDragging }: Props = $props();

  const income = $derived(reimbursement.income);
  const expense = $derived(reimbursement.expense);

  function formatDate(date: string | undefined): string {
    if (!date) return '';
    return new Date(date).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }

  // 3D drag transform (mirrors TinderTransactionCard)
  const rotateY = $derived(isDragging ? dragX * 0.08 : 0);
  const rotateZ = $derived(isDragging ? dragX * 0.04 : 0);
  const scale = $derived(isDragging ? 1.02 : 1);

  const acceptOpacity = $derived(Math.max(0, Math.min(1, dragX / 120)));
  const rejectOpacity = $derived(Math.max(0, Math.min(1, -dragX / 120)));

  const glowColor = $derived.by(() => {
    if (acceptOpacity > 0.1) return `rgba(122, 186, 165, ${acceptOpacity * 0.4})`;
    if (rejectOpacity > 0.1) return `rgba(245, 121, 108, ${rejectOpacity * 0.4})`;
    return 'transparent';
  });
</script>

<div class="tinder-card-wrapper" style="perspective: 1000px;">
  <div
    class="tinder-card"
    class:dragging={isDragging}
    style="
      transform: translateX({dragX}px) rotateY({rotateY}deg) rotateZ({rotateZ}deg) scale({scale});
      box-shadow: 0 20px 60px rgba(0,0,0,0.12), 0 0 40px {glowColor};
    "
  >
    {#if acceptOpacity > 0.05}
      <div class="swipe-overlay accept-overlay" style="opacity: {acceptOpacity};">
        <span class="overlay-label accept-label">{$t('tinder.link_label')}</span>
      </div>
    {/if}
    {#if rejectOpacity > 0.05}
      <div class="swipe-overlay reject-overlay" style="opacity: {rejectOpacity};">
        <span class="overlay-label reject-label">{$t('tinder.reject_label')}</span>
      </div>
    {/if}

    <div class="card-body">
      <div class="card-tag">
        <Link2 size={12} />
        <span>{$t('tinder.shared_expense')}</span>
      </div>

      <!-- Income (the reimbursement) -->
      <div class="leg income-leg">
        <div class="leg-top">
          <span class="leg-merchant">{income.merchant || 'Unknown'}</span>
          <span class="leg-amount income">+{formatCurrency(Math.abs(income.amount ?? 0))}</span>
        </div>
        {#if income.description}
          <span class="leg-desc">{income.description}</span>
        {/if}
        <span class="leg-date">{formatDate(income.date)}</span>
      </div>

      <!-- Link indicator -->
      <div class="link-row">
        <div class="link-line"></div>
        <div class="link-badge">
          <ArrowLeftRight size={13} />
          <span
            >{reimbursement.suggestedSplitPercentage}% / {100 -
              reimbursement.suggestedSplitPercentage}%</span
          >
        </div>
        <div class="link-line"></div>
      </div>

      <!-- Expense (what it reimburses) -->
      <div class="leg expense-leg">
        <div class="leg-top">
          <span class="leg-merchant">{expense.merchant || 'Unknown'}</span>
          <span class="leg-amount expense">-{formatCurrency(Math.abs(expense.amount ?? 0))}</span>
        </div>
        {#if expense.description}
          <span class="leg-desc">{expense.description}</span>
        {/if}
        <span class="leg-date">{formatDate(expense.date)}</span>
      </div>

      <!-- Match reasons -->
      {#if reimbursement.matchReasons?.length}
        <div class="reasons">
          {#each reimbursement.matchReasons.slice(0, 3) as reason, ri (ri)}
            <span class="reason-chip">{reason}</span>
          {/each}
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
    padding: 1.75rem 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    position: relative;
    z-index: 1;
  }

  .card-tag {
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
    align-self: flex-start;
    font-size: 0.6875rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: var(--primary, #023c46);
    background: rgba(2, 60, 70, 0.08);
    padding: 0.3rem 0.6rem;
    border-radius: 6px;
  }

  .leg {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    padding: 0.75rem 0.875rem;
    border-radius: 0.75rem;
    background: var(--surface-muted, rgba(0, 0, 0, 0.03));
  }

  .leg-top {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 0.5rem;
  }

  .leg-merchant {
    font-size: 1.0625rem;
    font-weight: 700;
    color: var(--text-primary);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    flex: 1;
  }

  .leg-amount {
    font-family: var(--font-mono, 'JetBrains Mono', monospace);
    font-size: 1.25rem;
    font-weight: 700;
    letter-spacing: -0.02em;
    flex-shrink: 0;
  }

  .leg-amount.income {
    color: var(--acapulco, #7abaa5);
  }

  .leg-amount.expense {
    color: var(--froly, #f5796c);
  }

  .leg-desc {
    font-size: 0.8125rem;
    color: var(--text-secondary);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .leg-date {
    font-size: 0.75rem;
    color: var(--text-muted);
    font-weight: 500;
  }

  .link-row {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .link-line {
    flex: 1;
    height: 1px;
    background: var(--border-color, rgba(0, 0, 0, 0.1));
  }

  .link-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
    font-size: 0.8125rem;
    font-weight: 700;
    color: var(--primary, #023c46);
    background: var(--surface-elevated);
    border: 1.5px solid var(--primary, #023c46);
    padding: 0.25rem 0.625rem;
    border-radius: 999px;
  }

  .reasons {
    display: flex;
    flex-wrap: wrap;
    gap: 0.375rem;
    margin-top: 0.25rem;
  }

  .reason-chip {
    font-size: 0.6875rem;
    font-weight: 500;
    color: var(--text-secondary);
    background: var(--surface-muted, rgba(0, 0, 0, 0.05));
    padding: 0.2rem 0.5rem;
    border-radius: 6px;
  }

  @media (max-width: 480px) {
    .tinder-card-wrapper {
      max-width: 100%;
      padding: 0 0.5rem;
    }

    .card-body {
      padding: 1.5rem 1.25rem;
    }

    .leg-merchant {
      font-size: 0.9375rem;
    }

    .leg-amount {
      font-size: 1.125rem;
    }
  }
</style>
