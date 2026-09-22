<script lang="ts">
  import { BrainCircuit, Check, X, AlertTriangle, Loader2 } from 'lucide-svelte';
  import {
    aiCategorizeTransactions,
    type AiProposal,
  } from '$lib/modules/transactions/application/services/CategoryService';

  interface Props {
    open: boolean;
    onClose: () => void;
    /** Called after proposals are written so the page can reload. */
    onApplied: (count: number) => void;
  }

  let { open = false, onClose, onApplied }: Props = $props();

  type Phase = 'idle' | 'scanning' | 'review' | 'applying' | 'done' | 'error';

  let phase = $state<Phase>('idle');
  let proposals = $state<AiProposal[]>([]);
  let chosen = $state<Set<string>>(new Set());
  let examined = $state(0);
  let undecided = $state(0);
  let model = $state('');
  let usage = $state({ inputTokens: 0, outputTokens: 0, batches: 0 });
  let warnings = $state<string[]>([]);
  let errorMessage = $state('');
  let appliedCount = $state(0);
  let learnPatterns = $state(true);
  /** Anything under this is listed but not pre-selected. */
  let minConfidence = $state(0.75);

  const selectedCount = $derived(chosen.size);

  const eurFormat = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' });

  function formatMoney(amount: number, currency: string): string {
    if (currency === 'EUR') return eurFormat.format(amount);
    return `${amount.toFixed(2)} ${currency}`;
  }

  function confidenceClass(confidence: number): string {
    if (confidence >= 0.85) return 'high';
    if (confidence >= minConfidence) return 'mid';
    return 'low';
  }

  function toggle(transactionId: string) {
    const next = new Set(chosen);
    if (next.has(transactionId)) next.delete(transactionId);
    else next.add(transactionId);
    chosen = next;
  }

  function selectAll() {
    chosen = new Set(proposals.map((p) => p.transactionId));
  }

  function selectConfident() {
    chosen = new Set(
      proposals.filter((p) => p.confidence >= minConfidence).map((p) => p.transactionId)
    );
  }

  function selectNone() {
    chosen = new Set();
  }

  async function scan() {
    phase = 'scanning';
    errorMessage = '';
    warnings = [];

    // Dry run: nothing is written until the user picks rows below.
    const result = await aiCategorizeTransactions({ apply: false, minConfidence });

    if (!result.success) {
      phase = 'error';
      errorMessage = result.message || 'La clasificación con IA ha fallado';
      return;
    }

    if (!result.configured) {
      phase = 'error';
      errorMessage =
        result.warnings[0] ??
        'Falta la clave ANTHROPIC_API_KEY en el backend: la clasificación con IA está desactivada.';
      return;
    }

    proposals = result.proposals;
    examined = result.examined;
    undecided = result.undecided;
    model = result.model;
    usage = result.usage;
    warnings = result.warnings;
    selectConfident();
    phase = 'review';
  }

  async function apply() {
    if (chosen.size === 0) return;
    phase = 'applying';

    const result = await aiCategorizeTransactions({
      apply: true,
      // 0 so every reviewed row is written: the user's tick is the threshold now.
      minConfidence: 0,
      transactionIds: [...chosen],
      learnPatterns,
    });

    if (!result.success) {
      phase = 'error';
      errorMessage = result.message || 'No se pudieron aplicar las propuestas';
      return;
    }

    appliedCount = result.appliedCount;
    warnings = result.warnings;
    phase = 'done';
    onApplied(result.appliedCount);
  }

  function close() {
    phase = 'idle';
    proposals = [];
    chosen = new Set();
    errorMessage = '';
    warnings = [];
    onClose();
  }

  // Start scanning as soon as the modal is opened.
  $effect(() => {
    if (open && phase === 'idle') {
      void scan();
    }
  });
</script>

{#if open}
  <div
    class="ai-backdrop"
    role="button"
    tabindex="-1"
    onclick={close}
    onkeydown={(e) => e.key === 'Escape' && close()}
  >
    <div
      class="ai-modal"
      role="dialog"
      aria-modal="true"
      aria-label="Clasificar con IA"
      tabindex="-1"
      onclick={(e) => e.stopPropagation()}
      onkeydown={(e) => e.stopPropagation()}
    >
      <header class="ai-header">
        <div class="ai-title">
          <BrainCircuit size={18} />
          <div>
            <h2>Clasificar con IA</h2>
            {#if model}<p class="ai-sub">{model}</p>{/if}
          </div>
        </div>
        <button class="ai-close" onclick={close} aria-label="Cerrar"><X size={18} /></button>
      </header>

      <div class="ai-body">
        {#if phase === 'scanning'}
          <div class="ai-center">
            <Loader2 size={28} class="ai-spin" />
            <p>Leyendo los movimientos sin categoría…</p>
            <p class="ai-hint">No se escribe nada todavía.</p>
          </div>
        {:else if phase === 'applying'}
          <div class="ai-center">
            <Loader2 size={28} class="ai-spin" />
            <p>Aplicando {selectedCount} categorías…</p>
          </div>
        {:else if phase === 'error'}
          <div class="ai-center ai-error">
            <AlertTriangle size={28} />
            <p>{errorMessage}</p>
            <button class="ai-btn" onclick={scan}>Reintentar</button>
          </div>
        {:else if phase === 'done'}
          <div class="ai-center ai-ok">
            <Check size={28} />
            <p>{appliedCount} movimientos clasificados.</p>
            {#if warnings.length}
              <ul class="ai-warnings">
                {#each warnings as warning (warning)}<li>{warning}</li>{/each}
              </ul>
            {/if}
          </div>
        {:else if phase === 'review'}
          {#if proposals.length === 0}
            <div class="ai-center">
              <Check size={28} />
              <p>
                {examined === 0
                  ? 'No hay movimientos sin categoría.'
                  : `Revisados ${examined}, pero la IA no ha propuesto nada con criterio suficiente.`}
              </p>
            </div>
          {:else}
            <div class="ai-summary">
              <span><strong>{proposals.length}</strong> propuestas de {examined} revisados</span>
              {#if undecided > 0}<span class="ai-muted">{undecided} sin decidir</span>{/if}
              <span class="ai-muted">
                {usage.inputTokens.toLocaleString('es-ES')} tokens in ·
                {usage.outputTokens.toLocaleString('es-ES')} out ·
                {usage.batches}
                {usage.batches === 1 ? 'lote' : 'lotes'}
              </span>
            </div>

            <div class="ai-controls">
              <button class="ai-chip" onclick={selectConfident}>
                Solo fiables (≥{Math.round(minConfidence * 100)}%)
              </button>
              <button class="ai-chip" onclick={selectAll}>Todas</button>
              <button class="ai-chip" onclick={selectNone}>Ninguna</button>
              <label class="ai-learn">
                <input type="checkbox" bind:checked={learnPatterns} />
                Aprender el patrón del comercio
              </label>
            </div>

            <ul class="ai-list">
              {#each proposals as proposal (proposal.transactionId)}
                <li class="ai-row" class:picked={chosen.has(proposal.transactionId)}>
                  <label class="ai-row-label">
                    <input
                      type="checkbox"
                      checked={chosen.has(proposal.transactionId)}
                      onchange={() => toggle(proposal.transactionId)}
                    />
                    <span class="ai-merchant">
                      <strong>{proposal.merchant}</strong>
                      <span class="ai-meta">
                        {proposal.date} ·
                        {formatMoney(proposal.amount, proposal.currency)}
                        {#if proposal.description}· {proposal.description}{/if}
                      </span>
                    </span>
                    <span class="ai-cat" style="--cat: {proposal.categoryColor}">
                      {proposal.categoryIcon}
                      {proposal.categoryName}
                    </span>
                    <span class="ai-conf {confidenceClass(proposal.confidence)}">
                      {Math.round(proposal.confidence * 100)}%
                    </span>
                  </label>
                  {#if proposal.reason}
                    <p class="ai-reason">{proposal.reason}</p>
                  {/if}
                </li>
              {/each}
            </ul>
          {/if}
        {/if}
      </div>

      <footer class="ai-footer">
        <button class="ai-btn ghost" onclick={close}>
          {phase === 'done' ? 'Cerrar' : 'Cancelar'}
        </button>
        {#if phase === 'review' && proposals.length > 0}
          <button class="ai-btn primary" onclick={apply} disabled={selectedCount === 0}>
            Aplicar {selectedCount > 0 ? selectedCount : ''}
          </button>
        {/if}
      </footer>
    </div>
  </div>
{/if}

<style>
  .ai-backdrop {
    position: fixed;
    inset: 0;
    background: rgb(0 0 0 / 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1rem;
    z-index: 1000;
  }

  .ai-modal {
    background: var(--color-surface, #fff);
    color: var(--color-text, #111);
    border-radius: 16px;
    width: min(760px, 100%);
    max-height: min(88vh, 900px);
    display: flex;
    flex-direction: column;
    box-shadow: 0 24px 60px rgb(0 0 0 / 0.28);
    overflow: hidden;
  }

  .ai-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    padding: 1rem 1.25rem;
    border-bottom: 1px solid var(--color-border, #e5e7eb);
  }

  .ai-title {
    display: flex;
    align-items: center;
    gap: 0.65rem;
  }

  .ai-title h2 {
    margin: 0;
    font-size: 1rem;
    font-weight: 600;
  }

  .ai-sub {
    margin: 0.1rem 0 0;
    font-size: 0.72rem;
    font-family: ui-monospace, SFMono-Regular, monospace;
    opacity: 0.6;
  }

  .ai-close {
    background: none;
    border: none;
    cursor: pointer;
    color: inherit;
    opacity: 0.6;
    padding: 0.25rem;
    border-radius: 8px;
  }

  .ai-close:hover {
    opacity: 1;
    background: var(--color-surface-hover, #f3f4f6);
  }

  .ai-body {
    flex: 1;
    overflow-y: auto;
    padding: 1rem 1.25rem;
  }

  .ai-center {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.6rem;
    padding: 2.5rem 1rem;
    text-align: center;
  }

  .ai-center p {
    margin: 0;
  }

  .ai-hint {
    font-size: 0.8rem;
    opacity: 0.6;
  }

  .ai-error {
    color: var(--color-danger, #dc2626);
  }

  .ai-ok {
    color: var(--color-success, #16a34a);
  }

  :global(.ai-spin) {
    animation: ai-rotate 1s linear infinite;
  }

  @keyframes ai-rotate {
    to {
      transform: rotate(360deg);
    }
  }

  .ai-summary {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
    font-size: 0.82rem;
    margin-bottom: 0.75rem;
  }

  .ai-muted {
    opacity: 0.6;
  }

  .ai-controls {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.5rem;
    padding-bottom: 0.75rem;
    border-bottom: 1px solid var(--color-border, #e5e7eb);
    margin-bottom: 0.5rem;
  }

  .ai-chip {
    border: 1px solid var(--color-border, #e5e7eb);
    background: none;
    color: inherit;
    border-radius: 999px;
    padding: 0.25rem 0.7rem;
    font-size: 0.78rem;
    cursor: pointer;
  }

  .ai-chip:hover {
    background: var(--color-surface-hover, #f3f4f6);
  }

  .ai-learn {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    font-size: 0.78rem;
    margin-left: auto;
    cursor: pointer;
  }

  .ai-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
  }

  .ai-row {
    border-bottom: 1px solid var(--color-border, #e5e7eb);
    padding: 0.55rem 0.35rem;
    border-radius: 8px;
  }

  .ai-row.picked {
    background: var(--color-surface-hover, #f6f8ff);
  }

  .ai-row-label {
    display: grid;
    grid-template-columns: auto 1fr auto auto;
    align-items: center;
    gap: 0.65rem;
    cursor: pointer;
  }

  .ai-merchant {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }

  .ai-merchant strong {
    font-size: 0.86rem;
    font-weight: 600;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .ai-meta {
    font-size: 0.72rem;
    opacity: 0.62;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .ai-cat {
    font-size: 0.78rem;
    padding: 0.2rem 0.55rem;
    border-radius: 999px;
    border: 1px solid var(--cat);
    color: var(--cat);
    white-space: nowrap;
  }

  .ai-conf {
    font-size: 0.75rem;
    font-variant-numeric: tabular-nums;
    font-weight: 600;
    min-width: 3ch;
    text-align: right;
  }

  .ai-conf.high {
    color: var(--color-success, #16a34a);
  }

  .ai-conf.mid {
    color: var(--color-warning, #d97706);
  }

  .ai-conf.low {
    color: var(--color-danger, #dc2626);
  }

  .ai-reason {
    margin: 0.2rem 0 0 2.1rem;
    font-size: 0.73rem;
    opacity: 0.65;
  }

  .ai-warnings {
    margin: 0.5rem 0 0;
    padding-left: 1.1rem;
    font-size: 0.75rem;
    text-align: left;
    opacity: 0.75;
  }

  .ai-footer {
    display: flex;
    justify-content: flex-end;
    gap: 0.6rem;
    padding: 0.85rem 1.25rem;
    border-top: 1px solid var(--color-border, #e5e7eb);
  }

  .ai-btn {
    border-radius: 10px;
    padding: 0.5rem 1rem;
    font-size: 0.85rem;
    font-weight: 500;
    cursor: pointer;
    border: 1px solid var(--color-border, #e5e7eb);
    background: none;
    color: inherit;
  }

  .ai-btn.primary {
    background: var(--color-primary, #4f46e5);
    border-color: transparent;
    color: #fff;
  }

  .ai-btn.primary:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }

  .ai-btn.ghost:hover {
    background: var(--color-surface-hover, #f3f4f6);
  }

  @media (max-width: 640px) {
    .ai-row-label {
      grid-template-columns: auto 1fr;
      grid-template-areas:
        'check merchant'
        '. cat';
      row-gap: 0.35rem;
    }

    .ai-row-label input {
      grid-area: check;
    }

    .ai-merchant {
      grid-area: merchant;
    }

    .ai-cat {
      grid-area: cat;
      justify-self: start;
    }

    .ai-conf {
      display: none;
    }
  }
</style>
