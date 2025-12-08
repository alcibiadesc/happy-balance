<script lang="ts">
  import { TrendingUp, TrendingDown, Target } from 'lucide-svelte';
  import { currentCurrency, formatCurrency } from '$lib/stores/currency';
  import { portfolioGoal, userPreferences } from '$lib/stores/user-preferences';

  interface Props {
    totalValue: number;
    totalProfit: number;
    profitPercentage: number;
    formatCurrencyFn: (value: number) => string;
    formatPercentageFn: (value: number) => string;
  }

  let { totalValue, totalProfit, profitPercentage, formatCurrencyFn, formatPercentageFn }: Props =
    $props();

  // Goal state
  let goalInput = $state($portfolioGoal || 100000);
  let showGoalEdit = $state(false);

  // Goal progress
  const goalProgress = $derived(Math.min(100, (totalValue / ($portfolioGoal || 100000)) * 100));

  async function saveGoal() {
    await userPreferences.updatePortfolioGoal(goalInput);
    showGoalEdit = false;
  }
</script>

<header class="balance-header">
  <div class="balance-content">
    <span class="greeting">Tu portfolio</span>
    <div class="balance-amount">
      <span class="currency">{$currentCurrency}</span>
      <span class="amount">{formatCurrencyFn(totalValue).replace(/[€$£]/g, '')}</span>
    </div>

    <!-- Goal Progress -->
    <div class="goal-section">
      <div class="goal-bar">
        <div class="goal-progress" style="width: {goalProgress}%"></div>
      </div>
      <div class="goal-info">
        <span class="goal-text">
          {goalProgress.toFixed(0)}% de tu meta
          {#if goalProgress < 100}
            <span class="goal-remaining">
              (faltan {formatCurrencyFn(($portfolioGoal || 100000) - totalValue)})
            </span>
          {/if}
        </span>
        <button class="goal-edit" onclick={() => (showGoalEdit = !showGoalEdit)}>
          <Target size={14} />
          {formatCurrencyFn($portfolioGoal || 100000)}
        </button>
      </div>
    </div>

    {#if showGoalEdit}
      <div class="goal-input-wrapper">
        <input type="number" bind:value={goalInput} class="goal-input" placeholder="Meta..." />
        <button class="goal-save" onclick={saveGoal}>OK</button>
      </div>
    {/if}
  </div>

  <!-- Revenue Card -->
  <div class="revenue-card" class:positive={totalProfit >= 0} class:negative={totalProfit < 0}>
    <div class="revenue-header">
      <span class="revenue-label">Rentabilidad</span>
      {#if totalProfit >= 0}
        <TrendingUp size={18} />
      {:else}
        <TrendingDown size={18} />
      {/if}
    </div>
    <div class="revenue-value">
      {formatCurrencyFn(totalProfit)}
      <span class="revenue-percentage">{formatPercentageFn(profitPercentage)}</span>
    </div>
  </div>
</header>

<style>
  .balance-header {
    display: flex;
    flex-wrap: wrap;
    gap: 1.5rem;
    margin-bottom: 2rem;
  }

  .balance-content {
    flex: 1;
    min-width: 280px;
  }

  .greeting {
    font-size: 0.875rem;
    color: var(--text-secondary);
    margin-bottom: 0.25rem;
    display: block;
  }

  .balance-amount {
    display: flex;
    align-items: baseline;
    gap: 0.5rem;
    margin-bottom: 1rem;
  }

  .currency {
    font-size: 1.25rem;
    font-weight: 500;
    color: var(--text-secondary);
  }

  .amount {
    font-size: 2.5rem;
    font-weight: 700;
    color: var(--text-primary);
    letter-spacing: -0.02em;
  }

  /* Goal Section */
  .goal-section {
    margin-top: 0.75rem;
  }

  .goal-bar {
    height: 6px;
    background: var(--surface-muted);
    border-radius: 3px;
    overflow: hidden;
    margin-bottom: 0.5rem;
  }

  .goal-progress {
    height: 100%;
    background: var(--acapulco);
    border-radius: 3px;
    transition: width 0.3s ease;
  }

  .goal-info {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.75rem;
  }

  .goal-text {
    color: var(--text-secondary);
  }

  .goal-remaining {
    color: var(--text-muted);
  }

  .goal-edit {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    background: none;
    border: none;
    color: var(--primary);
    font-size: 0.75rem;
    cursor: pointer;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    transition: background 0.15s;
  }

  .goal-edit:hover {
    background: var(--surface-muted);
  }

  .goal-input-wrapper {
    display: flex;
    gap: 0.5rem;
    margin-top: 0.75rem;
  }

  .goal-input {
    flex: 1;
    padding: 0.5rem 0.75rem;
    border: 1px solid var(--border-color);
    border-radius: 6px;
    background: var(--surface);
    color: var(--text-primary);
    font-size: 0.875rem;
  }

  .goal-save {
    padding: 0.5rem 1rem;
    background: var(--primary);
    color: white;
    border: none;
    border-radius: 6px;
    font-weight: 500;
    cursor: pointer;
  }

  /* Revenue Card */
  .revenue-card {
    min-width: 160px;
    padding: 1rem 1.25rem;
    border-radius: 12px;
    background: var(--surface-elevated);
    border: 1px solid var(--border-color);
  }

  .revenue-card.positive {
    border-color: rgba(16, 185, 129, 0.3);
    background: rgba(16, 185, 129, 0.05);
  }

  .revenue-card.negative {
    border-color: rgba(239, 68, 68, 0.3);
    background: rgba(239, 68, 68, 0.05);
  }

  .revenue-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;
  }

  .revenue-label {
    font-size: 0.75rem;
    color: var(--text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.03em;
  }

  .revenue-card.positive .revenue-header {
    color: #10b981;
  }

  .revenue-card.negative .revenue-header {
    color: #ef4444;
  }

  .revenue-value {
    font-size: 1.25rem;
    font-weight: 600;
  }

  .revenue-card.positive .revenue-value {
    color: #10b981;
  }

  .revenue-card.negative .revenue-value {
    color: #ef4444;
  }

  .revenue-percentage {
    font-size: 0.875rem;
    font-weight: 500;
    margin-left: 0.5rem;
    opacity: 0.8;
  }

  @media (max-width: 640px) {
    .balance-header {
      flex-direction: column;
      gap: 1rem;
    }

    .balance-content {
      min-width: auto;
    }

    .amount {
      font-size: 2rem;
    }

    .currency {
      font-size: 1rem;
    }

    .goal-info {
      flex-direction: column;
      gap: 0.5rem;
      align-items: flex-start;
    }

    .goal-edit {
      align-self: flex-start;
    }

    .revenue-card {
      width: 100%;
    }
  }

  @media (max-width: 360px) {
    .balance-header {
      gap: 0.75rem;
    }

    .greeting {
      font-size: 0.75rem;
    }

    .balance-amount {
      margin-bottom: 0.75rem;
    }

    .amount {
      font-size: 1.75rem;
    }

    .currency {
      font-size: 0.875rem;
    }

    .goal-section {
      margin-top: 0.5rem;
    }

    .goal-info {
      font-size: 0.6875rem;
    }

    .goal-input-wrapper {
      flex-direction: column;
    }

    .goal-input {
      font-size: 0.8125rem;
    }

    .goal-save {
      width: 100%;
      padding: 0.625rem;
    }

    .revenue-card {
      padding: 0.875rem 1rem;
    }

    .revenue-label {
      font-size: 0.6875rem;
    }

    .revenue-value {
      font-size: 1.125rem;
    }

    .revenue-percentage {
      font-size: 0.75rem;
    }
  }
</style>
