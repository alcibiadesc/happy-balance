<script lang="ts">
  import { t, currentLanguage } from '$lib/stores/i18n';
  import { currentCurrency, currencies } from '$lib/stores/currency';
  
  interface Props {
    income: number;
    expenses: number;
  }
  
  let { income, expenses }: Props = $props();
  
  // Calculate spending rate (de cada 10€ cuántos gasto)
  let spendingRate = $derived(
    income > 0 ? Math.round(expenses / income * 10) : 0
  );

  // Determine status based on spending rate
  let spendingStatus = $derived.by(() => {
    if (spendingRate <= 5) return 'good';
    if (spendingRate <= 8) return 'medium';
    return 'regular';
  });

  // Generate dynamic spending summary with current currency
  let spendingSummaryText = $derived.by(() => {
    const currencyCode = $currentCurrency;
    const rate = spendingRate;

    const currency = currencies[currencyCode];
    if (!currency) return 'Loading...';

    // Use proper currency formatting with Intl.NumberFormat
    const formatCurrencyAmount = (amount: number) => {
      return new Intl.NumberFormat(currency.locale, {
        style: 'currency',
        currency: currency.code,
        minimumFractionDigits: currency.code === 'JPY' ? 0 : 0,
        maximumFractionDigits: currency.code === 'JPY' ? 0 : 0
      }).format(amount);
    };

    // Use the i18n translation from the store
    const template = $t('dashboard.spending_summary');
    return template.replace('{amount}', `<strong>${formatCurrencyAmount(rate)}</strong>`);
  });
</script>

<div class="spending-summary {spendingStatus}">
  <div class="spending-indicator">
    <span class="spending-dot"></span>
    <span class="spending-text">
      {@html spendingSummaryText}
    </span>
  </div>
</div>

<style>
  .spending-summary {
    background: var(--surface-elevated);
    border-radius: 8px;
    padding: 1rem 1.25rem;
    margin-bottom: 1.5rem;
    border: 1px solid var(--border-color, transparent);
    display: inline-block;
    min-width: 280px;
  }

  .spending-indicator {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .spending-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex-shrink: 0;
    transition: all 0.2s ease;
  }

  .spending-text {
    font-size: 0.9375rem;
    color: var(--text-secondary);
    line-height: 1.4;
  }

  .spending-text :global(strong) {
    color: var(--text-primary);
    font-weight: 600;
    font-size: 1rem;
  }

  /* Minimal status indicators - just a dot */
  .spending-summary.good .spending-dot {
    background: #22c55e;
  }

  .spending-summary.medium .spending-dot {
    background: #f59e0b;
  }

  .spending-summary.regular .spending-dot {
    background: #ef4444;
  }

  /* Subtle pulse animation on the dot for high spending */
  @keyframes pulse {
    0%, 100% {
      opacity: 1;
      transform: scale(1);
    }
    50% {
      opacity: 0.7;
      transform: scale(1.1);
    }
  }

  .spending-summary.regular .spending-dot {
    animation: pulse 2s ease-in-out infinite;
  }

  /* Subtle hover effect */
  .spending-summary:hover {
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  }

  /* Responsive */
  @media (max-width: 768px) {
    .spending-summary {
      min-width: auto;
      width: 100%;
      padding: 0.875rem 1rem;
    }

    .spending-text {
      font-size: 0.875rem;
    }

    .spending-text :global(strong) {
      font-size: 0.9375rem;
    }
  }
</style>
