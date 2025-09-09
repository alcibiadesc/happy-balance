<script lang="ts">
  import { cn } from '$lib/shared/utils/cn';
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
    const safeAmount = isFinite(amount) ? Math.abs(amount) : 0;
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(safeAmount);
  }

  function getVariantFromAmount(amount: number): 'income' | 'expense' | 'neutral' {
    const safeAmount = isFinite(amount) ? amount : 0;
    if (safeAmount > 0) return 'income';
    if (safeAmount < 0) return 'expense';
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
  let safeAmount = $derived(isFinite(amount) ? amount : 0);
  let sign = $derived(showSign && safeAmount !== 0 ? (safeAmount > 0 ? '+' : '-') : '');
  let formattedAmount = $derived(formatCurrency(safeAmount, currency));
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