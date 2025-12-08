<script lang="ts">
  import { Calendar, Check } from 'lucide-svelte';
  import { formatCurrency } from '$lib/stores/currency';
  import type { Snippet } from 'svelte';

  interface Props {
    description: string;
    merchant?: string;
    date: string;
    amount: number;
    selected?: boolean;
    current?: boolean;
    showCheckbox?: boolean;
    checked?: boolean;
    onchange?: () => void;
    children?: Snippet;
  }

  let {
    description,
    merchant,
    date,
    amount,
    selected = false,
    current = false,
    showCheckbox = false,
    checked = false,
    onchange,
    children,
  }: Props = $props();

  function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  }

  const isExpense = $derived(amount < 0);
  const isIncome = $derived(amount > 0);
</script>

<label class="transaction-card" class:selected class:current>
  {#if showCheckbox}
    <input type="checkbox" {checked} {onchange} />
  {/if}

  <div class="transaction-info">
    <span class="transaction-description">{description || merchant}</span>
    <span class="transaction-meta">
      <Calendar size={10} />
      {formatDate(date)}
      {#if description && merchant}
        <span class="separator">•</span>
        <span>{merchant}</span>
      {/if}
    </span>
  </div>

  <span class="transaction-amount" class:expense={isExpense} class:income={isIncome}>
    {formatCurrency(amount)}
  </span>

  {#if current}
    <div class="check-badge">
      <Check size={14} />
    </div>
  {/if}

  {#if children}
    {@render children()}
  {/if}
</label>

<style>
  .transaction-card {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 14px;
    background: var(--surface-elevated);
    border: 1.5px solid var(--border-color);
    border-radius: 10px;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .transaction-card:hover {
    border-color: var(--text-muted);
    background: var(--surface-muted);
  }

  .transaction-card.current {
    background: var(--acapulco-alpha-10);
    border-color: var(--acapulco);
    cursor: default;
  }

  .transaction-card.selected {
    background: var(--primary-alpha-10);
    border-color: var(--primary);
  }

  .transaction-card input[type='checkbox'] {
    width: 16px;
    height: 16px;
    accent-color: var(--primary);
    cursor: pointer;
    flex-shrink: 0;
  }

  .transaction-info {
    flex: 1;
    min-width: 0;
  }

  .transaction-description {
    font-size: 13px;
    font-weight: 500;
    color: var(--text-primary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    display: block;
  }

  .transaction-meta {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 11px;
    color: var(--text-muted);
    margin-top: 2px;
  }

  .transaction-meta :global(svg) {
    flex-shrink: 0;
  }

  .separator {
    margin: 0 2px;
  }

  .transaction-amount {
    font-size: 13px;
    font-weight: 600;
    flex-shrink: 0;
  }

  .transaction-amount.expense {
    color: var(--froly);
  }

  .transaction-amount.income {
    color: var(--acapulco);
  }

  .check-badge {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 22px;
    height: 22px;
    background: var(--acapulco);
    border-radius: 50%;
    color: white;
    flex-shrink: 0;
  }

  @media (max-width: 480px) {
    .transaction-card {
      padding: 10px 12px;
    }

    .transaction-description {
      font-size: 12px;
    }
  }
</style>
