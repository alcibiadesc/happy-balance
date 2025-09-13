<script lang="ts">
  import { Upload } from 'lucide-svelte';
  import { goto } from '$app/navigation';

  interface Props {
    collapsed: boolean;
  }

  let { collapsed }: Props = $props();

  function handleImportClick() {
    goto('/import');
  }
</script>

{#if collapsed}
  <footer class="sidebar-footer sidebar-footer--collapsed">
    <button
      class="import-button import-button--icon"
      onclick={handleImportClick}
      aria-label="Import transactions"
      title="Import transactions"
    >
      <Upload size={18} strokeWidth={2} />
    </button>
  </footer>
{/if}

<style>
  .sidebar-footer {
    padding: var(--space-lg);
    border-top: 1px solid var(--border-color);
    margin-top: auto;
  }

  .sidebar-footer--collapsed {
    display: flex;
    justify-content: center;
    padding: var(--space-md);
  }

  .import-button {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: var(--space-sm) var(--space-md);
    border-radius: var(--radius-lg);
    border: 1px solid var(--primary);
    background: var(--primary);
    color: var(--text-inverse);
    cursor: pointer;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    font-weight: 500;
    font-size: 0.875rem;
    gap: var(--space-sm);
  }

  .import-button--icon {
    width: 40px;
    height: 40px;
    padding: 0;
  }

  .import-button:hover {
    background: var(--primary-hover);
    border-color: var(--primary-hover);
    transform: translateY(-2px);
    box-shadow: 0 4px 16px rgba(122, 186, 165, 0.25);
  }

  .import-button:focus {
    outline: none;
    box-shadow: 0 0 0 3px var(--primary-light);
  }

  .import-button:active {
    transform: translateY(0);
  }
</style>