<script lang="ts">
  import { X } from 'lucide-svelte';
  import { modalKeyboard } from '$lib/actions/modalKeyboard';

  interface FormData {
    type: 'CONTRIBUTION' | 'WITHDRAWAL' | 'VALUE_UPDATE';
    amount: number;
    date: string;
    notes: string;
  }

  interface Props {
    isOpen: boolean;
    formData: FormData;
    onSave: () => void;
    onCancel: () => void;
  }

  let { isOpen, formData = $bindable(), onSave, onCancel }: Props = $props();

  function handleSubmit(e: Event) {
    e.preventDefault();
    onSave();
  }
</script>

{#if isOpen}
  <div
    use:modalKeyboard={{
      onConfirm: onSave,
      onCancel: onCancel,
      isOpen: isOpen,
    }}
  ></div>
  <div class="overlay" onclick={onCancel} role="dialog" aria-modal="true">
    <div class="modal" onclick={(e) => e.stopPropagation()}>
      <div class="header">
        <h3>Añadir movimiento</h3>
        <button class="btn-close" onclick={onCancel}>
          <X size={18} />
        </button>
      </div>
      <form class="body" onsubmit={handleSubmit}>
        <div class="form-group">
          <label for="history-type">Tipo</label>
          <select id="history-type" bind:value={formData.type}>
            <option value="CONTRIBUTION">Aportación</option>
            <option value="WITHDRAWAL">Retirada</option>
            <option value="VALUE_UPDATE">Actualización</option>
          </select>
        </div>
        <div class="form-group">
          <label for="history-amount">Cantidad</label>
          <input
            id="history-amount"
            type="number"
            step="0.01"
            min="0.01"
            required
            bind:value={formData.amount}
          />
        </div>
        <div class="form-group">
          <label for="history-date">Fecha</label>
          <input id="history-date" type="date" required bind:value={formData.date} />
        </div>
        <div class="form-group">
          <label for="history-notes">Notas</label>
          <input
            id="history-notes"
            type="text"
            bind:value={formData.notes}
            placeholder="Opcional"
          />
        </div>
        <div class="footer">
          <button type="button" class="btn-cancel" onclick={onCancel}>Cancelar</button>
          <button type="submit" class="btn-save">Guardar</button>
        </div>
      </form>
    </div>
  </div>
{/if}

<style>
  .overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(4px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 100;
    padding: 1rem;
  }

  .modal {
    background: var(--surface-elevated);
    border: 1px solid var(--border-color);
    border-radius: 16px;
    width: 100%;
    max-width: 400px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  }

  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.25rem 1.5rem;
    border-bottom: 1px solid var(--border-color);
  }

  .header h3 {
    margin: 0;
    font-size: 1.125rem;
    font-weight: 600;
    color: var(--text-primary);
  }

  .btn-close {
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--surface-muted);
    border: 1px solid var(--border-color);
    border-radius: 8px;
    color: var(--text-muted);
    cursor: pointer;
    transition: all 0.15s;
  }

  .btn-close:hover {
    background: var(--surface-hover);
    color: var(--text-primary);
  }

  .body {
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 0.375rem;
  }

  .form-group label {
    font-size: 0.8125rem;
    font-weight: 500;
    color: var(--text-secondary);
  }

  .form-group input,
  .form-group select {
    padding: 0.625rem 0.875rem;
    border: 1px solid var(--border-color);
    border-radius: 8px;
    background: var(--surface);
    color: var(--text-primary);
    font-size: 0.9375rem;
    transition: border-color 0.15s;
  }

  .form-group input:focus,
  .form-group select:focus {
    outline: none;
    border-color: var(--primary);
  }

  .footer {
    display: flex;
    gap: 0.75rem;
    margin-top: 0.5rem;
  }

  .btn-cancel,
  .btn-save {
    flex: 1;
    padding: 0.75rem 1rem;
    border-radius: 8px;
    font-weight: 500;
    font-size: 0.9375rem;
    cursor: pointer;
    transition: all 0.15s;
  }

  .btn-cancel {
    background: var(--surface-muted);
    border: 1px solid var(--border-color);
    color: var(--text-secondary);
  }

  .btn-cancel:hover {
    background: var(--surface-hover);
    color: var(--text-primary);
  }

  .btn-save {
    background: var(--primary);
    border: none;
    color: white;
  }

  .btn-save:hover {
    background: var(--primary-hover);
  }
</style>
