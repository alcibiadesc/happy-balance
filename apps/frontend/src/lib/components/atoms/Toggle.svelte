<script lang="ts">
  interface Props {
    checked?: boolean;
    disabled?: boolean;
    label?: string;
    size?: 'sm' | 'md';
    onchange?: (checked: boolean) => void;
  }

  let {
    checked = $bindable(false),
    disabled = false,
    label = '',
    size = 'md',
    onchange,
  }: Props = $props();

  function handleChange() {
    if (!disabled) {
      checked = !checked;
      onchange?.(checked);
    }
  }

  const sizeClasses = $derived({
    sm: {
      toggle: 'w-8 h-5',
      thumb: 'w-4 h-4',
      translate: checked ? 'translate-x-3' : 'translate-x-0',
    },
    md: {
      toggle: 'w-11 h-6',
      thumb: 'w-5 h-5',
      translate: checked ? 'translate-x-5' : 'translate-x-0',
    },
  });
</script>

<div class="flex items-center space-x-3">
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    aria-label={label}
    class="focus:ring-acapulco/30 relative inline-flex rounded-full transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2
      {sizeClasses[size].toggle}
      {checked ? 'bg-acapulco' : 'bg-evening-sea/20'}
      {disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
    "
    onclick={handleChange}
    onkeydown={(e) => e.key === 'Enter' && handleChange()}
    {disabled}
  >
    <span
      class="bg-bridesmaid inline-block transform rounded-full shadow-lg transition-all duration-300 ease-in-out
        {sizeClasses[size].thumb}
        {sizeClasses[size].translate}
        {checked ? 'shadow-acapulco/20' : 'shadow-evening-sea/10'}
      "
    >
      <!-- Optional inner icon -->
      {#if checked}
        <div class="text-acapulco flex h-full items-center justify-center">
          <svg class="h-2.5 w-2.5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fill-rule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clip-rule="evenodd"
            />
          </svg>
        </div>
      {/if}
    </span>
  </button>

  {#if label}
    <span
      class="text-evening-sea cursor-pointer text-sm font-medium {disabled ? 'opacity-50' : ''}"
      onclick={!disabled ? handleChange : undefined}
      role="button"
      tabindex="-1"
    >
      {label}
    </span>
  {/if}
</div>
