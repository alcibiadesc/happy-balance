<script lang="ts">
  import { Sparkles } from 'lucide-svelte';
  import type { Transaction, Category } from '$lib/types/transaction';
  import { modalKeyboard } from '$lib/actions/modalKeyboard';
  import { formatCurrency } from '$lib/stores/currency';
  import TransactionCard from '../molecules/TransactionCard.svelte';
  import ModalActions from '../molecules/ModalActions.svelte';

  interface Props {
    isOpen: boolean;
    transaction: Transaction | null;
    selectedCategory: Category | null;
    matchingTransactions: Transaction[];
    onConfirm: (
      scope: 'single' | 'pattern' | 'all',
      applyToFuture: boolean,
      selectedTransactionIds?: string[]
    ) => void;
    onCancel: () => void;
  }

  let {
    isOpen = false,
    transaction = null,
    selectedCategory = null,
    matchingTransactions = [],
    onConfirm = () => {},
    onCancel = () => {},
  }: Props = $props();

  let applyToFuture = $state(true);
  let selectedTransactionIds = $state(new Set<string>());

  const hasMatches = $derived(matchingTransactions.length > 0);
  const selectedCount = $derived(selectedTransactionIds.size + 1);
  const totalSelectedAmount = $derived(getTotalAmount());

  $effect(() => {
    if (isOpen) {
      selectedTransactionIds = new Set(matchingTransactions.map((t) => t.id));
      applyToFuture = true;
    }
  });

  function handleConfirm() {
    if (selectedTransactionIds.size > 0) {
      onConfirm('pattern', applyToFuture, Array.from(selectedTransactionIds));
    } else {
      onConfirm('single', applyToFuture);
    }
  }

  function getPatternName(tx: Transaction): string {
    return tx.merchant || tx.description || 'Esta transacción';
  }

  function getTotalAmount(): string {
    const selected = matchingTransactions.filter((t) => selectedTransactionIds.has(t.id));
    const total = selected.reduce(
      (sum, t) => sum + Math.abs(t.amount),
      Math.abs(transaction?.amount || 0)
    );
    return formatCurrency(total);
  }

  function toggleTransaction(transactionId: string) {
    const newSet = new Set(selectedTransactionIds);
    if (newSet.has(transactionId)) {
      newSet.delete(transactionId);
    } else {
      newSet.add(transactionId);
    }
    selectedTransactionIds = newSet;
  }

  function toggleAll() {
    if (selectedTransactionIds.size === matchingTransactions.length) {
      selectedTransactionIds = new Set();
    } else {
      selectedTransactionIds = new Set(matchingTransactions.map((t) => t.id));
    }
  }
</script>

<div use:modalKeyboard={{ onConfirm: handleConfirm, onCancel, isOpen }}></div>

{#if isOpen && transaction && selectedCategory}
  <div class="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="categorization-title">
    <div class="modal-content">
      <!-- Header -->
      <div class="modal-header">
        <div class="header-content">
          <h2 id="categorization-title" class="modal-title">
            <Sparkles size={18} />
            Categorización inteligente
          </h2>
          <div class="category-preview">
            <span class="merchant-name">{getPatternName(transaction)}</span>
            <div class="category-assignment">
              <span class="arrow">→</span>
              <div
                class="category-chip"
                style="background-color: {selectedCategory.color}15; border-color: {selectedCategory.color}; color: {selectedCategory.color}"
              >
                <span class="category-icon">{selectedCategory.icon}</span>
                <span class="category-name">{selectedCategory.name}</span>
              </div>
            </div>
          </div>
        </div>
        <button class="close-btn" onclick={onCancel} aria-label="Cerrar">×</button>
      </div>

      <div class="content-section">
        <!-- Current transaction -->
        <div class="current-transaction">
          <div class="section-label">Transacción actual</div>
          <TransactionCard
            description={transaction.description}
            merchant={transaction.merchant}
            date={transaction.date}
            amount={transaction.amount}
            current
          />
        </div>

        <!-- Matching transactions -->
        {#if hasMatches}
          <div class="matches-section">
            <div class="section-header">
              <div class="section-label">
                Transacciones anteriores similares
                <span class="match-count">{matchingTransactions.length}</span>
              </div>
              <button type="button" class="toggle-all-btn" onclick={toggleAll}>
                {selectedTransactionIds.size === matchingTransactions.length
                  ? 'Deseleccionar'
                  : 'Seleccionar todas'}
              </button>
            </div>
            <div class="matches-list">
              {#each matchingTransactions as match (match.id)}
                <TransactionCard
                  description={match.description}
                  merchant={match.merchant}
                  date={match.date}
                  amount={match.amount}
                  selected={selectedTransactionIds.has(match.id)}
                  showCheckbox
                  checked={selectedTransactionIds.has(match.id)}
                  onchange={() => toggleTransaction(match.id)}
                />
              {/each}
            </div>
            {#if selectedTransactionIds.size > 0}
              <div class="selection-summary">
                <span>Total seleccionado:</span>
                <strong>{totalSelectedAmount}</strong>
              </div>
            {/if}
          </div>
        {:else}
          <div class="no-matches">
            <span class="no-matches-text">No se encontraron transacciones anteriores similares</span
            >
          </div>
        {/if}

        <!-- Future transactions option -->
        <div class="future-option">
          <label class="checkbox-option">
            <input type="checkbox" bind:checked={applyToFuture} />
            <div class="checkbox-content">
              <span class="checkbox-title">
                <Sparkles size={14} />
                Aplicar a futuras transacciones
              </span>
              <span class="checkbox-detail">
                Las transacciones similares que importes en el futuro se categorizarán
                automáticamente
              </span>
            </div>
          </label>
        </div>
      </div>

      <ModalActions>
        <button class="btn-secondary" onclick={onCancel}>Cancelar</button>
        <button class="btn-primary" onclick={handleConfirm}>
          {#if selectedTransactionIds.size > 0}
            Aplicar a {selectedCount} transacciones
          {:else}
            Aplicar categoría
          {/if}
        </button>
      </ModalActions>
    </div>
  </div>
{/if}

<style>
  .modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.4);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1100;
    padding: 1rem;
    backdrop-filter: blur(4px);
    -webkit-backdrop-filter: blur(4px);
  }

  .modal-content {
    background: var(--surface-elevated);
    border-radius: 16px;
    box-shadow: var(--shadow-lg);
    max-width: 480px;
    width: 100%;
    max-height: 90vh;
    overflow: hidden;
    animation: modalSlideIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  @keyframes modalSlideIn {
    from {
      opacity: 0;
      transform: translateY(-30px) scale(0.9);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }

  .modal-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    padding: 20px 24px;
    border-bottom: 1px solid var(--border-color);
    background: var(--surface-muted);
  }

  .header-content {
    flex: 1;
  }

  .modal-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 16px;
    font-weight: 600;
    color: var(--text-primary);
    margin: 0 0 12px 0;
  }

  .modal-title :global(svg) {
    color: var(--primary);
  }

  .category-preview {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .merchant-name {
    font-size: 13px;
    color: var(--text-secondary);
    font-weight: 500;
  }

  .category-assignment {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .arrow {
    color: var(--text-muted);
    font-size: 12px;
  }

  .category-chip {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 5px 10px;
    border: 1px solid;
    border-radius: 6px;
  }

  .category-icon {
    font-size: 13px;
  }

  .category-name {
    font-size: 12px;
    font-weight: 600;
  }

  .close-btn {
    width: 2rem;
    height: 2rem;
    border: none;
    background: none;
    color: var(--text-secondary);
    cursor: pointer;
    font-size: 1.5rem;
    line-height: 1;
    border-radius: 0.5rem;
    transition: all 0.2s ease;
  }

  .close-btn:hover {
    background: var(--surface-hover);
    color: var(--text-primary);
  }

  .content-section {
    padding: 16px 24px 20px;
    max-height: calc(90vh - 220px);
    overflow-y: auto;
  }

  .current-transaction {
    margin-bottom: 16px;
  }

  .section-label {
    font-size: 11px;
    font-weight: 600;
    color: var(--text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 8px;
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .match-count {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 18px;
    height: 18px;
    background: var(--primary);
    border-radius: 9px;
    font-size: 10px;
    font-weight: 600;
    color: var(--primary-foreground);
    padding: 0 5px;
  }

  .matches-section {
    margin-bottom: 16px;
  }

  .section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 8px;
  }

  .toggle-all-btn {
    padding: 4px 10px;
    border: 1px solid var(--border-color);
    background: var(--surface-elevated);
    color: var(--primary);
    border-radius: 5px;
    font-size: 11px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .toggle-all-btn:hover {
    background: var(--primary-alpha-10);
    border-color: var(--primary);
  }

  .matches-list {
    display: flex;
    flex-direction: column;
    gap: 6px;
    max-height: 200px;
    overflow-y: auto;
    padding-right: 4px;
  }

  .selection-summary {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 14px;
    background: var(--primary-alpha-10);
    border: 1px solid var(--primary);
    border-radius: 8px;
    margin-top: 10px;
    font-size: 12px;
    color: var(--primary);
  }

  .no-matches {
    padding: 16px;
    background: var(--surface-muted);
    border: 1px dashed var(--border-color);
    border-radius: 10px;
    text-align: center;
    margin-bottom: 16px;
  }

  .no-matches-text {
    font-size: 12px;
    color: var(--text-muted);
  }

  .future-option {
    padding: 14px 16px;
    background: var(--primary-alpha-10);
    border: 1.5px solid var(--primary);
    border-radius: 10px;
  }

  .checkbox-option {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    cursor: pointer;
  }

  .checkbox-option input[type='checkbox'] {
    width: 16px;
    height: 16px;
    margin-top: 2px;
    accent-color: var(--primary);
    flex-shrink: 0;
  }

  .checkbox-content {
    flex: 1;
  }

  .checkbox-title {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    font-weight: 600;
    color: var(--primary);
    margin-bottom: 2px;
  }

  .checkbox-title :global(svg) {
    color: var(--primary);
  }

  .checkbox-detail {
    font-size: 11px;
    color: var(--text-secondary);
    line-height: 1.4;
  }

  .btn-secondary {
    flex: 1;
    padding: 11px 16px;
    border: 1.5px solid var(--border-color);
    background: var(--surface-elevated);
    color: var(--text-secondary);
    border-radius: 8px;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .btn-secondary:hover {
    background: var(--surface-muted);
    border-color: var(--text-muted);
    color: var(--text-primary);
  }

  .btn-primary {
    flex: 2;
    padding: 11px 16px;
    border: none;
    background: var(--primary);
    color: var(--primary-foreground);
    border-radius: 8px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    box-shadow: var(--shadow-sm);
  }

  .btn-primary:hover {
    background: var(--primary-hover);
    box-shadow: var(--shadow-md);
    transform: translateY(-1px);
  }

  .matches-list::-webkit-scrollbar,
  .content-section::-webkit-scrollbar {
    width: 5px;
  }

  .matches-list::-webkit-scrollbar-track,
  .content-section::-webkit-scrollbar-track {
    background: transparent;
  }

  .matches-list::-webkit-scrollbar-thumb,
  .content-section::-webkit-scrollbar-thumb {
    background: var(--border-color);
    border-radius: 3px;
  }

  @media (max-width: 480px) {
    .modal-overlay {
      padding: 12px;
      align-items: flex-end;
    }

    .modal-content {
      max-width: none;
      width: 100%;
      max-height: 85vh;
      border-radius: 16px 16px 0 0;
    }

    .modal-header {
      padding: 16px 20px;
    }

    .modal-title {
      font-size: 15px;
    }

    .content-section {
      padding: 12px 20px 16px;
      max-height: calc(85vh - 200px);
    }

    .matches-list {
      max-height: 150px;
    }
  }
</style>
