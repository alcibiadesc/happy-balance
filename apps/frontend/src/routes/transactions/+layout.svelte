<script lang="ts">
  // Layout for transactions - currently empty but kept for potential future use
</script>

<!-- Layout wrapper for transactions page -->
<div class="transactions-layout">
  <slot />
</div>

<style>
  .transactions-layout {
    min-height: 100vh;
    background: var(--surface);
  }

  @media (min-width: 1024px) {
    .transactions-layout {
      /* Account for sidebar */
      margin-left: 0;
    }
  }
</style>
