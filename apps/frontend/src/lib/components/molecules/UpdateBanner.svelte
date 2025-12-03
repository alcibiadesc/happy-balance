<script lang="ts">
  import { X } from 'lucide-svelte';
  import { updateInfo, showChangelogModal } from '$lib/stores/updates';
  import { t } from '$lib/stores/i18n';
  import { browser } from '$app/environment';

  let dismissed = $state(false);

  // Check if user already dismissed this version
  $effect(() => {
    if (browser && $updateInfo.latest?.commit) {
      const dismissedVersion = localStorage.getItem('dismissed-update-version');
      if (dismissedVersion === $updateInfo.latest.commit) {
        dismissed = true;
      }
    }
  });

  function dismissBanner() {
    dismissed = true;
    if (browser && $updateInfo.latest?.commit) {
      localStorage.setItem('dismissed-update-version', $updateInfo.latest.commit);
    }
  }

  function openChangelog() {
    showChangelogModal.set(true);
  }

  const showBanner = $derived($updateInfo.updateAvailable && !dismissed);
</script>

{#if showBanner}
  <div class="update-banner">
    <div class="banner-content">
      <span class="update-dot"></span>
      <span class="banner-text">{$t('updates.new_version_available')}</span>
      <button class="release-link" onclick={openChangelog}>
        {$t('updates.view_changes')}
      </button>
    </div>
    <button class="dismiss-btn" onclick={dismissBanner} aria-label={$t('common.close')}>
      <X size={16} strokeWidth={2} />
    </button>
  </div>
{/if}

<style>
  .update-banner {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.625rem 1rem;
    background: var(--surface-elevated, #fff);
    border-bottom: 1px solid var(--border-color);
    font-size: 0.8125rem;
  }

  .banner-content {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .update-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--success, #10b981);
    flex-shrink: 0;
  }

  .banner-text {
    color: var(--text-secondary);
  }

  .release-link {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    color: var(--primary);
    background: none;
    border: none;
    padding: 0;
    font: inherit;
    font-weight: 500;
    cursor: pointer;
    transition: opacity 0.15s;
  }

  .release-link:hover {
    opacity: 0.8;
    text-decoration: underline;
  }

  .dismiss-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0.25rem;
    background: transparent;
    border: none;
    color: var(--text-tertiary);
    cursor: pointer;
    border-radius: 4px;
    transition:
      color 0.15s,
      background 0.15s;
  }

  .dismiss-btn:hover {
    color: var(--text-primary);
    background: var(--surface-muted);
  }

  @media (min-width: 1024px) {
    .update-banner {
      left: 280px;
    }

    :global(body.sidebar-collapsed .update-banner) {
      left: 80px;
    }
  }
</style>
