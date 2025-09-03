<script lang="ts">
  import { cn } from '$lib/shared/utils/cn.js';

  interface Props {
    class?: string;
    type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'search' | 'file';
    value?: string | number;
    placeholder?: string;
    disabled?: boolean;
    readonly?: boolean;
    required?: boolean;
    autocomplete?: string | null;
    id?: string;
    name?: string;
    min?: number;
    max?: number;
    step?: number;
    accept?: string;
    oninput?: (event: Event & { currentTarget: HTMLInputElement }) => void;
    onchange?: (event: Event & { currentTarget: HTMLInputElement }) => void;
    onfocus?: (event: FocusEvent & { currentTarget: HTMLInputElement }) => void;
    onblur?: (event: FocusEvent & { currentTarget: HTMLInputElement }) => void;
  }

  let {
    class: className,
    type = 'text',
    value = $bindable(),
    placeholder,
    disabled = false,
    readonly = false,
    required = false,
    autocomplete,
    id,
    name,
    min,
    max,
    step,
    accept,
    oninput,
    onchange,
    onfocus,
    onblur,
    ...props
  }: Props = $props();
</script>

<input
  {type}
  {id}
  {name}
  {placeholder}
  {disabled}
  {readonly}
  {required}
  autocomplete={autocomplete || undefined}
  {min}
  {max}
  {step}
  {accept}
  bind:value
  class={cn(
    'flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
    className
  )}
  {oninput}
  {onchange}
  {onfocus}
  {onblur}
  {...props}
/>