<script lang="ts">
  import { X, GripVertical } from 'lucide-svelte';
  import { dashboardConfig, type SectionType } from '$lib/stores/dashboardConfig';
  import { getSectionDefinition } from '$lib/config/dashboardSections';
  import { t } from '$lib/stores/i18n';
  import type { Snippet } from 'svelte';

  interface Props {
    sectionId: SectionType;
    children: Snippet;
  }

  let { sectionId, children }: Props = $props();

  const sectionDef = $derived(getSectionDefinition(sectionId));
  const SectionIcon = $derived(sectionDef?.icon);
  const sectionLabel = $derived(sectionDef ? $t(sectionDef.i18nKey) || sectionId : sectionId);

  let isDragging = $state(false);
  let dragOver = $state(false);

  function handleDragStart(e: DragEvent) {
    if (!$dashboardConfig.editMode) return;
    isDragging = true;
    e.dataTransfer!.effectAllowed = 'move';
    e.dataTransfer!.setData('text/plain', sectionId);
  }

  function handleDragEnd() {
    isDragging = false;
  }

  function handleDragOver(e: DragEvent) {
    if (!$dashboardConfig.editMode) return;
    e.preventDefault();
    e.dataTransfer!.dropEffect = 'move';
    dragOver = true;
  }

  function handleDragLeave() {
    dragOver = false;
  }

  function handleDrop(e: DragEvent) {
    e.preventDefault();
    dragOver = false;
    const fromId = e.dataTransfer!.getData('text/plain') as SectionType;
    if (fromId && fromId !== sectionId) {
      dashboardConfig.reorderSections(fromId, sectionId);
    }
  }

  function handleHide() {
    dashboardConfig.hideSection(sectionId);
  }
</script>

<div
  class="editable-section"
  class:edit-mode={$dashboardConfig.editMode}
  class:dragging={isDragging}
  class:drag-over={dragOver}
  draggable={$dashboardConfig.editMode}
  ondragstart={handleDragStart}
  ondragend={handleDragEnd}
  ondragover={handleDragOver}
  ondragleave={handleDragLeave}
  ondrop={handleDrop}
  role={$dashboardConfig.editMode ? 'listitem' : undefined}
>
  {#if $dashboardConfig.editMode && SectionIcon}
    <div class="section-label">
      <svelte:component this={SectionIcon} size={12} />
      <span>{sectionLabel}</span>
    </div>
    <div class="edit-controls">
      <button class="drag-handle" aria-label="Arrastrar para reordenar">
        <GripVertical size={16} />
      </button>
      <button class="hide-btn" onclick={handleHide} aria-label="Ocultar sección">
        <X size={14} />
      </button>
    </div>
  {/if}
  <div class="section-content">
    {@render children()}
  </div>
</div>

<style>
  .editable-section {
    position: relative;
    transition: all 0.2s ease;
  }

  .editable-section.edit-mode {
    border: 2px dashed transparent;
    border-radius: 12px;
    padding: 0.25rem;
    margin: -0.25rem;
  }

  .editable-section.edit-mode:hover {
    border-color: var(--primary);
    background: var(--primary-alpha, rgba(99, 102, 241, 0.05));
  }

  .editable-section.dragging {
    opacity: 0.5;
    border-color: var(--primary);
  }

  .editable-section.drag-over {
    border-color: var(--success);
    background: var(--success-alpha, rgba(34, 197, 94, 0.1));
  }

  .section-label {
    position: absolute;
    top: -10px;
    left: 12px;
    display: flex;
    align-items: center;
    gap: 0.25rem;
    padding: 0.125rem 0.5rem;
    background: var(--primary);
    color: white;
    font-size: 0.625rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    border-radius: 4px;
    z-index: 10;
    opacity: 0;
    transition: opacity 0.15s ease;
  }

  .editable-section.edit-mode:hover .section-label {
    opacity: 1;
  }

  .edit-controls {
    position: absolute;
    top: 0.5rem;
    right: 0.5rem;
    display: flex;
    gap: 0.25rem;
    z-index: 10;
    opacity: 0;
    transition: opacity 0.15s ease;
  }

  .editable-section.edit-mode:hover .edit-controls {
    opacity: 1;
  }

  .drag-handle,
  .hide-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .drag-handle {
    background: var(--surface-elevated);
    color: var(--text-muted);
    cursor: grab;
  }

  .drag-handle:hover {
    background: var(--surface-muted);
    color: var(--text-primary);
  }

  .drag-handle:active {
    cursor: grabbing;
  }

  .hide-btn {
    background: var(--surface-elevated);
    color: var(--text-muted);
  }

  .hide-btn:hover {
    background: var(--accent);
    color: white;
  }

  .section-content {
    position: relative;
  }

  .editable-section.edit-mode.dragging .section-content {
    pointer-events: none;
  }
</style>
