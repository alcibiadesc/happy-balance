<script lang="ts">
  import { t } from '$lib/stores/i18n';

  interface Props {
    previewEnabled: boolean;
    onToggle: () => void;
  }

  const { previewEnabled, onToggle }: Props = $props();
</script>

<div class="settings-section">
  <h3 class="settings-title">{$t('import.settings.title')}</h3>
  <div class="setting-item">
    <label class="setting-label">
      <input
        type="checkbox"
        checked={previewEnabled}
        onchange={onToggle}
        class="toggle toggle-acapulco"
      />
      <span class="setting-text">{$t('import.settings.enable_preview')}</span>
    </label>
    <div class="setting-desc">
      {$t('import.settings.enable_preview_desc')}
    </div>
  </div>
</div>

<style>
  .settings-section {
    background: var(--surface-muted);
    border: 1px solid var(--border-color);
    border-radius: 0.75rem;
    padding: 1.5rem;
    margin-bottom: 2rem;
  }

  .settings-title {
    font-size: 1.125rem;
    font-weight: 500;
    color: var(--text-primary);
    margin-bottom: 1.5rem;
  }

  .setting-item {
    margin-bottom: 0;
  }

  .setting-label {
    display: flex;
    align-items: center;
    gap: 1rem;
    cursor: pointer;
  }

  .setting-text {
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--text-primary);
  }

  .setting-desc {
    font-size: 0.75rem;
    color: var(--text-muted);
    margin-top: 0.75rem;
    margin-left: 3.5rem;
  }

  /* Custom Acapulco Toggle */
  .toggle-acapulco {
    --tw-toggle-bg-on: var(--acapulco);
    --tw-toggle-border-on: var(--acapulco);
    background-color: var(--surface-muted);
    border-color: var(--border-color);
  }

  :global(.toggle-acapulco:checked) {
    background-color: var(--acapulco);
    border-color: var(--acapulco);
  }

  :global(.toggle-acapulco:focus) {
    box-shadow: 0 0 0 2px rgba(122, 186, 165, 0.2);
  }
</style>
