<script lang="ts">
  import { Plus, RotateCcw } from 'lucide-svelte';
  import { fly } from 'svelte/transition';
  import { t } from '$lib/stores/i18n';
  import { dashboardConfig, type MetricType, type SectionType } from '$lib/stores/dashboardConfig';
  import { getMetricDefinition, getSectionDefinition } from '$lib/config/dashboardSections';

  const hiddenMetrics = $derived($dashboardConfig.metrics.filter((m) => !m.visible));

  const hiddenSections = $derived($dashboardConfig.sections.filter((s) => !s.visible));

  const hasHiddenItems = $derived(hiddenMetrics.length > 0 || hiddenSections.length > 0);

  function getMetricLabel(id: MetricType): string {
    const def = getMetricDefinition(id);
    return def ? $t(def.i18nKey) || id : id;
  }

  function getSectionLabel(id: SectionType): string {
    const def = getSectionDefinition(id);
    return def ? $t(def.i18nKey) || id : id;
  }

  function handleReset() {
    dashboardConfig.reset();
  }
</script>

{#if $dashboardConfig.editMode}
  <div class="hidden-items-bar" transition:fly={{ y: 20, duration: 200 }}>
    {#if hasHiddenItems}
      <span class="bar-label">{$t('dashboard.config.hidden_items') || 'Ocultos'}:</span>
      <div class="hidden-items">
        {#each hiddenMetrics as metric (metric.id)}
          {@const def = getMetricDefinition(metric.id)}
          <button
            class="hidden-item metric-item"
            onclick={() => dashboardConfig.showMetric(metric.id)}
            title={getMetricLabel(metric.id)}
          >
            <Plus size={10} />
            {#if def}
              <svelte:component this={def.icon} size={14} />
            {/if}
            <span class="item-label">{getMetricLabel(metric.id)}</span>
          </button>
        {/each}
        {#each hiddenSections as section (section.id)}
          {@const def = getSectionDefinition(section.id)}
          <button
            class="hidden-item section-item"
            onclick={() => dashboardConfig.showSection(section.id)}
            title={getSectionLabel(section.id)}
          >
            <Plus size={10} />
            {#if def}
              <svelte:component this={def.icon} size={14} />
            {/if}
            <span class="item-label">{getSectionLabel(section.id)}</span>
          </button>
        {/each}
      </div>
      <div class="bar-divider"></div>
    {/if}
    <button class="reset-btn" onclick={handleReset} title={$t('common.reset') || 'Reset'}>
      <RotateCcw size={14} />
      <span class="reset-label">{$t('common.reset') || 'Reset'}</span>
    </button>
  </div>
{/if}

<style>
  .hidden-items-bar {
    position: fixed;
    bottom: 1rem;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.625rem 1rem;
    background: var(--surface-elevated);
    border: 1px solid var(--border-color);
    border-radius: 50px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
    z-index: 100;
    max-width: 90vw;
    overflow-x: auto;
  }

  .bar-label {
    font-size: 0.6875rem;
    color: var(--text-muted);
    white-space: nowrap;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .bar-divider {
    width: 1px;
    height: 20px;
    background: var(--border-color);
  }

  .hidden-items {
    display: flex;
    gap: 0.375rem;
    flex-wrap: nowrap;
  }

  .hidden-item {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    padding: 0.375rem 0.5rem;
    background: var(--surface-muted);
    border: 1px solid var(--border-color);
    border-radius: 20px;
    font-size: 0.6875rem;
    color: var(--text-secondary);
    cursor: pointer;
    transition: all 0.15s ease;
    white-space: nowrap;
  }

  .hidden-item:hover {
    background: var(--primary);
    border-color: var(--primary);
    color: white;
    transform: translateY(-1px);
  }

  .metric-item,
  .section-item {
    background: var(--surface);
  }

  .item-label {
    max-width: 80px;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .reset-btn {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    padding: 0.375rem 0.625rem;
    background: transparent;
    border: 1px solid var(--border-color);
    border-radius: 20px;
    font-size: 0.6875rem;
    color: var(--text-muted);
    cursor: pointer;
    transition: all 0.15s ease;
    white-space: nowrap;
  }

  .reset-btn:hover {
    background: var(--accent);
    border-color: var(--accent);
    color: white;
  }

  @media (max-width: 640px) {
    .hidden-items-bar {
      bottom: 0.5rem;
      padding: 0.5rem 0.75rem;
      gap: 0.5rem;
    }

    .bar-label {
      display: none;
    }

    .item-label {
      display: none;
    }

    .reset-label {
      display: none;
    }

    .hidden-item,
    .reset-btn {
      padding: 0.375rem;
    }
  }
</style>
