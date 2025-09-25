<script lang="ts">
  interface Props {
    name: string;
    amount: string;
    percentage: number;
    color?: string;
    icon?: string;
    monthlyBudget?: string | null;
    budgetUsage?: number | null;
  }

  let {
    name,
    amount,
    percentage,
    color = "var(--primary)",
    icon = "📊",
    monthlyBudget = null,
    budgetUsage = null,
  }: Props = $props();
</script>

<div class="category-card">
  <div class="category-header">
    <div class="category-info">
      <span
        class="category-icon"
        style="background-color: {color}20; color: {color}"
      >
        {icon}
      </span>
      <span class="category-name">{name}</span>
    </div>
    <div class="category-amount-section">
      <span class="category-amount">{amount}</span>
      {#if monthlyBudget}
        <span class="category-budget">/ {monthlyBudget}</span>
      {/if}
    </div>
  </div>
  <div class="category-bar">
    <div
      class="category-progress"
      style="width: {budgetUsage !== null ? Math.min(budgetUsage, 100) : percentage}%; background-color: {budgetUsage !== null && budgetUsage > 100 ? 'var(--accent)' : color}"
    ></div>
  </div>
  <div class="category-footer">
    <span class="category-percentage">{percentage}% del total</span>
    {#if budgetUsage !== null}
      <span class="budget-usage" class:over-budget={budgetUsage > 100}>
        {Math.round(budgetUsage)}% del presupuesto
      </span>
    {/if}
  </div>
</div>

<style>
  .category-card {
    background: var(--surface);
    border-radius: 10px;
    padding: 1rem;
    border: 1px solid var(--border-color, transparent);
    transition: all 0.2s ease;
  }

  .category-card:hover {
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  }

  .category-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.75rem;
  }

  .category-info {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .category-icon {
    width: 1.75rem;
    height: 1.75rem;
    border-radius: var(--radius-sm);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.875rem;
    flex-shrink: 0;
  }

  .category-name {
    font-size: 0.875rem;
    color: var(--text-primary);
    font-weight: 500;
  }

  .category-amount-section {
    display: flex;
    align-items: baseline;
    gap: 0.25rem;
  }

  .category-amount {
    font-size: 0.875rem;
    color: var(--text-primary);
    font-weight: 600;
  }

  .category-budget {
    font-size: 0.75rem;
    color: var(--text-muted);
    font-weight: 500;
  }

  .category-bar {
    height: 4px;
    background: var(--surface-muted);
    border-radius: 2px;
    overflow: hidden;
    margin-bottom: 0.5rem;
  }

  .category-progress {
    height: 100%;
    background: var(--primary);
    border-radius: 2px;
    transition: width 0.6s ease;
  }

  .category-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 0.5rem;
  }

  .category-percentage {
    font-size: 0.75rem;
    color: var(--text-muted);
  }

  .budget-usage {
    font-size: 0.75rem;
    color: var(--success);
    font-weight: 500;
  }

  .budget-usage.over-budget {
    color: var(--accent);
    font-weight: 600;
  }
</style>
