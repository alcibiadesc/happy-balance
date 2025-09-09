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

<div class={cn('rounded-lg border bg-card text-card-foreground shadow-sm', className)} {...props}>
  {@render children?.()}
</div>