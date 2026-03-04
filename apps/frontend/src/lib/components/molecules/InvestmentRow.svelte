<script lang="ts">
  import { GripVertical, Star, Plus, Pencil, Trash2, X } from 'lucide-svelte';

  interface Investment {
    id: string;
    name: string;
    symbol?: string | null;
    icon: string;
    color: string;
    currentValue: number;
    netContributions: number;
    profit: number;
    profitPercentage: number;
    highlight?: boolean;
  }

  interface Props {
    investment: Investment;
    index: number;
    isEditing: boolean;
    isDragging: boolean;
    isDragOver: boolean;
    isInlineEditing: boolean;
    inlineEditValue: number;
    editForm: { name: string; currentValue: number; icon: string; color: string };
    formatCurrency: (value: number) => string;
    formatPercentage: (value: number) => string;
    onDragStart: (e: DragEvent, index: number) => void;
    onDragOver: (e: DragEvent, index: number) => void;
    onDragLeave: () => void;
    onDrop: (e: DragEvent, index: number) => void;
    onDragEnd: () => void;
    onClick: () => void;
    onToggleHighlight: () => void;
    onAddHistory: () => void;
    onStartEdit: () => void;
    onDelete: () => void;
    onStartInlineEdit: () => void;
    onSaveInlineEdit: () => void;
    onCancelInlineEdit: () => void;
    onSaveEdit: () => void;
    onCancelEdit: () => void;
    onIconClick: (e: Event) => void;
  }

  let {
    investment,
    index,
    isEditing,
    isDragging,
    isDragOver,
    isInlineEditing,
    inlineEditValue = $bindable(),
    editForm = $bindable(),
    formatCurrency,
    formatPercentage,
    onDragStart,
    onDragOver,
    onDragLeave,
    onDrop,
    onDragEnd,
    onClick,
    onToggleHighlight,
    onAddHistory,
    onStartEdit,
    onDelete,
    onStartInlineEdit,
    onSaveInlineEdit,
    onCancelInlineEdit,
    onSaveEdit,
    onCancelEdit,
    onIconClick,
  }: Props = $props();
</script>

{#if isEditing}
  <!-- Edit Mode -->
  <div class="investment-row editing">
    <button
      class="icon-picker-btn small"
      onclick={onIconClick}
      style="background-color: {editForm.color}"
    >
      {editForm.icon}
    </button>
    <input type="text" class="form-input name" bind:value={editForm.name} />
    <input type="number" class="form-input value" bind:value={editForm.currentValue} step="0.01" />
    <div class="row-actions">
      <button class="btn-icon" onclick={onCancelEdit}>
        <X size={16} />
      </button>
      <button class="btn-icon primary" onclick={onSaveEdit}>
        <Plus size={16} />
      </button>
    </div>
  </div>
{:else}
  <!-- Display Mode with Drag-and-Drop -->
  <div
    class="investment-row"
    class:highlighted={investment.highlight}
    class:dragging={isDragging}
    class:drag-over={isDragOver}
    draggable="true"
    ondragstart={(e) => onDragStart(e, index)}
    ondragover={(e) => onDragOver(e, index)}
    ondragleave={onDragLeave}
    ondrop={(e) => onDrop(e, index)}
    ondragend={onDragEnd}
    onclick={onClick}
    role="button"
    tabindex="0"
  >
    <div class="drag-handle" onclick={(e) => e.stopPropagation()}>
      <GripVertical size={14} />
    </div>
    <div class="row-icon" style="background-color: {investment.color}">
      {investment.icon}
    </div>
    <div class="row-info">
      <span class="row-name">{investment.name}</span>
      {#if investment.symbol}
        <span class="row-symbol">{investment.symbol}</span>
      {/if}
    </div>
    <div class="row-value" onclick={(e) => e.stopPropagation()}>
      {#if isInlineEditing}
        <input
          type="number"
          class="inline-edit-input"
          bind:value={inlineEditValue}
          onblur={onSaveInlineEdit}
          onkeydown={(e) => {
            if (e.key === 'Enter') onSaveInlineEdit();
            if (e.key === 'Escape') onCancelInlineEdit();
          }}
          step="0.01"
        />
      {:else}
        <span class="value editable" onclick={onStartInlineEdit} title="Click para editar">
          {formatCurrency(investment.currentValue)}
        </span>
      {/if}
      {#if investment.netContributions > 0}
        <div class="profit-pills">
          <span
            class="pill amount"
            class:positive={investment.profit >= 0}
            class:negative={investment.profit < 0}
          >
            {investment.profit >= 0 ? '+' : ''}{formatCurrency(investment.profit)}
          </span>
          <span
            class="pill pct"
            class:positive={investment.profit >= 0}
            class:negative={investment.profit < 0}
          >
            {formatPercentage(investment.profitPercentage)}
          </span>
        </div>
      {/if}
    </div>
    <div class="row-actions" onclick={(e) => e.stopPropagation()}>
      <button class="btn-icon" class:active={investment.highlight} onclick={onToggleHighlight}>
        <Star size={14} fill={investment.highlight ? 'currentColor' : 'none'} />
      </button>
      <button class="btn-icon" onclick={onAddHistory}>
        <Plus size={14} />
      </button>
      <button class="btn-icon" onclick={onStartEdit}>
        <Pencil size={14} />
      </button>
      <button class="btn-icon danger" onclick={onDelete}>
        <Trash2 size={14} />
      </button>
    </div>
  </div>
{/if}

<style>
  .investment-row {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.875rem 1rem;
    background: var(--surface-elevated);
    border: 1px solid var(--border-color);
    border-radius: 10px;
    cursor: pointer;
    transition: all 0.15s ease;
    position: relative;
  }

  .investment-row:hover {
    border-color: var(--primary);
  }

  .investment-row.highlighted {
    border-color: #f59e0b;
    background: rgba(245, 158, 11, 0.05);
  }

  .investment-row.dragging {
    opacity: 0.5;
    transform: scale(0.98);
  }

  .investment-row.drag-over {
    border-color: var(--primary);
    background: rgba(122, 186, 165, 0.1);
  }

  .investment-row.editing {
    cursor: default;
  }

  .drag-handle {
    cursor: grab;
    color: var(--text-muted);
    padding: 0.25rem;
    opacity: 0.5;
    transition: opacity 0.15s;
  }

  .investment-row:hover .drag-handle {
    opacity: 1;
  }

  .row-icon {
    width: 36px;
    height: 36px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.125rem;
    flex-shrink: 0;
  }

  .row-info {
    flex: 1;
    min-width: 0;
  }

  .row-name {
    display: block;
    font-weight: 500;
    color: var(--text-primary);
    font-size: 0.875rem;
  }

  .row-symbol {
    font-size: 0.6875rem;
    color: var(--text-muted);
    text-transform: uppercase;
  }

  .row-value {
    text-align: right;
    min-width: 120px;
  }

  .value {
    font-weight: 600;
    font-size: 0.9375rem;
    color: var(--text-primary);
    display: block;
  }

  .value.editable {
    cursor: text;
    padding: 0.125rem 0.25rem;
    border-radius: 4px;
    transition: background 0.15s;
  }

  .value.editable:hover {
    background: var(--surface-muted);
  }

  .inline-edit-input {
    width: 100px;
    padding: 0.25rem 0.5rem;
    border: 1px solid var(--primary);
    border-radius: 4px;
    background: var(--surface);
    color: var(--text-primary);
    font-size: 0.875rem;
    text-align: right;
  }

  .profit-pills {
    display: flex;
    gap: 0.375rem;
    justify-content: flex-end;
    margin-top: 0.25rem;
  }

  .pill {
    font-size: 0.6875rem;
    padding: 0.125rem 0.375rem;
    border-radius: 4px;
    font-weight: 500;
  }

  .pill.positive {
    background: rgba(16, 185, 129, 0.1);
    color: #10b981;
  }

  .pill.negative {
    background: rgba(239, 68, 68, 0.1);
    color: #ef4444;
  }

  .row-actions {
    display: flex;
    gap: 0.25rem;
  }

  .btn-icon {
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--surface-muted);
    border: 1px solid var(--border-color);
    border-radius: 6px;
    color: var(--text-muted);
    cursor: pointer;
    transition: all 0.15s;
  }

  .btn-icon:hover {
    background: var(--primary);
    border-color: var(--primary);
    color: white;
  }

  .btn-icon.primary {
    background: var(--primary);
    border-color: var(--primary);
    color: white;
  }

  .btn-icon.danger:hover {
    background: #ef4444;
    border-color: #ef4444;
  }

  .btn-icon.active {
    color: #f59e0b;
  }

  /* Form inputs */
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
    min-width: 120px;
  }

  .form-input.value {
    width: 100px;
    text-align: right;
  }

  .icon-picker-btn {
    width: 36px;
    height: 36px;
    border-radius: 8px;
    border: none;
    font-size: 1.125rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .icon-picker-btn.small {
    width: 32px;
    height: 32px;
    font-size: 1rem;
  }

  @media (max-width: 640px) {
    .investment-row {
      flex-wrap: wrap;
      padding: 0.75rem;
      padding-bottom: 3rem;
    }

    .drag-handle {
      display: none;
    }

    .row-icon {
      width: 32px;
      height: 32px;
      font-size: 1rem;
    }

    .row-info {
      flex: 1;
      min-width: 0;
    }

    .row-name {
      font-size: 0.8125rem;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .row-value {
      min-width: auto;
      text-align: right;
    }

    .value {
      font-size: 0.875rem;
    }

    .profit-pills {
      gap: 0.25rem;
    }

    .pill {
      font-size: 0.625rem;
      padding: 0.0625rem 0.25rem;
    }

    .row-actions {
      position: absolute;
      right: 0.5rem;
      bottom: 0.5rem;
      left: 0.5rem;
      justify-content: flex-end;
      background: var(--surface-elevated);
      padding-top: 0.5rem;
      border-top: 1px solid var(--border-color);
    }

    .btn-icon {
      width: 32px;
      height: 32px;
    }

    .investment-row.editing {
      flex-direction: column;
      gap: 0.5rem;
      padding-bottom: 0.75rem;
    }

    .investment-row.editing .form-input.name {
      width: 100%;
    }

    .investment-row.editing .form-input.value {
      width: 100%;
    }

    .investment-row.editing .row-actions {
      position: static;
      border-top: none;
      padding-top: 0;
      justify-content: flex-end;
    }
  }

  @media (max-width: 360px) {
    .investment-row {
      padding: 0.625rem;
      padding-bottom: 2.75rem;
      gap: 0.5rem;
    }

    .row-icon {
      width: 28px;
      height: 28px;
      font-size: 0.875rem;
      border-radius: 6px;
    }

    .row-name {
      font-size: 0.75rem;
    }

    .row-symbol {
      font-size: 0.625rem;
    }

    .value {
      font-size: 0.8125rem;
    }

    .pill {
      font-size: 0.5625rem;
    }

    .btn-icon {
      width: 28px;
      height: 28px;
    }

    .row-actions {
      gap: 0.125rem;
    }
  }
</style>
