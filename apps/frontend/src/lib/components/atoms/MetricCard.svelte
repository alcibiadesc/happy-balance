<script lang="ts">
  import type { ComponentType } from 'svelte';

  interface Props {
    icon: ComponentType;
    iconClass: string;
    label: string;
    value: string;
    loading?: boolean;
    trend?: string;
    trendColor?: string;
    subtext?: string;
  }

  const {
    icon: Icon,
    iconClass,
    label,
    value,
    loading = false,
    trend,
    trendColor,
    subtext,
  }: Props = $props();
</script>

<article class="metric-card">
  <div class="metric-header">
    <div class="metric-icon {iconClass}">
      <Icon size={18} strokeWidth={2} />
    </div>
    <span class="metric-label">{label}</span>
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
      {#if trend}
        <div class="metric-trend" style="color: {trendColor}">
          {trend}
        </div>
      {:else if subtext}
        <div class="metric-subtext">
          {@html subtext}
        </div>
      {/if}
    {/if}
  </div>
</article>

<style>
  .metric-card {
    background: var(--surface-elevated);
    border-radius: 12px;
    padding: 1.25rem;
    transition: all 0.2s ease;
    border: 1px solid var(--border-color, transparent);
  }

  .metric-card:hover {
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

  .metric-icon.income {
    background: rgba(122, 186, 165, 0.1);
    color: var(--success);
  }

  .metric-icon.investments {
    background: rgba(2, 60, 70, 0.1);
    color: var(--primary);
  }

  .metric-icon.balance {
    background: rgba(254, 205, 44, 0.1);
    color: var(--warning);
  }

  .metric-icon.expenses {
    background: rgba(245, 121, 108, 0.1);
    color: var(--accent);
  }

  .metric-icon.portfolio {
    background: rgba(139, 92, 246, 0.1);
    color: #8b5cf6;
  }

  .metric-icon.profit-positive {
    background: rgba(16, 185, 129, 0.1);
    color: #10b981;
  }

  .metric-icon.profit-negative {
    background: rgba(239, 68, 68, 0.1);
    color: #ef4444;
  }

  .metric-label {
    font-size: 0.875rem;
    color: var(--text-secondary);
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.05em;
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

  .metric-subtext {
    font-size: 0.875rem;
    color: var(--text-secondary);
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

  /* Responsive */
  @media (max-width: 768px) {
    .metric-card {
      padding: 1rem;
    }

    .metric-header {
      gap: 0.5rem;
      margin-bottom: 0.75rem;
    }

    .metric-icon {
      width: 32px;
      height: 32px;
    }

    .metric-icon :global(svg) {
      width: 16px;
      height: 16px;
    }

    .metric-label {
      font-size: 0.75rem;
    }

    .metric-value {
      font-size: 1.25rem;
    }

    .metric-trend,
    .metric-subtext {
      font-size: 0.75rem;
    }
  }

  @media (max-width: 480px) {
    .metric-card {
      padding: 0.75rem;
      border-radius: 10px;
    }

    .metric-card:hover {
      transform: none;
      box-shadow: none;
    }

    .metric-header {
      gap: 0.375rem;
      margin-bottom: 0.5rem;
    }

    .metric-icon {
      width: 28px;
      height: 28px;
      border-radius: 6px;
    }

    .metric-icon :global(svg) {
      width: 14px;
      height: 14px;
    }

    .metric-label {
      font-size: 0.6875rem;
    }

    .metric-value {
      font-size: 1.125rem;
    }

    .metric-trend,
    .metric-subtext {
      font-size: 0.6875rem;
    }
  }

  @media (max-width: 360px) {
    .metric-card {
      padding: 0.625rem;
      border-radius: 8px;
    }

    .metric-header {
      gap: 0.25rem;
      margin-bottom: 0.375rem;
    }

    .metric-icon {
      width: 24px;
      height: 24px;
      border-radius: 5px;
    }

    .metric-icon :global(svg) {
      width: 12px;
      height: 12px;
    }

    .metric-label {
      font-size: 0.625rem;
      letter-spacing: 0.025em;
    }

    .metric-value {
      font-size: 1rem;
    }

    .metric-trend,
    .metric-subtext {
      font-size: 0.625rem;
    }

    .metric-skeleton {
      height: 1rem;
    }
  }
</style>
