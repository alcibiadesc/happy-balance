<script lang="ts">
  import { t } from '$lib/stores/i18n';

  interface Props {
    loading?: boolean;
    onFileSelect: (event: Event) => void;
    selectedFiles?: File[];
    importProgress?: number;
    totalFiles?: number;
  }

  const {
    loading = false,
    onFileSelect,
    selectedFiles = [],
    importProgress = 0,
    totalFiles = 0,
  }: Props = $props();
</script>

<div class="upload-container">
  <div class="upload-area">
    <input
      type="file"
      accept=".csv"
      multiple
      onchange={onFileSelect}
      class="upload-input"
      id="file-upload"
      disabled={loading}
    />
    <label for="file-upload" class="upload-label" class:loading>
      {#if loading}
        <div class="upload-spinner"></div>
      {:else}
        <div class="upload-icon">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
        </div>
      {/if}

      <div class="upload-text">
        <p class="upload-title">
          {loading ? $t('import.upload.processing') : $t('import.upload.choose_file')}
        </p>
        <p class="upload-subtitle">
          {$t('import.upload.drag_drop')}
        </p>
      </div>
    </label>
  </div>

  {#if selectedFiles.length > 0 && !loading}
    <div class="files-container">
      {#if totalFiles > 0 && importProgress > 0}
        <div class="progress-info">
          <p class="progress-text">Procesando archivo {importProgress} de {totalFiles}...</p>
          <div class="progress-bar">
            <div class="progress-fill" style="width: {(importProgress / totalFiles) * 100}%"></div>
          </div>
        </div>
      {/if}
      <div class="files-list">
        {#each selectedFiles as file (file.name)}
          <div class="file-info">
            <div class="file-details">
              <div class="file-icon">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <div class="file-text">
                <p class="file-name">{file.name}</p>
                <p class="file-size">{(file.size / 1024).toFixed(1)} KB</p>
              </div>
            </div>
            <div class="file-badge">{$t('import.upload.ready')}</div>
          </div>
        {/each}
      </div>
    </div>
  {/if}
</div>

<style>
  .upload-container {
    width: 100%;
  }

  .upload-area {
    position: relative;
  }

  .upload-input {
    position: absolute;
    opacity: 0;
    pointer-events: none;
  }

  .upload-label {
    display: block;
    width: 100%;
    border: 2px dashed var(--border-color);
    border-radius: 1rem;
    padding: 3rem;
    text-align: center;
    cursor: pointer;
    transition: all 0.3s ease;
  }

  .upload-label:hover {
    border-color: var(--acapulco);
    background: rgba(122, 186, 165, 0.02);
  }

  .upload-label.loading {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .upload-icon {
    width: 4rem;
    height: 4rem;
    background: rgba(122, 186, 165, 0.1);
    border-radius: 1rem;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 1rem;
    transition: all 0.3s ease;
  }

  .upload-label:hover .upload-icon {
    background: rgba(122, 186, 165, 0.2);
    transform: scale(1.05);
  }

  .upload-icon svg {
    width: 2rem;
    height: 2rem;
    color: var(--acapulco);
  }

  .upload-spinner {
    width: 3rem;
    height: 3rem;
    border: 3px solid var(--border-color);
    border-top: 3px solid var(--acapulco);
    border-radius: 50%;
    margin: 0 auto 1rem;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }

  .upload-title {
    font-size: 1.125rem;
    font-weight: 500;
    color: var(--text-primary);
    margin-bottom: 0.5rem;
  }

  .upload-subtitle {
    font-size: 0.875rem;
    color: var(--text-muted);
  }

  .files-container {
    margin-top: 2rem;
  }

  .progress-info {
    margin-bottom: 1.5rem;
    padding: 1rem;
    background: rgba(122, 186, 165, 0.05);
    border: 1px solid rgba(122, 186, 165, 0.2);
    border-radius: 0.75rem;
  }

  .progress-text {
    font-size: 0.875rem;
    color: var(--text-primary);
    margin-bottom: 0.75rem;
    font-weight: 500;
  }

  .progress-bar {
    width: 100%;
    height: 6px;
    background: var(--surface-muted);
    border-radius: 3px;
    overflow: hidden;
  }

  .progress-fill {
    height: 100%;
    background: linear-gradient(90deg, var(--acapulco), rgba(122, 186, 165, 0.7));
    transition: width 0.3s ease;
    border-radius: 3px;
  }

  .files-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .file-info {
    padding: 1rem;
    background: rgba(122, 186, 165, 0.05);
    border: 1px solid rgba(122, 186, 165, 0.2);
    border-radius: 0.75rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .file-details {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .file-icon {
    width: 3rem;
    height: 3rem;
    background: rgba(122, 186, 165, 0.2);
    border-radius: 0.75rem;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
  }

  .file-icon svg {
    width: 1.5rem;
    height: 1.5rem;
    color: var(--acapulco);
  }

  .file-name {
    font-weight: 500;
    color: var(--text-primary);
  }

  .file-size {
    font-size: 0.875rem;
    color: var(--text-secondary);
    margin-top: 0.25rem;
  }

  .file-badge {
    padding: 0.25rem 0.75rem;
    background: var(--acapulco);
    color: var(--text-inverse);
    border-radius: 0.5rem;
    font-size: 0.875rem;
    font-weight: 500;
  }
</style>
