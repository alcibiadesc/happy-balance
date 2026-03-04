<script lang="ts">
  import { onMount } from 'svelte';
  import { afterNavigate } from '$app/navigation';
  import { Plus, Wallet, RefreshCw } from 'lucide-svelte';

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
  import { createInvestmentsStore } from '$lib/modules/investments/presentation/stores/investmentsStore.svelte.ts';

  const store = createInvestmentsStore();

  // Derived reactive state for modals (fixes Svelte 5 getter reactivity)
  const showAddHistoryModal = $derived(store.showAddHistoryModal);
  const showDeleteModal = $derived(store.showDeleteModal);

  // Sync notification
  let syncNotification = $state<string | null>(null);

  async function handleSync() {
    try {
      const result = await store.syncWithCategories();
      if (result) {
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
    await store.loadAll();
  });
</script>

<svelte:head>
  <title>Portfolio - Happy Balance</title>
</svelte:head>

<PageContainer>
  <div class="portfolio-page">
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

      <!-- Investments -->
      <section class="investments-section">
        <div class="section-header">
          <h2><Wallet size={18} /> Inversiones</h2>
          <div class="header-actions">
            <button
              class="sync-btn"
              onclick={handleSync}
              disabled={store.isSyncing}
              title="Sincronizar inversiones ↔ categorías"
            >
              <RefreshCw size={14} class={store.isSyncing ? 'spinning' : ''} />
              {store.isSyncing ? 'Sincronizando...' : 'Sincronizar'}
            </button>
            <button class="add-btn" onclick={() => store.startNewInvestment()}>
              <Plus size={16} /> Añadir
            </button>
          </div>
        </div>

        {#if syncNotification}
          <div class="sync-notification" role="status">
            <RefreshCw size={14} />
            <span>{syncNotification}</span>
            <button class="dismiss-btn" onclick={() => (syncNotification = null)}>×</button>
          </div>
        {/if}

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
          <div class="loading">Cargando...</div>
        {:else if store.investments.length === 0 && !store.showNewForm}
          <div class="empty-state">
            <Wallet size={48} strokeWidth={1} />
            <p>Añade tu primera inversión</p>
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
  }

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

  .sync-btn {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    padding: 0.5rem 0.75rem;
    background: var(--surface-muted);
    color: var(--text-secondary);
    border: 1px solid var(--border-color);
    border-radius: 6px;
    font-size: 0.75rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .sync-btn:hover:not(:disabled) {
    background: var(--surface-elevated);
    color: var(--text-primary);
    border-color: var(--primary);
  }

  .sync-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .sync-btn :global(.spinning) {
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

  .sync-notification {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    background: var(--acapulco-alpha-15, rgba(122, 186, 165, 0.15));
    border: 1px solid var(--acapulco);
    border-radius: 8px;
    margin-bottom: 1rem;
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
  }

  .investments-grid {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .loading,
  .empty-state {
    text-align: center;
    padding: 2rem;
    color: var(--text-muted);
  }

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
  }

  @media (max-width: 640px) {
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

    .sync-btn {
      padding: 0.375rem 0.5rem;
      font-size: 0.6875rem;
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

    .sync-btn {
      padding: 0.25rem 0.375rem;
      font-size: 0.625rem;
      border-radius: 4px;
    }

    .sync-btn :global(svg) {
      width: 10px;
      height: 10px;
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
      padding: 1.5rem;
    }

    .empty-state :global(svg) {
      width: 36px;
      height: 36px;
    }

    .empty-state p {
      font-size: 0.8125rem;
    }
  }
</style>
