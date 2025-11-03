<script lang="ts">
  import { TrendingDown } from "lucide-svelte";
  import { t } from "$lib/stores/i18n";

  interface Props {
    value: string;
    trend: string;
    trendColor: string;
    loading?: boolean;
  }

  let {
    value,
    trend,
    trendColor,
    loading = false,
  }: Props = $props();
</script>

<article class="metric-card expenses-card">
  <div class="metric-header">
    <div class="metric-icon expenses">
      <TrendingDown size={18} strokeWidth={2} />
    </div>
    <span class="metric-label">{$t("dashboard.metrics.expenses")}</span>
  </div>

  <div class="metric-body">
    <div class="metric-value">
      {#if loading}
        <div class="metric-skeleton"></div>
      {:else}
        {value}
      {/if}
    </div>
    {#if !loading}
      <div class="metric-trend" style="color: {trendColor}">
        {trend}
      </div>
    {/if}
  </div>
</article>

<style>
  .expenses-card {
    background: var(--surface-elevated);
    border-radius: 12px;
    padding: 1.25rem;
    transition: all 0.2s ease;
    border: 1px solid var(--border-color, transparent);
  }

  .expenses-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  }

  .metric-header {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 1rem;
  }

  .metric-icon {
    width: 36px;
    height: 36px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .metric-icon.expenses {
    background: rgba(245, 121, 108, 0.1);
    color: var(--accent);
  }

  .metric-label {
    font-size: 0.875rem;
    color: var(--text-secondary);
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    flex: 1;
  }

  .metric-body {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
  }

  .metric-value {
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--text-primary);
    letter-spacing: -0.025em;
  }

  .metric-trend {
    font-size: 0.875rem;
    font-weight: 600;
  }

  .metric-skeleton {
    width: 80%;
    height: 1.5rem;
    background: linear-gradient(
      90deg,
      var(--surface-muted) 25%,
      var(--surface-elevated) 50%,
      var(--surface-muted) 75%
    );
    background-size: 200% 100%;
    border-radius: 4px;
    animation: skeleton-loading 1.5s infinite;
  }

  @keyframes skeleton-loading {
    0% {
      background-position: 200% 0;
    }
    100% {
      background-position: -200% 0;
    }
  }
</style>
