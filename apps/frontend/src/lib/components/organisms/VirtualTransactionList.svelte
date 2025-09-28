<script lang="ts">
  import { onMount, tick } from 'svelte';
  import { browser } from '$app/environment';
  import type { Transaction, Category } from '$lib/types/transaction';
  import { paginatedTransactions, type PaginatedQuery } from '$lib/stores/paginated-transactions';
  import { apiCategories } from '$lib/stores/api-transactions';
  import { ChevronDown, TrendingUp, TrendingDown, Eye, EyeOff, Trash2, Tag, MoreVertical } from 'lucide-svelte';
  import { t } from '$lib/stores/i18n';

  // Props
  interface Props {
    query?: Partial<PaginatedQuery>;
    onTransactionSelect?: (transaction: Transaction) => void;
    onTransactionEdit?: (transaction: Transaction) => void;
    onTransactionDelete?: (transactionId: string) => void;
    onTransactionToggleHidden?: (transaction: Transaction) => void;
    onCategoryAssign?: (transaction: Transaction) => void;
    isSelectionMode?: boolean;
    selectedTransactions?: Set<string>;
    showHiddenTransactions?: boolean;
  }

  let {
    query = {},
    onTransactionSelect = undefined,
    onTransactionEdit = undefined,
    onTransactionDelete = undefined,
    onTransactionToggleHidden = undefined,
    onCategoryAssign = undefined,
    isSelectionMode = false,
    selectedTransactions = new Set(),
    showHiddenTransactions = true
  }: Props = $props();

  // Internal state
  let listContainer: HTMLElement;
  let isLoadingMore = $state(false);
  let hasInitialized = $state(false);

  // Virtual scrolling config
  const ITEM_HEIGHT = 80; // Approximate height of each transaction card
  const BUFFER_SIZE = 5; // Number of items to render outside visible area
  const LOAD_THRESHOLD = 300; // Distance from bottom to trigger next page load

  // Reactive data from store
  let transactions = $derived($paginatedTransactions.transactions);
  let totalCount = $derived($paginatedTransactions.totalCount);
  let isLoading = $derived($paginatedTransactions.isLoading);
  let hasMore = $derived($paginatedTransactions.hasMore);
  let error = $derived($paginatedTransactions.error);

  // Categories for lookup
  let categories = $derived($apiCategories);

  // Filter transactions based on showHiddenTransactions preference
  let filteredTransactions = $derived(() => {
    if (showHiddenTransactions) {
      return transactions;
    }
    return transactions.filter(t => !t.hidden);
  });

  // Virtual scrolling calculations
  let scrollTop = $state(0);
  let containerHeight = $state(600);
  let visibleStart = $derived(Math.floor(scrollTop / ITEM_HEIGHT) - BUFFER_SIZE);
  let visibleEnd = $derived(visibleStart + Math.ceil(containerHeight / ITEM_HEIGHT) + BUFFER_SIZE * 2);
  let visibleTransactions = $derived(() => {
    const start = Math.max(0, visibleStart);
    const end = Math.min(filteredTransactions.length, visibleEnd);
    return filteredTransactions.slice(start, end);
  });

  // Initialize and load first page
  onMount(async () => {
    if (!browser) return;

    try {
      await loadFirstPage();
      hasInitialized = true;
    } catch (error) {
      console.error('Failed to initialize transaction list:', error);
    }
  });

  // Load first page
  async function loadFirstPage() {
    try {
      await paginatedTransactions.loadFirstPage(query);
    } catch (error) {
      console.error('Failed to load first page:', error);
    }
  }

  // Load next page when scrolling
  async function loadNextPage() {
    if (isLoadingMore || !hasMore || isLoading) {
      return;
    }

    isLoadingMore = true;
    try {
      await paginatedTransactions.loadNextPage(query);
    } catch (error) {
      console.error('Failed to load next page:', error);
    } finally {
      isLoadingMore = false;
    }
  }

  // Handle scroll events
  function handleScroll(event: Event) {
    const element = event.target as HTMLElement;
    scrollTop = element.scrollTop;

    // Check if we need to load more data
    const scrollBottom = element.scrollHeight - element.scrollTop - element.clientHeight;
    if (scrollBottom < LOAD_THRESHOLD && hasMore && !isLoading && !isLoadingMore) {
      loadNextPage();
    }
  }

  // Handle container resize
  function handleResize() {
    if (listContainer) {
      containerHeight = listContainer.clientHeight;
    }
  }

  // Helper functions
  function getCategoryById(categoryId: string | undefined): Category | undefined {
    if (!categoryId) return undefined;
    return categories.find(c => c.id === categoryId);
  }

  function formatAmount(amount: number): string {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
    }).format(Math.abs(amount));
  }

  function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
    });
  }

  // Handle transaction selection
  function handleTransactionClick(transaction: Transaction) {
    if (isSelectionMode) {
      onTransactionSelect?.(transaction);
    }
  }

  // Handle transaction actions
  function handleEdit(transaction: Transaction) {
    onTransactionEdit?.(transaction);
  }

  function handleDelete(transaction: Transaction) {
    onTransactionDelete?.(transaction.id);
  }

  function handleToggleHidden(transaction: Transaction) {
    onTransactionToggleHidden?.(transaction);
  }

  function handleCategoryAssign(transaction: Transaction) {
    onCategoryAssign?.(transaction);
  }

  // Refresh data when query changes
  $effect(() => {
    if (hasInitialized && browser) {
      paginatedTransactions.reset();
      loadFirstPage();
    }
  });

  // Update container height on mount
  $effect(() => {
    if (browser && listContainer) {
      handleResize();
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  });
</script>

<div class="virtual-list-container" bind:this={listContainer}>
  {#if error}
    <div class="error-state">
      <p class="error-message">{error}</p>
      <button class="retry-btn" onclick={() => loadFirstPage()}>
        {$t('transactions.retry')}
      </button>
    </div>
  {:else if !hasInitialized && isLoading}
    <div class="loading-state">
      <div class="spinner"></div>
      <p>{$t('transactions.loading')}</p>
    </div>
  {:else if filteredTransactions.length === 0}
    <div class="empty-state">
      <p>{$t('transactions.noResults')}</p>
    </div>
  {:else}
    <div
      class="virtual-scroll-container"
      onscroll={handleScroll}
    >
      <!-- Virtual spacer for items above visible area -->
      <div style="height: {Math.max(0, visibleStart) * ITEM_HEIGHT}px;"></div>

      <!-- Visible transactions -->
      <div class="transactions-list">
        {#each visibleTransactions as transaction, index (transaction.id)}
          {@const category = getCategoryById(transaction.categoryId)}
          {@const actualIndex = Math.max(0, visibleStart) + index}
          <div
            class="transaction-card"
            class:selected={selectedTransactions.has(transaction.id)}
            class:hidden={transaction.hidden}
            onclick={() => handleTransactionClick(transaction)}
          >
            {#if isSelectionMode}
              <div class="selection-checkbox">
                <input
                  type="checkbox"
                  checked={selectedTransactions.has(transaction.id)}
                  onchange={() => handleTransactionClick(transaction)}
                />
              </div>
            {/if}

            <div class="transaction-main">
              <div class="transaction-info">
                <div class="transaction-header">
                  <span class="merchant">{transaction.merchant}</span>
                  <span class="date">{formatDate(transaction.date)}</span>
                </div>

                {#if transaction.description}
                  <div class="description">{transaction.description}</div>
                {/if}

                <div class="category-info">
                  {#if category}
                    <span class="category-badge" style="background-color: {category.color}20; color: {category.color};">
                      {category.icon} {category.name}
                    </span>
                  {:else}
                    <button
                      class="assign-category-btn"
                      onclick={(e) => { e.stopPropagation(); handleCategoryAssign(transaction); }}
                    >
                      <Tag size={14} />
                      {$t('transactions.assignCategory')}
                    </button>
                  {/if}
                </div>
              </div>

              <div class="transaction-amount">
                <span class="amount" class:positive={transaction.amount > 0} class:negative={transaction.amount < 0}>
                  {transaction.amount > 0 ? '+' : ''}{formatAmount(transaction.amount)}
                </span>

                {#if transaction.amount > 0}
                  <TrendingUp class="amount-icon positive" size={16} />
                {:else}
                  <TrendingDown class="amount-icon negative" size={16} />
                {/if}
              </div>

              {#if !isSelectionMode}
                <div class="transaction-actions">
                  <button
                    class="action-btn"
                    onclick={(e) => { e.stopPropagation(); handleToggleHidden(transaction); }}
                    title={transaction.hidden ? $t('transactions.show') : $t('transactions.hide')}
                  >
                    {#if transaction.hidden}
                      <Eye size={16} />
                    {:else}
                      <EyeOff size={16} />
                    {/if}
                  </button>

                  <button
                    class="action-btn"
                    onclick={(e) => { e.stopPropagation(); handleEdit(transaction); }}
                    title={$t('transactions.edit')}
                  >
                    <MoreVertical size={16} />
                  </button>

                  <button
                    class="action-btn delete"
                    onclick={(e) => { e.stopPropagation(); handleDelete(transaction); }}
                    title={$t('transactions.delete')}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              {/if}
            </div>
          </div>
        {/each}
      </div>

      <!-- Virtual spacer for items below visible area -->
      <div style="height: {Math.max(0, filteredTransactions.length - visibleEnd) * ITEM_HEIGHT}px;"></div>

      <!-- Loading indicator for infinite scroll -->
      {#if isLoadingMore}
        <div class="loading-more">
          <div class="spinner small"></div>
          <span>{$t('transactions.loadingMore')}</span>
        </div>
      {/if}

      <!-- End of data indicator -->
      {#if !hasMore && filteredTransactions.length > 0}
        <div class="end-indicator">
          <span>{$t('transactions.noMoreData')} ({totalCount} {$t('transactions.total')})</span>
        </div>
      {/if}
    </div>
  {/if}
</div>

<style>
  .virtual-list-container {
    height: 100%;
    width: 100%;
    position: relative;
  }

  .virtual-scroll-container {
    height: 100%;
    overflow-y: auto;
    overflow-x: hidden;
  }

  .transactions-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    padding: 1rem;
  }

  .transaction-card {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem;
    background: rgba(249, 250, 251, 0.5);
    border: 1px solid var(--gray-200);
    border-radius: 0.75rem;
    transition: all 0.2s ease;
    cursor: pointer;
    min-height: 70px;
  }

  .transaction-card:hover {
    background: white;
    border-color: rgba(122, 186, 165, 0.2);
    transform: translateX(4px);
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  }

  .transaction-card.selected {
    background: rgba(122, 186, 165, 0.1);
    border-color: var(--acapulco);
  }

  .transaction-card.hidden {
    opacity: 0.6;
    background: repeating-linear-gradient(
      45deg,
      var(--surface-elevated),
      var(--surface-elevated) 10px,
      var(--gray-50) 10px,
      var(--gray-50) 20px
    );
  }

  .selection-checkbox {
    display: flex;
    align-items: center;
  }

  .transaction-main {
    display: flex;
    align-items: center;
    gap: 1rem;
    flex: 1;
  }

  .transaction-info {
    flex: 1;
    min-width: 0;
  }

  .transaction-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.25rem;
  }

  .merchant {
    font-weight: 500;
    color: var(--text-primary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .date {
    font-size: 0.8125rem;
    color: var(--text-muted);
    white-space: nowrap;
  }

  .description {
    font-size: 0.8125rem;
    color: var(--text-secondary);
    margin-bottom: 0.25rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .category-info {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .category-badge {
    font-size: 0.75rem;
    padding: 0.125rem 0.5rem;
    border-radius: 0.375rem;
    font-weight: 500;
    white-space: nowrap;
  }

  .assign-category-btn {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    font-size: 0.75rem;
    color: var(--text-muted);
    background: none;
    border: 1px dashed var(--gray-300);
    border-radius: 0.375rem;
    padding: 0.125rem 0.5rem;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .assign-category-btn:hover {
    color: var(--acapulco);
    border-color: var(--acapulco);
    background: rgba(122, 186, 165, 0.05);
  }

  .transaction-amount {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-right: 1rem;
  }

  .amount {
    font-weight: 600;
    font-size: 1rem;
    white-space: nowrap;
  }

  .amount.positive {
    color: var(--acapulco);
  }

  .amount.negative {
    color: var(--froly);
  }

  .amount-icon.positive {
    color: var(--acapulco);
  }

  .amount-icon.negative {
    color: var(--froly);
  }

  .transaction-actions {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    opacity: 0;
    transition: opacity 0.2s ease;
  }

  .transaction-card:hover .transaction-actions {
    opacity: 1;
  }

  .action-btn {
    width: 2rem;
    height: 2rem;
    border-radius: 0.375rem;
    border: none;
    background: var(--gray-100);
    color: var(--text-muted);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
  }

  .action-btn:hover {
    background: var(--gray-200);
    color: var(--text-primary);
  }

  .action-btn.delete:hover {
    background: rgba(239, 68, 68, 0.1);
    color: #ef4444;
  }

  .loading-state,
  .error-state,
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 200px;
    text-align: center;
    color: var(--text-muted);
  }

  .spinner {
    width: 2rem;
    height: 2rem;
    border: 2px solid var(--gray-200);
    border-top: 2px solid var(--acapulco);
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 1rem;
  }

  .spinner.small {
    width: 1rem;
    height: 1rem;
    border-width: 1px;
    margin: 0 0.5rem 0 0;
  }

  .loading-more {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1rem;
    color: var(--text-muted);
    font-size: 0.875rem;
  }

  .end-indicator {
    display: flex;
    justify-content: center;
    padding: 1rem;
    color: var(--text-muted);
    font-size: 0.8125rem;
    border-top: 1px solid var(--gray-200);
    margin-top: 1rem;
  }

  .retry-btn {
    margin-top: 1rem;
    padding: 0.5rem 1rem;
    background: var(--acapulco);
    color: white;
    border: none;
    border-radius: 0.5rem;
    cursor: pointer;
    transition: background 0.2s ease;
  }

  .retry-btn:hover {
    background: var(--acapulco-dark, #5a9d7a);
  }

  .error-message {
    color: var(--froly);
    margin-bottom: 0.5rem;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  /* Mobile responsive adjustments */
  @media (max-width: 768px) {
    .transactions-list {
      padding: 0.5rem;
      gap: 0.375rem;
    }

    .transaction-card {
      padding: 0.75rem;
      min-height: 60px;
    }

    .transaction-main {
      gap: 0.75rem;
    }

    .transaction-amount {
      margin-right: 0.5rem;
    }

    .amount {
      font-size: 0.875rem;
    }

    .merchant {
      font-size: 0.875rem;
    }

    .transaction-actions {
      gap: 0.25rem;
    }

    .action-btn {
      width: 1.75rem;
      height: 1.75rem;
    }
  }
</style>