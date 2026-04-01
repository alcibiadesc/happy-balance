<script lang="ts">
  import { t } from '$lib/stores/i18n';

  interface Props {
    current: number;
    total: number;
    progress: number;
  }

  const { current, total, progress }: Props = $props();

  const remaining = $derived(Math.max(0, total - current));
</script>

<div class="tinder-progress">
  <span class="progress-text">
    {$t('tinder.remaining', { current: remaining.toString(), total: total.toString() })}
  </span>
  <div class="progress-bar">
    <div class="progress-fill" style="width: {progress}%;"></div>
  </div>
</div>

<style>
  .tinder-progress {
    display: flex;
    flex-direction: column;
    gap: var(--space-xs, 0.25rem);
    width: 100%;
  }

  .progress-text {
    font-size: 0.8125rem;
    color: var(--text-secondary);
    text-align: center;
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
    background: var(--primary, #023c46);
    border-radius: 3px;
    transition: width 0.3s ease;
  }
</style>
