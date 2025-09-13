<script lang="ts">
  import { cn } from '$lib/shared/utils/cn';

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
  class={cn('input input-bordered w-full', className)}
  {oninput}
  {onchange}
  {onfocus}
  {onblur}
  {...props}
/>