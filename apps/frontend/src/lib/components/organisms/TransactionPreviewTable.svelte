<script lang="ts">
  import { t } from '$lib/stores/i18n';
  import type { ParsedTransaction } from '$lib/utils/csv-parser';
  import SearchInput from '../atoms/SearchInput.svelte';
  import FilterTabs from '../molecules/FilterTabs.svelte';
  import AmountDisplay from '../atoms/AmountDisplay.svelte';
  import StatusBadge from '../atoms/StatusBadge.svelte';

  type ViewMode = 'all' | 'duplicates' | 'new';

  interface Props {
    transactions: ParsedTransaction[];
    onToggleTransaction: (id: string) => void;
    onToggleAll: () => void;
  }

  let {
    transactions = $bindable(),
    onToggleTransaction,
    onToggleAll: _onToggleAll,
  }: Props = $props();

  // Local state
  let showAllTransactions = $state(false);
  let viewMode: ViewMode = $state('all');
  let searchQuery = $state('');

  // Derived values
  const duplicateCount = $derived(transactions.filter((tx) => tx.isDuplicate).length);
  const selectedDuplicatesCount = $derived(
    transactions.filter((tx) => tx.isDuplicate && tx.selected).length
  );
  const newTransactionsCount = $derived(transactions.filter((tx) => !tx.isDuplicate).length);

  const tabs = $derived([
    { id: 'all', label: 'Todas', count: transactions.length },
    { id: 'new', label: 'Nuevas', count: newTransactionsCount },
    {
      id: 'duplicates',
      label: 'Duplicados',
      count: duplicateCount,
      badge: selectedDuplicatesCount,
      disabled: duplicateCount === 0,
    },
  ]);

  function matchesSearch(transaction: ParsedTransaction): boolean {
    if (!searchQuery) return true;
    const searchableFields = [
      transaction.partner,
      transaction.description,
      transaction.date,
      transaction.amount?.toString(),
      transaction.hash,
    ];
    return searchableFields.some((field) => field?.toString().toLowerCase().includes(searchQuery));
  }

  const visibleTransactions = $derived.by(() => {
    let filtered = transactions;
    switch (viewMode) {
      case 'duplicates':
        filtered = filtered.filter((tx) => tx.isDuplicate);
        break;
      case 'new':
        filtered = filtered.filter((tx) => !tx.isDuplicate);
        break;
    }
    return searchQuery ? filtered.filter(matchesSearch) : filtered;
  });

  const displayedTransactions = $derived(
    showAllTransactions ? visibleTransactions : visibleTransactions.slice(0, 10)
  );

  const allVisibleSelected = $derived(visibleTransactions.every((tx) => tx.selected));

  function handleToggleAll() {
    const currentVisible = visibleTransactions;
    const allSelected = currentVisible.every((tx) => tx.selected);
    transactions = transactions.map((tx) => {
      const isVisible = currentVisible.some((v) => v.id === tx.id);
      return isVisible ? { ...tx, selected: !allSelected } : tx;
    });
  }

  function getStatusVariant(
    tx: ParsedTransaction
  ): 'ready' | 'duplicate' | 'duplicate-selected' | 'skipped' {
    if (tx.isDuplicate) return tx.selected ? 'duplicate-selected' : 'duplicate';
    return tx.selected ? 'ready' : 'skipped';
  }

  function getStatusText(tx: ParsedTransaction): string {
    if (tx.isDuplicate)
      return tx.selected ? 'Duplicado (se importará)' : $t('import.preview.status.duplicate');
    return tx.selected ? $t('import.preview.status.ready') : $t('import.preview.status.skipped');
  }
</script>

<div class="preview-step">
  <div class="search-container">
    <SearchInput placeholder="Buscar transacciones..." onSearch={(v) => (searchQuery = v)} />
  </div>

  <div class="view-filters">
    <FilterTabs {tabs} activeTab={viewMode} onTabChange={(id) => (viewMode = id as ViewMode)} />

    <div class="control-actions">
      {#if visibleTransactions.length > 10}
        <label class="control-item">
          <input
            type="checkbox"
            bind:checked={showAllTransactions}
            class="toggle toggle-acapulco toggle-sm"
          />
          <span class="control-text">{$t('import.preview.controls.show_all')}</span>
        </label>
      {/if}
      <button class="select-all-btn" onclick={handleToggleAll}>
        {allVisibleSelected
          ? $t('import.preview.controls.deselect_all')
          : $t('import.preview.controls.select_all')}
      </button>
    </div>
  </div>

  <div class="table-container">
    {#if visibleTransactions.length === 0}
      <div class="empty-state">
        <div class="empty-icon">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="48" height="48">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d={viewMode === 'duplicates'
                ? 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'
                : viewMode === 'new'
                  ? 'M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z'
                  : 'M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4'}
            />
          </svg>
        </div>
        <h3 class="empty-title">
          {viewMode === 'duplicates'
            ? 'No hay transacciones duplicadas'
            : viewMode === 'new'
              ? 'No hay transacciones nuevas'
              : 'No hay transacciones'}
        </h3>
        <p class="empty-subtitle">
          {viewMode === 'duplicates'
            ? 'No se detectaron duplicados en tu archivo'
            : viewMode === 'new'
              ? 'Todas las transacciones ya existen'
              : 'El archivo no contiene transacciones válidas'}
        </p>
      </div>
    {:else}
      <div class="table-wrapper">
        <table class="transactions-table">
          <thead>
            <tr>
              <th class="col-checkbox"
                ><span class="th-content">{$t('import.preview.table.select')}</span></th
              >
              <th class="col-date"
                ><span class="th-content">{$t('import.preview.table.date')}</span></th
              >
              <th class="col-partner"
                ><span class="th-content">{$t('import.preview.table.partner')}</span></th
              >
              <th class="col-description"
                ><span class="th-content">{$t('import.preview.table.description')}</span></th
              >
              <th class="col-amount"
                ><span class="th-content">{$t('import.preview.table.amount')}</span></th
              >
              <th class="col-status"
                ><span class="th-content">{$t('import.preview.table.status')}</span></th
              >
            </tr>
          </thead>
          <tbody>
            {#each displayedTransactions as tx (tx.id)}
              <tr class="transaction-row" class:duplicate={tx.isDuplicate}>
                <td class="col-checkbox">
                  <div class="checkbox-wrapper">
                    <input
                      type="checkbox"
                      class="checkbox-acapulco"
                      id="tx-{tx.id}"
                      checked={tx.selected}
                      onchange={() => onToggleTransaction(tx.id)}
                    />
                    <label for="tx-{tx.id}" class="checkbox-label">
                      <svg class="checkbox-icon" viewBox="0 0 24 24"
                        ><path
                          d="M5 13l4 4L19 7"
                          stroke="currentColor"
                          stroke-width="2"
                          fill="none"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                        /></svg
                      >
                    </label>
                  </div>
                </td>
                <td class="col-date"><div class="cell-content">{tx.date}</div></td>
                <td class="col-partner"
                  ><div class="cell-content" title={tx.partner}>{tx.partner}</div></td
                >
                <td class="col-description"
                  ><div class="cell-content" title={tx.description}>{tx.description}</div></td
                >
                <td class="col-amount"><AmountDisplay amount={tx.amount} /></td>
                <td class="col-status">
                  <StatusBadge variant={getStatusVariant(tx)} text={getStatusText(tx)} />
                  {#if tx.duplicateReason}
                    <div class="status-reason" title={tx.duplicateReason}>{tx.duplicateReason}</div>
                  {/if}
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {/if}

    {#if !showAllTransactions && visibleTransactions.length > 10}
      <div class="pagination-info">
        <p class="pagination-text">
          {$t('import.preview.pagination.showing', { total: visibleTransactions.length })}
        </p>
        <button class="show-all-btn" onclick={() => (showAllTransactions = true)}
          >{$t('import.preview.pagination.show_all')}</button
        >
      </div>
    {/if}
  </div>
</div>

<style>
  .preview-step {
    padding: 1.5rem;
  }
  .search-container {
    margin-bottom: 1rem;
  }

  .view-filters {
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: var(--surface);
    border-radius: 0.75rem;
    padding: 0.75rem;
    margin-bottom: 1.5rem;
    flex-wrap: wrap;
    gap: 1rem;
    border: 1px solid var(--border-color);
  }

  .control-actions {
    display: flex;
    align-items: center;
    gap: 1rem;
  }
  .control-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    cursor: pointer;
  }
  .control-text {
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--text-primary);
  }

  .select-all-btn {
    padding: 0.5rem 1rem;
    background: transparent;
    border: none;
    color: var(--acapulco);
    font-size: 0.875rem;
    font-weight: 500;
    border-radius: 0.5rem;
    cursor: pointer;
    transition: background-color 0.2s ease;
  }
  .select-all-btn:hover {
    background: rgba(122, 186, 165, 0.1);
  }

  .table-container {
    background: var(--surface);
    border-radius: 0.75rem;
    overflow: hidden;
    border: 1px solid var(--border-color);
  }

  .table-wrapper {
    overflow-x: auto;
  }

  .transactions-table {
    width: 100%;
    border-collapse: separate;
    border-spacing: 0;
    min-width: 600px;
  }

  .transactions-table thead {
    background: var(--surface-muted);
    position: sticky;
    top: 0;
    z-index: 10;
  }

  .transactions-table th {
    padding: 1rem;
    text-align: left;
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    border-bottom: 2px solid var(--border-color);
    white-space: nowrap;
  }

  .th-content {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .col-checkbox {
    width: 50px;
    text-align: center;
  }
  .col-date {
    width: 110px;
  }
  .col-partner {
    width: 160px;
    min-width: 120px;
  }
  .col-description {
    width: auto;
    min-width: 150px;
  }
  .col-amount {
    width: 100px;
    text-align: right;
  }
  .col-status {
    width: 120px;
  }

  .transaction-row {
    transition: background-color 0.2s ease;
    border-bottom: 1px solid var(--border-color);
  }
  .transaction-row:hover {
    background: var(--surface-muted);
  }
  .transaction-row.duplicate {
    background: rgba(254, 205, 44, 0.03);
  }

  .transactions-table td {
    padding: 0.875rem 0.75rem;
    vertical-align: middle;
  }

  .checkbox-wrapper {
    display: flex;
    justify-content: center;
    align-items: center;
  }
  .checkbox-acapulco {
    position: absolute;
    opacity: 0;
    pointer-events: none;
  }

  .checkbox-label {
    width: 1.125rem;
    height: 1.125rem;
    border: 2px solid var(--border-color);
    border-radius: 0.25rem;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s ease;
    background: var(--surface);
  }

  .checkbox-acapulco:checked + .checkbox-label {
    background: var(--acapulco);
    border-color: var(--acapulco);
  }

  .checkbox-icon {
    width: 0.75rem;
    height: 0.75rem;
    color: white;
    opacity: 0;
    transform: scale(0);
    transition: all 0.2s ease;
  }

  .checkbox-acapulco:checked + .checkbox-label .checkbox-icon {
    opacity: 1;
    transform: scale(1);
  }

  .checkbox-label:hover {
    border-color: var(--acapulco);
    box-shadow: 0 0 0 2px rgba(122, 186, 165, 0.1);
  }

  .cell-content {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 0.8125rem;
    color: var(--text-primary);
  }

  .col-date .cell-content {
    font-family: 'JetBrains Mono', 'Courier New', monospace;
    font-size: 0.75rem;
    color: var(--text-secondary);
  }

  .col-partner .cell-content {
    font-weight: 500;
  }
  .col-description .cell-content {
    color: var(--text-secondary);
  }

  .status-reason {
    font-size: 0.625rem;
    color: var(--text-muted);
    margin-top: 0.25rem;
    max-width: 100px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 3rem 2rem;
    text-align: center;
  }

  .empty-icon {
    margin-bottom: 1rem;
    color: var(--text-muted);
    opacity: 0.5;
  }
  .empty-title {
    font-size: 1.125rem;
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: 0.5rem;
  }
  .empty-subtitle {
    font-size: 0.875rem;
    color: var(--text-secondary);
    max-width: 400px;
  }

  .pagination-info {
    background: var(--surface-muted);
    padding: 1rem;
    text-align: center;
    border-top: 1px solid var(--border-color);
  }

  .pagination-text {
    font-size: 0.875rem;
    color: var(--text-secondary);
    margin-bottom: 0.5rem;
  }

  .show-all-btn {
    padding: 0.5rem 1rem;
    background: transparent;
    border: none;
    color: var(--acapulco);
    font-size: 0.875rem;
    font-weight: 500;
    border-radius: 0.5rem;
    cursor: pointer;
  }
  .show-all-btn:hover {
    background: rgba(122, 186, 165, 0.1);
  }

  @media (max-width: 768px) {
    .preview-step {
      padding: 1rem;
    }
    .view-filters {
      flex-direction: column;
      align-items: flex-start;
    }
    .transactions-table {
      font-size: 0.75rem;
      min-width: 500px;
    }
    .transactions-table th {
      padding: 0.625rem 0.375rem;
      font-size: 0.625rem;
    }
    .transactions-table td {
      padding: 0.625rem 0.375rem;
    }
  }

  @media (max-width: 480px) {
    .col-description {
      display: none;
    }
    .transactions-table {
      min-width: 350px;
    }
  }
</style>
