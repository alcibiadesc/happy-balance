<script lang="ts">
  import { onMount } from 'svelte';
  import { afterNavigate } from '$app/navigation';
  import { Plus, Wallet, RefreshCw, ArrowRight, Zap, Clock } from 'lucide-svelte';

  // Components
  import PageContainer from '$lib/components/atoms/PageContainer.svelte';
  import PortfolioHeader from '$lib/components/organisms/PortfolioHeader.svelte';
  import PortfolioChartsSection from '$lib/components/organisms/PortfolioChartsSection.svelte';
  import InvestmentRow from '$lib/components/molecules/InvestmentRow.svelte';
  import InvestmentDetailsView from '$lib/components/organisms/InvestmentDetailsView.svelte';
  import NewInvestmentForm from '$lib/components/organisms/NewInvestmentForm.svelte';
  import IconPicker from '$lib/components/molecules/IconPicker.svelte';
  import AddHistoryModal from '$lib/components/organisms/AddHistoryModal.svelte';
  import ConfirmModal from '$lib/components/organisms/ConfirmModal.svelte';

  // Store
  import { createInvestmentsStore } from '$lib/modules/investments/presentation/stores/investmentsStore.svelte';

  const store = createInvestmentsStore();

  // Derived reactive state for modals (fixes Svelte 5 getter reactivity)
  const showAddHistoryModal = $derived(store.showAddHistoryModal);
  const showDeleteModal = $derived(store.showDeleteModal);

  // Sync notification
  let syncNotification = $state<string | null>(null);

  // Refreshing indicator for afterNavigate
  let isRefreshing = $state(false);

  // Last sync timestamp
  let lastSyncTime = $state<Date | null>(null);

  function formatRelativeTime(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return 'hace un momento';
    if (diffMin < 60) return `hace ${diffMin} min`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `hace ${diffHours}h`;
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  }

  async function handleSync() {
    try {
      const result = await store.syncWithCategories();
      if (result) {
        lastSyncTime = new Date();
        syncNotification = result.message;
        setTimeout(() => {
          syncNotification = null;
        }, 5000);
      }
    } catch (_e) {
      syncNotification = 'Error al sincronizar';
      setTimeout(() => {
        syncNotification = null;
      }, 3000);
    }
  }

  // View state
  let viewMode = $state<'grid' | 'details'>('grid');
  let showIconPicker = $state(false);
  let activeForm = $state<'new' | 'edit' | null>(null);
  let pickerPosition = $state({ top: 0, left: 0 });

  // Time period filter
  type TimePeriod = '1M' | '3M' | '6M' | '1Y' | 'ALL';
  let selectedPeriod = $state<TimePeriod>('ALL');

  // Drag-and-drop state
  let draggedIndex = $state<number | null>(null);
  let dragOverIndex = $state<number | null>(null);

  function getDateFromMonthsAgo(months: number): string {
    const date = new Date();
    date.setMonth(date.getMonth() - months);
    return date.toISOString().split('T')[0];
  }

  async function handlePeriodChange(period: string) {
    selectedPeriod = period as TimePeriod;
    const periodMonths: Record<string, number | null> = {
      '1M': 1,
      '3M': 3,
      '6M': 6,
      '1Y': 12,
      ALL: null,
    };
    const months = periodMonths[period];
    if (months) {
      await store.loadTimeline('day', getDateFromMonthsAgo(months));
    } else {
      await store.loadTimeline('month');
    }
  }

  // Drag handlers
  function handleDragStart(e: DragEvent, index: number) {
    draggedIndex = index;
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', index.toString());
    }
  }

  function handleDragOver(e: DragEvent, index: number) {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== index) dragOverIndex = index;
  }

  function handleDragLeave() {
    dragOverIndex = null;
  }

  function handleDrop(e: DragEvent, toIndex: number) {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== toIndex) {
      store.reorderInvestments(draggedIndex, toIndex);
    }
    draggedIndex = null;
    dragOverIndex = null;
  }

  function handleDragEnd() {
    draggedIndex = null;
    dragOverIndex = null;
  }

  // Icon picker
  function handleIconClick(e: Event, formType: 'new' | 'edit') {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    pickerPosition = { top: rect.bottom + 8, left: Math.max(8, rect.left - 100) };
    activeForm = formType;
    showIconPicker = true;
  }

  function selectIcon(icon: string) {
    if (activeForm === 'new') store.newInvestmentForm.icon = icon;
    else if (activeForm === 'edit') store.editForm.icon = icon;
    showIconPicker = false;
    activeForm = null;
  }

  function handleViewDetails(investment: { id: string }) {
    store.loadInvestmentDetails(investment.id);
    viewMode = 'details';
  }

  function backToGrid() {
    viewMode = 'grid';
    store.selectedInvestment = null;
  }

  onMount(async () => {
    await store.loadAll();
    await store.loadTimeline('month');
  });

  afterNavigate(async () => {
    isRefreshing = true;
    await store.loadAll();
    isRefreshing = false;
  });
</script>

<svelte:head>
  <title>Portfolio - Happy Balance</title>
</svelte:head>

<PageContainer>
  <div class="portfolio-page">
    <!-- Refreshing indicator -->
    {#if isRefreshing}
      <div class="refresh-bar" role="status">
        <div class="refresh-bar-progress"></div>
      </div>
    {/if}

    {#if viewMode === 'grid'}
      <!-- Header -->
      <PortfolioHeader
        totalValue={store.totalPortfolioValue}
        totalProfit={store.totalProfit}
        profitPercentage={store.profitPercentage}
        formatCurrencyFn={store.formatCurrency}
        formatPercentageFn={store.formatPercentage}
      />

      <!-- Charts -->
      <PortfolioChartsSection
        portfolioSummary={store.portfolioSummary}
        timeline={store.timeline}
        investmentsCount={store.investments.length}
        {selectedPeriod}
        onPeriodChange={handlePeriodChange}
      />

      <!-- Sync CTA Banner -->
      <section class="sync-banner">
        <div class="sync-banner-content">
          <div class="sync-banner-icon">
            <Zap size={20} />
          </div>
          <div class="sync-banner-text">
            <strong>Sincronizar con transacciones</strong>
            <span>Conecta tus transacciones categorizadas como inversion con tu portfolio</span>
          </div>
        </div>
        <div class="sync-banner-actions">
          {#if lastSyncTime}
            <span class="last-sync-time">
              <Clock size={12} />
              {formatRelativeTime(lastSyncTime)}
            </span>
          {/if}
          <button class="sync-banner-btn" onclick={handleSync} disabled={store.isSyncing}>
            <RefreshCw size={16} class={store.isSyncing ? 'spinning' : ''} />
            {store.isSyncing ? 'Sincronizando...' : 'Sincronizar ahora'}
          </button>
        </div>
      </section>

      {#if syncNotification}
        <div class="sync-notification" role="status">
          <RefreshCw size={14} />
          <span>{syncNotification}</span>
          <button class="dismiss-btn" onclick={() => (syncNotification = null)}>x</button>
        </div>
      {/if}

      <!-- Investments -->
      <section class="investments-section">
        <div class="section-header">
          <h2><Wallet size={18} /> Inversiones</h2>
          <div class="header-actions">
            <button class="add-btn" onclick={() => store.startNewInvestment()}>
              <Plus size={16} /> Anadir
            </button>
          </div>
        </div>

        {#if store.showNewForm}
          <NewInvestmentForm
            bind:formData={store.newInvestmentForm}
            availableColors={store.availableColors}
            onIconClick={(e) => handleIconClick(e, 'new')}
            onSave={store.saveNewInvestment}
            onCancel={store.cancelNewInvestment}
          />
        {/if}

        {#if store.isLoading}
          <div class="loading">
            <div class="loading-spinner"></div>
            <span>Cargando inversiones...</span>
          </div>
        {:else if store.investments.length === 0 && !store.showNewForm}
          <div class="empty-state">
            <div class="empty-state-icon">
              <Wallet size={48} strokeWidth={1} />
            </div>
            <h3>Sin inversiones todavia</h3>
            <p>Hay dos formas de empezar:</p>
            <div class="empty-state-actions">
              <a href="/transactions" class="empty-action-card">
                <div class="action-icon categorize">
                  <Zap size={20} />
                </div>
                <div class="action-text">
                  <strong>Categoriza transacciones</strong>
                  <span>Marca transacciones como "inversion" y sincroniza</span>
                </div>
                <ArrowRight size={16} class="action-arrow" />
              </a>
              <a href="/transactions/tinder" class="empty-action-card">
                <div class="action-icon tinder">
                  <ArrowRight size={20} />
                </div>
                <div class="action-text">
                  <strong>Tinder de transacciones</strong>
                  <span>Categoriza rapidamente deslizando</span>
                </div>
                <ArrowRight size={16} class="action-arrow" />
              </a>
              <button class="empty-action-card" onclick={() => store.startNewInvestment()}>
                <div class="action-icon manual">
                  <Plus size={20} />
                </div>
                <div class="action-text">
                  <strong>Anadir manualmente</strong>
                  <span>Crea una inversion desde cero</span>
                </div>
                <ArrowRight size={16} class="action-arrow" />
              </button>
            </div>
          </div>
        {:else}
          <div class="investments-grid">
            {#each store.investments as investment, index (investment.id)}
              <InvestmentRow
                {investment}
                {index}
                isEditing={store.editingInvestment === investment.id}
                isDragging={draggedIndex === index}
                isDragOver={dragOverIndex === index}
                isInlineEditing={store.inlineEditingId === investment.id}
                bind:inlineEditValue={store.inlineEditValue}
                bind:editForm={store.editForm}
                formatCurrency={store.formatCurrency}
                formatPercentage={store.formatPercentage}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onDragEnd={handleDragEnd}
                onClick={() => handleViewDetails(investment)}
                onToggleHighlight={() => store.toggleHighlight(investment)}
                onAddHistory={() => store.startAddHistory(investment.id)}
                onStartEdit={() => store.startEdit(investment)}
                onDelete={() => store.prepareDelete(investment)}
                onStartInlineEdit={() => store.startInlineEdit(investment)}
                onSaveInlineEdit={() => store.saveInlineEdit()}
                onCancelInlineEdit={() => store.cancelInlineEdit()}
                onSaveEdit={() => store.saveEdit()}
                onCancelEdit={() => store.cancelEdit()}
                onIconClick={(e) => handleIconClick(e, 'edit')}
              />
            {/each}
          </div>
        {/if}
      </section>
    {:else if viewMode === 'details' && store.selectedInvestment}
      <InvestmentDetailsView
        investment={store.selectedInvestment}
        editingHistoryEntry={store.editingHistoryEntry}
        formatCurrency={store.formatCurrency}
        formatPercentage={store.formatPercentage}
        formatDate={store.formatDate}
        getHistoryTypeLabel={store.getHistoryTypeLabel}
        getHistoryTypeColor={store.getHistoryTypeColor}
        onBack={backToGrid}
        onAddHistory={() => store.startAddHistory(store.selectedInvestment?.id || '')}
        onStartEditHistoryEntry={(entry) =>
          store.startEditHistoryEntry(store.selectedInvestment?.id || '', entry)}
        onSaveHistoryEntryEdit={() => store.saveHistoryEntryEdit()}
        onCancelHistoryEntryEdit={() => store.cancelHistoryEntryEdit()}
        onDeleteHistoryEntry={(historyId) =>
          store.deleteHistoryEntry(store.selectedInvestment?.id || '', historyId)}
      />
    {/if}
  </div>
</PageContainer>

<!-- Modals -->
<IconPicker
  isOpen={showIconPicker}
  icons={store.availableIcons}
  position={pickerPosition}
  onSelect={selectIcon}
  onClose={() => (showIconPicker = false)}
/>

<AddHistoryModal
  isOpen={showAddHistoryModal}
  bind:formData={store.addHistoryFormData}
  onSave={store.saveHistoryEntry}
  onCancel={store.cancelAddHistory}
/>

<ConfirmModal
  isOpen={showDeleteModal}
  title="Eliminar inversión"
  message={`¿Eliminar "${store.investmentToDelete?.name}"?`}
  confirmText="Eliminar"
  cancelText="Cancelar"
  type="danger"
  onConfirm={store.confirmDelete}
  onCancel={() => (store.showDeleteModal = false)}
/>

<style>
  .portfolio-page {
    width: 100%;
    position: relative;
  }

  /* Refresh bar */
  .refresh-bar {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    z-index: 100;
    background: var(--surface-muted);
    overflow: hidden;
  }

  .refresh-bar-progress {
    height: 100%;
    width: 30%;
    background: var(--primary);
    border-radius: 0 2px 2px 0;
    animation: refreshSlide 1.2s ease-in-out infinite;
  }

  @keyframes refreshSlide {
    0% {
      transform: translateX(-100%);
    }
    50% {
      transform: translateX(250%);
    }
    100% {
      transform: translateX(-100%);
    }
  }

  /* Sync Banner */
  .sync-banner {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    padding: 1rem 1.25rem;
    margin-bottom: 1.25rem;
    background: linear-gradient(
      135deg,
      var(--primary),
      color-mix(in srgb, var(--primary) 80%, var(--accent))
    );
    border-radius: 12px;
    color: white;
  }

  .sync-banner-content {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex: 1;
    min-width: 0;
  }

  .sync-banner-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 10px;
    flex-shrink: 0;
  }

  .sync-banner-text {
    display: flex;
    flex-direction: column;
    gap: 0.125rem;
    min-width: 0;
  }

  .sync-banner-text strong {
    font-size: 0.875rem;
    font-weight: 600;
  }

  .sync-banner-text span {
    font-size: 0.75rem;
    opacity: 0.85;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .sync-banner-actions {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex-shrink: 0;
  }

  .last-sync-time {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    font-size: 0.6875rem;
    opacity: 0.75;
    white-space: nowrap;
  }

  .sync-banner-btn {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    padding: 0.5rem 1rem;
    background: rgba(255, 255, 255, 0.2);
    color: white;
    border: 1px solid rgba(255, 255, 255, 0.3);
    border-radius: 8px;
    font-size: 0.8125rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    white-space: nowrap;
    backdrop-filter: blur(4px);
  }

  .sync-banner-btn:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.35);
    border-color: rgba(255, 255, 255, 0.5);
  }

  .sync-banner-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .sync-banner-btn :global(.spinning) {
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }

  /* Sync notification */
  .sync-notification {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    background: var(--acapulco-alpha-15, rgba(122, 186, 165, 0.15));
    border: 1px solid var(--acapulco);
    border-radius: 8px;
    margin-bottom: 1.25rem;
    font-size: 0.8125rem;
    color: var(--acapulco);
    animation: slideIn 0.3s ease;
  }

  .sync-notification :global(svg) {
    flex-shrink: 0;
  }

  .sync-notification span {
    flex: 1;
  }

  .dismiss-btn {
    background: none;
    border: none;
    color: var(--acapulco);
    font-size: 1.25rem;
    cursor: pointer;
    padding: 0;
    line-height: 1;
    opacity: 0.7;
  }

  .dismiss-btn:hover {
    opacity: 1;
  }

  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  /* Investments Section */
  .investments-section {
    background: var(--surface-elevated);
    border: 1px solid var(--border-color);
    border-radius: 12px;
    padding: 1.25rem;
  }

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  }

  .section-header h2 {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 1rem;
    font-weight: 500;
    margin: 0;
  }

  .header-actions {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .add-btn {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    padding: 0.5rem 0.75rem;
    background: var(--primary);
    color: white;
    border: none;
    border-radius: 6px;
    font-size: 0.8125rem;
    font-weight: 500;
    cursor: pointer;
    transition: background 0.15s;
  }

  .add-btn:hover {
    filter: brightness(1.1);
  }

  .investments-grid {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  /* Loading */
  .loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.75rem;
    text-align: center;
    padding: 2.5rem;
    color: var(--text-muted);
    font-size: 0.875rem;
  }

  .loading-spinner {
    width: 24px;
    height: 24px;
    border: 2.5px solid var(--border-color);
    border-top-color: var(--primary);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  /* Empty State */
  .empty-state {
    text-align: center;
    padding: 2.5rem 1.5rem;
    color: var(--text-muted);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
  }

  .empty-state-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 72px;
    height: 72px;
    background: var(--surface-muted);
    border-radius: 50%;
    margin-bottom: 0.5rem;
    color: var(--text-muted);
  }

  .empty-state h3 {
    font-size: 1.125rem;
    font-weight: 600;
    color: var(--text-primary);
    margin: 0;
  }

  .empty-state > p {
    font-size: 0.875rem;
    color: var(--text-secondary);
    margin: 0 0 1rem 0;
  }

  .empty-state-actions {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    width: 100%;
    max-width: 400px;
  }

  .empty-action-card {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.875rem 1rem;
    background: var(--surface);
    border: 1px solid var(--border-color);
    border-radius: 10px;
    text-decoration: none;
    color: inherit;
    cursor: pointer;
    transition: all 0.2s ease;
    text-align: left;
    width: 100%;
    font: inherit;
  }

  .empty-action-card:hover {
    border-color: var(--primary);
    background: var(--surface-muted);
  }

  .action-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border-radius: 10px;
    flex-shrink: 0;
  }

  .action-icon.categorize {
    background: rgba(245, 121, 108, 0.15);
    color: var(--accent, #f5796c);
  }

  .action-icon.tinder {
    background: rgba(122, 186, 165, 0.15);
    color: var(--success, #7abaa5);
  }

  .action-icon.manual {
    background: rgba(2, 60, 70, 0.1);
    color: var(--primary, #023c46);
  }

  .action-text {
    display: flex;
    flex-direction: column;
    gap: 0.125rem;
    flex: 1;
    min-width: 0;
  }

  .action-text strong {
    font-size: 0.8125rem;
    font-weight: 600;
    color: var(--text-primary);
  }

  .action-text span {
    font-size: 0.6875rem;
    color: var(--text-secondary);
  }

  .empty-action-card :global(.action-arrow) {
    color: var(--text-muted);
    flex-shrink: 0;
    transition: transform 0.15s;
  }

  .empty-action-card:hover :global(.action-arrow) {
    transform: translateX(2px);
    color: var(--primary);
  }

  /* Responsive */
  @media (max-width: 640px) {
    .sync-banner {
      flex-direction: column;
      gap: 0.75rem;
      padding: 1rem;
    }

    .sync-banner-actions {
      width: 100%;
      justify-content: space-between;
    }

    .sync-banner-btn {
      flex: 1;
      justify-content: center;
    }

    .investments-section {
      padding: 1rem;
      border-radius: 10px;
    }

    .section-header {
      margin-bottom: 0.75rem;
    }

    .section-header h2 {
      font-size: 0.9375rem;
    }

    .header-actions {
      gap: 0.375rem;
    }

    .add-btn {
      padding: 0.375rem 0.625rem;
      font-size: 0.75rem;
    }

    .investments-grid {
      gap: 0.375rem;
    }
  }

  @media (max-width: 360px) {
    .sync-banner {
      padding: 0.75rem;
      border-radius: 10px;
    }

    .sync-banner-icon {
      width: 32px;
      height: 32px;
      border-radius: 8px;
    }

    .sync-banner-icon :global(svg) {
      width: 16px;
      height: 16px;
    }

    .sync-banner-text strong {
      font-size: 0.8125rem;
    }

    .sync-banner-text span {
      font-size: 0.6875rem;
    }

    .sync-banner-btn {
      padding: 0.375rem 0.75rem;
      font-size: 0.75rem;
    }

    .investments-section {
      padding: 0.75rem;
      border-radius: 8px;
    }

    .section-header h2 {
      font-size: 0.875rem;
      gap: 0.375rem;
    }

    .section-header h2 :global(svg) {
      width: 14px;
      height: 14px;
    }

    .add-btn {
      padding: 0.375rem 0.5rem;
      font-size: 0.6875rem;
      border-radius: 5px;
    }

    .add-btn :global(svg) {
      width: 12px;
      height: 12px;
    }

    .empty-state {
      padding: 1.5rem 1rem;
    }

    .empty-state-icon {
      width: 56px;
      height: 56px;
    }

    .empty-state-icon :global(svg) {
      width: 32px;
      height: 32px;
    }

    .empty-state h3 {
      font-size: 1rem;
    }

    .empty-action-card {
      padding: 0.75rem;
    }

    .action-icon {
      width: 34px;
      height: 34px;
      border-radius: 8px;
    }

    .action-icon :global(svg) {
      width: 16px;
      height: 16px;
    }
  }
</style>
