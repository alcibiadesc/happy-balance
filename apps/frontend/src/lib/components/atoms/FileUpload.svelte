<script lang="ts">
  interface Props {
    accept?: string;
    disabled?: boolean;
    multiple?: boolean;
    dragActive?: boolean;
    onupload?: (files: FileList) => void;
    ondragover?: (active: boolean) => void;
  }

  let {
    accept = '.csv',
    disabled = false,
    multiple = false,
    dragActive = false,
    onupload,
    ondragover,
  }: Props = $props();

  let fileInput = $state<HTMLInputElement | null>(null);
  let isDragActive = $state(false);

  function handleFileSelect(event: Event) {
    const target = event.target as HTMLInputElement;
    if (target.files && target.files.length > 0) {
      onupload?.(target.files);
    }
  }

  function handleDragOver(event: DragEvent) {
    event.preventDefault();
    if (!isDragActive) {
      isDragActive = true;
      ondragover?.(true);
    }
  }

  function handleDragLeave(event: DragEvent) {
    event.preventDefault();
    if (!(event.currentTarget as HTMLElement)?.contains(event.relatedTarget as Node)) {
      isDragActive = false;
      ondragover?.(false);
    }
  }

  function handleDrop(event: DragEvent) {
    event.preventDefault();
    isDragActive = false;
    ondragover?.(false);

    if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
      onupload?.(event.dataTransfer.files);
    }
  }

  function openFileDialog() {
    if (!disabled) {
      fileInput?.click();
    }
  }
</script>

<div
  class="relative cursor-pointer rounded-lg border-2 border-dashed p-8 text-center transition-all duration-200
    {isDragActive || dragActive
    ? 'border-acapulco bg-acapulco scale-105 bg-opacity-5'
    : 'border-evening-sea hover:border-acapulco hover:bg-acapulco border-opacity-30 hover:bg-opacity-5'}
    {disabled ? 'cursor-not-allowed opacity-50' : ''}
  "
  ondragover={handleDragOver}
  ondragleave={handleDragLeave}
  ondrop={handleDrop}
  onclick={openFileDialog}
  onkeydown={(e) => e.key === 'Enter' && openFileDialog()}
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
    onchange={handleFileSelect}
    data-testid="file-upload"
  />

  <div class="flex flex-col items-center space-y-4">
    <!-- Upload Icon -->
    <svg
      class="text-acapulco h-12 w-12 transition-transform duration-200 {isDragActive || dragActive
        ? 'scale-110'
        : ''}"
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
      <p class="text-evening-sea text-lg font-medium">
        {#if isDragActive || dragActive}
          Drop your CSV file here
        {:else}
          Choose a CSV file or drag it here
        {/if}
      </p>
      <p class="text-evening-sea text-sm text-opacity-70">Supports CSV files up to 10MB</p>
    </div>

    <div class="text-evening-sea text-xs text-opacity-50">
      <span class="font-medium">Supported formats:</span> .csv
    </div>
  </div>
</div>
