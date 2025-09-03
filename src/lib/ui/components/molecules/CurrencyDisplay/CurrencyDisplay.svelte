<script lang="ts">
  import { cn } from '$lib/shared/utils/cn.js';
  import { Badge } from '$lib/ui/components/atoms/index.js';
  
  interface Props {
    amount: number;
    currency?: string;
    class?: string;
    showSign?: boolean;
    variant?: 'default' | 'income' | 'expense' | 'neutral';
    size?: 'sm' | 'default' | 'lg';
  }

  let {
    amount,
    currency = 'EUR',
    class: className,
    showSign = true,
    variant = 'default',
    size = 'default'
  }: Props = $props();

  function formatCurrency(amount: number, currency: string): string {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(Math.abs(amount));
  }

  function getVariantFromAmount(amount: number): 'income' | 'expense' | 'neutral' {
    if (amount > 0) return 'income';
    if (amount < 0) return 'expense';
    return 'neutral';
  }

  function getSizeClasses(size: string): string {
    switch (size) {
      case 'sm': return 'text-sm';
      case 'lg': return 'text-lg font-semibold';
      default: return 'text-base';
    }
  }

  let displayVariant = $derived(variant === 'default' ? getVariantFromAmount(amount) : variant);
  let sign = $derived(showSign && amount !== 0 ? (amount > 0 ? '+' : '-') : '');
  let formattedAmount = $derived(formatCurrency(amount, currency));
</script>

<div class={cn('flex items-center gap-1', className)}>
  <span class={cn(
    'font-mono tabular-nums',
    getSizeClasses(size),
    displayVariant === 'income' && 'text-green-600',
    displayVariant === 'expense' && 'text-red-600',
    displayVariant === 'neutral' && 'text-gray-600'
  )}>
    {sign}{formattedAmount}
  </span>
  
  {#if currency !== 'EUR'}
    <Badge variant="outline" class="text-xs">{currency}</Badge>
  {/if}
</div>