<script lang="ts">
  import { type VariantProps, cva } from '$lib/utils/cva.js';
  import { cn } from '$lib/shared/utils/cn.js';

  const buttonVariants = cva(
    'btn-editorial interactive-lift focus-ring disabled:pointer-events-none disabled:opacity-50 disabled:transform-none',
    {
      variants: {
        variant: {
          default: 'btn-primary',
          destructive: 'bg-coral-red text-white shadow-subtle hover:shadow-medium hover:translate-y-[-1px]',
          outline: 'border border-medium-grey bg-white shadow-subtle hover:bg-light-grey hover:border-text-grey hover:translate-y-[-1px]',
          secondary: 'btn-secondary',
          ghost: 'btn-ghost',
          link: 'bg-transparent text-charcoal hover:text-black underline-offset-4 hover:underline',
          success: 'bg-sage-green text-white shadow-subtle hover:shadow-medium hover:translate-y-[-1px]',
          warning: 'bg-amber text-white shadow-subtle hover:shadow-medium hover:translate-y-[-1px]',
        },
        size: {
          default: 'px-6 py-3 text-base',
          sm: 'px-4 py-2 text-sm rounded-sm',
          lg: 'px-8 py-4 text-lg rounded-lg',
          icon: 'p-3 w-auto h-auto min-w-[2.75rem] min-h-[2.75rem]',
        },
      },
      defaultVariants: {
        variant: 'default',
        size: 'default',
      },
    }
  );

  interface Props extends VariantProps<typeof buttonVariants> {
    class?: string;
    type?: 'button' | 'submit' | 'reset';
    disabled?: boolean;
    loading?: boolean;
    onclick?: () => void;
    children?: import('svelte').Snippet;
  }

  let {
    class: className,
    variant = 'default',
    size = 'default',
    type = 'button',
    disabled = false,
    loading = false,
    onclick,
    children,
    ...props
  }: Props = $props();
</script>

<button
  {type}
  class={cn(buttonVariants({ variant, size, className }))}
  disabled={disabled || loading}
  onclick={onclick}
  {...props}
>
  {#if loading}
    <svg class="mr-2 h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
      <path class="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
  {/if}
  {@render children?.()}
</button>