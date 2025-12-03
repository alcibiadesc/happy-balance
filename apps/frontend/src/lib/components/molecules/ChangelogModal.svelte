<script lang="ts">
  import { ExternalLink, GitCommit, Calendar } from 'lucide-svelte';
  import { t } from '$lib/stores/i18n';
  import Modal from '$lib/components/atoms/Modal.svelte';

  interface Props {
    open: boolean;
    onclose: () => void;
  }

  const { open, onclose }: Props = $props();

  interface Release {
    tag_name: string;
    name: string;
    body: string;
    published_at: string;
    html_url: string;
  }

  let releases = $state<Release[]>([]);
  let loading = $state(true);
  let error = $state<string | null>(null);

  const GITHUB_API = 'https://api.github.com/repos/alcibiadesc/happy-balance/releases';

  async function fetchReleases() {
    loading = true;
    error = null;
    try {
      const response = await fetch(`${GITHUB_API}?per_page=5`);
      if (!response.ok) throw new Error('Failed to fetch releases');
      releases = await response.json();
    } catch (e) {
      error = e instanceof Error ? e.message : 'Error desconocido';
    } finally {
      loading = false;
    }
  }

  $effect(() => {
    if (open) {
      fetchReleases();
    }
  });

  function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }

  function parseChangelog(body: string): string[] {
    const lines = body.split('\n').filter((line) => line.trim().startsWith('- '));
    return lines.map((line) => line.trim().replace(/^- /, ''));
  }
</script>

<Modal {open} {onclose} title={$t('updates.changelog_title')} size="md">
  {#if loading}
    <div class="loading">
      <div class="spinner"></div>
      <span>{$t('updates.loading_releases')}</span>
    </div>
  {:else if error}
    <div class="error">
      <p>{$t('updates.could_not_load')}</p>
      <a
        href="https://github.com/alcibiadesc/happy-balance/releases"
        target="_blank"
        rel="noopener"
      >
        {$t('updates.view_on_github')}
        <ExternalLink size={14} />
      </a>
    </div>
  {:else if releases.length === 0}
    <p class="empty">{$t('updates.no_releases')}</p>
  {:else}
    <div class="releases">
      {#each releases as release, i (release.tag_name)}
        <article class="release" class:release--latest={i === 0}>
          <div class="release-header">
            <div class="release-info">
              <span class="release-tag">
                <GitCommit size={14} strokeWidth={2} />
                {release.tag_name}
              </span>
              {#if i === 0}
                <span class="badge-latest">{$t('updates.latest')}</span>
              {/if}
            </div>
            <span class="release-date">
              <Calendar size={12} strokeWidth={2} />
              {formatDate(release.published_at)}
            </span>
          </div>
          <ul class="changes">
            {#each parseChangelog(release.body) as change}
              <li>{change}</li>
            {/each}
          </ul>
        </article>
      {/each}
    </div>
  {/if}

  {#snippet footer()}
    <div class="footer-content">
      <a
        href="https://github.com/alcibiadesc/happy-balance/releases"
        target="_blank"
        rel="noopener noreferrer"
        class="github-link"
      >
        {$t('updates.view_all_on_github')}
        <ExternalLink size={14} strokeWidth={2} />
      </a>
    </div>
  {/snippet}
</Modal>

<style>
  .loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.75rem;
    padding: 2rem;
    color: var(--text-secondary);
  }

  .spinner {
    width: 24px;
    height: 24px;
    border: 2px solid var(--border-color);
    border-top-color: var(--primary);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  .error {
    text-align: center;
    padding: 2rem;
    color: var(--text-secondary);
  }

  .error a {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    color: var(--primary);
    margin-top: 0.5rem;
  }

  .empty {
    text-align: center;
    padding: 2rem;
    color: var(--text-tertiary);
  }

  .releases {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .release {
    padding: 0.875rem;
    background: var(--surface-muted);
    border-radius: var(--radius-md);
    border: 1px solid transparent;
  }

  .release--latest {
    border-color: var(--primary-light);
    background: var(--primary-light);
  }

  .release-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 0.5rem;
  }

  .release-info {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .release-tag {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    font-family: 'SF Mono', 'Monaco', monospace;
    font-size: 0.75rem;
    font-weight: 500;
    color: var(--text-primary);
  }

  .badge-latest {
    font-size: 0.625rem;
    font-weight: 600;
    text-transform: uppercase;
    padding: 0.125rem 0.375rem;
    background: var(--success);
    color: white;
    border-radius: var(--radius-sm);
  }

  .release-date {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    font-size: 0.6875rem;
    color: var(--text-tertiary);
  }

  .changes {
    margin: 0;
    padding-left: 1rem;
    font-size: 0.8125rem;
    color: var(--text-secondary);
    line-height: 1.6;
  }

  .changes li {
    margin-bottom: 0.125rem;
  }

  .footer-content {
    text-align: center;
  }

  .github-link {
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
    font-size: 0.8125rem;
    color: var(--text-secondary);
    text-decoration: none;
    transition: color 0.15s;
  }

  .github-link:hover {
    color: var(--primary);
  }
</style>
