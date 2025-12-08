<script lang="ts">
  import { X } from 'lucide-svelte';
  import type { ComponentType } from 'svelte';

  interface Props {
    title: string;
    icon?: ComponentType;
    iconColor?: string;
    onClose: () => void;
    subtitle?: string;
  }

  let { title, icon: Icon, iconColor = 'var(--primary)', onClose, subtitle }: Props = $props();
</script>

<div class="modal-header">
  {#if Icon}
    <div class="header-icon" style="color: {iconColor}">
      <Icon size={20} />
    </div>
  {/if}
  <div class="header-content">
    <h3 class="modal-title">{title}</h3>
    {#if subtitle}
      <p class="modal-subtitle">{subtitle}</p>
    {/if}
  </div>
  <button class="close-btn" onclick={onClose} aria-label="Cerrar">
    <X size={20} />
  </button>
</div>

<style>
  .modal-header {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
    padding: 1.25rem 1.5rem;
    border-bottom: 1px solid var(--border-color);
    background: var(--surface-muted);
  }

  .header-icon {
    width: 2.5rem;
    height: 2.5rem;
    border-radius: 0.75rem;
    background: currentColor;
    background: rgba(122, 186, 165, 0.1);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .header-content {
    flex: 1;
    min-width: 0;
  }

  .modal-title {
    font-size: 1.125rem;
    font-weight: 600;
    color: var(--text-primary);
    margin: 0;
    line-height: 1.3;
  }

  .modal-subtitle {
    font-size: 0.8125rem;
    color: var(--text-secondary);
    margin: 0.25rem 0 0 0;
  }

  .close-btn {
    width: 2rem;
    height: 2rem;
    border-radius: 0.5rem;
    border: none;
    background: transparent;
    color: var(--text-secondary);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
    flex-shrink: 0;
  }

  .close-btn:hover {
    background: var(--surface-hover);
    color: var(--text-primary);
  }

  @media (max-width: 480px) {
    .modal-header {
      padding: 1rem 1.25rem;
    }

    .modal-title {
      font-size: 1rem;
    }

    .header-icon {
      width: 2rem;
      height: 2rem;
    }
  }
</style>
