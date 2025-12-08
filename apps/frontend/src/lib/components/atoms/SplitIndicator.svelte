<script lang="ts">
  import { Split } from 'lucide-svelte';

  interface Props {
    percentage: number;
    isLinked?: boolean;
    isExpense?: boolean;
  }

  let { percentage, isLinked = false, isExpense = true }: Props = $props();

  const title = $derived(
    isLinked
      ? isExpense
        ? `Gasto compartido - Pagas el ${percentage}%`
        : `Reembolso vinculado - Cubre el ${percentage}%`
      : isExpense
        ? `Gasto compartido - Pagas el ${percentage}% (sin vincular)`
        : `Reembolso - Cubre el ${percentage}% (sin vincular)`
  );
</script>

<div class="split-indicator" class:unlinked={!isLinked} {title}>
  <Split size={12} />
  <span>{percentage}%</span>
</div>

<style>
  .split-indicator {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    padding: 0.125rem 0.5rem;
    background: var(--primary-alpha-10);
    border: 1px solid var(--primary);
    border-radius: 0.375rem;
    font-size: 0.75rem;
    font-weight: 500;
    color: var(--primary);
    cursor: help;
    transition: all 0.2s ease;
  }

  .split-indicator:hover {
    background: var(--primary-alpha-20);
    transform: scale(1.05);
  }

  .split-indicator.unlinked {
    background: var(--surface-muted);
    border-color: var(--text-secondary);
    color: var(--text-secondary);
    border-style: dashed;
  }

  .split-indicator.unlinked:hover {
    background: var(--surface-hover);
    border-color: var(--text-primary);
    color: var(--text-primary);
  }

  @media (max-width: 768px) {
    .split-indicator {
      font-size: 0.65rem;
      padding: 0.1rem 0.375rem;
    }
  }

  @media (max-width: 360px) {
    .split-indicator {
      font-size: 0.6rem;
      padding: 0.0625rem 0.25rem;
    }
  }
</style>
