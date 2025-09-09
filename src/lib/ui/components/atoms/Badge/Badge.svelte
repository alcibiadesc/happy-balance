<script lang="ts">
  import { type VariantProps, cva } from '$lib/utils/cva.js';
  import { cn } from '$lib/shared/utils/cn';

  const badgeVariants = cva(
    'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
    {
      variants: {
        variant: {
          default: 'border-transparent bg-primary text-primary-foreground hover:bg-primary/80',
          secondary: 'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80',
          destructive: 'border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80',
          outline: 'text-foreground',
          success: 'border-transparent bg-green-100 text-green-800 hover:bg-green-200',
          warning: 'border-transparent bg-yellow-100 text-yellow-800 hover:bg-yellow-200',
          income: 'border-transparent bg-green-100 text-green-800 hover:bg-green-200',
          expense: 'border-transparent bg-red-100 text-red-800 hover:bg-red-200',
          savings: 'border-transparent bg-blue-100 text-blue-800 hover:bg-blue-200',
          investment: 'border-transparent bg-purple-100 text-purple-800 hover:bg-purple-200',
          debt: 'border-transparent bg-orange-100 text-orange-800 hover:bg-orange-200',
        },
      },
      defaultVariants: {
        variant: 'default',
      },
    }
  );

  interface Props extends VariantProps<typeof badgeVariants> {
    class?: string;
    children?: import('svelte').Snippet;
  }

  let {
    class: className,
    variant = 'default',
    children,
    ...props
  }: Props = $props();
</script>

<div class={cn(badgeVariants({ variant }), className)} {...props}>
  {@render children?.()}
</div>