<script lang="ts">
  import { Card, CardHeader, CardContent, CardTitle } from '$lib/ui/components/atoms/index.js';
  import { CurrencyDisplay } from '$lib/ui/components/molecules/CurrencyDisplay/index.js';
  import { cn } from '$lib/shared/utils/cn.js';

  interface Props {
    title: string;
    amount: number;
    currency?: string;
    trend?: number; // Percentage change
    trendPeriod?: string;
    icon?: string;
    class?: string;
    variant?: 'income' | 'expense' | 'savings' | 'investment' | 'debt' | 'neutral';
  }

  let {
    title,
    amount,
    currency = 'EUR',
    trend,
    trendPeriod = 'vs mes anterior',
    icon,
    class: className,
    variant = 'neutral'
  }: Props = $props();

  function getTrendColor(trend: number): string {
    if (variant === 'income' || variant === 'savings' || variant === 'investment') {
      return trend > 0 ? 'text-green-600' : 'text-red-600';
    }
    if (variant === 'expense' || variant === 'debt') {
      return trend > 0 ? 'text-red-600' : 'text-green-600';
    }
    return trend > 0 ? 'text-green-600' : 'text-red-600';
  }

  function getTrendIcon(trend: number): string {
    return trend > 0 ? '↗' : '↘';
  }

  function getVariantColor(variant: string): string {
    switch (variant) {
      case 'income': return 'border-l-green-500';
      case 'expense': return 'border-l-red-500';
      case 'savings': return 'border-l-blue-500';
      case 'investment': return 'border-l-purple-500';
      case 'debt': return 'border-l-orange-500';
      default: return 'border-l-gray-300';
    }
  }
</script>

<Card class={cn('border-l-4', getVariantColor(variant), className)}>
  <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
    <CardTitle class="text-sm font-medium">{title}</CardTitle>
    {#if icon}
      <span class="text-2xl">{icon}</span>
    {/if}
  </CardHeader>
  
  <CardContent>
    <div class="flex flex-col space-y-2">
      <CurrencyDisplay 
        {amount} 
        {currency} 
        size="lg" 
        variant={variant} 
        showSign={false}
      />
      
      {#if trend !== undefined}
        <div class="flex items-center text-xs text-muted-foreground">
          <span class={cn('flex items-center', getTrendColor(trend))}>
            <span class="mr-1">{getTrendIcon(trend)}</span>
            {Math.abs(trend).toFixed(1)}%
          </span>
          <span class="ml-1">{trendPeriod}</span>
        </div>
      {/if}
    </div>
  </CardContent>
</Card>