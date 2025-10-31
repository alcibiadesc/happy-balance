<script lang="ts">
  import { Upload } from "lucide-svelte";
  import { goto } from "$app/navigation";
  import { onMount } from "svelte";
  import UserMenu from "./UserMenu.svelte";
  import { getApiUrl } from "$lib/utils/api-url";

  interface Props {
    collapsed: boolean;
  }

  let { collapsed }: Props = $props();

  let versionInfo = $state<{version: string, commit: string, buildTimestamp: string} | null>(null);

  onMount(async () => {
    try {
      const API_BASE = getApiUrl();
      const response = await fetch(`${API_BASE}/version`);
      if (response.ok) {
        versionInfo = await response.json();
      }
    } catch (err) {
      console.error('Failed to load version:', err);
    }
  });

  function formatTimestamp(timestamp: string): string {
    // Format: 20251031-171606 -> v.20251031171606
    return `v.${timestamp.replace('-', '')}`;
  }

  function handleImportClick() {
    goto("/import");
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
    {#if versionInfo}
      <div class="version-badge" title="Build: {versionInfo.buildTimestamp}&#10;Commit: {versionInfo.commit}">
        {formatTimestamp(versionInfo.buildTimestamp)}
      </div>
    {/if}
  {:else}
    <UserMenu />
    {#if versionInfo}
      <div class="version-info" title="Click to go to Settings">
        <button class="version-link" onclick={() => goto('/settings')}>
          <span class="version-label">Version</span>
          <span class="version-value">{formatTimestamp(versionInfo.buildTimestamp)}</span>
          <span class="version-commit">({versionInfo.commit})</span>
        </button>
      </div>
    {/if}
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
    width: 100%;
  }

  .sidebar-footer--collapsed .user-menu-wrapper :global(.user-menu-trigger) {
    padding: 0.25rem;
  }

  .sidebar-footer--collapsed .user-menu-wrapper :global(.chevron) {
    display: none;
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

  /* Version info styles */
  .version-info {
    margin-top: var(--space-md);
    padding-top: var(--space-md);
    border-top: 1px solid var(--border-color);
  }

  .version-link {
    display: flex;
    flex-direction: column;
    gap: 2px;
    width: 100%;
    background: transparent;
    border: none;
    padding: var(--space-xs) var(--space-sm);
    border-radius: var(--radius-md);
    cursor: pointer;
    transition: background 0.2s ease;
    text-align: left;
  }

  .version-link:hover {
    background: var(--surface-hover);
  }

  .version-label {
    font-size: 0.625rem;
    color: var(--text-tertiary);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    font-weight: 600;
  }

  .version-value {
    font-size: 0.75rem;
    color: var(--text-secondary);
    font-weight: 500;
    font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Fira Code', monospace;
  }

  .version-commit {
    font-size: 0.625rem;
    color: var(--text-tertiary);
    font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Fira Code', monospace;
  }

  .version-badge {
    font-size: 0.625rem;
    color: var(--text-tertiary);
    font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Fira Code', monospace;
    padding: var(--space-xs) var(--space-sm);
    background: var(--surface-alt);
    border-radius: var(--radius-sm);
    text-align: center;
    width: 100%;
    cursor: help;
  }
</style>
