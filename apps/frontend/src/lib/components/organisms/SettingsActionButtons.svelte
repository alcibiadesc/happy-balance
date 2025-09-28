<script lang="ts">
  import { Download, Upload, Trash2, RotateCcw } from 'lucide-svelte';
  import { t } from '$lib/stores/i18n';

  interface Props {
    onExport: () => void;
    onFileImport: (event: Event) => void;
    onReset: () => void;
    onDeleteAll: () => void;
    importing?: boolean;
  }

  let {
    onExport,
    onFileImport,
    onReset,
    onDeleteAll,
    importing = false
  }: Props = $props();
</script>

<div class="action-buttons">
  <button 
    class="action-button export"
    onclick={onExport}
  >
    <Download size={16} strokeWidth={2} />
    {$t('settings.export_data')}
  </button>
  
  <label class="action-button import {importing ? 'loading' : ''}">
    <input 
      type="file" 
      accept=".json"
      onchange={onFileImport}
      style="display: none;"
      disabled={importing}
    />
    {#if importing}
      <div class="import-spinner"></div>
      Importing...
    {:else}
      <Upload size={16} strokeWidth={2} />
      Import Data
    {/if}
  </label>
  
  <button
    class="action-button reset"
    onclick={onReset}
  >
    <RotateCcw size={16} strokeWidth={2} />
    {$t('settings.reset_data')}
  </button>

  <button
    class="action-button delete"
    onclick={onDeleteAll}
  >
    <Trash2 size={16} strokeWidth={2} />
    {$t('settings.clear_data')}
  </button>
</div>

<style>
  /* Action Buttons - Exact copy from settings page */
  .action-buttons {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }
  
  .action-button {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    border-radius: 0.5rem;
    font-weight: 500;
    font-size: 0.875rem;
    cursor: pointer;
    transition: all 0.2s ease;
    border: 1px solid;
    text-decoration: none;
  }
  
  .action-button.export {
    background: transparent;
    border-color: var(--acapulco);
    color: var(--acapulco);
  }
  
  .action-button.export:hover {
    background: var(--acapulco);
    color: var(--text-inverse);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(122, 186, 165, 0.3);
  }
  
  .action-button.import {
    background: transparent;
    border-color: #7abaa5;
    color: #7abaa5;
  }
  
  .action-button.import:hover:not(.loading) {
    background: #7abaa5;
    color: var(--text-inverse);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(122, 186, 165, 0.2);
  }
  
  .action-button.import.loading {
    opacity: 0.7;
    cursor: not-allowed;
  }
  
  .action-button.reset {
    background: transparent;
    border-color: #FDCB6E;
    color: #FDCB6E;
  }

  .action-button.reset:hover {
    background: #FDCB6E;
    color: var(--text-inverse);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(253, 203, 110, 0.3);
  }

  .action-button.delete {
    background: transparent;
    border-color: #f5796c;
    color: #f5796c;
  }

  .action-button.delete:hover {
    background: #f5796c;
    color: var(--text-inverse);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(245, 121, 108, 0.3);
  }
  
  .action-button:focus {
    outline: none;
    box-shadow: 0 0 0 3px rgba(122, 186, 165, 0.3);
  }
  
  /* Import spinner */
  .import-spinner {
    width: 16px;
    height: 16px;
    border: 2px solid var(--text-muted);
    border-top: 2px solid var(--acapulco);
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
</style>