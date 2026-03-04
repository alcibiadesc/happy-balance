<script lang="ts">
  import { goto } from '$app/navigation';
  import {
    ChevronLeft,
    History,
    Plus,
    Pencil,
    Trash2,
    X,
    Link2,
    ExternalLink,
  } from 'lucide-svelte';

  type InvestmentHistoryType = 'CONTRIBUTION' | 'WITHDRAWAL' | 'VALUE_UPDATE';

  interface HistoryEntry {
    id: string;
    date: string;
    type: InvestmentHistoryType;
    amount: number;
    notes?: string | null;
    transactionId?: string | null;
  }

  interface Investment {
    id: string;
    name: string;
    icon: string;
    color: string;
    symbol?: string | null;
    currentValue: number;
    netContributions: number;
    profit: number;
    profitPercentage: number;
    history?: HistoryEntry[];
  }

  interface EditingHistoryEntry {
    historyId: string;
    date: string;
    type: InvestmentHistoryType;
    amount: number;
    notes: string;
  }

  interface Props {
    investment: Investment;
    editingHistoryEntry: EditingHistoryEntry | null;
    formatCurrency: (amount: number) => string;
    formatPercentage: (value: number) => string;
    formatDate: (date: string) => string;
    getHistoryTypeLabel: (type: InvestmentHistoryType) => string;
    getHistoryTypeColor: (type: InvestmentHistoryType) => string;
    onBack: () => void;
    onAddHistory: () => void;
    onStartEditHistoryEntry: (entry: HistoryEntry) => void;
    onSaveHistoryEntryEdit: () => void;
    onCancelHistoryEntryEdit: () => void;
    onDeleteHistoryEntry: (historyId: string) => void;
  }

  let {
    investment,
    editingHistoryEntry,
    formatCurrency,
    formatPercentage,
    formatDate,
    getHistoryTypeLabel,
    getHistoryTypeColor,
    onBack,
    onAddHistory,
    onStartEditHistoryEntry,
    onSaveHistoryEntryEdit,
    onCancelHistoryEntryEdit,
    onDeleteHistoryEntry,
  }: Props = $props();

  function navigateToTransaction(transactionId: string) {
    goto(`/transactions?search=${transactionId}`);
  }
</script>

<header class="details-header">
  <button class="back-btn" onclick={onBack}>
    <ChevronLeft size={20} /> Volver
  </button>
</header>

<div class="details-content">
  <div class="details-main">
    <div class="details-icon" style="background-color: {investment.color}">
      {investment.icon}
    </div>
    <div class="details-info">
      <h2>{investment.name}</h2>
      {#if investment.symbol}
        <span class="symbol">{investment.symbol}</span>
      {/if}
    </div>
  </div>

  <div class="details-stats">
    <div class="stat">
      <span class="stat-label">Valor actual</span>
      <span class="stat-value">{formatCurrency(investment.currentValue)}</span>
    </div>
    <div class="stat">
      <span class="stat-label">Aportado</span>
      <span class="stat-value">{formatCurrency(investment.netContributions)}</span>
    </div>
    <div
      class="stat"
      class:positive={investment.profit >= 0}
      class:negative={investment.profit < 0}
    >
      <span class="stat-label">Rentabilidad</span>
      <span class="stat-value">
        {formatCurrency(investment.profit)}
        ({formatPercentage(investment.profitPercentage)})
      </span>
    </div>
  </div>

  <!-- History -->
  <div class="history-section">
    <div class="history-header">
      <h3><History size={16} /> Historial</h3>
      <button class="add-btn small" onclick={onAddHistory}>
        <Plus size={14} />
      </button>
    </div>

    {#if investment.history && investment.history.length > 0}
      <div class="history-list">
        {#each investment.history as entry (entry.id)}
          {#if editingHistoryEntry?.historyId === entry.id}
            <div class="history-item editing">
              <div class="history-edit-row">
                <input type="date" class="form-input small" bind:value={editingHistoryEntry.date} />
                <select class="form-input small" bind:value={editingHistoryEntry.type}>
                  <option value="CONTRIBUTION">Aportación</option>
                  <option value="WITHDRAWAL">Retirada</option>
                  <option value="VALUE_UPDATE">Actualización</option>
                </select>
                <input
                  type="number"
                  class="form-input small"
                  bind:value={editingHistoryEntry.amount}
                  step="0.01"
                />
              </div>
              <div class="history-edit-row">
                <input
                  type="text"
                  class="form-input small flex-1"
                  bind:value={editingHistoryEntry.notes}
                  placeholder="Notas"
                />
                <button class="btn-icon small" onclick={onCancelHistoryEntryEdit}
                  ><X size={12} /></button
                >
                <button class="btn-icon primary small" onclick={onSaveHistoryEntryEdit}
                  ><Plus size={12} /></button
                >
              </div>
            </div>
          {:else}
            <div
              class="history-item"
              class:linked={entry.transactionId}
              onclick={() => entry.transactionId && navigateToTransaction(entry.transactionId)}
              role={entry.transactionId ? 'button' : undefined}
            >
              <div class="history-date">{formatDate(entry.date)}</div>
              <div class="history-type">
                {getHistoryTypeLabel(entry.type)}
                {#if entry.transactionId}
                  <span class="linked-badge"><Link2 size={10} /></span>
                {/if}
              </div>
              <div class="history-amount {getHistoryTypeColor(entry.type)}">
                {entry.type === 'WITHDRAWAL' ? '-' : '+'}{formatCurrency(entry.amount)}
              </div>
              {#if entry.transactionId}
                <button
                  class="btn-icon small"
                  onclick={(e) => {
                    e.stopPropagation();
                    navigateToTransaction(entry.transactionId!);
                  }}
                >
                  <ExternalLink size={12} />
                </button>
              {/if}
              <button
                class="btn-icon small"
                onclick={(e) => {
                  e.stopPropagation();
                  onStartEditHistoryEntry(entry);
                }}
              >
                <Pencil size={12} />
              </button>
              <button
                class="btn-icon danger small"
                onclick={(e) => {
                  e.stopPropagation();
                  onDeleteHistoryEntry(entry.id);
                }}
              >
                <Trash2 size={12} />
              </button>
            </div>
          {/if}
        {/each}
      </div>
    {:else}
      <p class="empty-history">Sin movimientos</p>
    {/if}
  </div>
</div>

<style>
  .details-header {
    margin-bottom: 1.5rem;
  }

  .back-btn {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    padding: 0.5rem 0.75rem;
    background: var(--surface-muted);
    border: 1px solid var(--border-color);
    border-radius: 6px;
    color: var(--text-primary);
    font-size: 0.875rem;
    cursor: pointer;
  }

  .details-content {
    background: var(--surface-elevated);
    border: 1px solid var(--border-color);
    border-radius: 12px;
    padding: 1.5rem;
  }

  .details-main {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 1.5rem;
  }

  .details-icon {
    width: 56px;
    height: 56px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.5rem;
  }

  .details-info h2 {
    margin: 0;
    font-size: 1.25rem;
  }

  .symbol {
    font-size: 0.75rem;
    color: var(--text-muted);
    text-transform: uppercase;
  }

  .details-stats {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1rem;
    margin-bottom: 1.5rem;
  }

  .stat {
    padding: 1rem;
    background: var(--surface);
    border-radius: 8px;
    text-align: center;
  }

  .stat-label {
    display: block;
    font-size: 0.75rem;
    color: var(--text-muted);
    margin-bottom: 0.25rem;
  }

  .stat-value {
    font-size: 1.125rem;
    font-weight: 600;
  }

  .stat.positive .stat-value {
    color: #10b981;
  }

  .stat.negative .stat-value {
    color: #ef4444;
  }

  .history-section {
    border-top: 1px solid var(--border-color);
    padding-top: 1.5rem;
  }

  .history-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  }

  .history-header h3 {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.9375rem;
    margin: 0;
  }

  .add-btn.small {
    display: flex;
    align-items: center;
    padding: 0.375rem 0.5rem;
    background: var(--primary);
    color: white;
    border: none;
    border-radius: 6px;
    cursor: pointer;
  }

  .history-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .history-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem;
    background: var(--surface);
    border-radius: 6px;
  }

  .history-item.linked {
    cursor: pointer;
  }

  .history-item.linked:hover {
    background: var(--surface-hover);
  }

  .history-item.editing {
    flex-direction: column;
    align-items: stretch;
  }

  .history-edit-row {
    display: flex;
    gap: 0.5rem;
    align-items: center;
  }

  .history-edit-row:first-child {
    margin-bottom: 0.5rem;
  }

  .form-input {
    padding: 0.5rem 0.75rem;
    border: 1px solid var(--border-color);
    border-radius: 6px;
    background: var(--surface);
    color: var(--text-primary);
    font-size: 0.875rem;
  }

  .form-input.small {
    padding: 0.375rem 0.5rem;
    font-size: 0.8125rem;
  }

  .form-input.flex-1 {
    flex: 1;
  }

  .history-date {
    font-size: 0.8125rem;
    color: var(--text-muted);
    min-width: 80px;
  }

  .history-type {
    flex: 1;
    font-size: 0.8125rem;
    display: flex;
    align-items: center;
    gap: 0.25rem;
  }

  .linked-badge {
    color: var(--primary);
  }

  .history-amount {
    font-size: 0.875rem;
    font-weight: 500;
    min-width: 80px;
    text-align: right;
  }

  .history-amount.positive,
  .history-amount.green {
    color: #10b981;
  }

  .history-amount.negative,
  .history-amount.red {
    color: #ef4444;
  }

  .btn-icon {
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--surface-muted);
    border: 1px solid var(--border-color);
    border-radius: 6px;
    color: var(--text-muted);
    cursor: pointer;
  }

  .btn-icon:hover {
    background: var(--primary);
    border-color: var(--primary);
    color: white;
  }

  .btn-icon.primary {
    background: var(--primary);
    border-color: var(--primary);
    color: white;
  }

  .btn-icon.danger:hover {
    background: #ef4444;
    border-color: #ef4444;
  }

  .btn-icon.small {
    width: 24px;
    height: 24px;
  }

  .empty-history {
    text-align: center;
    padding: 2rem;
    color: var(--text-muted);
  }

  @media (max-width: 768px) {
    .details-stats {
      grid-template-columns: 1fr;
    }
  }
</style>
