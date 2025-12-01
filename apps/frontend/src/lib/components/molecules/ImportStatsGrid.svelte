<script lang="ts">
  import { t } from '$lib/stores/i18n';

  interface Props {
    total: number;
    selected: number;
    duplicates: number;
    selectedDuplicates: number;
    skipped: number;
  }

  const { total, selected, duplicates, selectedDuplicates, skipped }: Props = $props();
</script>

<div class="stats-grid">
  <div class="stat-card">
    <div class="stat-value">{total}</div>
    <div class="stat-label">{$t('import.preview.stats.total')}</div>
  </div>
  <div class="stat-card accent">
    <div class="stat-value">{selected}</div>
    <div class="stat-label">{$t('import.preview.stats.selected')}</div>
  </div>
  <div class="stat-card warning" class:pulse={duplicates > 0}>
    <div class="stat-value">{duplicates}</div>
    <div class="stat-label">{$t('import.preview.stats.duplicates')}</div>
    {#if duplicates > 0}
      <div class="stat-hint">Posibles duplicados detectados</div>
    {/if}
    {#if selectedDuplicates > 0}
      <div class="stat-hint accent">{selectedDuplicates} seleccionados para importar</div>
    {/if}
  </div>
  <div class="stat-card error">
    <div class="stat-value">{skipped}</div>
    <div class="stat-label">{$t('import.preview.stats.skipped')}</div>
  </div>
</div>

<style>
  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
    margin-bottom: 1.5rem;
  }

  .stat-card {
    background: var(--surface-muted);
    border: 1px solid var(--border-color);
    border-radius: 0.75rem;
    padding: 1.5rem;
    text-align: center;
  }

  .stat-card.accent {
    background: rgba(122, 186, 165, 0.1);
    border-color: rgba(122, 186, 165, 0.2);
  }

  .stat-card.warning {
    background: rgba(254, 205, 44, 0.1);
    border-color: rgba(254, 205, 44, 0.2);
  }

  .stat-card.error {
    background: rgba(245, 121, 108, 0.05);
    border-color: rgba(245, 121, 108, 0.1);
  }

  .stat-value {
    font-size: 1.5rem;
    font-weight: 300;
    color: var(--text-primary);
  }

  .stat-card.accent .stat-value {
    color: var(--acapulco);
  }

  .stat-card.warning .stat-value {
    color: #fecd2c;
  }

  .stat-card.error .stat-value {
    color: #f5796c;
  }

  .stat-label {
    font-size: 0.75rem;
    font-weight: 500;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-top: 0.5rem;
  }

  .stat-hint {
    font-size: 0.625rem;
    color: var(--text-muted);
    margin-top: 0.25rem;
    font-weight: normal;
    text-transform: none;
    letter-spacing: normal;
  }

  .stat-hint.accent {
    color: #8dc351;
    font-weight: 500;
  }

  .stat-card.warning.pulse {
    animation: pulse-warning 2s ease-in-out;
  }

  @keyframes pulse-warning {
    0%,
    100% {
      background: rgba(254, 205, 44, 0.1);
      border-color: rgba(254, 205, 44, 0.2);
    }
    50% {
      background: rgba(254, 205, 44, 0.2);
      border-color: rgba(254, 205, 44, 0.4);
    }
  }

  @media (max-width: 768px) {
    .stats-grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  @media (max-width: 480px) {
    .stats-grid {
      gap: 0.5rem;
    }

    .stat-card {
      padding: 1rem;
    }
  }
</style>
