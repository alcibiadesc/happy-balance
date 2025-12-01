<script lang="ts">
  import { t } from '$lib/stores/i18n';

  interface Bank {
    id: string;
    name: string;
    logo?: string;
    status: 'supported' | 'coming-soon';
  }

  const banks: Bank[] = [
    { id: 'n26', name: 'N26', status: 'supported' },
    { id: 'more', name: 'import.more_banks', status: 'coming-soon' },
  ];
</script>

<div class="compatible-banks">
  <h3 class="banks-title">{$t('import.compatible_banks')}</h3>
  <div class="banks-list">
    {#each banks as bank (bank.id)}
      <div class="bank-item" class:coming-soon={bank.status === 'coming-soon'}>
        {#if bank.id === 'n26'}
          <!-- N26 Official Logo -->
          <div class="bank-logo-container n26">
            <img src="https://n26.com/logo.png" alt="N26" class="bank-logo" />
          </div>
          <span class="bank-name">{bank.name}</span>
        {:else}
          <div class="bank-logo-placeholder">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11M20 10v11M8 14v3M12 14v3M16 14v3" />
            </svg>
          </div>
          <span class="bank-name">{$t(bank.name)}</span>
        {/if}
        <span
          class="bank-status"
          class:supported={bank.status === 'supported'}
          class:upcoming={bank.status === 'coming-soon'}
        >
          {bank.status === 'supported' ? $t('import.supported') : $t('import.coming_soon')}
        </span>
      </div>
    {/each}
  </div>
</div>

<style>
  .compatible-banks {
    background: var(--surface-muted);
    border: 1px solid var(--border-color);
    border-radius: 0.75rem;
    padding: 1.25rem;
    margin-top: 1.5rem;
  }

  .banks-title {
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--text-muted);
    margin-bottom: 1rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .banks-list {
    display: flex;
    gap: 0.75rem;
    flex-wrap: wrap;
  }

  .bank-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.625rem 1rem;
    background: var(--surface);
    border: 1px solid var(--border-color);
    border-radius: 0.5rem;
    transition: all 0.2s ease;
    min-width: 140px;
  }

  .bank-item:not(.coming-soon):hover {
    border-color: #36a18b;
    background: rgba(54, 161, 139, 0.04);
  }

  .bank-item.coming-soon {
    opacity: 0.5;
  }

  .bank-logo-container {
    width: 1.75rem;
    height: 1.75rem;
    flex-shrink: 0;
    border-radius: 50%;
    overflow: hidden;
  }

  .bank-logo-container.n26 {
    box-shadow: 0 2px 4px rgba(54, 161, 139, 0.2);
  }

  .bank-logo {
    width: 100%;
    height: 100%;
  }

  .bank-logo-placeholder {
    width: 1.75rem;
    height: 1.75rem;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--text-muted);
    background: var(--surface-muted);
    border-radius: 50%;
  }

  .bank-logo-placeholder svg {
    width: 1rem;
    height: 1rem;
  }

  .bank-name {
    font-weight: 600;
    font-size: 0.8125rem;
    color: var(--text-primary);
    flex: 1;
  }

  .bank-status {
    font-size: 0.625rem;
    font-weight: 500;
    padding: 0.1875rem 0.375rem;
    border-radius: 0.25rem;
    text-transform: uppercase;
    letter-spacing: 0.025em;
  }

  .bank-status.supported {
    background: rgba(54, 161, 139, 0.12);
    color: #36a18b;
  }

  .bank-status.upcoming {
    background: var(--surface-muted);
    color: var(--text-muted);
  }
</style>
