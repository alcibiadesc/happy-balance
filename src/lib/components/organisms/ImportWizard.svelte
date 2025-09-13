<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { ImportTransactionsUseCase } from '../../application/use-cases/import-transactions';
  import type { ImportableTransaction, ImportPreview, ImportResult } from '../../shared/types/transaction';
  
  // Components
  import Button from '../atoms/Button.svelte';
  import FileUpload from '../atoms/FileUpload.svelte';
  import Toggle from '../atoms/Toggle.svelte';
  import Badge from '../atoms/Badge.svelte';
  import TransactionPreviewTable from '../molecules/TransactionPreviewTable.svelte';

  const dispatch = createEventDispatcher<{
    'import-complete': { result: ImportResult };
    'close': void;
  }>();

  // State management
  let currentStep: 'upload' | 'preview' | 'importing' | 'complete' = 'upload';
  let selectedFile: File | null = null;
  let preview: ImportPreview | null = null;
  let transactions: ImportableTransaction[] = [];
  let loading = false;
  let error: string | null = null;
  let importResult: ImportResult | null = null;

  // Settings
  let showDuplicates = true;
  let enablePreview = true;
  let autoDetectDuplicates = true;

  // Services
  const importUseCase = new ImportTransactionsUseCase();

  // UI State
  let dragActive = false;

  // Step navigation
  const steps = [
    { id: 'upload', label: 'Upload', icon: 'upload' },
    { id: 'preview', label: 'Preview', icon: 'eye' },
    { id: 'importing', label: 'Import', icon: 'check' }
  ];

  // File upload handlers
  async function handleFileUpload(event: CustomEvent<{ files: FileList }>) {
    const file = event.detail.files[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.csv')) {
      error = 'Please select a CSV file';
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      error = 'File size must be less than 10MB';
      return;
    }

    selectedFile = file;
    error = null;

    if (enablePreview) {
      await generatePreview();
    } else {
      // Skip preview, go directly to import
      await performImport();
    }
  }

  async function generatePreview() {
    if (!selectedFile) return;

    loading = true;
    error = null;

    try {
      preview = await importUseCase.generatePreview(selectedFile);
      transactions = preview.transactions;
      currentStep = 'preview';
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to process file';
      console.error('Preview generation failed:', err);
    } finally {
      loading = false;
    }
  }

  async function performImport() {
    if (!transactions.length && selectedFile) {
      // Generate preview first if we don't have transactions
      await generatePreview();
      if (!transactions.length) return;
    }

    loading = true;
    currentStep = 'importing';
    error = null;

    try {
      importResult = await importUseCase.importTransactions(transactions);
      currentStep = 'complete';
      dispatch('import-complete', { result: importResult });
    } catch (err) {
      error = err instanceof Error ? err.message : 'Import failed';
      console.error('Import failed:', err);
      currentStep = 'preview'; // Go back to preview on error
    } finally {
      loading = false;
    }
  }

  // Transaction selection handlers
  function handleToggleSelection(event: CustomEvent<{ id: string; selected: boolean }>) {
    const { id, selected } = event.detail;
    transactions = importUseCase.updateTransactionSelection(transactions, { [id]: selected });
  }

  function handleToggleAll(event: CustomEvent<{ selected: boolean }>) {
    const { selected } = event.detail;
    const updates: Record<string, boolean> = {};
    
    const visibleTransactions = showDuplicates 
      ? transactions 
      : transactions.filter(t => !t.isDuplicate);
    
    visibleTransactions.forEach(t => {
      if (!t.isDuplicate) {
        updates[t.id] = selected;
      }
    });
    
    transactions = importUseCase.updateTransactionSelection(transactions, updates);
  }

  function handleShowDuplicatesToggle() {
    // The toggle is bound to showDuplicates, so this just triggers reactivity
  }

  function resetWizard() {
    currentStep = 'upload';
    selectedFile = null;
    preview = null;
    transactions = [];
    loading = false;
    error = null;
    importResult = null;
  }

  function goBack() {
    if (currentStep === 'preview') {
      currentStep = 'upload';
    } else if (currentStep === 'complete') {
      resetWizard();
    }
  }

  // Computed values
  $: selectedCount = transactions.filter(t => t.isSelected && !t.isDuplicate).length;
  $: duplicateCount = transactions.filter(t => t.isDuplicate).length;
  $: canProceed = currentStep === 'preview' && selectedCount > 0;
  $: currentStepIndex = steps.findIndex(s => s.id === currentStep);
</script>

<div class="max-w-6xl mx-auto bg-bridesmaid rounded-xl shadow-lg border border-evening-sea border-opacity-10 overflow-hidden">
  <!-- Header -->
  <div class="bg-evening-sea bg-opacity-5 px-6 py-4 border-b border-evening-sea border-opacity-10">
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-xl font-bold text-evening-sea">Import Transactions</h2>
        <p class="text-sm text-evening-sea opacity-70 mt-1">
          Upload and review your CSV file before importing
        </p>
      </div>
      
      <button 
        on:click={() => dispatch('close')}
        class="text-evening-sea opacity-50 hover:opacity-100 transition-opacity"
      >
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>

    <!-- Progress Steps -->
    <div class="flex items-center space-x-4 mt-4">
      {#each steps as step, index}
        <div class="flex items-center">
          <div class="flex items-center space-x-2">
            <div class="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
              {index <= currentStepIndex 
                ? 'bg-acapulco text-bridesmaid' 
                : 'bg-evening-sea bg-opacity-20 text-evening-sea opacity-50'
              }
            ">
              {#if step.id === 'upload'}
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              {:else if step.id === 'preview'}
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              {:else}
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
              {/if}
            </div>
            <span class="text-sm font-medium text-evening-sea
              {index <= currentStepIndex ? '' : 'opacity-50'}
            ">
              {step.label}
            </span>
          </div>
          {#if index < steps.length - 1}
            <div class="w-8 h-px bg-evening-sea bg-opacity-20 ml-4"></div>
          {/if}
        </div>
      {/each}
    </div>
  </div>

  <!-- Content -->
  <div class="p-6">
    {#if error}
      <div class="bg-froly bg-opacity-10 border border-froly border-opacity-30 text-froly px-4 py-3 rounded-lg mb-6">
        <div class="flex items-center">
          <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 18.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          {error}
        </div>
      </div>
    {/if}

    <!-- Upload Step -->
    {#if currentStep === 'upload'}
      <div class="space-y-6">
        <!-- Settings -->
        <div class="bg-evening-sea bg-opacity-5 rounded-lg p-4">
          <h3 class="font-medium text-evening-sea mb-3">Import Settings</h3>
          <div class="space-y-3">
            <Toggle 
              bind:checked={enablePreview} 
              label="Enable preview before import" 
            />
            <Toggle 
              bind:checked={autoDetectDuplicates} 
              label="Detect duplicate transactions" 
            />
          </div>
        </div>

        <!-- File Upload -->
        <FileUpload
          on:upload={handleFileUpload}
          on:dragover={(e) => dragActive = e.detail}
          {dragActive}
          disabled={loading}
        />

        {#if selectedFile && !loading}
          <div class="bg-acapulco bg-opacity-10 border border-acapulco border-opacity-30 rounded-lg p-4">
            <div class="flex items-center justify-between">
              <div class="flex items-center space-x-3">
                <div class="w-10 h-10 bg-acapulco bg-opacity-20 rounded-lg flex items-center justify-center">
                  <svg class="w-5 h-5 text-acapulco" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <p class="font-medium text-evening-sea">{selectedFile.name}</p>
                  <p class="text-sm text-evening-sea opacity-70">
                    {(selectedFile.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              </div>
              <Badge variant="success">Ready</Badge>
            </div>
          </div>
        {/if}
      </div>
    {/if}

    <!-- Preview Step -->
    {#if currentStep === 'preview'}
      <div class="space-y-6">
        <!-- Summary -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div class="bg-evening-sea bg-opacity-5 rounded-lg p-4 text-center">
            <div class="text-2xl font-bold text-evening-sea">{transactions.length}</div>
            <div class="text-sm text-evening-sea opacity-70">Total</div>
          </div>
          <div class="bg-acapulco bg-opacity-10 rounded-lg p-4 text-center">
            <div class="text-2xl font-bold text-acapulco">{selectedCount}</div>
            <div class="text-sm text-evening-sea opacity-70">Selected</div>
          </div>
          <div class="bg-sunglow bg-opacity-10 rounded-lg p-4 text-center">
            <div class="text-2xl font-bold text-sunglow">{duplicateCount}</div>
            <div class="text-sm text-evening-sea opacity-70">Duplicates</div>
          </div>
          <div class="bg-froly bg-opacity-10 rounded-lg p-4 text-center">
            <div class="text-2xl font-bold text-froly">{transactions.length - selectedCount}</div>
            <div class="text-sm text-evening-sea opacity-70">Skipped</div>
          </div>
        </div>

        <!-- Controls -->
        <div class="flex items-center justify-between">
          <Toggle 
            bind:checked={showDuplicates} 
            label="Show duplicate transactions"
            on:change={handleShowDuplicatesToggle}
          />
        </div>

        <!-- Transaction Table -->
        <TransactionPreviewTable
          {transactions}
          {showDuplicates}
          {loading}
          on:toggle-selection={handleToggleSelection}
          on:toggle-all={handleToggleAll}
        />
      </div>
    {/if}

    <!-- Importing Step -->
    {#if currentStep === 'importing'}
      <div class="text-center py-12">
        <div class="animate-spin w-16 h-16 border-4 border-acapulco border-t-transparent rounded-full mx-auto mb-6"></div>
        <h3 class="text-lg font-medium text-evening-sea mb-2">Importing Transactions</h3>
        <p class="text-evening-sea opacity-70">Please wait while we process your data...</p>
      </div>
    {/if}

    <!-- Complete Step -->
    {#if currentStep === 'complete' && importResult}
      <div class="text-center py-12">
        <div class="w-16 h-16 bg-acapulco bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg class="w-8 h-8 text-acapulco" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        
        <h3 class="text-lg font-medium text-evening-sea mb-2">Import Complete!</h3>
        <p class="text-evening-sea opacity-70 mb-6">Your transactions have been successfully imported.</p>

        <div class="bg-evening-sea bg-opacity-5 rounded-lg p-6 max-w-md mx-auto">
          <div class="space-y-2 text-sm">
            <div class="flex justify-between">
              <span class="text-evening-sea opacity-70">Imported:</span>
              <span class="font-medium text-acapulco">{importResult.imported}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-evening-sea opacity-70">Skipped:</span>
              <span class="font-medium text-evening-sea">{importResult.skipped}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-evening-sea opacity-70">Duplicates:</span>
              <span class="font-medium text-sunglow">{importResult.duplicates}</span>
            </div>
          </div>
        </div>
      </div>
    {/if}
  </div>

  <!-- Footer -->
  <div class="bg-evening-sea bg-opacity-5 px-6 py-4 border-t border-evening-sea border-opacity-10">
    <div class="flex items-center justify-between">
      <div>
        {#if currentStep === 'preview'}
          <Button variant="ghost" on:click={goBack}>
            Back to Upload
          </Button>
        {:else if currentStep === 'complete'}
          <Button variant="ghost" on:click={resetWizard}>
            Import Another File
          </Button>
        {/if}
      </div>
      
      <div class="flex space-x-3">
        {#if currentStep === 'upload' && selectedFile && !loading}
          {#if !enablePreview}
            <Button variant="primary" on:click={performImport} {loading}>
              Import Now
            </Button>
          {:else}
            <Button variant="primary" on:click={generatePreview} {loading}>
              Continue to Preview
            </Button>
          {/if}
        {:else if currentStep === 'preview'}
          <Button 
            variant="primary" 
            disabled={!canProceed || loading}
            on:click={performImport}
            {loading}
          >
            Import {selectedCount} Transaction{selectedCount !== 1 ? 's' : ''}
          </Button>
        {:else if currentStep === 'complete'}
          <Button variant="primary" on:click={() => dispatch('close')}>
            Done
          </Button>
        {/if}
      </div>
    </div>
  </div>
</div>
