<script lang="ts">
  import { Check, X, ArrowDown, ArrowLeft } from 'lucide-svelte';
  import { t } from '$lib/stores/i18n';

  interface Props {
    acceptedCount: number;
    rejectedCount: number;
    skippedCount: number;
    onBack: () => void;
  }

  const { acceptedCount, rejectedCount, skippedCount, onBack }: Props = $props();

  const totalProcessed = $derived(acceptedCount + rejectedCount + skippedCount);
</script>

<div class="completion-screen">
  <div class="celebration">
    <span class="celebration-icon">&#127881;</span>
    <h2 class="completion-title">{$t('tinder.complete_title')}</h2>
    <p class="completion-subtitle">{$t('tinder.complete_subtitle')}</p>
  </div>

  <div class="stats-grid">
    <div class="stat-card accepted">
      <div class="stat-icon"><Check size={20} /></div>
      <div class="stat-value">{acceptedCount}</div>
      <div class="stat-label">{$t('tinder.accepted')}</div>
    </div>
    <div class="stat-card rejected">
      <div class="stat-icon"><X size={20} /></div>
      <div class="stat-value">{rejectedCount}</div>
      <div class="stat-label">{$t('tinder.rejected')}</div>
    </div>
    <div class="stat-card skipped">
      <div class="stat-icon"><ArrowDown size={20} /></div>
      <div class="stat-value">{skippedCount}</div>
      <div class="stat-label">{$t('tinder.skipped')}</div>
    </div>
  </div>

  <div class="total-processed">
    {$t('tinder.total_processed', { count: totalProcessed.toString() })}
  </div>

  <button class="back-btn" onclick={onBack}>
    <ArrowLeft size={16} />
    {$t('tinder.back_to_transactions')}
  </button>
</div>

<style>
  .completion-screen {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-2xl, 2rem);
    padding: var(--space-3xl, 3rem) var(--space-xl, 1.5rem);
    text-align: center;
    width: 100%;
    max-width: 400px;
    margin: 0 auto;
  }

  .celebration {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-sm, 0.5rem);
  }

  .celebration-icon {
    font-size: 4rem;
    animation: bounce 1s ease-in-out;
  }

  @keyframes bounce {
    0%,
    100% {
      transform: translateY(0);
    }
    50% {
      transform: translateY(-20px);
    }
  }

  .completion-title {
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--text-primary);
    margin: 0;
  }

  .completion-subtitle {
    font-size: 0.9375rem;
    color: var(--text-secondary);
    margin: 0;
  }

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: var(--space-md, 0.75rem);
    width: 100%;
  }

  .stat-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-xs, 0.25rem);
    padding: var(--space-lg, 1rem);
    border-radius: var(--radius-md, 0.5rem);
    background: var(--surface-elevated);
    box-shadow: var(--shadow-sm);
  }

  .stat-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border-radius: 50%;
    margin-bottom: var(--space-xs, 0.25rem);
  }

  .stat-card.accepted .stat-icon {
    background: rgba(122, 186, 165, 0.15);
    color: var(--acapulco, #7abaa5);
  }

  .stat-card.rejected .stat-icon {
    background: rgba(245, 121, 108, 0.15);
    color: var(--froly, #f5796c);
  }

  .stat-card.skipped .stat-icon {
    background: var(--surface-muted);
    color: var(--text-muted);
  }

  .stat-value {
    font-family: var(--font-mono, 'JetBrains Mono', monospace);
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--text-primary);
  }

  .stat-label {
    font-size: 0.75rem;
    color: var(--text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .total-processed {
    font-size: 0.875rem;
    color: var(--text-secondary);
  }

  .back-btn {
    display: flex;
    align-items: center;
    gap: var(--space-sm, 0.5rem);
    padding: var(--space-md, 0.75rem) var(--space-xl, 1.5rem);
    background: var(--primary, #023c46);
    color: white;
    border: none;
    border-radius: var(--radius-md, 0.5rem);
    font-size: 0.9375rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }

  .back-btn:hover {
    opacity: 0.9;
    transform: translateY(-1px);
    box-shadow: var(--shadow-md);
  }
</style>
