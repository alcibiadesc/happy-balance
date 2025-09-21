<script lang="ts">
  import { onMount, onDestroy, createEventDispatcher } from 'svelte';
  import type { Transaction } from '$lib/types/transaction';

  // Props
  export let transactions: Transaction[] = [];
  export let itemHeight: number = 80; // Height of each transaction item in pixels
  export let containerHeight: number = 600; // Height of the scrollable container
  export let overscan: number = 5; // Extra items to render outside viewport for smooth scrolling
  export let loadMoreThreshold: number = 200; // Pixels from bottom to trigger load more

  // Event dispatcher
  const dispatch = createEventDispatcher<{
    loadMore: void;
    itemClick: { transaction: Transaction; index: number };
    itemSelect: { transaction: Transaction; selected: boolean };
  }>();

  // State
  let container: HTMLDivElement;
  let scrollTop = 0;
  let isLoadingMore = false;

  // Calculated values
  $: totalHeight = transactions.length * itemHeight;
  $: visibleCount = Math.ceil(containerHeight / itemHeight);
  $: startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  $: endIndex = Math.min(
    transactions.length - 1,
    startIndex + visibleCount + overscan * 2
  );
  $: visibleTransactions = transactions.slice(startIndex, endIndex + 1);
  $: offsetY = startIndex * itemHeight;

  // Scroll handler with throttling
  let scrollTimeout: number;
  function handleScroll() {
    if (scrollTimeout) clearTimeout(scrollTimeout);

    scrollTimeout = setTimeout(() => {
      if (!container) return;

      scrollTop = container.scrollTop;

      // Check if we need to load more data
      const scrollBottom = scrollTop + containerHeight;
      const shouldLoadMore = totalHeight - scrollBottom < loadMoreThreshold;

      if (shouldLoadMore && !isLoadingMore && transactions.length > 0) {
        isLoadingMore = true;
        dispatch('loadMore');

        // Reset loading flag after a delay
        setTimeout(() => {
          isLoadingMore = false;
        }, 1000);
      }
    }, 16); // ~60fps throttling
  }

  // Keyboard navigation
  function handleKeyDown(event: KeyboardEvent) {
    if (!container) return;

    const currentIndex = Math.floor(scrollTop / itemHeight);
    let newIndex = currentIndex;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        newIndex = Math.min(transactions.length - 1, currentIndex + 1);
        break;
      case 'ArrowUp':
        event.preventDefault();
        newIndex = Math.max(0, currentIndex - 1);
        break;
      case 'PageDown':
        event.preventDefault();
        newIndex = Math.min(transactions.length - 1, currentIndex + visibleCount);
        break;
      case 'PageUp':
        event.preventDefault();
        newIndex = Math.max(0, currentIndex - visibleCount);
        break;
      case 'Home':
        event.preventDefault();
        newIndex = 0;
        break;
      case 'End':
        event.preventDefault();
        newIndex = transactions.length - 1;
        break;
      default:
        return;
    }

    if (newIndex !== currentIndex) {
      scrollToIndex(newIndex);
    }
  }

  // Scroll to specific index
  export function scrollToIndex(index: number) {
    if (!container) return;

    const targetScrollTop = Math.max(0, Math.min(
      index * itemHeight,
      totalHeight - containerHeight
    ));

    container.scrollTo({
      top: targetScrollTop,
      behavior: 'smooth'
    });
  }

  // Scroll to top
  export function scrollToTop() {
    scrollToIndex(0);
  }

  // Handle item interactions
  function handleItemClick(transaction: Transaction, index: number) {
    dispatch('itemClick', { transaction, index: startIndex + index });
  }

  function handleItemSelect(transaction: Transaction, selected: boolean) {
    dispatch('itemSelect', { transaction, selected });
  }

  onMount(() => {
    if (container) {
      container.addEventListener('scroll', handleScroll, { passive: true });
    }
  });

  onDestroy(() => {
    if (container) {
      container.removeEventListener('scroll', handleScroll);
    }
    if (scrollTimeout) {
      clearTimeout(scrollTimeout);
    }
  });
</script>

<svelte:window on:keydown={handleKeyDown} />

<div
  bind:this={container}
  class="virtual-list"
  style="height: {containerHeight}px; overflow-y: auto; position: relative;"
  tabindex="0"
  role="grid"
  aria-label="Transactions list"
>
  <!-- Total height spacer -->
  <div style="height: {totalHeight}px; pointer-events: none;"></div>

  <!-- Visible items container -->
  <div
    class="visible-items"
    style="position: absolute; top: {offsetY}px; left: 0; right: 0;"
  >
    {#each visibleTransactions as transaction, index (transaction.id)}
      <div
        class="transaction-item"
        style="height: {itemHeight}px;"
        role="gridcell"
        tabindex="-1"
      >
        <slot
          {transaction}
          index={startIndex + index}
          onItemClick={() => handleItemClick(transaction, index)}
          onItemSelect={(selected) => handleItemSelect(transaction, selected)}
        >
          <!-- Default item template -->
          <div class="default-transaction-item">
            <div class="transaction-info">
              <div class="merchant">{transaction.merchant}</div>
              <div class="date">{new Date(transaction.date).toLocaleDateString()}</div>
            </div>
            <div class="amount" class:negative={transaction.amount < 0}>
              {transaction.amount > 0 ? '+' : ''}{transaction.amount.toFixed(2)} €
            </div>
          </div>
        </slot>
      </div>
    {/each}
  </div>

  <!-- Loading indicator -->
  {#if isLoadingMore}
    <div class="loading-indicator">
      <div class="loading-spinner"></div>
      <span>Loading more transactions...</span>
    </div>
  {/if}

  <!-- Empty state -->
  {#if transactions.length === 0}
    <div class="empty-state">
      <slot name="empty">
        <div class="empty-message">
          <p>No transactions found</p>
        </div>
      </slot>
    </div>
  {/if}
</div>

<style>
  .virtual-list {
    border: 1px solid var(--border-color, #e2e8f0);
    border-radius: 8px;
    background: var(--bg-color, white);
  }

  .virtual-list:focus {
    outline: 2px solid var(--focus-color, #3b82f6);
    outline-offset: -2px;
  }

  .transaction-item {
    border-bottom: 1px solid var(--border-color, #e2e8f0);
    display: flex;
    align-items: center;
    padding: 0 16px;
    background: var(--item-bg, white);
    transition: background-color 0.15s ease;
  }

  .transaction-item:hover {
    background: var(--item-hover-bg, #f8fafc);
  }

  .transaction-item:last-child {
    border-bottom: none;
  }

  .default-transaction-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
  }

  .transaction-info {
    flex: 1;
  }

  .merchant {
    font-weight: 500;
    color: var(--text-primary, #1f2937);
    font-size: 14px;
  }

  .date {
    font-size: 12px;
    color: var(--text-secondary, #6b7280);
    margin-top: 2px;
  }

  .amount {
    font-weight: 600;
    font-size: 14px;
    color: var(--income-color, #10b981);
  }

  .amount.negative {
    color: var(--expense-color, #ef4444);
  }

  .loading-indicator {
    position: absolute;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 16px;
    background: var(--loading-bg, rgba(255, 255, 255, 0.9));
    border-radius: 6px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    font-size: 14px;
    color: var(--text-secondary, #6b7280);
  }

  .loading-spinner {
    width: 16px;
    height: 16px;
    border: 2px solid var(--spinner-track, #e2e8f0);
    border-top: 2px solid var(--spinner-color, #3b82f6);
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  .empty-state {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    min-height: 200px;
  }

  .empty-message {
    text-align: center;
    color: var(--text-secondary, #6b7280);
  }

  .empty-message p {
    margin: 0;
    font-size: 16px;
  }

  /* Responsive design */
  @media (max-width: 640px) {
    .transaction-item {
      padding: 0 12px;
    }

    .merchant {
      font-size: 13px;
    }

    .amount {
      font-size: 13px;
    }
  }
</style>