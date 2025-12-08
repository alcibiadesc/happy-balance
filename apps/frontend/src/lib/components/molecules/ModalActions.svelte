<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    children: Snippet;
  }

  let { children }: Props = $props();
</script>

<div class="modal-actions">
  {@render children()}
</div>

<style>
  .modal-actions {
    display: flex;
    gap: 0.75rem;
    justify-content: flex-end;
    padding: 1rem 1.5rem;
    border-top: 1px solid var(--border-color);
  }

  @media (max-width: 480px) {
    .modal-actions {
      flex-direction: column-reverse;
      gap: 0.5rem;
      padding: 1rem 1.25rem;
    }

    .modal-actions :global(button) {
      width: 100%;
      justify-content: center;
    }
  }
</style>
