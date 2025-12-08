<script lang="ts">
  import { t } from '$lib/stores/i18n';
  import type { ParsedTransaction } from '$lib/utils/csv-parser';

  type ViewMode = 'all' | 'duplicates' | 'new';

  interface Props {
    transactions: ParsedTransaction[];
    onToggleTransaction: (id: string) => void;
    onToggleAll: () => void;
  }

  let { transactions = $bindable(), onToggleTransaction, onToggleAll }: Props = $props();

  // Local state
  let showAllTransactions = $state(false);
  let viewMode: ViewMode = $state('all');
  let searchQuery = $state('');
  let searchTimeout: ReturnType<typeof setTimeout>;

  const DEBOUNCE_DELAY_MS = 300;

  // Derived values
  const selectedCount = $derived(transactions.filter((tx) => tx.selected).length);
  const duplicateCount = $derived(transactions.filter((tx) => tx.isDuplicate).length);
  const selectedDuplicatesCount = $derived(
    transactions.filter((tx) => tx.isDuplicate && tx.selected).length
  );
  const newTransactionsCount = $derived(transactions.filter((tx) => !tx.isDuplicate).length);

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

  function handleSearch(event: Event) {
    const target = event.target as HTMLInputElement;
    const value = target.value;
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      searchQuery = value.toLowerCase();
    }, DEBOUNCE_DELAY_MS);
  }

  function handleToggleAll() {
    const currentVisible = visibleTransactions;
    const allSelected = currentVisible.every((tx) => tx.selected);

    transactions = transactions.map((tx) => {
      const isVisible = currentVisible.some((v) => v.id === tx.id);
      return isVisible ? { ...tx, selected: !allSelected } : tx;
    });
  }
</script>

<div class="preview-step">
  <!-- Search Bar -->
  <div class="search-container">
    <div class="search-wrapper">
      <svg
        class="search-icon"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        width="20"
        height="20"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        />
      </svg>
      <input
        type="text"
        placeholder="Buscar transacciones..."
        class="search-input"
        oninput={handleSearch}
      />
    </div>
  </div>

  <!-- View Mode Filters -->
  <div class="view-filters">
    <div class="filter-tabs">
      <button
        class="filter-tab"
        class:active={viewMode === 'all'}
        onclick={() => (viewMode = 'all')}
      >
        Todas ({transactions.length})
      </button>

      <button
        class="filter-tab"
        class:active={viewMode === 'new'}
        onclick={() => (viewMode = 'new')}
      >
        Nuevas ({newTransactionsCount})
      </button>

      <button
        class="filter-tab"
        class:active={viewMode === 'duplicates'}
        onclick={() => (viewMode = 'duplicates')}
        disabled={duplicateCount === 0}
      >
        Duplicados ({duplicateCount})
        {#if selectedDuplicatesCount > 0}
          <span class="selected-badge">{selectedDuplicatesCount}</span>
        {/if}
      </button>
    </div>

    <div class="control-actions">
      {#if visibleTransactions.length > 10}
        <label class="control-item">
          <input
            type="checkbox"
            bind:checked={showAllTransactions}
            class="toggle toggle-acapulco toggle-sm"
          />
          <span class="control-text">
            {$t('import.preview.controls.show_all')}
          </span>
        </label>
      {/if}

      <button class="select-all-btn" onclick={handleToggleAll}>
        {allVisibleSelected
          ? $t('import.preview.controls.deselect_all')
          : $t('import.preview.controls.select_all')}
      </button>
    </div>
  </div>

  <!-- Transactions Table -->
  <div class="table-container">
    {#if visibleTransactions.length === 0}
      <div class="empty-state">
        <div class="empty-icon">
          {#if viewMode === 'duplicates'}
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="48" height="48">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          {:else if viewMode === 'new'}
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="48" height="48">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          {:else}
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="48" height="48">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
              />
            </svg>
          {/if}
        </div>
        <h3 class="empty-title">
          {#if viewMode === 'duplicates'}
            No hay transacciones duplicadas
          {:else if viewMode === 'new'}
            No hay transacciones nuevas
          {:else}
            No hay transacciones
          {/if}
        </h3>
        <p class="empty-subtitle">
          {#if viewMode === 'duplicates'}
            No se detectaron duplicados en tu archivo
          {:else if viewMode === 'new'}
            Todas las transacciones ya existen en la base de datos
          {:else}
            El archivo no contiene transacciones validas
          {/if}
        </p>
      </div>
    {:else}
      <div class="table-wrapper">
        <table class="transactions-table">
          <thead>
            <tr>
              <th class="col-checkbox">
                <span class="th-content">{$t('import.preview.table.select')}</span>
              </th>
              <th class="col-date">
                <span class="th-content">{$t('import.preview.table.date')}</span>
              </th>
              <th class="col-partner">
                <span class="th-content">{$t('import.preview.table.partner')}</span>
              </th>
              <th class="col-description">
                <span class="th-content">{$t('import.preview.table.description')}</span>
              </th>
              <th class="col-amount">
                <span class="th-content">{$t('import.preview.table.amount')}</span>
              </th>
              <th class="col-status">
                <span class="th-content">{$t('import.preview.table.status')}</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {#each displayedTransactions as transaction (transaction.id)}
              <tr class="transaction-row" class:duplicate={transaction.isDuplicate}>
                <td class="col-checkbox">
                  <div class="checkbox-wrapper">
                    <input
                      type="checkbox"
                      class="checkbox-acapulco"
                      id="tx-{transaction.id}"
                      checked={transaction.selected}
                      onchange={() => onToggleTransaction(transaction.id)}
                    />
                    <label for="tx-{transaction.id}" class="checkbox-label">
                      <svg class="checkbox-icon" viewBox="0 0 24 24">
                        <path
                          d="M5 13l4 4L19 7"
                          stroke="currentColor"
                          stroke-width="2"
                          fill="none"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                        />
                      </svg>
                    </label>
                  </div>
                </td>
                <td class="col-date">
                  <div class="cell-content">{transaction.date}</div>
                </td>
                <td class="col-partner">
                  <div class="cell-content" title={transaction.partner}>{transaction.partner}</div>
                </td>
                <td class="col-description">
                  <div class="cell-content" title={transaction.description}>
                    {transaction.description}
                  </div>
                </td>
                <td class="col-amount">
                  <div
                    class="amount-wrapper"
                    class:positive={transaction.amount >= 0}
                    class:negative={transaction.amount < 0}
                  >
                    <span class="amount-sign">{transaction.amount >= 0 ? '+' : ''}</span>
                    <span class="amount-value">{Math.abs(transaction.amount).toFixed(2)}</span>
                    <span class="amount-currency">EUR</span>
                  </div>
                </td>
                <td class="col-status">
                  {#if transaction.isDuplicate}
                    <div
                      class="status-badge"
                      class:duplicate={!transaction.selected}
                      class:duplicate-selected={transaction.selected}
                    >
                      <span class="status-dot"></span>
                      <span class="status-text">
                        {transaction.selected
                          ? 'Duplicado (se importara)'
                          : $t('import.preview.status.duplicate')}
                      </span>
                    </div>
                    {#if transaction.duplicateReason}
                      <div class="status-reason" title={transaction.duplicateReason}>
                        {transaction.duplicateReason}
                      </div>
                    {/if}
                  {:else if transaction.selected}
                    <div class="status-badge ready">
                      <span class="status-dot"></span>
                      <span class="status-text">{$t('import.preview.status.ready')}</span>
                    </div>
                  {:else}
                    <div class="status-badge skipped">
                      <span class="status-dot"></span>
                      <span class="status-text">{$t('import.preview.status.skipped')}</span>
                    </div>
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
        <button class="show-all-btn" onclick={() => (showAllTransactions = true)}>
          {$t('import.preview.pagination.show_all')}
        </button>
      </div>
    {/if}
  </div>
</div>

<style>
  .preview-step {
    padding: 1.5rem;
  }

  /* Search Container */
  .search-container {
    margin-bottom: 1rem;
  }

  .search-wrapper {
    position: relative;
    max-width: 400px;
  }

  .search-icon {
    position: absolute;
    left: 0.75rem;
    top: 50%;
    transform: translateY(-50%);
    color: var(--text-muted);
    pointer-events: none;
  }

  .search-input {
    width: 100%;
    padding: 0.75rem 0.75rem 0.75rem 2.75rem;
    border: 1px solid var(--border-color);
    border-radius: 0.5rem;
    background: var(--surface);
    color: var(--text-primary);
    font-size: 0.875rem;
    transition: all 0.2s ease;
  }

  .search-input:focus {
    outline: none;
    border-color: var(--acapulco);
    box-shadow: 0 0 0 2px rgba(122, 186, 165, 0.1);
  }

  .search-input::placeholder {
    color: var(--text-muted);
  }

  /* View Filters */
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

  .filter-tabs {
    display: flex;
    gap: 0.25rem;
    background: var(--surface-muted);
    border-radius: 0.5rem;
    padding: 0.25rem;
  }

  .filter-tab {
    padding: 0.5rem 1rem;
    background: transparent;
    border: none;
    border-radius: 0.375rem;
    color: var(--text-secondary);
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    white-space: nowrap;
  }

  .filter-tab:hover:not(:disabled) {
    color: var(--text-primary);
    background: rgba(122, 186, 165, 0.1);
  }

  .filter-tab.active {
    color: var(--acapulco);
    background: var(--surface);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }

  .filter-tab:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .selected-badge {
    display: inline-block;
    margin-left: 0.5rem;
    padding: 0.125rem 0.375rem;
    background: var(--acapulco);
    color: var(--text-inverse);
    border-radius: 0.25rem;
    font-size: 0.75rem;
    font-weight: 600;
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

  /* Table Container */
  .table-container {
    background: var(--surface);
    border-radius: 0.75rem;
    overflow: hidden;
    border: 1px solid var(--border-color);
  }

  .table-wrapper {
    overflow-x: auto;
    overflow-y: visible;
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

  /* Column widths */
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

  /* Table rows */
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

  /* Custom Checkbox */
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

  /* Cell content */
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

  /* Amount styling */
  .amount-wrapper {
    display: flex;
    align-items: baseline;
    justify-content: flex-end;
    gap: 0.125rem;
    font-family: 'JetBrains Mono', 'Courier New', monospace;
    font-weight: 600;
  }

  .amount-wrapper.positive {
    color: var(--acapulco);
  }

  .amount-wrapper.negative {
    color: #f5796c;
  }

  .amount-sign {
    font-size: 0.6875rem;
  }

  .amount-value {
    font-size: 0.8125rem;
  }

  .amount-currency {
    font-size: 0.6875rem;
    opacity: 0.8;
  }

  /* Empty state */
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

  /* Status badges */
  .status-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    padding: 0.125rem 0.5rem;
    border-radius: 0.75rem;
    font-size: 0.6875rem;
    font-weight: 500;
  }

  .status-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .status-badge.ready {
    background: rgba(122, 186, 165, 0.1);
    color: var(--acapulco);
  }

  .status-badge.ready .status-dot {
    background: var(--acapulco);
  }

  .status-badge.duplicate {
    background: rgba(254, 205, 44, 0.1);
    color: #d4a000;
  }

  .status-badge.duplicate .status-dot {
    background: #fecd2c;
  }

  .status-badge.duplicate-selected {
    background: rgba(141, 195, 81, 0.2);
    color: #8dc351;
    border: 1px solid rgba(141, 195, 81, 0.3);
  }

  .status-badge.duplicate-selected .status-dot {
    background: #8dc351;
  }

  .status-badge.skipped {
    background: var(--surface-muted);
    color: var(--text-muted);
  }

  .status-badge.skipped .status-dot {
    background: var(--text-muted);
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

  /* Pagination */
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
    transition: background-color 0.2s ease;
  }

  .show-all-btn:hover {
    background: rgba(122, 186, 165, 0.1);
  }

  /* Responsive */
  @media (max-width: 768px) {
    .preview-step {
      padding: 1rem;
    }

    .search-wrapper {
      max-width: 100%;
    }

    .filter-tabs {
      flex-wrap: wrap;
      gap: 0.125rem;
    }

    .filter-tab {
      padding: 0.375rem 0.75rem;
      font-size: 0.75rem;
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

    .status-text {
      display: none;
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
