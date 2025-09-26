<script lang="ts">
  interface Props {
    type?: 'text' | 'password' | 'email' | 'number';
    placeholder?: string;
    value?: string;
    required?: boolean;
    disabled?: boolean;
    error?: string;
    label?: string;
    name?: string;
    autocomplete?: string;
    oninput?: (event: Event) => void;
    onblur?: (event: FocusEvent) => void;
  }

  let {
    type = 'text',
    placeholder = '',
    value = $bindable(''),
    required = false,
    disabled = false,
    error = '',
    label = '',
    name = '',
    autocomplete = 'off',
    oninput,
    onblur
  }: Props = $props();
</script>

<div class="form-control w-full">
  {#if label}
    <label for={name} class="label">
      <span class="label-text">
        {label}
        {#if required}
          <span class="text-error">*</span>
        {/if}
      </span>
    </label>
  {/if}

  <input
    {type}
    {name}
    {placeholder}
    {required}
    {disabled}
    {autocomplete}
    bind:value
    {oninput}
    {onblur}
    class="input input-bordered w-full {error ? 'input-error' : ''} {disabled ? 'opacity-50 cursor-not-allowed' : ''}"
  />

  {#if error}
    <label class="label">
      <span class="label-text-alt text-error">{error}</span>
    </label>
  {/if}
</div>