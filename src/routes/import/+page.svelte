<script lang="ts">
  import { onMount } from 'svelte';
  import { 
    Upload, 
    FileText, 
    CheckCircle, 
    AlertTriangle, 
    Download,
    ArrowRight
  } from 'lucide-svelte';

  interface CSVFile {
    name: string;
    size: number;
    content: string;
  }

  interface ImportResult {
    total: number;
    success: number;
    errors: string[];
  }

  let isDragOver = $state(false);
  let file = $state<CSVFile | null>(null);
  let isProcessing = $state(false);
  let result = $state<ImportResult | null>(null);
  let fileInput: HTMLInputElement;

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    isDragOver = true;
  };

  const handleDragLeave = (e: DragEvent) => {
    e.preventDefault();
    isDragOver = false;
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    isDragOver = false;
    
    const droppedFile = e.dataTransfer?.files[0];
    if (droppedFile && droppedFile.type === 'text/csv') {
      processFile(droppedFile);
    }
  };

  const handleFileSelect = (e: Event) => {
    const target = e.target as HTMLInputElement;
    const selectedFile = target.files?.[0];
    if (selectedFile) {
      processFile(selectedFile);
    }
  };

  const processFile = async (selectedFile: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      file = {
        name: selectedFile.name,
        size: selectedFile.size,
        content
      };
    };
    reader.readAsText(selectedFile);
  };

  const handleImport = async () => {
    if (!file) return;

    isProcessing = true;
    
    // Simular procesamiento
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Simular resultado
    const mockResult: ImportResult = {
      total: 125,
      success: 120,
      errors: [
        'Row 15: Invalid date format',
        'Row 32: Missing amount',
        'Row 87: Invalid category',
        'Row 103: Duplicate transaction',
        'Row 118: Invalid format'
      ]
    };
    
    result = mockResult;
    isProcessing = false;
  };

  const resetImport = () => {
    file = null;
    result = null;
    isProcessing = false;
    if (fileInput) {
      fileInput.value = '';
    }
  };

  const downloadTemplate = () => {
    const csvContent = "data:text/csv;charset=utf-8,Date,Description,Amount,Category\n2024-01-01,Coffee Shop,-4.50,Food\n2024-01-01,Salary,3000.00,Income\n2024-01-02,Gas Station,-45.00,Transportation";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "expense_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
</script>

<div class="min-h-screen" style="background-color: #fef7ee;">
  <!-- Hero Section - Minimal y Espacioso -->
  <section class="pt-4xl pb-3xl">
    <div class="container-gentle">
      <div class="text-center fade-in">
        <div class="mb-xl">
          <div class="w-16 h-16 mx-auto mb-lg flex items-center justify-center">
            <Upload class="w-8 h-8" style="color: var(--evening-sea);" />
          </div>
        </div>
        
        <h1 class="text-proclaim mb-lg">
          Import
        </h1>
        
        <p class="text-voice mb-xl max-w-md mx-auto">
          Upload your financial data from CSV files.
        </p>

        <div class="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <button 
            onclick={() => fileInput?.click()}
            class="btn-primary"
          >
            <Upload class="w-4 h-4" />
            Select File
          </button>
          
          <button 
            onclick={downloadTemplate}
            class="btn-secondary"
          >
            <Download class="w-4 h-4" />
            Template
          </button>
        </div>
      </div>
    </div>
  </section>

  <hr class="divider-whisper" />

  <!-- Upload Section - Clean y Focused -->
  <section class="pt-3xl pb-4xl">
    <div class="container-intimate">
      
      {#if !file && !result}
        <!-- Empty State -->
        <div class="fade-in">
          <div 
            class="card-breath pa-4xl text-center breathe cursor-pointer {isDragOver ? 'border-2 border-dashed' : ''}"
            style={isDragOver ? 'border-color: var(--acapulco); background-color: var(--ash);' : ''}
            on:dragover={handleDragOver}
            on:dragleave={handleDragLeave}
            on:drop={handleDrop}
            onclick={() => fileInput?.click()}
            role="button"
            tabindex="0"
            on:keydown={(e) => e.key === 'Enter' && fileInput?.click()}
          >
            <div class="mb-lg">
              <FileText class="w-12 h-12 mx-auto mb-lg" style="color: var(--mist);" />
              <h3 class="text-call mb-md">Drop CSV file here</h3>
              <p class="text-breath">
                Or click to browse
              </p>
            </div>
          </div>
          
          <input
            bind:this={fileInput}
            type="file"
            accept=".csv"
            on:change={handleFileSelect}
            class="hidden"
          />
        </div>
      ...

      {#if file && !result && !isProcessing}
        <!-- File Selected State -->
        <div class="fade-in">
          <div class="card-breath pa-xl">
            <div class="flex items-start gap-4 mb-lg">
              <FileText class="w-6 h-6 mt-1 flex-shrink-0" style="color: var(--acapulco);" />
              <div class="flex-1">
                <h3 class="text-call mb-sm">{file.name}</h3>
                <p class="text-breath">
                  {(file.size / 1024).toFixed(1)} KB
                </p>
              </div>
            </div>

            <div class="bg-ash rounded-lg pa-md mb-lg">
              <h4 class="text-voice mb-md">Preview</h4>
              <div class="text-whisper font-mono bg-white rounded pa-md overflow-x-auto">
                {file.content.split('\n').slice(0, 3).join('\n')}
                {#if file.content.split('\n').length > 3}
                  ...
                ...
              </div>
            </div>

            <div class="flex gap-3">
              <button 
                onclick={handleImport}
                class="btn-primary flex-1"
              >
                Import
                <ArrowRight class="w-4 h-4" />
              </button>
              <button 
                onclick={resetImport}
                class="btn-ghost"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      ...

      {#if isProcessing}
        <!-- Processing State -->
        <div class="fade-in">
          <div class="card-breath pa-xl text-center">
            <div class="w-12 h-12 mx-auto mb-lg flex items-center justify-center">
              <div 
                class="animate-spin w-6 h-6 rounded-full border-2 border-t-transparent"
                style="border-color: var(--acapulco); border-top-color: transparent;"
              ></div>
            </div>
            <h3 class="text-call mb-md">Processing...</h3>
            <p class="text-breath">
              Analyzing your file
            </p>
          </div>
        </div>
      ...

      {#if result}
        <!-- Results State -->
        <div class="fade-in space-y-6">
          <div class="card-breath pa-xl">
            <div class="flex items-start gap-4 mb-lg">
              <CheckCircle class="w-6 h-6 mt-1 flex-shrink-0 status-success" />
              <div class="flex-1">
                <h3 class="text-call mb-sm">Complete</h3>
                <p class="text-breath">
                  Imported {result.success} of {result.total} transactions
                </p>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-4 mb-lg">
              <div class="text-center pa-md rounded" style="background-color: var(--ash);">
                <div class="text-shout status-success mb-sm">
                  {result.success}
                </div>
                <div class="text-whisper">Success</div>
              </div>
              <div class="text-center pa-md rounded" style="background-color: var(--ash);">
                <div class="text-shout status-error mb-sm">
                  {result.errors.length}
                </div>
                <div class="text-whisper">Errors</div>
              </div>
            </div>

            {#if result.errors.length > 0}
              <div class="pa-md rounded mb-lg" style="background-color: var(--ash);">
                <div class="flex items-center gap-2 mb-md">
                  <AlertTriangle class="w-4 h-4 status-error" />
                  <h4 class="text-voice status-error">Issues</h4>
                </div>
                <ul class="space-y-1">
                  {#each result.errors.slice(0, 3) as error}
                    <li class="text-breath">
                      {error}
                    </li>
                  {/each}
                  {#if result.errors.length > 3}
                    <li class="text-breath">
                      +{result.errors.length - 3} more errors
                    </li>
                  ...
                </ul>
              </div>
            ...

            <div class="flex gap-3">
              <button 
                onclick={() => window.location.href = '/transactions'}
                class="btn-primary flex-1"
              >
                View Transactions
                <ArrowRight class="w-4 h-4" />
              </button>
              <button 
                onclick={resetImport}
                class="btn-secondary"
              >
                Import More
              </button>
            </div>
          </div>
        </div>
      ...
    </div>
  </section>
</div>

<style>
  /* Animaciones específicas del componente */
  .fade-in {
    animation: fadeIn 0.6s cubic-bezier(0.4, 0, 0.6, 1) both;
  }
  
  .breathe {
    transition: all 200ms cubic-bezier(0.4, 0, 0.6, 1);
  }
  
  .breathe:hover {
    transform: translateY(-2px);
    box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.04), 0 1px 2px -1px rgb(0 0 0 / 0.04);
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
</style>
