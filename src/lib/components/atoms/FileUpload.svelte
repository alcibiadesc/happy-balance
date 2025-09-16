<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  export let accept = '.csv';
  export let disabled = false;
  export let multiple = false;
  export let dragActive = false;

  const dispatch = createEventDispatcher<{
    upload: { files: FileList };
    dragover: boolean;
  }>();

  let fileInput: HTMLInputElement;
  let isDragActive = false;

  function handleFileSelect(event: Event) {
    const target = event.target as HTMLInputElement;
    if (target.files && target.files.length > 0) {
      dispatch('upload', { files: target.files });
    }
  }

  function handleDragOver(event: DragEvent) {
    event.preventDefault();
    if (!isDragActive) {
      isDragActive = true;
      dispatch('dragover', true);
    }
  }

  function handleDragLeave(event: DragEvent) {
    event.preventDefault();
    if (!event.currentTarget?.contains(event.relatedTarget as Node)) {
      isDragActive = false;
      dispatch('dragover', false);
    }
  }

  function handleDrop(event: DragEvent) {
    event.preventDefault();
    isDragActive = false;
    dispatch('dragover', false);
    
    if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
      dispatch('upload', { files: event.dataTransfer.files });
    }
  }

  function openFileDialog() {
    if (!disabled) {
      fileInput?.click();
    }
  }
</script>

<div
  class="relative border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 cursor-pointer
    {isDragActive || dragActive 
      ? 'border-acapulco bg-acapulco bg-opacity-5 scale-105' 
      : 'border-evening-sea border-opacity-30 hover:border-acapulco hover:bg-acapulco hover:bg-opacity-5'
    }
    {disabled ? 'opacity-50 cursor-not-allowed' : ''}
  "
  on:dragover={handleDragOver}
  on:dragleave={handleDragLeave}
  on:drop={handleDrop}
  on:click={openFileDialog}
  on:keydown={(e) => e.key === 'Enter' && openFileDialog()}
  role="button"
  tabindex="0"
>
  <input
    bind:this={fileInput}
    type="file"
    {accept}
    {multiple}
    {disabled}
    class="sr-only"
    on:change={handleFileSelect}
    data-testid="file-upload"
  />

  <div class="flex flex-col items-center space-y-4">
    <!-- Upload Icon -->
    <svg 
      class="w-12 h-12 text-acapulco transition-transform duration-200 {isDragActive || dragActive ? 'scale-110' : ''}" 
      fill="none" 
      stroke="currentColor" 
      viewBox="0 0 24 24"
    >
      <path 
        stroke-linecap="round" 
        stroke-linejoin="round" 
        stroke-width="2" 
        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
      />
    </svg>

    <div class="space-y-2">
      <p class="text-lg font-medium text-evening-sea">
        {#if isDragActive || dragActive}
          Drop your CSV file here
        {:else}
          Choose a CSV file or drag it here
        {/if}
      </p>
      <p class="text-sm text-evening-sea text-opacity-70">
        Supports CSV files up to 10MB
      </p>
    </div>

    <div class="text-xs text-evening-sea text-opacity-50">
      <span class="font-medium">Supported formats:</span> .csv
    </div>
  </div>
</div>
