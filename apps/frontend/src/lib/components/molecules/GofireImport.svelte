<script lang="ts">
  import { Flame, ExternalLink } from 'lucide-svelte';
  import { investmentsApi } from '$lib/modules/investments/infrastructure/api/investmentsApi';

  // State
  let file = $state<File | null>(null);
  let loading = $state(false);
  let error = $state('');
  let success = $state(false);
  let importResult = $state<{ imported: number; historyCount: number } | null>(null);

  async function handleFileSelect(event: Event) {
    const selectedFile = (event.target as HTMLInputElement).files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.toLowerCase().endsWith('.json')) {
      error = 'Must be a JSON file';
      return;
    }

    file = selectedFile;
    error = '';
  }

  async function handleImport() {
    if (!file) return;

    loading = true;
    error = '';

    try {
      const data = JSON.parse(await file.text());

      if (!data.data || !Array.isArray(data.data)) {
        throw new Error('Invalid format');
      }

      importResult = await investmentsApi.importFromGofire({ data: data.data });
      success = true;
    } catch (err) {
      error = err instanceof Error ? err.message : 'Import failed';
    } finally {
      loading = false;
    }
  }

  function reset() {
    file = null;
    error = '';
    success = false;
    importResult = null;
  }
</script>

<div class="gofire-section">
  <div class="gofire-header">
    <Flame size={16} class="gofire-icon" />
    <span>Import from</span>
    <a href="https://www.alci.dev/es/tools/gofire" target="_blank" rel="noopener">
      GoFire <ExternalLink size={12} />
    </a>
  </div>

  {#if error}
    <div class="inline-error">{error}</div>
  {/if}

  {#if success && importResult}
    <div class="gofire-result">
      <span class="result-text">
        ✓ {importResult.imported} investments, {importResult.historyCount} entries
      </span>
      <button class="text-btn" onclick={reset}>Import another</button>
    </div>
  {:else}
    <div class="gofire-upload">
      <input
        type="file"
        id="gofire-input"
        accept=".json"
        class="hidden-input"
        onchange={handleFileSelect}
        disabled={loading}
      />
      <label for="gofire-input" class="upload-zone" class:selected={file} class:loading>
        {#if loading}
          <span class="spinner-small"></span> Importing...
        {:else if file}
          ✓ {file.name}
        {:else}
          Select JSON file
        {/if}
      </label>
      {#if file && !loading}
        <button class="import-btn" onclick={handleImport}>Import</button>
      {/if}
    </div>
  {/if}
</div>

<style>
  .gofire-section {
    padding: 1rem;
    background: var(--surface-muted);
    border-radius: 8px;
    margin-bottom: 1rem;
  }

  .gofire-header {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    font-size: 0.8125rem;
    color: var(--text-secondary);
    margin-bottom: 0.75rem;
  }

  .gofire-header :global(.gofire-icon) {
    color: #f59e0b;
  }

  .gofire-header a {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    color: var(--primary);
    text-decoration: none;
    font-weight: 500;
  }

  .gofire-header a:hover {
    text-decoration: underline;
  }

  .gofire-upload {
    display: flex;
    gap: 0.5rem;
  }

  .hidden-input {
    display: none;
  }

  .upload-zone {
    flex: 1;
    padding: 0.625rem 1rem;
    border: 1px dashed var(--border-color);
    border-radius: 6px;
    font-size: 0.8125rem;
    color: var(--text-muted);
    text-align: center;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .upload-zone:hover {
    border-color: var(--primary);
    color: var(--text-primary);
  }

  .upload-zone.selected {
    border-style: solid;
    border-color: var(--primary);
    color: var(--primary);
    background: var(--primary-bg, rgba(122, 186, 165, 0.08));
  }

  .upload-zone.loading {
    cursor: wait;
    opacity: 0.7;
  }

  .import-btn {
    padding: 0.625rem 1rem;
    background: var(--primary);
    color: white;
    border: none;
    border-radius: 6px;
    font-size: 0.8125rem;
    font-weight: 500;
    cursor: pointer;
  }

  .import-btn:hover {
    background: var(--primary-dark);
  }

  .gofire-result {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 0.8125rem;
  }

  .result-text {
    color: var(--success-text, #10b981);
  }

  .text-btn {
    background: none;
    border: none;
    color: var(--primary);
    font-size: 0.75rem;
    cursor: pointer;
    text-decoration: underline;
  }

  .inline-error {
    padding: 0.5rem 0.75rem;
    background: var(--error-bg);
    color: var(--error);
    border-radius: 4px;
    font-size: 0.75rem;
    margin-bottom: 0.5rem;
  }

  /* Spinner */
  .spinner-small {
    display: inline-block;
    width: 12px;
    height: 12px;
    border: 2px solid var(--border-color);
    border-top-color: var(--primary);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
    margin-right: 0.25rem;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  @media (max-width: 480px) {
    .gofire-section {
      padding: 0.75rem;
    }

    .gofire-upload {
      flex-direction: column;
    }

    .upload-zone {
      width: 100%;
    }
  }
</style>
