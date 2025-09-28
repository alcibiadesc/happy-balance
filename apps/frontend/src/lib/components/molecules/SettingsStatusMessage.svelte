<script lang="ts">
  import { CheckCircle, FileText, AlertCircle } from 'lucide-svelte';

  interface Props {
    message: string;
    type?: 'success' | 'error' | 'info';
  }

  let {
    message,
    type = 'info'
  }: Props = $props();
</script>

{#if message}
  <div class="status-message {type}">
    {#if type === 'success'}
      <CheckCircle size={20} strokeWidth={2} />
    {:else if type === 'error'}
      <AlertCircle size={20} strokeWidth={2} />
    {:else}
      <FileText size={20} strokeWidth={2} />
    {/if}
    <span>{message}</span>
  </div>
{/if}

<style>
  /* Status Messages - Exact copy from settings page */
  .status-message {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 1rem 1.25rem;
    border-radius: 0.75rem;
    margin-bottom: 1.5rem;
    font-size: 0.875rem;
    font-weight: 500;
  }

  .status-message.success {
    background: rgba(122, 186, 165, 0.1);
    border: 1px solid rgba(122, 186, 165, 0.2);
    color: var(--acapulco);
  }

  .status-message.error {
    background: rgba(245, 121, 108, 0.1);
    border: 1px solid rgba(245, 121, 108, 0.2);
    color: #f5796c;
  }

  .status-message.info {
    background: rgba(254, 205, 44, 0.1);
    border: 1px solid rgba(254, 205, 44, 0.2);
    color: #fecd2c;
  }
</style>