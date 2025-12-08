<script lang="ts">
  import { Menu, ChevronDown, ChevronUp, GripVertical } from 'lucide-svelte';
  import { t } from '$lib/stores/i18n';
  import { sidebarConfig } from '$lib/stores/sidebarConfig';

  // Props
  interface Props {
    expanded?: boolean;
  }

  let { expanded = $bindable(false) }: Props = $props();

  // Drag state
  let draggedId = $state<string | null>(null);
  let dragOverId = $state<string | null>(null);

  function handleDragStart(e: DragEvent, id: string) {
    draggedId = id;
    e.dataTransfer!.effectAllowed = 'move';
    e.dataTransfer!.setData('sidebar-item', id);
  }

  function handleDragEnd() {
    draggedId = null;
    dragOverId = null;
  }

  function handleDragOver(e: DragEvent, id: string) {
    e.preventDefault();
    if (draggedId && draggedId !== id) {
      dragOverId = id;
    }
  }

  function handleDragLeave() {
    dragOverId = null;
  }

  function handleDrop(e: DragEvent, toId: string) {
    e.preventDefault();
    const fromId = e.dataTransfer!.getData('sidebar-item');
    if (fromId && fromId !== toId) {
      sidebarConfig.reorderItems(fromId, toId);
    }
    draggedId = null;
    dragOverId = null;
  }

  function toggleExpanded() {
    expanded = !expanded;
  }
</script>

<section class="settings-section">
  <button class="section-title clickable" onclick={toggleExpanded}>
    <Menu size={18} />
    <span>{$t('settings.sidebar') || 'Sidebar'}</span>
    {#if expanded}<ChevronUp size={16} />{:else}<ChevronDown size={16} />{/if}
  </button>

  {#if expanded}
    <div class="sidebar-config">
      <!-- Main Navigation -->
      <p class="sidebar-group-label">Main Navigation</p>
      <div class="sidebar-list">
        {#each sidebarConfig.getTopItems($sidebarConfig) as item (item.id)}
          <div
            class="sidebar-item"
            class:disabled={!item.visible && !item.required}
            class:dragging={draggedId === item.id}
            class:drag-over={dragOverId === item.id}
            draggable="true"
            ondragstart={(e) => handleDragStart(e, item.id)}
            ondragend={handleDragEnd}
            ondragover={(e) => handleDragOver(e, item.id)}
            ondragleave={handleDragLeave}
            ondrop={(e) => handleDrop(e, item.id)}
            role="listitem"
          >
            <div class="sidebar-item-left">
              <span class="drag-handle">
                <GripVertical size={16} />
              </span>
              <span class="item-name">{$t(item.labelKey)}</span>
              {#if item.required}
                <span class="item-badge required">Required</span>
              {:else if !item.visible}
                <span class="item-badge hidden">Hidden</span>
              {/if}
            </div>

            <label class="toggle-switch">
              <input
                type="checkbox"
                checked={item.visible}
                disabled={item.required}
                onchange={() => sidebarConfig.toggleItem(item.id)}
              />
              <span class="toggle-slider"></span>
            </label>
          </div>
        {/each}
      </div>

      <!-- Footer Items -->
      <p class="sidebar-group-label">Footer</p>
      <div class="sidebar-list">
        {#each sidebarConfig.getBottomItems($sidebarConfig) as item (item.id)}
          <div
            class="sidebar-item"
            class:disabled={!item.visible && !item.required}
            class:dragging={draggedId === item.id}
            class:drag-over={dragOverId === item.id}
            draggable="true"
            ondragstart={(e) => handleDragStart(e, item.id)}
            ondragend={handleDragEnd}
            ondragover={(e) => handleDragOver(e, item.id)}
            ondragleave={handleDragLeave}
            ondrop={(e) => handleDrop(e, item.id)}
            role="listitem"
          >
            <div class="sidebar-item-left">
              <span class="drag-handle">
                <GripVertical size={16} />
              </span>
              <span class="item-name">{$t(item.labelKey)}</span>
              {#if item.required}
                <span class="item-badge required">Required</span>
              {:else if !item.visible}
                <span class="item-badge hidden">Hidden</span>
              {/if}
            </div>

            <label class="toggle-switch">
              <input
                type="checkbox"
                checked={item.visible}
                disabled={item.required}
                onchange={() => sidebarConfig.toggleItem(item.id)}
              />
              <span class="toggle-slider"></span>
            </label>
          </div>
        {/each}
      </div>
    </div>
  {/if}
</section>

<style>
  .settings-section {
    background: var(--surface-elevated);
    border: 1px solid var(--border-color);
    border-radius: 12px;
    padding: 1.5rem;
  }

  .section-title {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--text-primary);
    text-transform: uppercase;
    letter-spacing: 0.03em;
    margin: 0;
    padding: 0;
    background: none;
    border: none;
    width: 100%;
    text-align: left;
  }

  .section-title.clickable {
    cursor: pointer;
  }

  .section-title.clickable:hover {
    color: var(--primary);
  }

  .sidebar-config {
    padding-top: 0.5rem;
  }

  .sidebar-group-label {
    font-size: 0.6875rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: var(--text-muted);
    margin: 0 0 0.5rem 0;
  }

  .sidebar-group-label:not(:first-child) {
    margin-top: 1rem;
  }

  .sidebar-list {
    display: flex;
    flex-direction: column;
    gap: 0.375rem;
  }

  .sidebar-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.625rem 0.75rem;
    background: var(--surface-muted);
    border: 1px solid var(--border-color);
    border-radius: 8px;
    transition: all 0.15s ease;
    cursor: grab;
  }

  .sidebar-item:hover {
    border-color: var(--primary-alpha, rgba(122, 186, 165, 0.4));
  }

  .sidebar-item:active {
    cursor: grabbing;
  }

  .sidebar-item.disabled {
    opacity: 0.5;
  }

  .sidebar-item.dragging {
    opacity: 0.4;
    transform: scale(0.98);
  }

  .sidebar-item.drag-over {
    border-color: var(--primary);
    background: var(--primary-alpha, rgba(122, 186, 165, 0.08));
  }

  .sidebar-item-left {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .drag-handle {
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--text-muted);
    cursor: grab;
  }

  .drag-handle:active {
    cursor: grabbing;
  }

  .item-name {
    font-size: 0.8125rem;
    font-weight: 500;
    color: var(--text-primary);
  }

  .item-badge {
    display: inline-block;
    font-size: 0.5625rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.03em;
    padding: 0.125rem 0.375rem;
    border-radius: 3px;
    margin-left: 0.375rem;
  }

  .item-badge.required {
    background: var(--primary-alpha, rgba(122, 186, 165, 0.15));
    color: var(--primary);
  }

  .item-badge.hidden {
    background: var(--surface);
    color: var(--text-muted);
  }

  /* Toggle Switch */
  .toggle-switch {
    position: relative;
    display: inline-block;
    width: 36px;
    height: 20px;
    flex-shrink: 0;
  }

  .toggle-switch input {
    opacity: 0;
    width: 0;
    height: 0;
  }

  .toggle-slider {
    position: absolute;
    cursor: pointer;
    inset: 0;
    background: var(--border-color);
    border-radius: 20px;
    transition: 0.2s;
  }

  .toggle-slider::before {
    content: '';
    position: absolute;
    height: 14px;
    width: 14px;
    left: 3px;
    bottom: 3px;
    background: white;
    border-radius: 50%;
    transition: 0.2s;
  }

  .toggle-switch input:checked + .toggle-slider {
    background: var(--acapulco);
  }

  .toggle-switch input:checked + .toggle-slider::before {
    transform: translateX(16px);
  }

  .toggle-switch input:disabled + .toggle-slider {
    opacity: 0.5;
    cursor: not-allowed;
  }

  @media (max-width: 640px) {
    .settings-section {
      padding: 1rem;
      border-radius: 8px;
    }
  }

  @media (max-width: 480px) {
    .settings-section {
      padding: 0.875rem;
    }

    .section-title {
      font-size: 0.8125rem;
    }
  }
</style>
