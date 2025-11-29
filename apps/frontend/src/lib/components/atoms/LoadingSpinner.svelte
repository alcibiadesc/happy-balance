<script lang="ts">
  interface Props {
    size?: number;
    message?: string;
  }

  let { size = 24, message }: Props = $props();
</script>

<div class="loading-container">
  <div class="spinner" style="width: {size}px; height: {size}px;"></div>
  {#if message}
    <span class="message">{message}</span>
  {/if}
</div>

<style>
  .loading-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    height: 100%;
  }

  .spinner {
    border: 2px solid var(--border-color);
    border-top: 2px solid var(--primary);
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  .message {
    color: var(--text-secondary);
    font-size: 0.875rem;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
</style>
