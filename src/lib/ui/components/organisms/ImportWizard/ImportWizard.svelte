<script lang="ts">
  import { Card, CardHeader, CardContent, CardTitle, Button, Input } from '$lib/ui/components/atoms/index.js';
  import { CurrencyDisplay } from '$lib/ui/components/molecules/CurrencyDisplay/index.js';
  import { UniversalCSVParser, type ParseResult } from '$lib/infrastructure/parsers/UniversalCSVParser.js';
  import { Account, AccountType } from '$lib/domain/entities/Account.js';
  import { AccountId } from '$lib/domain/value-objects/AccountId.js';
  import { Upload, FileText, CheckCircle, AlertCircle, TrendingUp } from 'lucide-svelte';

  interface Props {
    onComplete?: (result: ParseResult) => void;
  }

  let { onComplete }: Props = $props();

  // State
  let currentStep = $state(1);
  let selectedFile: File | null = $state(null);
  let parseResult: ParseResult | null = $state(null);
  let importResult: any = $state(null);
  let isLoading = $state(false);
  let error = $state('');

  // Steps
  const steps = [
    { number: 1, title: 'Upload File', description: 'Select your CSV file' },
    { number: 2, title: 'Validate Data', description: 'Review imported transactions' },
    { number: 3, title: 'Categorize', description: 'Assign categories to transactions' },
    { number: 4, title: 'Confirm', description: 'Confirm the import' },
    { number: 5, title: 'Complete', description: 'Import successful' }
  ];

  // Use existing account ID from database
  const MAIN_ACCOUNT_ID = 'a524e6f2-647f-498f-beda-e710ff2a9423';
  
  // Create dummy account for parsing preview (not used for actual import)
  const dummyAccount = new Account(
    new AccountId(MAIN_ACCOUNT_ID),
    'Main Account',
    AccountType.MAIN
  );

  const parser = new UniversalCSVParser();

  async function handleFileSelect(event: Event) {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    
    if (!file) return;

    // Validate file type
    if (!file.name.endsWith('.csv')) {
      error = 'Please select a CSV file';
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      error = 'File is too large (5MB maximum)';
      return;
    }

    selectedFile = file;
    error = '';
  }

  async function parseCSV() {
    if (!selectedFile) {
      error = 'No file selected';
      return;
    }

    isLoading = true;
    error = '';

    try {
      console.log('Parsing CSV file:', selectedFile.name);
      const content = await selectedFile.text();
      console.log('CSV content length:', content.length);
      
      // Use the UniversalCSVParser for frontend preview
      parseResult = await parser.parseWithDetails(content);
      
      console.log('Parse result:', parseResult);

      // Move to next step based on parse result
      if (parseResult.errors.length > 0) {
        console.warn('Parse errors found:', parseResult.errors);
        // Still proceed to show results with errors
      }
      
      currentStep = 2; // Go to validation step to show parsed data
      
    } catch (err) {
      console.error('CSV parse error:', err);
      error = err instanceof Error ? err.message : 'Failed to parse CSV';
    } finally {
      isLoading = false;
    }
  }

  function nextStep() {
    if (currentStep < steps.length) {
      currentStep++;
    }
  }

  function prevStep() {
    if (currentStep > 1) {
      currentStep--;
    }
  }

  async function completeImport() {
    if (!selectedFile) {
      error = 'No file selected';
      return;
    }
    
    isLoading = true;
    error = '';
    
    try {
      console.log('Starting import with file:', selectedFile.name);
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('accountId', MAIN_ACCOUNT_ID);
      formData.append('overwriteExisting', 'false');
      
      // Call import API
      const response = await fetch('/api/transactions/import', {
        method: 'POST',
        body: formData
      });
      
      // Check HTTP status first
      if (!response.ok) {
        const errorText = await response.text();
        error = `Server error (${response.status}): ${errorText}`;
        console.error('HTTP Error:', response.status, errorText);
        return;
      }
      
      const result = await response.json();
      console.log('Import API response:', result);
      
      if (!result.success) {
        error = result.error || 'Import failed';
        return;
      }
      
      // Success! Store import result and move to success step
      const importData = result.data;
      
      importResult = {
        success: true,
        imported: importData.imported,
        skipped: importData.skipped,
        errors: importData.errors,
        warnings: importData.warnings,
        message: importData.message
      };
      
      // Move to success step
      currentStep = 5;
      
    } catch (err) {
      console.error('Import error:', err);
      error = err instanceof Error ? err.message : 'Network error during import';
    } finally {
      isLoading = false;
    }
  }

  function formatFileSize(bytes: number): string {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }
</script>

<div class="container-editorial py-8">
  <!-- Editorial Progress Steps -->
  <div class="mb-12">
    <div class="max-w-3xl mx-auto">
      <div class="flex items-center justify-between relative">
        {#each steps as step, index}
          <div class="flex flex-col items-center relative z-10">
            <div class={`
              w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-default shadow-subtle
              ${currentStep >= step.number 
                ? 'bg-charcoal text-white shadow-medium' 
                : 'bg-gray-100 text-tertiary'
              }
            `}>
              {step.number}
            </div>
            <div class="mt-3 text-center max-w-20">
              <div class={`text-sm font-medium ${currentStep >= step.number ? 'text-primary' : 'text-tertiary'}`}>
                {step.title}
              </div>
              <div class="text-xs text-tertiary mt-1">
                {step.description}
              </div>
            </div>
          </div>
          {#if index < steps.length - 1}
            <div class={`
              absolute top-5 h-0.5 transition-all duration-default
              ${currentStep > step.number ? 'bg-charcoal' : 'bg-medium-grey'}
            `} 
            style={`left: ${((index + 1) * 100 / steps.length) - (50 / steps.length)}%; right: ${((steps.length - index - 1) * 100 / steps.length) - (50 / steps.length)}%;`}></div>
          {/if}
        {/each}
      </div>
    </div>
  </div>

  <!-- Step Content -->
  {#if currentStep === 1}
    <!-- Step 1: Editorial File Upload -->
    <div class="max-w-3xl mx-auto">
      <div class="card-editorial p-8 scale-in">
        <header class="text-center mb-8">
          <div class="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
            <Upload class="w-6 h-6 text-primary" />
          </div>
          <h2 class="text-h3 mb-2 text-primary">Upload N26 CSV File</h2>
          <p class="text-body-small text-tertiary">Select your exported transaction file</p>
        </header>

        <div class="space-y-6">
          <div class="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center transition-all duration-default hover:border-gray-400 hover:bg-gray-50">
            <Upload class="w-16 h-16 mx-auto text-tertiary mb-6 transition-colors duration-default" />
            <div class="space-y-3 mb-6">
              <h3 class="text-h4 text-primary">Drag your CSV file here</h3>
              <p class="text-body text-tertiary">or click to select from your computer</p>
            </div>
            <input
              type="file"
              accept=".csv"
              class="w-full h-full absolute inset-0 opacity-0 cursor-pointer"
              onchange={handleFileSelect}
              aria-label="Upload CSV file"
            />
            <div class="btn-secondary mx-auto">
              Choose File
            </div>
          </div>

          {#if selectedFile}
            <div class="bg-gray-50 border border-gray-200 p-6 rounded-lg slide-up">
              <div class="flex items-center gap-4">
                <div class="w-12 h-12 bg-charcoal/10 rounded-lg flex items-center justify-center">
                  <FileText class="w-6 h-6 text-primary" />
                </div>
                <div class="flex-1">
                  <div class="text-h4 text-primary mb-1">{selectedFile.name}</div>
                  <div class="text-body-small text-tertiary">
                    {formatFileSize(selectedFile.size)} • Last modified {new Date(selectedFile.lastModified).toLocaleDateString('en-US', { 
                      year: 'numeric', month: 'short', day: 'numeric' 
                    })}
                  </div>
                </div>
                <div class="w-3 h-3 rounded-full bg-sage-green"></div>
              </div>
            </div>
          {/if}

          {#if error}
            <div class="bg-coral-red/5 border border-coral-red/20 rounded-lg p-6">
              <div class="flex items-start gap-3">
                <AlertCircle class="w-5 h-5 text-coral-red flex-shrink-0 mt-0.5" />
                <div>
                  <span class="text-body font-semibold text-coral-red">Error: </span>
                  <span class="text-body text-primary">{error}</span>
                </div>
              </div>
            </div>
          {/if}

          <div class="flex justify-end pt-4">
            <button
              class="btn-primary transition-all duration-default disabled:opacity-50 disabled:cursor-not-allowed"
              onclick={parseCSV}
              disabled={!selectedFile || isLoading}
              aria-label={isLoading ? 'Processing file...' : 'Process CSV file'}
            >
              {#if isLoading}
                <svg class="animate-spin -ml-1 mr-3 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              {:else}
                Process File
              {/if}
            </button>
          </div>
        </div>
      </div>
    </div>

  {:else if currentStep === 2 && parseResult}
    <!-- Step 2: Editorial Validation Results -->
    <div class="max-w-4xl mx-auto">
      <div class="card-editorial p-8 scale-in">
        <header class="text-center mb-8">
          <div class="w-12 h-12 bg-sage-green/10 rounded-lg flex items-center justify-center mx-auto mb-4">
            <CheckCircle class="w-6 h-6 text-sage-green" />
          </div>
          <h2 class="text-h3 mb-2 text-primary">Import Results</h2>
          <p class="text-body-small text-tertiary">Review your transaction data before continuing</p>
        </header>

        <div class="space-y-8">
          <!-- Summary Stats -->
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div class="bg-charcoal/5 border border-charcoal/10 p-6 rounded-lg text-center group hover:bg-charcoal/10 transition-colors duration-default">
              <div class="text-mono text-3xl font-semibold text-primary mb-2">{parseResult.summary.totalRows}</div>
              <div class="text-caption text-tertiary">Total Rows</div>
            </div>
            <div class="bg-sage-green/5 border border-sage-green/20 p-6 rounded-lg text-center group hover:bg-sage-green/10 transition-colors duration-default">
              <div class="text-mono text-3xl font-semibold text-sage-green mb-2">{parseResult.summary.validRows}</div>
              <div class="text-caption text-tertiary">Valid</div>
            </div>
            <div class="bg-coral-red/5 border border-coral-red/20 p-6 rounded-lg text-center group hover:bg-coral-red/10 transition-colors duration-default">
              <div class="text-mono text-3xl font-semibold text-coral-red mb-2">{parseResult.summary.errorRows}</div>
              <div class="text-caption text-tertiary">With Errors</div>
            </div>
            <div class="bg-amber/5 border border-amber/20 p-6 rounded-lg text-center group hover:bg-amber/10 transition-colors duration-default">
              <div class="text-mono text-3xl font-semibold text-amber mb-2">{parseResult.summary.duplicateRows}</div>
              <div class="text-caption text-tertiary">Duplicates</div>
            </div>
          </div>

          <!-- Financial Summary -->
          {#if parseResult.transactions.length > 0}
            <div class="bg-gray-50 border border-gray-200 rounded-lg p-6">
              <header class="flex items-center gap-3 mb-6">
                <div class="w-8 h-8 bg-charcoal/10 rounded-lg flex items-center justify-center">
                  <TrendingUp class="w-4 h-4 text-primary" />
                </div>
                <h3 class="text-h4 text-primary">Financial Summary</h3>
              </header>
              
              <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                {#each ['income', 'expense', 'net'] as type}
                  {@const amount = type === 'income' 
                    ? parseResult.transactions.filter(t => t.isIncome()).reduce((sum, t) => sum + t.amount.amount, 0)
                    : type === 'expense'
                    ? parseResult.transactions.filter(t => t.isExpense()).reduce((sum, t) => sum + Math.abs(t.amount.amount), 0)
                    : parseResult.transactions.reduce((sum, t) => sum + t.amount.amount, 0)
                  }
                  <div class="text-center p-4 bg-white border border-soft-beige rounded-lg">
                    <div class="text-caption mb-2 text-tertiary uppercase tracking-wider">
                      {type === 'income' ? 'Income' : type === 'expense' ? 'Expenses' : 'Net Balance'}
                    </div>
                    <CurrencyDisplay 
                      {amount} 
                      variant={type === 'income' ? 'income' : type === 'expense' ? 'expense' : 'neutral'}
                      size="lg"
                      showSign={type === 'net'}
                    />
                  </div>
                {/each}
              </div>
            </div>
          {/if}

          <!-- Error Display -->
          {#if parseResult.errors.length > 0}
            <div class="bg-coral-red/5 border border-coral-red/20 rounded-lg p-6">
              <header class="flex items-center gap-3 mb-4">
                <AlertCircle class="w-5 h-5 text-coral-red" />
                <h3 class="text-h4 text-coral-red">Parsing Errors Found</h3>
                <span class="text-caption bg-coral-red/10 text-coral-red px-2 py-1 rounded-full">
                  {parseResult.errors.length} {parseResult.errors.length === 1 ? 'error' : 'errors'}
                </span>
              </header>
              
              <div class="space-y-3 max-h-64 overflow-y-auto">
                {#each parseResult.errors.slice(0, 10) as error}
                  <div class="bg-white border border-coral-red/20 p-4 rounded-lg">
                    <div class="flex items-start justify-between gap-3">
                      <div class="flex-1">
                        <div class="text-body-small font-semibold text-primary mb-1">
                          Row {error.row}
                          {#if error.field}
                            <span class="text-tertiary"> • Field: {error.field}</span>
                          {/if}
                        </div>
                        <div class="text-body-small text-tertiary">
                          {error.message}
                        </div>
                      </div>
                    </div>
                  </div>
                {/each}
                {#if parseResult.errors.length > 10}
                  <div class="text-center py-2">
                    <span class="text-body-small text-tertiary">
                      ... and {parseResult.errors.length - 10} more errors
                    </span>
                  </div>
                {/if}
              </div>
            </div>
          {/if}

          <!-- Navigation -->
          <div class="flex justify-between pt-6 border-t border-medium-grey/10">
            <button 
              class="btn-secondary" 
              onclick={prevStep}
              aria-label="Go back to file upload"
            >
              Previous
            </button>
            <button 
              class={`btn-primary transition-all duration-default ${parseResult.summary.validRows === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
              onclick={nextStep}
              disabled={parseResult.summary.validRows === 0}
              aria-label="Continue to categorization step"
            >
              Continue with Categorization
            </button>
          </div>
        </div>
      </div>
    </div>

  {:else if currentStep === 3}
    <!-- Step 3: Categorization -->
    <div class="max-w-3xl mx-auto">
      <div class="card-editorial p-8 scale-in text-center">
        <div class="w-12 h-12 bg-amber/10 rounded-lg flex items-center justify-center mx-auto mb-6">
          <span class="text-2xl">🏷️</span>
        </div>
        <h2 class="text-h3 mb-4 text-primary">Automatic Categorization</h2>
        <p class="text-body text-tertiary mb-8 max-w-md mx-auto">
          Intelligent category assignment will be implemented in the next development phase
        </p>
        <div class="flex justify-center gap-4">
          <button class="btn-secondary" onclick={prevStep}>Previous</button>
          <button class="btn-primary" onclick={nextStep}>Continue</button>
        </div>
      </div>
    </div>

  {:else if currentStep === 4}
    <!-- Step 4: Confirmation -->
    <div class="max-w-3xl mx-auto">
      <div class="card-editorial p-8 scale-in text-center">
        <div class="w-16 h-16 bg-sage-green/10 rounded-lg flex items-center justify-center mx-auto mb-6">
          <CheckCircle class="w-10 h-10 text-sage-green" />
        </div>
        <h2 class="text-h3 mb-4 text-primary">Confirm Import</h2>
        <p class="text-body text-tertiary mb-8">
          <span class="text-mono font-semibold text-primary">
            {parseResult?.summary.validRows}
          </span> valid transactions will be imported to your expense tracker
        </p>
        
        <div class="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-8 max-w-md mx-auto">
          <p class="text-body-small text-tertiary">
            <strong>Note:</strong> This will add the transactions to your database. 
            You can always edit or remove them later if needed.
          </p>
        </div>
        
        <div class="flex justify-center gap-4">
          <button class="btn-secondary" onclick={prevStep} disabled={isLoading}>Previous</button>
          <button 
            class="btn-primary transition-all duration-default disabled:opacity-50 disabled:cursor-not-allowed" 
            onclick={completeImport}
            disabled={isLoading}
            aria-label={isLoading ? 'Importing transactions...' : 'Confirm import'}
          >
            {#if isLoading}
              <svg class="animate-spin -ml-1 mr-3 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Importing...
            {:else}
              Confirm Import
            {/if}
          </button>
        </div>
      </div>
    </div>

  {:else if currentStep === 5 && importResult}
    <!-- Step 5: Success Confirmation -->
    <div class="max-w-4xl mx-auto">
      <div class="card-editorial p-8 scale-in text-center">
        <div class="w-16 h-16 bg-sage-green/10 rounded-lg flex items-center justify-center mx-auto mb-6">
          <CheckCircle class="w-10 h-10 text-sage-green" />
        </div>
        
        <h2 class="text-h3 mb-4 text-primary">Import Successful!</h2>
        <p class="text-body text-tertiary mb-8 max-w-md mx-auto">
          {importResult.message}
        </p>

        <!-- Import Summary Stats -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div class="bg-sage-green/5 border border-sage-green/20 p-6 rounded-lg">
            <div class="text-mono text-3xl font-semibold text-sage-green mb-2">
              {importResult.imported}
            </div>
            <div class="text-caption text-tertiary">Transactions Imported</div>
          </div>
          
          {#if importResult.skipped > 0}
            <div class="bg-amber/5 border border-amber/20 p-6 rounded-lg">
              <div class="text-mono text-3xl font-semibold text-amber mb-2">
                {importResult.skipped}
              </div>
              <div class="text-caption text-tertiary">Skipped (Duplicates)</div>
            </div>
          {/if}
          
          {#if importResult.errors.length > 0}
            <div class="bg-coral-red/5 border border-coral-red/20 p-6 rounded-lg">
              <div class="text-mono text-3xl font-semibold text-coral-red mb-2">
                {importResult.errors.length}
              </div>
              <div class="text-caption text-tertiary">Errors</div>
            </div>
          {/if}
        </div>

        <!-- Warnings and Errors -->
        {#if importResult.warnings.length > 0 || importResult.errors.length > 0}
          <div class="bg-amber/5 border border-amber/20 rounded-lg p-6 mb-8 text-left">
            <h3 class="text-h4 text-amber mb-4 text-center">Import Details</h3>
            
            {#if importResult.warnings.length > 0}
              <div class="mb-4">
                <h4 class="text-body font-semibold text-primary mb-2">Warnings:</h4>
                <ul class="text-body-small text-tertiary space-y-1">
                  {#each importResult.warnings as warning}
                    <li>• {warning}</li>
                  {/each}
                </ul>
              </div>
            {/if}
            
            {#if importResult.errors.length > 0}
              <div>
                <h4 class="text-body font-semibold text-coral-red mb-2">Errors:</h4>
                <ul class="text-body-small text-tertiary space-y-1">
                  {#each importResult.errors as error}
                    <li>• {error}</li>
                  {/each}
                </ul>
              </div>
            {/if}
          </div>
        {/if}

        <!-- Next Steps -->
        <div class="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-8">
          <h3 class="text-h4 text-primary mb-4">What's Next?</h3>
          <div class="text-body-small text-tertiary space-y-2">
            <p>• Your transactions have been imported and are now visible in your dashboard</p>
            <p>• You can categorize them manually or set up automatic rules</p>
            <p>• Review and edit any transactions as needed</p>
          </div>
        </div>
        
        <div class="flex justify-center gap-4">
          <button 
            class="btn-secondary" 
            onclick={() => window.location.href = '/transactions'}
          >
            View Transactions
          </button>
          <button 
            class="btn-primary" 
            onclick={() => window.location.href = '/dashboard'}
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    </div>
  {/if}
</div>