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

<div class={cn('p-6 pt-0', className)} {...props}>
  {@render children?.()}
</div>