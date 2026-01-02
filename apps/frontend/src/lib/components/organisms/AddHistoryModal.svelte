<script lang="ts">
  import Modal from '$lib/components/atoms/Modal.svelte';

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

<Modal open={isOpen} onclose={onCancel} title="Añadir movimiento" size="sm">
  <form class="form-body" onsubmit={handleSubmit}>
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
      <input id="history-notes" type="text" bind:value={formData.notes} placeholder="Opcional" />
    </div>
    <div class="footer">
      <button type="button" class="btn-cancel" onclick={onCancel}>Cancelar</button>
      <button type="submit" class="btn-save">Guardar</button>
    </div>
  </form>
</Modal>

<style>
  .form-body {
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
