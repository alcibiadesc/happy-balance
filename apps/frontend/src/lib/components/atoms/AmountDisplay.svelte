<script lang="ts">
  interface Props {
    amount: number;
    currency?: string;
    showSign?: boolean;
    size?: 'sm' | 'md' | 'lg';
  }

  let { amount, currency = 'EUR', showSign = true, size = 'md' }: Props = $props();

  const isPositive = $derived(amount >= 0);
  const sign = $derived(showSign ? (isPositive ? '+' : '') : '');
  const displayAmount = $derived(Math.abs(amount).toFixed(2));
</script>

<div class="amount-wrapper {size}" class:positive={isPositive} class:negative={!isPositive}>
  {#if showSign}
    <span class="amount-sign">{sign}</span>
  {/if}
  <span class="amount-value">{displayAmount}</span>
  <span class="amount-currency">{currency}</span>
</div>

<style>
  .amount-wrapper {
    display: flex;
    align-items: baseline;
    justify-content: flex-end;
    gap: 0.125rem;
    font-family: 'JetBrains Mono', 'Courier New', monospace;
    font-weight: 600;
  }

  .amount-wrapper.positive {
    color: var(--acapulco);
  }

  .amount-wrapper.negative {
    color: var(--froly, #f5796c);
  }

  /* Sizes */
  .amount-wrapper.sm .amount-sign {
    font-size: 0.625rem;
  }
  .amount-wrapper.sm .amount-value {
    font-size: 0.75rem;
  }
  .amount-wrapper.sm .amount-currency {
    font-size: 0.625rem;
  }

  .amount-wrapper.md .amount-sign {
    font-size: 0.6875rem;
  }
  .amount-wrapper.md .amount-value {
    font-size: 0.8125rem;
  }
  .amount-wrapper.md .amount-currency {
    font-size: 0.6875rem;
  }

  .amount-wrapper.lg .amount-sign {
    font-size: 0.875rem;
  }
  .amount-wrapper.lg .amount-value {
    font-size: 1rem;
  }
  .amount-wrapper.lg .amount-currency {
    font-size: 0.875rem;
  }

  .amount-currency {
    opacity: 0.8;
  }
</style>
