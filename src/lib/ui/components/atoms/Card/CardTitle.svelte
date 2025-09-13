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

<h3 class={cn('card-title', className)} {...props}>
  {@render children?.()}
</h3>