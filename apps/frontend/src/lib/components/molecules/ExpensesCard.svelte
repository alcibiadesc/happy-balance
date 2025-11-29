<script lang="ts">
  import { TrendingDown } from 'lucide-svelte';
  import { t } from '$lib/stores/i18n';
  import MetricCard from '$lib/components/atoms/MetricCard.svelte';

  interface Props {
    value: string;
    trend: string;
    trendColor: string;
    loading?: boolean;
  }

  let { value, trend, trendColor, loading = false }: Props = $props();
</script>

<MetricCard
  icon={TrendingDown}
  iconClass="expenses"
  label={$t('dashboard.metrics.expenses')}
  {value}
  {loading}
  {trend}
  {trendColor}
/>
