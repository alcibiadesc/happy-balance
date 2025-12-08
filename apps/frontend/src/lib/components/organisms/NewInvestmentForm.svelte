<script lang="ts">
  interface FormData {
    name: string;
    currentValue: number;
    icon: string;
    color: string;
  }

  interface Props {
    formData: FormData;
    availableColors: string[];
    onIconClick: (e: Event) => void;
    onSave: () => void;
    onCancel: () => void;
  }

  let { formData = $bindable(), availableColors, onIconClick, onSave, onCancel }: Props = $props();
</script>

<div class="investment-form">
  <div class="form-row">
    <button
      class="icon-picker-btn"
      onclick={onIconClick}
      style="background-color: {formData.color}"
    >
      {formData.icon}
    </button>
    <input type="text" class="form-input name" bind:value={formData.name} placeholder="Nombre" />
    <input
      type="number"
      class="form-input value"
      bind:value={formData.currentValue}
      placeholder="Valor"
      step="0.01"
    />
  </div>
  <div class="form-row colors">
    {#each availableColors as color (color)}
      <button
        class="color-dot"
        class:selected={formData.color === color}
        style="background-color: {color}"
        onclick={() => (formData.color = color)}
      />
    {/each}
  </div>
  <div class="form-actions">
    <button class="btn-cancel" onclick={onCancel}>Cancelar</button>
    <button class="btn-save" onclick={onSave}>Guardar</button>
  </div>
</div>

<style>
  .investment-form {
    background: var(--surface);
    border: 1px solid var(--border-color);
    border-radius: 8px;
    padding: 1rem;
    margin-bottom: 1rem;
  }

  .form-row {
    display: flex;
    gap: 0.75rem;
    align-items: center;
    margin-bottom: 0.75rem;
  }

  .form-row.colors {
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .icon-picker-btn {
    width: 40px;
    height: 40px;
    border: none;
    border-radius: 8px;
    font-size: 1.25rem;
    cursor: pointer;
  }

  .form-input {
    padding: 0.5rem 0.75rem;
    border: 1px solid var(--border-color);
    border-radius: 6px;
    background: var(--surface);
    color: var(--text-primary);
    font-size: 0.875rem;
  }

  .form-input.name {
    flex: 1;
  }

  .form-input.value {
    width: 100px;
  }

  .color-dot {
    width: 24px;
    height: 24px;
    border: 2px solid transparent;
    border-radius: 50%;
    cursor: pointer;
  }

  .color-dot.selected {
    border-color: var(--text-primary);
    transform: scale(1.1);
  }

  .form-actions {
    display: flex;
    justify-content: flex-end;
    gap: 0.5rem;
  }

  .btn-cancel,
  .btn-save {
    padding: 0.5rem 1rem;
    border-radius: 6px;
    font-size: 0.8125rem;
    cursor: pointer;
  }

  .btn-cancel {
    background: var(--surface);
    border: 1px solid var(--border-color);
    color: var(--text-primary);
  }

  .btn-save {
    background: var(--primary);
    color: white;
    border: none;
    font-weight: 500;
  }
</style>
