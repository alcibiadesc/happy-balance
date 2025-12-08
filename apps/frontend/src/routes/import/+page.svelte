<script lang="ts">
  import { goto } from '$app/navigation';
  import { t } from '$lib/stores/i18n';
  import { onMount } from 'svelte';
  import { apiTransactions } from '$lib/stores/api-transactions';
  import { parseCSV } from '$lib/utils/csv-parser';

  // Layout Components
  import PageContainer from '$lib/components/atoms/PageContainer.svelte';
  import ErrorAlert from '$lib/components/atoms/ErrorAlert.svelte';

  // Atomic Components
  import ImportProgressSteps from '$lib/components/molecules/ImportProgressSteps.svelte';
  import ImportStatsGrid from '$lib/components/molecules/ImportStatsGrid.svelte';
  import CompatibleBanks from '$lib/components/molecules/CompatibleBanks.svelte';
  import ImportFileUpload from '$lib/components/molecules/ImportFileUpload.svelte';
  import ImportSettings from '$lib/components/molecules/ImportSettings.svelte';
  import ImportComplete from '$lib/components/molecules/ImportComplete.svelte';
  import TransactionPreviewTable from '$lib/components/organisms/TransactionPreviewTable.svelte';

  import type { ParsedTransaction } from '$lib/utils/csv-parser';

  // ===== TYPES & CONSTANTS =====
  type ImportStep = 1 | 2 | 3;

  const PREVIEW_SETTING_KEY = 'import-preview-enabled';
  const MAX_FILE_SIZE_MB = 10;
  const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
  const IMPORT_COMPLETE_DELAY_MS = 1500;

  // ===== STATE MANAGEMENT (Svelte 5 runes) =====
  let step: ImportStep = $state(1);
  let selectedFiles: File[] = $state([]);
  let transactions: ParsedTransaction[] = $state([]);
  let loading = $state(false);
  let error = $state('');
  let previewEnabled = $state(true);
  let mounted = $state(false);
  let importedCount = $state(0);
  let importProgress = $state(0);
  let totalFilesToProcess = $state(0);
  let lastImportDuplicates = $state(0);
  let lastImportDuplicatesForced = $state(0);

  // ===== DERIVED VALUES =====
  const selectedCount = $derived(transactions.filter((tx) => tx.selected).length);
  const duplicateCount = $derived(transactions.filter((tx) => tx.isDuplicate).length);
  const selectedDuplicatesCount = $derived(
    transactions.filter((tx) => tx.isDuplicate && tx.selected).length
  );

  const importButtonText = $derived(
    selectedCount === 1
      ? $t('import.actions.import_count', { count: selectedCount })
      : $t('import.actions.import_count_plural', { count: selectedCount })
  );

  // ===== UTILITY FUNCTIONS =====

  function isLocalStorageAvailable(): boolean {
    return typeof localStorage !== 'undefined';
  }

  function loadPreviewPreference(): boolean {
    if (!isLocalStorageAvailable()) return true;
    try {
      const saved = localStorage.getItem(PREVIEW_SETTING_KEY);
      return saved !== null ? JSON.parse(saved) : true;
    } catch {
      console.warn('Failed to load preview preference from localStorage');
      return true;
    }
  }

  function savePreviewPreference(enabled: boolean): void {
    if (!isLocalStorageAvailable()) return;
    try {
      localStorage.setItem(PREVIEW_SETTING_KEY, JSON.stringify(enabled));
    } catch {
      console.warn('Failed to save preview preference to localStorage');
    }
  }

  function validateFile(file: File): { valid: boolean; errorKey?: string } {
    if (!file.name.toLowerCase().endsWith('.csv')) {
      return { valid: false, errorKey: 'import.errors.invalid_file' };
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return { valid: false, errorKey: 'import.errors.file_too_large' };
    }
    return { valid: true };
  }

  function validateFiles(files: File[]): { valid: boolean; errorKey?: string } {
    if (files.length === 0) return { valid: false };
    for (const file of files) {
      const validation = validateFile(file);
      if (!validation.valid) return validation;
    }
    return { valid: true };
  }

  // ===== LIFECYCLE =====

  onMount(() => {
    previewEnabled = loadPreviewPreference();
    mounted = true;
  });

  $effect(() => {
    if (mounted && isLocalStorageAvailable()) {
      savePreviewPreference(previewEnabled);
    }
  });

  // ===== CSV PROCESSING =====

  async function getCSVPreview(file: File): Promise<ParsedTransaction[]> {
    const fileText = await file.text();
    const parseResult = parseCSV(fileText);

    if (parseResult.errors.length > 0) {
      parseResult.errors.forEach((_error) => {
        console.warn(`CSV parsing - Row ${_error.row}: ${_error.message}`);
      });
    }

    if (parseResult.transactions.length === 0) {
      throw new Error('import.errors.no_transactions');
    }

    const transactionsForHashing = parseResult.transactions.map((tx) => ({
      date: tx.date,
      merchant: tx.partner,
      amount: tx.amount,
      currency: 'EUR',
    }));

    const { hashes: hashResults } = await apiTransactions.generateHashes(transactionsForHashing);

    const transactionsWithHashes = parseResult.transactions.map((tx, index) => ({
      ...tx,
      hash: hashResults[index]?.hash || tx.hash,
    }));

    const transactionHashes = transactionsWithHashes.map((tx) => tx.hash);
    const { results: duplicateResults } = await apiTransactions.checkDuplicates(transactionHashes);

    const transactionsWithDuplicateInfo = transactionsWithHashes.map((tx) => {
      const duplicateInfo = duplicateResults.find((r) => r.hash === tx.hash);
      const isDuplicate = duplicateInfo?.isDuplicate || tx.isDuplicate;

      return {
        ...tx,
        isDuplicate,
        selected: !isDuplicate,
        duplicateReason: isDuplicate ? $t('import.duplicate_reasons.database') : tx.duplicateReason,
        isSuspectedDuplicate: duplicateInfo?.isDuplicate,
      };
    });

    return transactionsWithDuplicateInfo;
  }

  async function handleFileUpload(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const files = input.files ? Array.from(input.files) : [];

    const validation = validateFiles(files);
    if (!validation.valid) {
      error = validation.errorKey ? $t(validation.errorKey) : $t('import.errors.invalid_file');
      return;
    }

    selectedFiles = files;
    error = '';

    if (previewEnabled) {
      await generatePreview();
    } else {
      await importDirectly();
    }
  }

  function resetImportState(): void {
    step = 1;
    selectedFiles = [];
    transactions = [];
    error = '';
    importedCount = 0;
    importProgress = 0;
    totalFilesToProcess = 0;
  }

  async function processAllFiles(): Promise<ParsedTransaction[]> {
    const allTransactions: ParsedTransaction[] = [];

    for (let i = 0; i < selectedFiles.length; i++) {
      importProgress = i + 1;
      const fileTransactions = await getCSVPreview(selectedFiles[i]);
      allTransactions.push(...fileTransactions);
    }

    return allTransactions;
  }

  async function generatePreview(): Promise<void> {
    if (selectedFiles.length === 0) return;

    loading = true;
    error = '';
    totalFilesToProcess = selectedFiles.length;
    importProgress = 0;

    try {
      transactions = await processAllFiles();

      if (transactions.length === 0) {
        error = $t('import.errors.no_transactions');
        return;
      }

      step = 2;
    } catch (_err) {
      const errorMessage = _err instanceof Error ? _err.message : 'import.errors.parse_failed';
      error = $t(errorMessage);
      console.error('Preview generation failed:', _err);
    } finally {
      loading = false;
      importProgress = 0;
      totalFilesToProcess = 0;
    }
  }

  async function importDirectly(): Promise<void> {
    if (selectedFiles.length === 0) return;

    loading = true;
    step = 3;
    totalFilesToProcess = selectedFiles.length;
    importProgress = 0;

    try {
      let totalImported = 0;
      let totalDuplicatesSkipped = 0;

      for (let i = 0; i < selectedFiles.length; i++) {
        importProgress = i + 1;
        const result = await apiTransactions.importFile(selectedFiles[i], {
          currency: 'EUR',
          duplicateDetectionEnabled: true,
          skipDuplicates: true,
          autoCategorizationEnabled: true,
        });

        totalImported += result.imported || 0;
        totalDuplicatesSkipped += result.duplicatesSkipped || 0;
      }

      await finalizeImport(totalImported, totalDuplicatesSkipped, 0);
    } catch (_err) {
      handleImportError();
    } finally {
      cleanupImportProgress();
    }
  }

  async function importFromPreview(): Promise<void> {
    const selectedTransactions = transactions.filter((tx) => tx.selected);
    const duplicatesSkipped = transactions.filter((tx) => tx.isDuplicate && !tx.selected).length;
    const duplicatesImported = transactions.filter((tx) => tx.isDuplicate && tx.selected).length;

    if (selectedTransactions.length === 0) {
      throw new Error('import.errors.no_transactions_selected');
    }

    await apiTransactions.importSelectedTransactions(selectedTransactions);
    await finalizeImport(selectedTransactions.length, duplicatesSkipped, duplicatesImported);
  }

  async function finalizeImport(
    imported: number,
    duplicatesSkipped: number,
    duplicatesImported: number
  ): Promise<void> {
    importedCount = imported;

    lastImportDuplicates = duplicatesSkipped;
    lastImportDuplicatesForced = duplicatesImported;

    await new Promise((resolve) => setTimeout(resolve, IMPORT_COMPLETE_DELAY_MS));
    await apiTransactions.load();
  }

  function handleImportError(): void {
    error = $t('import.errors.import_failed');
    step = 2;
  }

  function cleanupImportProgress(): void {
    loading = false;
    importProgress = 0;
    totalFilesToProcess = 0;
  }

  async function importTransactions(): Promise<void> {
    if (selectedFiles.length === 0) return;

    loading = true;
    step = 3;
    totalFilesToProcess = selectedFiles.length;
    importProgress = 0;

    try {
      if (transactions.length === 0) {
        await importDirectly();
      } else {
        await importFromPreview();
      }
    } catch (_err) {
      const errorMessage = _err instanceof Error ? _err.message : 'import.errors.import_failed';
      error = $t(errorMessage);
      console.error('Import failed:', _err);
      handleImportError();
    } finally {
      cleanupImportProgress();
    }
  }

  // ===== TRANSACTION MANAGEMENT =====

  function toggleTransaction(id: string): void {
    transactions = transactions.map((tx) =>
      tx.id === id ? { ...tx, selected: !tx.selected } : tx
    );
  }

  function toggleAllTransactions(): void {
    const allSelected = transactions.every((tx) => tx.selected);
    transactions = transactions.map((tx) => ({ ...tx, selected: !allSelected }));
  }

  function goBack(): void {
    if (step === 2) {
      step = 1;
      selectedFiles = [];
      transactions = [];
      error = '';
      importedCount = 0;
    }
  }

  function handleClose(): void {
    goto('/');
  }
</script>

<svelte:head>
  <title>{$t('import.title')} - Happy Balance</title>
</svelte:head>

<PageContainer>
  <main class="import-page">
    <div class="import-container">
      <!-- Header -->
      <div class="import-header">
        <h1 class="import-title">{$t('import.title')}</h1>
        <p class="import-subtitle">{$t('import.subtitle')}</p>
      </div>

      <!-- Progress Steps -->
      <ImportProgressSteps currentStep={step} />

      <!-- Content Card -->
      <div class="import-content">
        <ErrorAlert message={error} onClose={() => (error = '')} />

        <!-- Step 1: Upload -->
        {#if step === 1}
          <div class="upload-step">
            <ImportSettings {previewEnabled} onToggle={() => (previewEnabled = !previewEnabled)} />
            <ImportFileUpload
              {loading}
              onFileSelect={handleFileUpload}
              {selectedFiles}
              {importProgress}
              totalFiles={totalFilesToProcess}
            />
            <CompatibleBanks />
          </div>
        {/if}

        <!-- Step 2: Preview -->
        {#if step === 2}
          <ImportStatsGrid
            total={transactions.length}
            selected={selectedCount}
            duplicates={duplicateCount}
            selectedDuplicates={selectedDuplicatesCount}
            skipped={transactions.length - selectedCount}
          />
          <TransactionPreviewTable
            bind:transactions
            onToggleTransaction={toggleTransaction}
            onToggleAll={toggleAllTransactions}
          />
        {/if}

        <!-- Step 3: Complete -->
        {#if step === 3}
          <ImportComplete
            {loading}
            {importedCount}
            duplicatesSkipped={lastImportDuplicates}
            duplicatesForced={lastImportDuplicatesForced}
          />
        {/if}

        <!-- Footer -->
        {#if !loading}
          <div class="import-footer">
            <div class="footer-actions">
              {#if step === 2}
                <button class="btn-secondary" onclick={goBack}>
                  {$t('common.back')}
                </button>
                <button
                  class="btn-primary"
                  class:disabled={selectedCount === 0}
                  disabled={selectedCount === 0}
                  onclick={importTransactions}
                >
                  {importButtonText}
                </button>
              {:else if step === 3 && !loading}
                <button class="btn-secondary" onclick={resetImportState}>
                  {$t('import.complete.import_another')}
                </button>
                <button class="btn-primary" onclick={handleClose}>
                  {$t('common.done')}
                </button>
              {/if}
            </div>
          </div>
        {/if}
      </div>
    </div>
  </main>
</PageContainer>

<style>
  /* Import Page Layout */
  .import-page {
    width: 100%;
    min-height: 100vh;
  }

  .import-container {
    max-width: 100%;
    margin: 0 auto;
  }

  /* Header */
  .import-header {
    text-align: center;
    margin-bottom: 2rem;
  }

  .import-title {
    font-size: 1.875rem;
    font-weight: 300;
    color: var(--text-primary);
    margin-bottom: 0.5rem;
  }

  .import-subtitle {
    color: var(--text-secondary);
    font-size: 0.875rem;
  }

  /* Content Card */
  .import-content {
    background: var(--surface-elevated);
    border: 1px solid var(--border-color);
    border-radius: 1rem;
    overflow: hidden;
  }

  /* Upload Step */
  .upload-step {
    padding: 2rem;
  }

  /* Footer */
  .import-footer {
    background: var(--surface-muted);
    border-top: 1px solid var(--border-color);
    padding: 1rem;
    border-radius: 0 0 1rem 1rem;
  }

  .footer-actions {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
  }

  /* Button Styles */
  .btn-primary,
  .btn-secondary {
    padding: 0.75rem 1.5rem;
    border-radius: 0.5rem;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    border: 1px solid transparent;
  }

  .btn-primary {
    background: var(--acapulco);
    color: var(--text-inverse);
    border-color: var(--acapulco);
  }

  .btn-primary:hover:not(.disabled) {
    background: rgba(122, 186, 165, 0.9);
    transform: translateY(-1px);
  }

  .btn-primary.disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }

  .btn-secondary {
    background: transparent;
    color: var(--text-primary);
    border-color: var(--border-color);
  }

  .btn-secondary:hover {
    background: var(--surface-muted);
    border-color: var(--acapulco);
  }

  /* Responsive */
  @media (max-width: 768px) {
    .upload-step {
      padding: 1rem;
    }

    .footer-actions {
      flex-direction: column;
      gap: 0.75rem;
    }

    .btn-primary,
    .btn-secondary {
      width: 100%;
      text-align: center;
    }
  }

  @media (max-width: 360px) {
    .import-header {
      margin-bottom: 1rem;
    }

    .import-title {
      font-size: 1.5rem;
    }

    .import-subtitle {
      font-size: 0.75rem;
    }

    .upload-step {
      padding: 1rem;
    }

    .btn-primary,
    .btn-secondary {
      padding: 0.625rem 1rem;
      font-size: 0.8125rem;
    }
  }
</style>
