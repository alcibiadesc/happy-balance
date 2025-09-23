<script lang="ts">
  import { Check, X } from 'lucide-svelte';
  import { t } from '$lib/stores/i18n';

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

<div class="category-card editing">
  <div class="category-icon-picker">
    <button
      class="icon-display"
      style="background-color: {editForm.color}20"
      aria-expanded={showIconPicker}
      aria-haspopup="listbox"
      onclick={onIconClick}
    >
      {editForm.icon}
    </button>
  </div>

  <div class="category-details">
    <input
      type="text"
      class="category-name-input"
      placeholder={$t('categories.name_placeholder')}
      bind:value={editForm.name}
      onkeydown={(e) => e.key === 'Enter' && onSave()}
    />

    <div class="budget-section">
      <label class="budget-label">{$t('categories.budget_label')}</label>
      <div class="budget-input-group">
        <span class="currency-symbol">{getCurrencySymbol()}</span>
        <input
          type="number"
          class="budget-input"
          placeholder="0"
          bind:value={editForm.annualBudget}
        />
        <span class="budget-period">{$t('categories.per_year')}</span>
      </div>
    </div>

    <div class="color-picker">
      {#each availableColors as color}
        <button
          class="color-option"
          class:selected={editForm.color === color}
          style="background-color: {color}"
          onclick={() => onColorSelect(color)}
        ></button>
      {/each}
    </div>
  </div>

  <div class="category-actions">
    <button class="save-btn" onclick={onSave} title={$t('common.save')}>
      <Check size={14} />
    </button>
    <button class="cancel-btn" onclick={onCancel} title={$t('common.cancel')}>
      <X size={14} />
    </button>
  </div>
</div>

<style>
  .category-card {
    display: flex;
    align-items: flex-start;
    gap: var(--space-md, 1rem);
    padding: var(--space-md, 1rem);
    background: var(--surface);
    border: 1px solid var(--gray-200, #e5e7eb);
    border-radius: var(--radius-md, 0.75rem);
    transition: all 0.2s ease;
  }

  .category-card.editing {
    background: var(--gray-50, #f9fafb);
    border-color: var(--acapulco);
  }

  .category-icon-picker {
    position: relative;
  }

  .icon-display {
    width: 2.5rem;
    height: 2.5rem;
    border-radius: var(--radius-md, 0.75rem);
    border: 1px solid var(--gray-200, #e5e7eb);
    background: var(--surface);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.25rem;
    transition: all 0.2s ease;
  }

  .icon-display:hover {
    border-color: var(--acapulco);
    transform: scale(1.05);
  }

  .category-details {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: var(--space-sm, 0.75rem);
  }

  .category-name-input {
    width: 100%;
    padding: var(--space-xs, 0.5rem) var(--space-sm, 0.75rem);
    border: 1px solid var(--gray-200, #e5e7eb);
    border-radius: var(--radius-sm, 0.5rem);
    background: var(--surface);
    color: var(--text-primary);
    font-size: 0.875rem;
    font-weight: 500;
    transition: all 0.2s ease;
  }

  .category-name-input:focus {
    outline: none;
    border-color: var(--acapulco);
    box-shadow: 0 0 0 3px rgba(122, 186, 165, 0.1);
  }

  .budget-section {
    display: flex;
    flex-direction: column;
    gap: var(--space-xs, 0.25rem);
  }

  .budget-label {
    font-size: 0.75rem;
    font-weight: 500;
    color: var(--text-muted);
  }

  .budget-input-group {
    display: flex;
    align-items: center;
    gap: var(--space-xs, 0.25rem);
  }

  .currency-symbol {
    font-size: 0.875rem;
    color: var(--text-muted);
  }

  .budget-input {
    width: 100px;
    padding: var(--space-xs, 0.25rem) var(--space-sm, 0.5rem);
    border: 1px solid var(--gray-200, #e5e7eb);
    border-radius: var(--radius-sm, 0.375rem);
    background: var(--surface);
    color: var(--text-primary);
    font-size: 0.875rem;
    transition: all 0.2s ease;
  }

  .budget-input:focus {
    outline: none;
    border-color: var(--acapulco);
    box-shadow: 0 0 0 2px rgba(122, 186, 165, 0.1);
  }

  .budget-period {
    font-size: 0.75rem;
    color: var(--text-muted);
  }

  .color-picker {
    display: flex;
    gap: var(--space-xs, 0.25rem);
    flex-wrap: wrap;
  }

  .color-option {
    width: 1.5rem;
    height: 1.5rem;
    border-radius: var(--radius-sm, 0.375rem);
    border: 2px solid transparent;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .color-option:hover {
    transform: scale(1.1);
  }

  .color-option.selected {
    border-color: var(--text-primary);
    box-shadow: 0 0 0 2px var(--surface);
  }

  .category-actions {
    display: flex;
    gap: var(--space-xs, 0.5rem);
    flex-shrink: 0;
  }

  .save-btn,
  .cancel-btn {
    width: 2rem;
    height: 2rem;
    border: 1px solid var(--gray-200, #e5e7eb);
    border-radius: var(--radius-sm, 0.5rem);
    background: var(--surface);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .save-btn {
    background: var(--acapulco);
    color: white;
    border-color: var(--acapulco);
  }

  .save-btn:hover {
    background: rgba(122, 186, 165, 0.9);
  }

  .cancel-btn {
    color: var(--text-muted);
  }

  .cancel-btn:hover {
    background: var(--gray-50, #f9fafb);
    color: var(--text-primary);
    border-color: var(--gray-300, #d1d5db);
  }

  @media (max-width: 640px) {
    .category-card {
      padding: var(--space-sm, 0.75rem);
      gap: var(--space-sm, 0.75rem);
    }

    .color-picker {
      display: grid;
      grid-template-columns: repeat(8, 1fr);
    }
  }
</style>