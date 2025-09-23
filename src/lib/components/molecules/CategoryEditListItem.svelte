<script lang="ts">
  import { Check, X } from 'lucide-svelte';

  interface EditForm {
    name: string;
    icon: string;
    color: string;
    annualBudget: number;
    type: string;
  }

  interface Props {
    editForm: EditForm;
    availableColors: string[];
    getCurrencySymbol: () => string;
    onSave: () => void;
    onCancel: () => void;
    onIconClick: (e: Event) => void;
    onColorSelect: (color: string) => void;
    showIconPicker: boolean;
  }

  let {
    editForm,
    availableColors,
    getCurrencySymbol,
    onSave,
    onCancel,
    onIconClick,
    onColorSelect,
    showIconPicker
  }: Props = $props();
</script>

<div class="category-item editing">
  <div class="item-left">
    <button
      class="icon-display"
      style="background-color: {editForm.color}20"
      aria-expanded={showIconPicker}
      aria-haspopup="listbox"
      onclick={onIconClick}
    >
      {editForm.icon}
    </button>

    <input
      type="text"
      class="category-name-input"
      placeholder="Nombre de la categoría"
      bind:value={editForm.name}
      onkeydown={(e) => e.key === 'Enter' && onSave()}
    />
  </div>

  <div class="item-right">
    <div class="budget-input-group">
      <span class="currency-symbol">{getCurrencySymbol()}</span>
      <input
        type="number"
        class="budget-input"
        placeholder="0"
        bind:value={editForm.annualBudget}
      />
      <span class="budget-period">/ año</span>
    </div>

    <div class="color-picker">
      {#each availableColors.slice(0, 8) as color}
        <button
          class="color-option"
          class:selected={editForm.color === color}
          style="background-color: {color}"
          onclick={() => onColorSelect(color)}
        ></button>
      {/each}
    </div>

    <div class="category-actions">
      <button class="save-btn" onclick={onSave} title="Guardar">
        <Check size={14} />
      </button>
      <button class="cancel-btn" onclick={onCancel} title="Cancelar">
        <X size={14} />
      </button>
    </div>
  </div>
</div>

<style>
  /* Category Edit List Item */
  .category-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.75rem 0;
    border-bottom: 1px solid var(--border-color);
    transition: all 0.2s ease;
  }

  .category-item.editing {
    background: rgba(122, 186, 165, 0.03);
    padding: 0.75rem;
    margin: 0 -0.75rem;
    border-bottom-color: var(--acapulco);
  }

  .item-left {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex: 1;
  }

  .item-right {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .icon-display {
    width: 2.25rem;
    height: 2.25rem;
    border: 2px dashed var(--border-color);
    border-radius: 0.5rem;
    font-size: 1.125rem;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s ease;
    flex-shrink: 0;
  }

  .icon-display:hover {
    border-color: var(--acapulco);
    transform: scale(1.05);
  }

  .category-name-input {
    flex: 1;
    max-width: 200px;
    padding: 0.375rem 0.5rem;
    border: 1px solid var(--border-color);
    border-radius: 0.375rem;
    background: var(--surface);
    color: var(--text-primary);
    font-size: 0.875rem;
    font-weight: 500;
    transition: all 0.2s ease;
  }

  .category-name-input:focus {
    outline: none;
    border-color: var(--acapulco);
    box-shadow: 0 0 0 2px rgba(122, 186, 165, 0.1);
  }

  .budget-input-group {
    display: flex;
    align-items: center;
    gap: 0.25rem;
  }

  .currency-symbol {
    font-size: 0.8125rem;
    color: var(--text-muted);
  }

  .budget-input {
    width: 80px;
    padding: 0.25rem 0.375rem;
    border: 1px solid var(--border-color);
    border-radius: 0.375rem;
    background: var(--surface);
    color: var(--text-primary);
    font-size: 0.8125rem;
    transition: all 0.2s ease;
  }

  .budget-input:focus {
    outline: none;
    border-color: var(--acapulco);
    box-shadow: 0 0 0 2px rgba(122, 186, 165, 0.1);
  }

  .budget-period {
    font-size: 0.8125rem;
    color: var(--text-muted);
  }

  .color-picker {
    display: flex;
    gap: 0.25rem;
  }

  .color-option {
    width: 1.25rem;
    height: 1.25rem;
    border-radius: 0.25rem;
    border: 2px solid transparent;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .color-option:hover {
    transform: scale(1.1);
  }

  .color-option.selected {
    border-color: var(--text-primary);
    box-shadow: 0 0 0 1px var(--surface-elevated);
  }

  .category-actions {
    display: flex;
    gap: 0.25rem;
    flex-shrink: 0;
  }

  .save-btn,
  .cancel-btn {
    width: 1.75rem;
    height: 1.75rem;
    border: none;
    border-radius: 0.375rem;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .save-btn {
    background: var(--acapulco);
    color: white;
  }

  .save-btn:hover {
    background: rgba(122, 186, 165, 0.9);
  }

  .cancel-btn {
    background: rgba(0, 0, 0, 0.05);
    color: var(--text-muted);
  }

  .cancel-btn:hover {
    background: rgba(0, 0, 0, 0.1);
    color: var(--text-primary);
  }

  /* Mobile */
  @media (max-width: 640px) {
    .category-name-input {
      max-width: 150px;
    }

    .color-picker {
      display: none;
    }
  }
</style>