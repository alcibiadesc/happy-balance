<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { browser } from '$app/environment';
  import { ChevronLeft, Sparkles } from 'lucide-svelte';
  import { swipeable } from '$lib/actions/swipeable';
  import { t } from '$lib/stores/i18n';
  import { apiCategories } from '$lib/stores/api-transactions';

  import { createTinderPageStore } from '$lib/modules/transactions/infrastructure/stores/tinderPageStore.svelte';
  import TinderTransactionCard from '$lib/components/molecules/TinderTransactionCard.svelte';
  import TinderActions from '$lib/components/molecules/TinderActions.svelte';
  import TinderProgress from '$lib/components/molecules/TinderProgress.svelte';
  import TinderCategoryPicker from '$lib/components/molecules/TinderCategoryPicker.svelte';
  import TinderCompletionScreen from '$lib/components/molecules/TinderCompletionScreen.svelte';

  const store = createTinderPageStore();

  let dragX = $state(0);
  let isDragging = $state(false);

  // Determine current transaction type for category filtering
  const currentTxType = $derived.by(() => {
    const current = store.currentSuggestion;
    if (!current) return 'EXPENSE';
    const tx = current.transaction;
    if (tx.type) return tx.type;
    return tx.amount > 0 ? 'INCOME' : 'EXPENSE';
  });

  function handleSwipeRight() {
    dragX = 0;
    isDragging = false;
    store.accept();
  }

  function handleSwipeLeft() {
    dragX = 0;
    isDragging = false;
    store.openCategoryPicker();
  }

  function handleMove(delta: number) {
    dragX = delta;
    isDragging = true;
  }

  function handleEnd() {
    dragX = 0;
    isDragging = false;
  }

  function handleAccept() {
    store.accept();
  }

  function handleReject() {
    store.openCategoryPicker();
  }

  function handleSkip() {
    store.skip();
  }

  function handleUndo() {
    store.undo();
  }

  function handleCategorySelect(categoryId: string) {
    store.reject(categoryId);
  }

  function handleCategoryCancel() {
    store.closeCategoryPicker();
  }

  function handleBack() {
    goto('/transactions');
  }

  onMount(async () => {
    if (browser) {
      await apiCategories.load();
      store.setCategories($apiCategories);
      await store.loadSuggestions();
    }
  });

  // Keep categories in sync
  $effect(() => {
    store.setCategories($apiCategories);
  });
</script>

<div class="tinder-page">
  <!-- Header -->
  <header class="tinder-header">
    <button class="back-btn" onclick={handleBack} aria-label={$t('common.back')}>
      <ChevronLeft size={20} />
      <span class="back-text">{$t('common.back')}</span>
    </button>
    <div class="header-center">
      <Sparkles size={16} />
      <span class="header-title">{$t('tinder.title')}</span>
    </div>
    <div class="header-spacer"></div>
  </header>

  <!-- Main content -->
  <main class="tinder-content">
    {#if store.isLoading}
      <div class="loading-state">
        <div class="spinner"></div>
        <p>{$t('common.loading')}</p>
      </div>
    {:else if store.error}
      <div class="error-state">
        <p>{store.error}</p>
        <button class="retry-btn" onclick={() => store.loadSuggestions()}>
          {$t('tinder.retry')}
        </button>
      </div>
    {:else if store.isComplete}
      <TinderCompletionScreen
        acceptedCount={store.acceptedCount}
        rejectedCount={store.rejectedCount}
        skippedCount={store.skippedCount}
        onBack={handleBack}
      />
    {:else if store.currentSuggestion}
      <!-- Progress -->
      <div class="progress-section">
        <TinderProgress
          current={store.currentIndex}
          total={store.total}
          progress={store.progress}
        />
      </div>

      <!-- Card area -->
      <div class="card-area">
        <div
          class="card-wrapper"
          use:swipeable={{
            onSwipeLeft: handleSwipeLeft,
            onSwipeRight: handleSwipeRight,
            onMove: handleMove,
            onEnd: handleEnd,
            threshold: 100,
            enabled: !store.showCategoryPicker,
          }}
        >
          <TinderTransactionCard suggestion={store.currentSuggestion} {dragX} {isDragging} />
        </div>
      </div>

      <!-- Actions -->
      <TinderActions
        hasSuggestion={store.currentSuggestion.suggestion !== null}
        disabled={store.showCategoryPicker}
        canUndo={store.canUndo}
        onAccept={handleAccept}
        onReject={handleReject}
        onSkip={handleSkip}
        onUndo={handleUndo}
      />
    {:else}
      <div class="empty-state">
        <span class="empty-icon">&#127881;</span>
        <h2>{$t('tinder.no_uncategorized')}</h2>
        <p>{$t('tinder.all_done')}</p>
        <button class="back-nav-btn" onclick={handleBack}>
          {$t('tinder.back_to_transactions')}
        </button>
      </div>
    {/if}
  </main>
</div>

<!-- Category picker bottom sheet -->
<TinderCategoryPicker
  isOpen={store.showCategoryPicker}
  categories={$apiCategories}
  transactionType={currentTxType}
  onSelect={handleCategorySelect}
  onCancel={handleCategoryCancel}
/>

<style>
  .tinder-page {
    min-height: 100vh;
    min-height: 100dvh;
    background: var(--surface);
    display: flex;
    flex-direction: column;
  }

  /* Header */
  .tinder-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--space-md, 0.75rem) var(--space-lg, 1rem);
    background: var(--surface-elevated);
    border-bottom: 1px solid var(--border-color);
    flex-shrink: 0;
    position: sticky;
    top: 0;
    z-index: 100;
  }

  .back-btn {
    display: flex;
    align-items: center;
    gap: var(--space-xs, 0.25rem);
    padding: var(--space-xs, 0.25rem) var(--space-sm, 0.5rem);
    background: none;
    border: none;
    color: var(--primary, #023c46);
    cursor: pointer;
    font-size: 0.875rem;
    font-weight: 500;
    border-radius: var(--radius-sm, 0.25rem);
    transition: background 0.15s;
    min-width: 70px;
  }

  .back-btn:hover {
    background: var(--surface-muted);
  }

  .header-center {
    display: flex;
    align-items: center;
    gap: var(--space-xs, 0.25rem);
    color: var(--primary, #023c46);
  }

  .header-title {
    font-size: 1rem;
    font-weight: 600;
  }

  .header-spacer {
    min-width: 70px;
  }

  /* Content */
  .tinder-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: var(--space-lg, 1rem);
    max-width: 500px;
    width: 100%;
    margin: 0 auto;
  }

  .progress-section {
    width: 100%;
    margin-bottom: var(--space-lg, 1rem);
  }

  .card-area {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    min-height: 0;
  }

  .card-wrapper {
    width: 100%;
    display: flex;
    justify-content: center;
  }

  /* Loading */
  .loading-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-md, 0.75rem);
    color: var(--text-secondary);
  }

  .spinner {
    width: 40px;
    height: 40px;
    border: 3px solid var(--surface-muted);
    border-top-color: var(--primary, #023c46);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  /* Error */
  .error-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-md, 0.75rem);
    color: var(--froly, #f5796c);
    text-align: center;
  }

  .retry-btn {
    padding: var(--space-sm, 0.5rem) var(--space-lg, 1rem);
    background: var(--primary, #023c46);
    color: white;
    border: none;
    border-radius: var(--radius-md, 0.5rem);
    font-weight: 600;
    cursor: pointer;
    transition: opacity 0.2s;
  }

  .retry-btn:hover {
    opacity: 0.9;
  }

  /* Empty state */
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-md, 0.75rem);
    text-align: center;
  }

  .empty-icon {
    font-size: 3rem;
  }

  .empty-state h2 {
    font-size: 1.25rem;
    font-weight: 700;
    color: var(--text-primary);
    margin: 0;
  }

  .empty-state p {
    font-size: 0.9375rem;
    color: var(--text-secondary);
    margin: 0;
  }

  .back-nav-btn {
    margin-top: var(--space-md, 0.75rem);
    padding: var(--space-sm, 0.5rem) var(--space-lg, 1rem);
    background: var(--primary, #023c46);
    color: white;
    border: none;
    border-radius: var(--radius-md, 0.5rem);
    font-weight: 600;
    cursor: pointer;
    transition: opacity 0.2s;
  }

  .back-nav-btn:hover {
    opacity: 0.9;
  }

  @media (max-width: 480px) {
    .back-text {
      display: none;
    }

    .tinder-content {
      padding: var(--space-md, 0.75rem);
    }
  }
</style>
