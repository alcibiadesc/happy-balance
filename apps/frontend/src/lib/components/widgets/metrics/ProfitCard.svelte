<script lang="ts">
  import { TrendingUp, TrendingDown } from 'lucide-svelte';
  import { t } from '$lib/stores/i18n';
  import MetricCard from '$lib/components/atoms/MetricCard.svelte';

  interface Props {
    value: string;
    profitPercentage?: number;
    loading?: boolean;
  }

  const { value, profitPercentage = 0, loading = false }: Props = $props();

  const isPositive = $derived(profitPercentage >= 0);
  const trendColor = $derived(isPositive ? 'var(--success)' : 'var(--danger)');
  const trendText = $derived(
    profitPercentage !== 0 ? `${isPositive ? '+' : ''}${profitPercentage.toFixed(1)}%` : undefined
  );
  const icon = $derived(isPositive ? TrendingUp : TrendingDown);
</script>

<MetricCard
  {icon}
  iconClass={isPositive ? 'profit-positive' : 'profit-negative'}
  label={$t('dashboard.metrics.profit')}
  {value}
  {loading}
  trend={trendText}
  {trendColor}
/>
