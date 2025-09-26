<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    title?: string;
    compact?: boolean;
    bordered?: boolean;
    children: Snippet;
  }

  let { title = '', compact = false, bordered = true, children }: Props = $props();
</script>

<div class="card {bordered ? 'bordered' : ''} bg-base-100 shadow-xl">
  {#if title}
    <div class="card-title {compact ? 'px-4 py-2' : 'px-6 py-4'}">
      <h2 class="text-xl font-semibold">{title}</h2>
    </div>
  {/if}

  <div class="card-body {compact ? 'p-4' : 'p-6'}">
    {@render children()}
  </div>
</div>