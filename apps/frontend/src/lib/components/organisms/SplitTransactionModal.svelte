<script lang="ts">
  import { Split, Check, Unlink } from 'lucide-svelte';
  import type { Transaction, PotentialReimbursement } from '$lib/types/transaction';
  import { apiTransactions } from '$lib/stores/api-transactions';
  import { modalKeyboard } from '$lib/actions/modalKeyboard';
  import { formatCurrency } from '$lib/stores/currency';
  import PercentageSlider from '$lib/components/molecules/PercentageSlider.svelte';
  import ModalHeader from '../molecules/ModalHeader.svelte';
  import ModalActions from '../molecules/ModalActions.svelte';

  interface Props {
    isOpen: boolean;
    transaction: Transaction | null;
    onClose: () => void;
  }

  let { isOpen = false, transaction = null, onClose = () => {} }: Props = $props();

  let loading = $state(false);
  let potentialReimbursements = $state<PotentialReimbursement[]>([]);
  let splitPercentage = $state(50);
  let selectedReimbursementId = $state<string | null>(null);
  let error = $state<string | null>(null);

  const isExpense = $derived(transaction ? transaction.amount < 0 : true);
  const modalTitle = $derived(
    isExpense
      ? transaction?.linkedTransactionId
        ? 'Gasto Compartido Vinculado'
        : 'Marcar como Gasto Compartido'
      : transaction?.linkedTransactionId
        ? 'Reembolso Vinculado'
        : 'Vincular con Gasto Compartido'
  );
  const potentialsLabel = $derived(
    isExpense ? 'Reembolsos Disponibles (Opcional)' : 'Gastos Compartidos Disponibles (Opcional)'
  );
  const sliderLabel = $derived(
    isExpense
      ? '¿Qué porcentaje del gasto pagas tú?'
      : '¿Qué porcentaje del gasto cubre este reembolso?'
  );
  const resultLabel = $derived(isExpense ? 'Monto real' : 'Monto cubierto');
  const resultAmount = $derived(transaction ? (transaction.amount * splitPercentage) / 100 : 0);

  $effect(() => {
    if (isOpen && transaction) {
      preventBodyScroll();
      loadPotentialReimbursements();
      splitPercentage = transaction.splitPercentage ?? 50;
      selectedReimbursementId = null;
    } else {
      restoreBodyScroll();
      resetState();
    }
  });

  function preventBodyScroll() {
    if (typeof document !== 'undefined') document.body.style.overflow = 'hidden';
  }

  function restoreBodyScroll() {
    if (typeof document !== 'undefined') document.body.style.overflow = '';
  }

  function resetState() {
    potentialReimbursements = [];
    splitPercentage = 50;
    selectedReimbursementId = null;
    error = null;
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

  async function loadPotentialReimbursements() {
    if (!transaction) return;
    loading = true;
    error = null;

    try {
      potentialReimbursements = await apiTransactions.findPotentialReimbursements(transaction.id);
    } catch {
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
      error = err instanceof Error ? err.message : 'Error al guardar';
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
      await apiTransactions.load();
      onClose();
    } catch (err) {
      error = err instanceof Error ? err.message : 'Error al vincular';
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
      error = err instanceof Error ? err.message : 'Error al desvincular';
    } finally {
      loading = false;
    }
  }
</script>

<div use:modalKeyboard={{ onConfirm: saveWithoutLinking, onCancel: onClose, isOpen }}></div>

{#if isOpen && transaction}
  <!-- svelte-ignore a11y_no_noninteractive_element_interactions a11y_click_events_have_key_events -->
  <div
    class="modal-backdrop"
    onclick={(e) => e.target === e.currentTarget && onClose()}
    role="dialog"
    aria-modal="true"
    tabindex="-1"
  >
    <!-- svelte-ignore a11y_no_noninteractive_element_interactions a11y_click_events_have_key_events -->
    <div class="modal-content" onclick={(e) => e.stopPropagation()} role="document">
      <ModalHeader title={modalTitle} icon={Split} {onClose} />

      <div class="modal-body">
        <!-- Transaction Info -->
        <div class="transaction-info">
          <div class="merchant">{transaction.merchant}</div>
          <div class="details">
            {formatCurrency(transaction.amount)} • {formatDate(transaction.date)}
          </div>
        </div>

        {#if transaction.linkedTransactionId}
          <!-- Already linked -->
          <div class="linked-info">
            <div class="linked-badge">
              <Check size={16} />
              <span>{isExpense ? 'Vinculado con reembolso' : 'Vinculado con gasto compartido'}</span
              >
            </div>
            {#if transaction.splitPercentage !== undefined}
              <div class="split-details">
                <span>
                  {isExpense ? 'Pagas el' : 'Este ingreso cubre el'}
                  <strong>{transaction.splitPercentage}%</strong>
                  {isExpense ? 'del gasto total' : 'de un gasto compartido'}
                </span>
                <span class="real-amount">
                  {isExpense ? 'Monto real' : 'Monto cubierto'}:
                  {formatCurrency((transaction.amount * transaction.splitPercentage) / 100)}
                </span>
              </div>
            {/if}
          </div>

          <ModalActions>
            <button class="btn btn-secondary" onclick={onClose}>Cerrar</button>
            <button class="btn btn-danger" onclick={unlinkTransaction} disabled={loading}>
              <Unlink size={16} /> Desvincular
            </button>
          </ModalActions>
        {:else}
          <PercentageSlider
            bind:value={splitPercentage}
            label={sliderLabel}
            {resultLabel}
            {resultAmount}
            {formatCurrency}
          />

          {#if loading}
            <div class="loading-state">
              <div class="spinner"></div>
              <span>{isExpense ? 'Buscando reembolsos...' : 'Buscando gastos compartidos...'}</span>
            </div>
          {:else if potentialReimbursements.length > 0}
            <div class="reimbursements-section">
              <div class="section-label">{potentialsLabel}</div>
              <div class="reimbursements-list">
                {#each potentialReimbursements as r (r.transaction.id)}
                  <label
                    class="reimbursement-item"
                    class:selected={selectedReimbursementId === r.transaction.id}
                  >
                    <input
                      type="radio"
                      name="reimbursement"
                      class="radio-input"
                      value={r.transaction.id}
                      bind:group={selectedReimbursementId}
                    />
                    <div class="reimbursement-content">
                      <div class="reimbursement-header">
                        <div class="reimbursement-left">
                          {#if r.transaction.description}
                            <div class="reimbursement-title">{r.transaction.description}</div>
                          {/if}
                          <div class="reimbursement-merchant">{r.transaction.merchant}</div>
                          <div class="reimbursement-date">{formatDate(r.transaction.date)}</div>
                        </div>
                        <div class="reimbursement-right">
                          <div
                            class="reimbursement-amount"
                            class:income={isExpense}
                            class:expense={!isExpense}
                          >
                            {formatCurrency(r.transaction.amount)}
                          </div>
                          <div
                            class="match-score"
                            style="color: {getMatchScoreColor(r.matchScore)}"
                          >
                            {Math.round(r.matchScore)}% coincidencia
                          </div>
                        </div>
                      </div>
                      {#if r.matchReasons.length > 0}
                        <div class="match-reasons">
                          {#each r.matchReasons as reason, ri (ri)}
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
            <div class="error-message">{error}</div>
          {/if}

          <ModalActions>
            <button class="btn btn-secondary" onclick={onClose} disabled={loading}>Cancelar</button>
            <button class="btn btn-primary" onclick={saveWithoutLinking} disabled={loading}>
              <Check size={16} /> Guardar
            </button>
            {#if selectedReimbursementId}
              <button class="btn btn-accent" onclick={linkTransaction} disabled={loading}>
                <Split size={16} /> Vincular
              </button>
            {/if}
          </ModalActions>
        {/if}
      </div>
    </div>
  </div>
{/if}

<style>
  .modal-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(4px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1100;
    padding: 1rem;
  }

  .modal-content {
    background: var(--surface-elevated);
    border-radius: 1rem;
    max-width: 600px;
    width: 100%;
    max-height: 90vh;
    overflow-y: auto;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
  }

  .modal-body {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    padding: 1.5rem;
  }

  .transaction-info {
    padding: 1rem;
    background: var(--surface-muted);
    border-radius: 0.75rem;
    border: 1px solid var(--border-color);
  }

  .merchant {
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: 0.25rem;
  }

  .details {
    font-size: 0.875rem;
    color: var(--text-secondary);
  }

  .linked-info {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    padding: 1rem;
    background: rgba(122, 186, 165, 0.1);
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

  .real-amount {
    font-weight: 500;
    color: var(--text-primary);
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
    to {
      transform: rotate(360deg);
    }
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

  .reimbursement-item.selected {
    background: rgba(122, 186, 165, 0.1);
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
    background: rgba(239, 68, 68, 0.1);
    border: 1px solid #ef4444;
    border-radius: 0.5rem;
    color: #ef4444;
    font-size: 0.875rem;
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
  }

  .btn-accent {
    background: var(--acapulco);
    color: white;
  }

  .btn-accent:hover:not(:disabled) {
    opacity: 0.9;
  }

  .btn-danger {
    background: #ef4444;
    color: white;
  }

  @media (max-width: 640px) {
    .modal-body {
      padding: 1rem;
      gap: 1rem;
    }

    .reimbursement-header {
      flex-direction: column;
      gap: 0.5rem;
    }

    .reimbursement-right {
      flex-direction: row;
      justify-content: space-between;
    }
  }
</style>
