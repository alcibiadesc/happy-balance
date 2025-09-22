<script lang="ts">
  interface Props {
    name: string;
    amount: string;
    percentage: number;
    color?: string;
    icon?: string;
  }

  let {
    name,
    amount,
    percentage,
    color = 'var(--primary)',
    icon = '📊'
  }: Props = $props();
</script>

<div class="category-card">
  <div class="category-header">
    <div class="category-info">
      <span class="category-icon" style="background-color: {color}20; color: {color}">
        {icon}
      </span>
      <span class="category-name">{name}</span>
    </div>
    <span class="category-amount">{amount}</span>
  </div>
  <div class="category-bar">
    <div
      class="category-progress"
      style="width: {percentage}%; background-color: {color}"
    ></div>
  </div>
  <span class="category-percentage">{percentage}%</span>
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

  .category-amount {
    font-size: 0.875rem;
    color: var(--text-primary);
    font-weight: 600;
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

  .category-percentage {
    font-size: 0.75rem;
    color: var(--text-muted);
  }
</style>