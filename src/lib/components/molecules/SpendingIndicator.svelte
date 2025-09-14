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
    const language = $currentLanguage;
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
    
    // Create the spending summary based on language and currency
    const templates = {
      en: `For every ${formatCurrencyAmount(10)} I earn, I spend {amount}`,
      es: `Por cada ${formatCurrencyAmount(10)} que ingreso, gasto {amount}`
    };
    
    const template = templates[language as keyof typeof templates] || templates.en;
    return template.replace('{amount}', `<strong>${rate}</strong>`);
  });
</script>

<div class="spending-summary {spendingStatus}">
  <span class="spending-text">
    {@html spendingSummaryText}
  </span>
</div>

<style>
  .spending-summary {
    background: var(--surface-elevated);
    border-radius: 12px;
    padding: 1rem 1.5rem;
    margin-bottom: 2rem;
    text-align: center;
    border: 1px solid var(--border-color, transparent);
  }
  
  .spending-text {
    font-size: 1rem;
    color: var(--text-primary);
    line-height: 1.4;
  }
  
  .spending-text :global(strong) {
    font-size: 1.125rem;
    font-weight: 700;
  }

  /* Status-based backgrounds */
  .spending-summary.good {
    background: linear-gradient(135deg, #22c55e10 0%, #16a34a10 100%);
    border-color: #22c55e30;
  }

  .spending-summary.medium {
    background: linear-gradient(135deg, #f59e0b10 0%, #ea580c10 100%);
    border-color: #f59e0b30;
  }

  .spending-summary.regular {
    background: linear-gradient(135deg, #ef444410 0%, #dc262610 100%);
    border-color: #ef444430;
  }

  /* Responsive */
  @media (max-width: 768px) {
    .spending-summary {
      padding: 0.875rem 1.25rem;
    }
    
    .spending-text {
      font-size: 0.9375rem;
    }
    
    .spending-text :global(strong) {
      font-size: 1.0625rem;
    }
  }
</style>
