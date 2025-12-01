<script lang="ts">
  import { t } from '$lib/stores/i18n';

  interface Props {
    loading: boolean;
    importedCount: number;
    duplicatesSkipped?: number;
    duplicatesForced?: number;
  }

  const { loading, importedCount, duplicatesSkipped = 0, duplicatesForced = 0 }: Props = $props();
</script>

<div class="complete-step">
  {#if loading}
    <div class="complete-loading">
      <div class="complete-spinner"></div>
      <h3 class="complete-title">{$t('import.complete.importing')}</h3>
      <p class="complete-subtitle">
        {$t('import.complete.importing_desc')}
      </p>
    </div>
  {:else}
    <div class="complete-success">
      <div class="success-icon">
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M5 13l4 4L19 7"
          />
        </svg>
      </div>
      <h3 class="complete-title">{$t('import.complete.success')}</h3>
      <p class="complete-subtitle">
        {$t('import.complete.success_desc', { count: importedCount })}
      </p>
      {#if duplicatesSkipped > 0}
        <p class="complete-info warning">
          {duplicatesSkipped} transacciones duplicadas fueron omitidas
        </p>
      {/if}
      {#if duplicatesForced > 0}
        <p class="complete-info success">
          {duplicatesForced} posibles duplicados fueron importados por petición del usuario
        </p>
      {/if}
    </div>
  {/if}
</div>

<style>
  .complete-step {
    padding: 3rem;
    text-align: center;
  }

  .complete-loading {
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .complete-spinner {
    width: 3rem;
    height: 3rem;
    border: 3px solid var(--border-color);
    border-top: 3px solid var(--acapulco);
    border-radius: 50%;
    margin-bottom: 1.5rem;
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

  .complete-success {
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .success-icon {
    width: 5rem;
    height: 5rem;
    background: rgba(122, 186, 165, 0.1);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 1.5rem;
    box-shadow: 0 8px 24px rgba(122, 186, 165, 0.2);
  }

  .success-icon svg {
    width: 2.5rem;
    height: 2.5rem;
    color: var(--acapulco);
  }

  .complete-title {
    font-size: 1.25rem;
    font-weight: 300;
    color: var(--text-primary);
    margin-bottom: 0.5rem;
  }

  .complete-subtitle {
    color: var(--text-secondary);
    margin-bottom: 1rem;
  }

  .complete-info {
    font-size: 0.875rem;
    padding: 0.5rem 1rem;
    border-radius: 0.5rem;
    margin-top: 0.5rem;
  }

  .complete-info.warning {
    color: #d4a000;
    background: rgba(254, 205, 44, 0.1);
  }

  .complete-info.success {
    color: var(--acapulco);
    background: rgba(122, 186, 165, 0.1);
  }
</style>
