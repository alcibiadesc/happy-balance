<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  export let checked = false;
  export let disabled = false;
  export let label = '';
  export let size: 'sm' | 'md' = 'md';

  const dispatch = createEventDispatcher<{ change: boolean }>();

  function handleChange() {
    if (!disabled) {
      checked = !checked;
      dispatch('change', checked);
    }
  }

  const sizeClasses = {
    sm: {
      toggle: 'w-8 h-5',
      thumb: 'w-4 h-4',
      translate: checked ? 'translate-x-3' : 'translate-x-0'
    },
    md: {
      toggle: 'w-11 h-6',
      thumb: 'w-5 h-5',
      translate: checked ? 'translate-x-5' : 'translate-x-0'
    }
  };
</script>

<div class="flex items-center space-x-3">
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    aria-label={label}
    class="relative inline-flex rounded-full transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-acapulco/30 focus:ring-offset-2 
      {sizeClasses[size].toggle}
      {checked ? 'bg-acapulco' : 'bg-evening-sea/20'}
      {disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
    "
    on:click={handleChange}
    on:keydown={(e) => e.key === 'Enter' && handleChange()}
    {disabled}
  >
    <span
      class="inline-block rounded-full bg-bridesmaid shadow-lg transform transition-all duration-300 ease-in-out
        {sizeClasses[size].thumb}
        {sizeClasses[size].translate}
        {checked ? 'shadow-acapulco/20' : 'shadow-evening-sea/10'}
      "
    >
      <!-- Optional inner icon -->
      {#if checked}
        <div class="flex items-center justify-center h-full text-acapulco">
          <svg class="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
          </svg>
        </div>
      {/if}
    </span>
  </button>

  {#if label}
    <label class="text-sm font-medium text-evening-sea cursor-pointer {disabled ? 'opacity-50' : ''}" 
           on:click={!disabled ? handleChange : null}>
      {label}
    </label>
  {/if}
</div>
