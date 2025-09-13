<script lang="ts">
  import { cn } from '$lib/shared/utils/cn';

  export let variant: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' | 'income' | 'expense' | 'savings' | 'investment' | 'debt' = 'default';

  interface Props {
    class?: string;
    children?: import('svelte').Snippet;
  }

  let {
    class: className,
    children,
    ...props
  }: Props = $props();

  // DaisyUI badge variant mapping
  const variantClasses = {
    default: 'badge-primary',
    secondary: 'badge-secondary', 
    destructive: 'badge-error',
    outline: 'badge-outline',
    success: 'badge-success',
    warning: 'badge-warning',
    income: 'badge-success',
    expense: 'badge-error',
    savings: 'badge-info',
    investment: 'badge-accent',
    debt: 'badge-warning',
  };

  $: badgeClass = variantClasses[variant] || variantClasses.default;
</script>

<div class={cn('badge', badgeClass, className)} {...props}>
  {@render children?.()}
</div>