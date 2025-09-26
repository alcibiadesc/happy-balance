<script lang="ts">
  import { Upload } from 'lucide-svelte';
  import { goto } from '$app/navigation';
  import UserMenu from './UserMenu.svelte';

  interface Props {
    collapsed: boolean;
  }

  let { collapsed }: Props = $props();

  function handleImportClick() {
    goto('/import');
  }
</script>

<footer class="sidebar-footer" class:sidebar-footer--collapsed={collapsed}>
  {#if collapsed}
    <button
      class="import-button import-button--icon"
      onclick={handleImportClick}
      aria-label="Import transactions"
      title="Import transactions"
    >
      <Upload size={18} strokeWidth={2} />
    </button>
    <div class="user-menu-wrapper">
      <UserMenu />
    </div>
  {:else}
    <div class="footer-content">
      <button
        class="import-button import-button--full"
        onclick={handleImportClick}
      >
        <Upload size={18} strokeWidth={2} />
        <span>Import Transactions</span>
      </button>
      <div class="user-section">
        <UserMenu />
      </div>
    </div>
  {/if}
</footer>

<style>
  .sidebar-footer {
    padding: var(--space-lg);
    border-top: 1px solid var(--border-color);
    margin-top: auto;
  }

  .sidebar-footer--collapsed {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-md);
    padding: var(--space-md);
  }

  .footer-content {
    display: flex;
    flex-direction: column;
    gap: var(--space-md);
  }

  .user-section {
    display: flex;
    justify-content: flex-start;
    padding-top: var(--space-sm);
    border-top: 1px solid var(--border-color);
  }

  .user-menu-wrapper {
    display: flex;
    justify-content: center;
  }

  .import-button {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: var(--space-sm) var(--space-md);
    border-radius: var(--radius-lg);
    border: 1px solid var(--success-border);
    background: var(--success-bg-hover);
    color: var(--success-text-hover);
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

  .import-button--full {
    width: 100%;
  }

  .import-button:hover {
    background: var(--success-border-hover);
    border-color: var(--success-border-hover);
    transform: translateY(-2px);
    box-shadow: 0 4px 16px rgba(122, 186, 165, 0.25);
  }

  .import-button:focus {
    outline: none;
    box-shadow: 0 0 0 3px var(--success-focus-ring);
  }

  .import-button:active {
    transform: translateY(0);
  }
</style>