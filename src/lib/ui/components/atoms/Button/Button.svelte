<script lang="ts">
  import { type VariantProps, cva } from '$lib/utils/cva.js';
  import { cn } from '$lib/shared/utils/cn';

  const buttonVariants = cva(
    'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
    {
      variants: {
        variant: {
          primary: 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm',
          secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80 shadow-sm',
          destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-sm',
          outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground shadow-sm',
          ghost: 'hover:bg-accent hover:text-accent-foreground',
          link: 'text-primary underline-offset-4 hover:underline',
          success: 'bg-green-600 text-white hover:bg-green-700 shadow-sm',
          warning: 'bg-yellow-600 text-white hover:bg-yellow-700 shadow-sm',
        },
        size: {
          default: 'h-10 px-4 py-2',
          sm: 'h-9 rounded-md px-3 text-xs',
          lg: 'h-11 rounded-md px-8',
          icon: 'h-10 w-10',
        },
      },
      defaultVariants: {
        variant: 'primary',
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
    'aria-label'?: string;
  }

  let {
    class: className,
    variant = 'primary',
    size = 'default',
    type = 'button',
    disabled = false,
    loading = false,
    onclick,
    children,
    'aria-label': ariaLabel,
    ...props
  }: Props = $props();

  const isDisabled = $derived(disabled || loading);
</script>

<button
  {type}
  class={cn(buttonVariants({ variant, size }), className)}
  disabled={isDisabled}
  onclick={onclick}
  aria-label={ariaLabel}
  {...props}
>
  {#if loading}
    <svg 
      class="mr-2 h-4 w-4 animate-spin" 
      xmlns="http://www.w3.org/2000/svg" 
      fill="none" 
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle 
        class="opacity-25" 
        cx="12" 
        cy="12" 
        r="10" 
        stroke="currentColor" 
        stroke-width="4"
      ></circle>
      <path 
        class="opacity-75" 
        fill="currentColor" 
        d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      ></path>
    </svg>
  {/if}
  
  {#if children}
    {@render children()}
  {/if}
</button>