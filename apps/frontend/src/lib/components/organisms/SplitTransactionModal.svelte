<script lang="ts">
  import { X, Split, Check, Unlink } from 'lucide-svelte';
  import type { Transaction, PotentialReimbursement } from '$lib/types/transaction';
  import { apiTransactions } from '$lib/stores/api-transactions';

  // Props
  export let isOpen = false;
  export let transaction: Transaction | null = null;
  export let onClose: () => void = () => {};

  let modalElement: HTMLDivElement;
  let loading = false;
  let potentialReimbursements: PotentialReimbursement[] = [];
  let splitPercentage = 50; // Default to 50%
  let selectedReimbursementId: string | null = null;
  let error: string | null = null;

  // Determine if transaction is expense or income
  $: isExpense = transaction ? transaction.amount < 0 : true;
  $: modalTitle = isExpense
    ? (transaction?.linkedTransactionId ? 'Gasto Compartido Vinculado' : 'Marcar como Gasto Compartido')
    : (transaction?.linkedTransactionId ? 'Reembolso Vinculado' : 'Vincular con Gasto Compartido');
  $: potentialsLabel = isExpense ? 'Reembolsos Disponibles (Opcional)' : 'Gastos Compartidos Disponibles (Opcional)';
  $: saveButtonLabel = 'Guardar';
  $: linkButtonLabel = 'Vincular';

  // Prevent body scroll when modal is open
  $: if (isOpen && transaction) {
    preventBodyScroll();
    loadPotentialReimbursements();
    // Initialize splitPercentage from transaction if exists
    splitPercentage = transaction.splitPercentage ?? 50;
    selectedReimbursementId = null;
  } else {
    restoreBodyScroll();
    resetState();
  }

  function preventBodyScroll() {
    if (typeof document !== 'undefined') {
      document.body.style.overflow = 'hidden';
    }
  }

  function restoreBodyScroll() {
    if (typeof document !== 'undefined') {
      document.body.style.overflow = '';
    }
  }

  function resetState() {
    potentialReimbursements = [];
    splitPercentage = 50;
    selectedReimbursementId = null;
    error = null;
  }

  async function loadPotentialReimbursements() {
    if (!transaction) return;

    loading = true;
    error = null;

    try {
      const results = await apiTransactions.findPotentialReimbursements(transaction.id);
      potentialReimbursements = results;
    } catch (err) {
      console.error('Error al cargar reembolsos potenciales:', err);
      // No mostramos error si no hay reembolsos, es normal
      potentialReimbursements = [];
    } finally {
      loading = false;
    }
  }

  async function saveWithoutLinking() {
    if (!transaction) return;

    loading = true;
    error = null;

    try {
      await apiTransactions.updateSplitPercentage(transaction.id, splitPercentage);
      onClose();
    } catch (err) {
      console.error('Error al guardar el porcentaje:', err);
      error = err instanceof Error ? err.message : 'Error al guardar el porcentaje';
    } finally {
      loading = false;
    }
  }

  async function linkTransaction() {
    if (!transaction || !selectedReimbursementId) return;

    loading = true;
    error = null;

    try {
      await apiTransactions.linkSplitTransaction(
        transaction.id,
        selectedReimbursementId,
        splitPercentage
      );
      onClose();
    } catch (err) {
      console.error('Error al vincular transacción:', err);
      error = err instanceof Error ? err.message : 'Error al vincular transacción';
    } finally {
      loading = false;
    }
  }

  async function unlinkTransaction() {
    if (!transaction) return;

    loading = true;
    error = null;

    try {
      await apiTransactions.unlinkSplitTransaction(transaction.id);
      onClose();
    } catch (err) {
      console.error('Error al desvincular transacción:', err);
      error = err instanceof Error ? err.message : 'Error al desvincular transacción';
    } finally {
      loading = false;
    }
  }

  function handleBackdropClick(event: MouseEvent) {
    if (event.target === modalElement) {
      onClose();
    }
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      onClose();
    }
  }

  function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  }

  function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }

  function getMatchScoreColor(score: number): string {
    if (score >= 80) return '#10b981';
    if (score >= 60) return '#f59e0b';
    return '#ef4444';
  }
</script>

<svelte:window on:keydown={handleKeydown} />

{#if isOpen && transaction}
  <div
    bind:this={modalElement}
    class="modal-backdrop"
    on:click={handleBackdropClick}
    role="dialog"
    aria-modal="true"
    aria-labelledby="modal-title"
  >
    <div class="modal-content">
      <!-- Header -->
      <div class="modal-header">
        <div class="header-icon">
          <Split size={20} />
        </div>
        <h3 id="modal-title" class="modal-title">
          {modalTitle}
        </h3>
        <button
          class="close-btn"
          on:click={onClose}
          aria-label="Cerrar"
        >
          <X size={20} />
        </button>
      </div>

      <!-- Transaction Info -->
      <div class="transaction-info">
        <div class="transaction-merchant">{transaction.merchant}</div>
        <div class="transaction-details">
          {formatCurrency(transaction.amount)} • {formatDate(transaction.date)}
        </div>
      </div>

      {#if transaction.linkedTransactionId}
        <!-- Already linked -->
        <div class="linked-info">
          <div class="linked-badge">
            <Check size={16} />
            <span>{isExpense ? 'Vinculado con reembolso' : 'Vinculado con gasto compartido'}</span>
          </div>
          {#if transaction.splitPercentage !== undefined}
            <div class="split-details">
              {#if isExpense}
                <span>Pagas el <strong>{transaction.splitPercentage}%</strong> del gasto total</span>
                <span class="real-amount">Monto real: {formatCurrency((transaction.amount * transaction.splitPercentage) / 100)}</span>
              {:else}
                <span>Este ingreso cubre el <strong>{transaction.splitPercentage}%</strong> de un gasto compartido</span>
                <span class="real-amount">Monto cubierto: {formatCurrency((transaction.amount * transaction.splitPercentage) / 100)}</span>
              {/if}
            </div>
          {/if}
        </div>

        <div class="actions">
          <button class="btn btn-secondary" on:click={onClose}>
            Cerrar
          </button>
          <button
            class="btn btn-danger"
            on:click={unlinkTransaction}
            disabled={loading}
          >
            <Unlink size={16} />
            Desvincular
          </button>
        </div>
      {:else}
        <!-- Not linked - configure split -->
        <div class="split-config">
          <label class="label">
            {isExpense ? '¿Qué porcentaje del gasto pagas tú?' : '¿Qué porcentaje del gasto cubre este reembolso?'}
          </label>
          <div class="slider-container">
            <input
              type="range"
              min="0"
              max="100"
              bind:value={splitPercentage}
              class="slider"
              step="5"
            />
            <div class="slider-labels">
              <span>0%</span>
              <span class="current-value">{splitPercentage}%</span>
              <span>100%</span>
            </div>
          </div>
          <div class="real-amount-display">
            {isExpense ? 'Monto real' : 'Monto cubierto'}: <strong>{formatCurrency((transaction.amount * splitPercentage) / 100)}</strong>
          </div>
        </div>

        {#if loading}
          <div class="loading-state">
            <div class="spinner"></div>
            <span>{isExpense ? 'Buscando reembolsos...' : 'Buscando gastos compartidos...'}</span>
          </div>
        {:else if potentialReimbursements.length > 0}
          <div class="reimbursements-section">
            <div class="section-label">{potentialsLabel}</div>
            <div class="reimbursements-list">
              {#each potentialReimbursements as reimbursement}
                <label class="reimbursement-item">
                  <input
                    type="radio"
                    name="reimbursement"
                    class="radio-input"
                    value={reimbursement.transaction.id}
                    bind:group={selectedReimbursementId}
                  />
                  <div class="reimbursement-content">
                    <div class="reimbursement-header">
                      <div class="reimbursement-left">
                        {#if reimbursement.transaction.description}
                          <div class="reimbursement-title">{reimbursement.transaction.description}</div>
                        {/if}
                        <div class="reimbursement-merchant">{reimbursement.transaction.merchant}</div>
                        <div class="reimbursement-date">{formatDate(reimbursement.transaction.date)}</div>
                      </div>
                      <div class="reimbursement-right">
                        <div class="reimbursement-amount" class:expense={!isExpense} class:income={isExpense}>
                          {formatCurrency(reimbursement.transaction.amount)}
                        </div>
                        <div
                          class="match-score"
                          style="color: {getMatchScoreColor(reimbursement.matchScore)}"
                        >
                          {Math.round(reimbursement.matchScore)}% coincidencia
                        </div>
                      </div>
                    </div>
                    {#if reimbursement.matchReasons.length > 0}
                      <div class="match-reasons">
                        {#each reimbursement.matchReasons as reason}
                          <span class="reason-badge">{reason}</span>
                        {/each}
                      </div>
                    {/if}
                  </div>
                </label>
              {/each}
            </div>
          </div>
        {/if}

        {#if error}
          <div class="error-message">
            {error}
          </div>
        {/if}

        <div class="actions">
          <button class="btn btn-secondary" on:click={onClose} disabled={loading}>
            Cancelar
          </button>
          <button
            class="btn btn-primary"
            on:click={saveWithoutLinking}
            disabled={loading}
          >
            <Check size={16} />
            {saveButtonLabel}
          </button>
          {#if selectedReimbursementId}
            <button
              class="btn btn-accent"
              on:click={linkTransaction}
              disabled={loading}
            >
              <Split size={16} />
              {linkButtonLabel}
            </button>
          {/if}
        </div>
      {/if}
    </div>
  </div>
{/if}

<style>
  .modal-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(4px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 1rem;
  }

  .modal-content {
    background: var(--surface-elevated);
    border-radius: 1rem;
    max-width: 600px;
    width: 100%;
    max-height: 90vh;
    overflow-y: auto;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    padding: 1.5rem;
  }

  .modal-header {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid var(--border-color);
  }

  .header-icon {
    width: 2.5rem;
    height: 2.5rem;
    border-radius: 0.75rem;
    background: var(--primary-alpha-10);
    color: var(--primary);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .modal-title {
    flex: 1;
    font-size: 1.125rem;
    font-weight: 600;
    color: var(--text-primary);
    margin: 0;
  }

  .close-btn {
    width: 2rem;
    height: 2rem;
    border-radius: 0.5rem;
    border: none;
    background: transparent;
    color: var(--text-secondary);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
  }

  .close-btn:hover {
    background: var(--surface-muted);
    color: var(--text-primary);
  }

  .transaction-info {
    padding: 1rem;
    background: var(--surface-muted);
    border-radius: 0.75rem;
    border: 1px solid var(--border-color);
  }

  .transaction-merchant {
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: 0.25rem;
  }

  .transaction-details {
    font-size: 0.875rem;
    color: var(--text-secondary);
  }

  .linked-info {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    padding: 1rem;
    background: var(--acapulco-alpha-10);
    border: 1px solid var(--acapulco);
    border-radius: 0.75rem;
  }

  .linked-badge {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: var(--acapulco);
    font-weight: 500;
  }

  .split-details {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    font-size: 0.875rem;
    color: var(--text-secondary);
  }

  .split-config {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .label {
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--text-primary);
  }

  .slider-container {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .slider {
    width: 100%;
    height: 0.5rem;
    border-radius: 0.25rem;
    background: var(--surface-muted);
    outline: none;
    -webkit-appearance: none;
  }

  .slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 1.25rem;
    height: 1.25rem;
    border-radius: 50%;
    background: var(--primary);
    cursor: pointer;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    transition: all 0.2s;
  }

  .slider::-webkit-slider-thumb:hover {
    transform: scale(1.1);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  }

  .slider::-moz-range-thumb {
    width: 1.25rem;
    height: 1.25rem;
    border-radius: 50%;
    background: var(--primary);
    cursor: pointer;
    border: none;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    transition: all 0.2s;
  }

  .slider::-moz-range-thumb:hover {
    transform: scale(1.1);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  }

  .slider-labels {
    display: flex;
    justify-content: space-between;
    font-size: 0.75rem;
    color: var(--text-secondary);
  }

  .current-value {
    font-weight: 600;
    color: var(--primary);
  }

  .real-amount-display,
  .real-amount {
    font-size: 0.875rem;
    color: var(--text-secondary);
  }

  .real-amount-display strong,
  .real-amount {
    color: var(--text-primary);
    font-weight: 600;
  }

  .loading-state {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
    padding: 2rem;
    color: var(--text-secondary);
  }

  .spinner {
    width: 1.5rem;
    height: 1.5rem;
    border: 2px solid var(--surface-muted);
    border-top-color: var(--primary);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .reimbursements-section {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .section-label {
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--text-secondary);
  }

  .reimbursements-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    max-height: 300px;
    overflow-y: auto;
  }

  .reimbursement-item {
    display: flex;
    gap: 0.75rem;
    padding: 1rem;
    background: var(--surface-muted);
    border: 1px solid var(--border-color);
    border-radius: 0.75rem;
    cursor: pointer;
    transition: all 0.2s;
  }

  .reimbursement-item:hover {
    background: var(--surface-hover);
    border-color: var(--primary);
  }

  .reimbursement-item:has(.radio-input:checked) {
    background: var(--primary-alpha-10);
    border-color: var(--primary);
  }

  .radio-input {
    margin-top: 0.25rem;
    cursor: pointer;
    accent-color: var(--primary);
  }

  .reimbursement-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .reimbursement-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 1rem;
  }

  .reimbursement-left {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .reimbursement-title {
    font-weight: 600;
    color: var(--text-primary);
    font-size: 0.9375rem;
  }

  .reimbursement-merchant {
    font-weight: 400;
    color: var(--text-secondary);
    font-size: 0.8125rem;
  }

  .reimbursement-date {
    font-size: 0.75rem;
    color: var(--text-secondary);
  }

  .reimbursement-right {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 0.25rem;
  }

  .reimbursement-amount {
    font-weight: 600;
  }

  .reimbursement-amount.income {
    color: var(--acapulco);
  }

  .reimbursement-amount.expense {
    color: var(--froly);
  }

  .match-score {
    font-size: 0.75rem;
    font-weight: 500;
  }

  .match-reasons {
    display: flex;
    flex-wrap: wrap;
    gap: 0.375rem;
  }

  .reason-badge {
    font-size: 0.75rem;
    padding: 0.125rem 0.5rem;
    background: var(--surface-elevated);
    border: 1px solid var(--border-color);
    border-radius: 0.375rem;
    color: var(--text-secondary);
  }

  .error-message {
    padding: 0.75rem 1rem;
    background: var(--error-alpha-10);
    border: 1px solid var(--error);
    border-radius: 0.5rem;
    color: var(--error);
    font-size: 0.875rem;
  }

  .actions {
    display: flex;
    gap: 0.75rem;
    justify-content: flex-end;
    padding-top: 1rem;
    border-top: 1px solid var(--border-color);
  }

  .btn {
    padding: 0.625rem 1.25rem;
    border-radius: 0.5rem;
    border: none;
    font-weight: 500;
    font-size: 0.875rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    transition: all 0.2s;
  }

  .btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .btn-secondary {
    background: var(--surface-muted);
    color: var(--text-primary);
  }

  .btn-secondary:hover:not(:disabled) {
    background: var(--surface-hover);
  }

  .btn-primary {
    background: var(--primary);
    color: white;
  }

  .btn-primary:hover:not(:disabled) {
    opacity: 0.9;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  .btn-accent {
    background: var(--acapulco);
    color: white;
  }

  .btn-accent:hover:not(:disabled) {
    opacity: 0.9;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  .btn-danger {
    background: var(--error);
    color: white;
  }

  .btn-danger:hover:not(:disabled) {
    opacity: 0.9;
  }

  @media (max-width: 640px) {
    .modal-content {
      padding: 1rem;
      gap: 1rem;
      max-height: 95vh;
    }

    .modal-header {
      padding-bottom: 0.75rem;
    }

    .header-icon {
      width: 2rem;
      height: 2rem;
    }

    .modal-title {
      font-size: 1rem;
    }

    .actions {
      flex-direction: column-reverse;
      padding-top: 0.75rem;
      gap: 0.5rem;
    }

    .btn {
      width: 100%;
      justify-content: center;
    }

    .reimbursement-header {
      flex-direction: column;
      gap: 0.5rem;
      align-items: stretch;
    }

    .reimbursement-left {
      gap: 0.375rem;
    }

    .reimbursement-right {
      flex-direction: row;
      align-items: center;
      justify-content: space-between;
    }

    .reimbursement-title {
      font-size: 0.875rem;
    }

    .match-reasons {
      gap: 0.25rem;
    }

    .reason-badge {
      font-size: 0.6875rem;
      padding: 0.125rem 0.375rem;
    }
  }
</style>
