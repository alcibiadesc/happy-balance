<script lang="ts">
  import { cn } from '$lib/shared/utils/cn';

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

<div class={cn('flex flex-col space-y-1.5 p-6', className)} {...props}>
  {@render children?.()}
</div>