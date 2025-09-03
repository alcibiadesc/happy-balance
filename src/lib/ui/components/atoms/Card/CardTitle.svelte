<script lang="ts">
  import { cn } from '$lib/shared/utils/cn.js';

  interface Props {
    class?: string;
    children?: import('svelte').Snippet;
  }

  let {
    class: className,
    children,
    ...props
  }: Props = $props();
</script>

<h3 class={cn('text-lg font-semibold leading-none tracking-tight', className)} {...props}>
  {@render children?.()}
</h3>