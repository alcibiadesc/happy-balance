<script lang="ts">
  import { Briefcase } from 'lucide-svelte';
  import { t } from '$lib/stores/i18n';
  import MetricCard from '$lib/components/atoms/MetricCard.svelte';

  interface Props {
    value: string;
    profit?: number;
    profitPercentage?: number;
    loading?: boolean;
  }

  let { value, profit = 0, profitPercentage = 0, loading = false }: Props = $props();

  const trendColor = $derived(profit >= 0 ? 'var(--success)' : 'var(--danger)');
  const trendText = $derived(
    profitPercentage !== 0 ? `${profit >= 0 ? '+' : ''}${profitPercentage.toFixed(1)}%` : undefined
  );
</script>

<MetricCard
  icon={Briefcase}
  iconClass="portfolio"
  label={$t('dashboard.metrics.portfolio')}
  {value}
  {loading}
  trend={trendText}
  {trendColor}
/>
