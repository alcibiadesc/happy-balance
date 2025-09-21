<script lang="ts">
  import { goto } from "$app/navigation";
  import { t } from "$lib/stores/i18n";
  import { onMount } from "svelte";
  import { apiTransactions } from "$lib/stores/api-transactions";
  import { parseCSV } from "$lib/utils/csv-parser";

  // Import types from the parser
  import type { ParsedTransaction } from "$lib/utils/csv-parser";

  // Constants
  const PREVIEW_SETTING_KEY = "import-preview-enabled";

  // State management
  let step = 1; // 1: upload, 2: preview, 3: complete
  let selectedFile: File | null = null;
  let transactions: ParsedTransaction[] = [];
  let loading = false;
  let error = "";
  let previewEnabled = true;
  let showAllTransactions = false;
  let mounted = false;
  let importedCount = 0;

  // View modes: 'all' | 'duplicates' | 'new'
  let viewMode: 'all' | 'duplicates' | 'new' = 'all';

  // Search functionality
  let searchQuery = '';
  let searchTimeout: ReturnType<typeof setTimeout>;

  // Load preview preference from localStorage
  function loadPreviewPreference(): boolean {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem(PREVIEW_SETTING_KEY);
      return saved !== null ? JSON.parse(saved) : true; // Default to true
    }
    return true;
  }

  // Save preview preference to localStorage
  function savePreviewPreference(enabled: boolean): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(PREVIEW_SETTING_KEY, JSON.stringify(enabled));
    }
  }

  // Initialize preview preference on mount
  onMount(() => {
    previewEnabled = loadPreviewPreference();
    mounted = true;
  });

  // React to previewEnabled changes and save to localStorage (only after mount)
  $: if (mounted && typeof localStorage !== 'undefined') {
    savePreviewPreference(previewEnabled);
  }

  // Parse CSV and check for duplicates using new DDD endpoints
  async function getCSVPreview(file: File): Promise<ParsedTransaction[]> {
    // Parse the CSV file using the centralized parser
    const fileText = await file.text();
    const parseResult = parseCSV(fileText);

    // Check for parsing errors
    if (parseResult.errors.length > 0) {
      console.warn('CSV parsing errors:', parseResult.errors);
      // Continue with parsed transactions, but log errors
      parseResult.errors.forEach(error => {
        console.warn(`Row ${error.row}: ${error.message}`);
      });
    }


    if (parseResult.transactions.length === 0) {
      throw new Error('No valid transactions found in CSV file');
    }

    // Generate hashes using backend service for consistency
    // IMPORTANT: Always use EUR for hash generation when amount is in EUR
    // This ensures consistent duplicate detection regardless of originalCurrency
    const transactionsForHashing = parseResult.transactions.map(tx => ({
      date: tx.date,
      merchant: tx.partner,
      amount: tx.amount,
      currency: 'EUR' // Always use EUR for hash to ensure consistent duplicate detection
    }));

    const hashResult = await apiTransactions.generateHashes(transactionsForHashing);

    // Update transactions with backend-generated hashes
    const transactionsWithHashes = parseResult.transactions.map((tx, index) => {
      const hashInfo = hashResult.hashes.find(h => h.index === index);
      return {
        ...tx,
        hash: hashInfo?.hash || tx.hash // Use backend hash if available
      };
    });

    // Check for duplicates using backend-generated hashes
    const hashes = transactionsWithHashes.map(tx => tx.hash);
    const duplicateCheckResult = await apiTransactions.checkDuplicates(hashes);

    // Update transactions based on duplicate check results
    const transactionsWithDuplicateInfo = transactionsWithHashes.map(tx => {
      const duplicateInfo = duplicateCheckResult.results.find(r => r.hash === tx.hash);
      return {
        ...tx,
        isDuplicate: duplicateInfo?.isDuplicate || tx.isDuplicate, // Keep local duplicates too
        selected: !(duplicateInfo?.isDuplicate || tx.isDuplicate), // Don't select any duplicates by default
        duplicateReason: duplicateInfo?.isDuplicate ? $t("import.duplicate_reasons.database") : tx.duplicateReason,
        isSuspectedDuplicate: duplicateInfo?.isDuplicate // Mark as suspected duplicate for UI
      };
    });

    return transactionsWithDuplicateInfo;
  }


  async function handleFileUpload(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".csv")) {
      error = $t("import.errors.invalid_file");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      error = $t("import.errors.file_too_large");
      return;
    }

    selectedFile = file;
    error = "";

    if (previewEnabled) {
      await generatePreview();
    } else {
      await importTransactions();
    }
  }

  async function generatePreview() {
    if (!selectedFile) return;

    loading = true;
    error = "";

    try {
      // Use backend preview endpoint to get transactions with duplicate detection
      transactions = await getCSVPreview(selectedFile);

      if (transactions.length === 0) {
        error = $t("import.errors.no_transactions");
        return;
      }

      // Show message if duplicates were detected
      const duplicateCount = transactions.filter(tx => tx.isDuplicate).length;
      if (duplicateCount > 0) {
      }

      step = 2;
    } catch (err) {
      error = err instanceof Error ? err.message : $t("import.errors.parse_failed");
      console.error(err);
    } finally {
      loading = false;
    }
  }


  async function importTransactions() {
    if (!selectedFile) return;

    loading = true;
    step = 3;

    try {
      let result;

      if (transactions.length === 0) {
        // Preview was disabled - import directly from file
        result = await apiTransactions.importFile(selectedFile, {
          currency: "EUR",
          duplicateDetectionEnabled: true,
          skipDuplicates: true,
          autoCategorizationEnabled: true,
        });

        // Store counts for success message
        importedCount = result.imported || 0;
        (window as any).lastImportDuplicates = result.duplicatesSkipped || 0;
        (window as any).lastImportDuplicatesForced = 0;
      } else {
        // Preview was enabled - import selected transactions
        const selectedTransactions = transactions.filter(tx => tx.selected);
        const duplicatesSkipped = transactions.filter(tx => tx.isDuplicate && !tx.selected).length;
        const duplicatesImported = transactions.filter(tx => tx.isDuplicate && tx.selected).length;

        if (selectedTransactions.length === 0) {
          throw new Error('No transactions selected for import');
        }

        result = await apiTransactions.importSelectedTransactions(selectedTransactions);

        // Store duplicate counts for success message
        importedCount = selectedTransactions.length;
        (window as any).lastImportDuplicates = duplicatesSkipped;
        (window as any).lastImportDuplicatesForced = duplicatesImported;
      }

      await new Promise((resolve) => setTimeout(resolve, 1500));

      loading = false;
    } catch (err) {
      error = $t("import.errors.import_failed");
      console.error(err);
      step = 2;
      loading = false;
    }
  }

  function toggleTransaction(id: string) {
    transactions = transactions.map((tx) =>
      tx.id === id ? { ...tx, selected: !tx.selected } : tx,
    );
  }

  function toggleAllTransactions() {
    const currentVisible = visibleTransactions;
    const allSelected = currentVisible.every((tx) => tx.selected);

    transactions = transactions.map((tx) => {
      // Toggle only visible transactions based on current view mode
      const isVisible = currentVisible.some(v => v.id === tx.id);
      if (isVisible) {
        return { ...tx, selected: !allSelected };
      }
      return tx;
    });
  }

  function goBack() {
    if (step === 2) {
      step = 1;
      selectedFile = null;
      transactions = [];
      error = "";
      importedCount = 0;
    }
  }

  function handleClose() {
    goto("/");
  }

  // Search functionality
  function handleSearch(event: Event) {
    const target = event.target as HTMLInputElement;
    const value = target.value;

    // Debounce search
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      searchQuery = value.toLowerCase();
    }, 300);
  }

  function matchesSearch(transaction: any): boolean {
    if (!searchQuery) return true;

    const searchFields = [
      transaction.partner,
      transaction.description,
      transaction.date,
      transaction.amount?.toString(),
      transaction.hash
    ];

    return searchFields.some(field =>
      field?.toString().toLowerCase().includes(searchQuery)
    );
  }

  $: selectedCount = transactions.filter(tx => tx.selected).length;
  $: duplicateCount = transactions.filter((tx) => tx.isDuplicate).length;
  $: selectedDuplicatesCount = transactions.filter((tx) => tx.isDuplicate && tx.selected).length;
  $: newTransactionsCount = transactions.filter((tx) => !tx.isDuplicate).length;
  $: visibleTransactions = (() => {
    let filtered = transactions;

    // Apply view mode filter
    switch (viewMode) {
      case 'duplicates':
        filtered = filtered.filter((tx) => tx.isDuplicate);
        break;
      case 'new':
        filtered = filtered.filter((tx) => !tx.isDuplicate);
        break;
      case 'all':
      default:
        // Show all transactions
        break;
    }

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(matchesSearch);
    }

    return filtered;
  })();
  $: displayedTransactions = showAllTransactions
    ? visibleTransactions
    : visibleTransactions.slice(0, 10);
  $: importButtonText =
    selectedCount === 1
      ? $t("import.actions.import_count", { count: selectedCount })
      : $t("import.actions.import_count_plural", { count: selectedCount });
</script>

<svelte:head>
  <title>{$t("import.title")} - Happy Balance</title>
</svelte:head>

<main class="import-page">
  <div class="import-container">
    <!-- Header sin Logo -->
    <div class="import-header">
      <h1 class="import-title">{$t("import.title")}</h1>
      <p class="import-subtitle">{$t("import.subtitle")}</p>
    </div>

    <!-- Progress Steps con círculos perfectos -->
    <div class="progress-steps">
      <div class="progress-container">
        <div class="step-item">
          <div class="step-circle {step >= 1 ? 'active' : ''}">
            {#if step > 1}
              <svg
                class="step-check"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            {:else}
              1
            {/if}
          </div>
          <div class="step-text">
            <div class="step-title {step >= 1 ? 'active' : ''}">
              {$t("import.steps.upload")}
            </div>
            <div class="step-desc">{$t("import.steps.upload_desc")}</div>
          </div>
        </div>

        <div class="step-line {step >= 2 ? 'active' : ''}"></div>

        <div class="step-item">
          <div class="step-circle {step >= 2 ? 'active' : ''}">
            {#if step > 2}
              <svg
                class="step-check"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            {:else}
              2
            {/if}
          </div>
          <div class="step-text">
            <div class="step-title {step >= 2 ? 'active' : ''}">
              {$t("import.steps.preview")}
            </div>
            <div class="step-desc">{$t("import.steps.preview_desc")}</div>
          </div>
        </div>

        <div class="step-line {step >= 3 ? 'active' : ''}"></div>

        <div class="step-item">
          <div class="step-circle {step >= 3 ? 'active' : ''}">3</div>
          <div class="step-text">
            <div class="step-title {step >= 3 ? 'active' : ''}">
              {$t("import.steps.complete")}
            </div>
            <div class="step-desc">{$t("import.steps.complete_desc")}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Content Card -->
    <div class="import-content">
      {#if error}
        <div class="error-alert">
          <svg
            class="error-icon"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 18.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
          <span class="error-message">{error}</span>
          <button
            class="error-close"
            on:click={() => (error = "")}
            aria-label="Close error message"
          >
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      {/if}

      <!-- Step 1: Upload -->
      {#if step === 1}
        <div class="upload-step">
          <!-- Settings Section con toggle personalizado -->
          <div class="settings-section">
            <h3 class="settings-title">{$t("import.settings.title")}</h3>
            <div class="setting-item">
              <label class="setting-label">
                <input
                  type="checkbox"
                  bind:checked={previewEnabled}
                  class="toggle toggle-acapulco"
                />
                <span class="setting-text"
                  >{$t("import.settings.enable_preview")}</span
                >
              </label>
              <div class="setting-desc">
                {$t("import.settings.enable_preview_desc")}
              </div>
            </div>
          </div>

          <!-- File Upload Area -->
          <div class="upload-area">
            <input
              type="file"
              accept=".csv"
              on:change={handleFileUpload}
              class="upload-input"
              id="file-upload"
              disabled={loading}
            />
            <label
              for="file-upload"
              class="upload-label {loading ? 'loading' : ''}"
            >
              {#if loading}
                <div class="upload-spinner"></div>
              {:else}
                <div class="upload-icon">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                </div>
              {/if}

              <div class="upload-text">
                <p class="upload-title">
                  {loading
                    ? $t("import.upload.processing")
                    : $t("import.upload.choose_file")}
                </p>
                <p class="upload-subtitle">
                  {$t("import.upload.drag_drop")}
                </p>
              </div>
            </label>
          </div>

          {#if selectedFile && !loading}
            <div class="file-info">
              <div class="file-details">
                <div class="file-icon">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <div class="file-text">
                  <p class="file-name">{selectedFile.name}</p>
                  <p class="file-size">
                    {(selectedFile.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              </div>
              <div class="file-badge">
                {$t("import.upload.ready")}
              </div>
            </div>
          {/if}
        </div>
      {/if}

      <!-- Step 2: Preview -->
      {#if step === 2}
        <div class="preview-step">
          <!-- Summary Cards -->
          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-value">{transactions.length}</div>
              <div class="stat-label">{$t("import.preview.stats.total")}</div>
            </div>
            <div class="stat-card accent">
              <div class="stat-value">{selectedCount}</div>
              <div class="stat-label">
                {$t("import.preview.stats.selected")}
              </div>
            </div>
            <div class="stat-card warning" class:pulse={duplicateCount > 0}>
              <div class="stat-value">{duplicateCount}</div>
              <div class="stat-label">
                {$t("import.preview.stats.duplicates")}
              </div>
              {#if duplicateCount > 0}
                <div class="stat-hint">{$t('pages.import.duplicates_detected')}</div>
              {/if}
              {#if selectedDuplicatesCount > 0}
                <div class="stat-hint accent">{$t('pages.import.selected_for_import', { count: selectedDuplicatesCount })}</div>
              {/if}
            </div>
            <div class="stat-card error">
              <div class="stat-value">
                {transactions.length - selectedCount}
              </div>
              <div class="stat-label">{$t("import.preview.stats.skipped")}</div>
            </div>
          </div>

          <!-- Search Bar -->
          <div class="search-container">
            <div class="search-wrapper">
              <svg class="search-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" width="20" height="20">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder={$t('pages.import.search_transactions')}
                class="search-input"
                on:input={handleSearch}
              />
            </div>
          </div>

          <!-- View Mode Filters -->
          <div class="view-filters">
            <div class="filter-tabs">
              <button
                class="filter-tab {viewMode === 'all' ? 'active' : ''}"
                on:click={() => viewMode = 'all'}
              >
                {$t('pages.import.filter_all')} ({transactions.length})
              </button>

              <button
                class="filter-tab {viewMode === 'new' ? 'active' : ''}"
                on:click={() => viewMode = 'new'}
              >
                {$t('pages.import.filter_new')} ({newTransactionsCount})
              </button>

              <button
                class="filter-tab {viewMode === 'duplicates' ? 'active' : ''}"
                on:click={() => viewMode = 'duplicates'}
                disabled={duplicateCount === 0}
              >
                {$t('pages.import.filter_duplicates')} ({duplicateCount})
                {#if selectedDuplicatesCount > 0}
                  <span class="selected-badge">{selectedDuplicatesCount}</span>
                {/if}
              </button>
            </div>

            <div class="control-actions">
              {#if visibleTransactions.length > 10}
                <label class="control-item">
                  <input
                    type="checkbox"
                    bind:checked={showAllTransactions}
                    class="toggle toggle-acapulco toggle-sm"
                  />
                  <span class="control-text">
                    {$t("import.preview.controls.show_all")}
                  </span>
                </label>
              {/if}

              <button class="select-all-btn" on:click={toggleAllTransactions}>
                {visibleTransactions.every((tx) => tx.selected)
                  ? $t("import.preview.controls.deselect_all")
                  : $t("import.preview.controls.select_all")}
              </button>
            </div>
          </div>

          <!-- Transactions Table Mejorada -->
          <div class="table-container">
            {#if visibleTransactions.length === 0}
              <div class="empty-state">
                <div class="empty-icon">
                  {#if viewMode === 'duplicates'}
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="48" height="48">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  {:else if viewMode === 'new'}
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="48" height="48">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  {:else}
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="48" height="48">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                  {/if}
                </div>
                <h3 class="empty-title">
                  {#if viewMode === 'duplicates'}
                    No hay transacciones duplicadas
                  {:else if viewMode === 'new'}
                    No hay transacciones nuevas
                  {:else}
                    No hay transacciones
                  {/if}
                </h3>
                <p class="empty-subtitle">
                  {#if viewMode === 'duplicates'}
                    ¡Excelente! No se detectaron duplicados en tu archivo
                  {:else if viewMode === 'new'}
                    Todas las transacciones ya existen en la base de datos
                  {:else}
                    El archivo no contiene transacciones válidas
                  {/if}
                </p>
              </div>
            {:else}
            <div class="table-wrapper">
              <table class="transactions-table">
                <thead>
                  <tr>
                    <th class="col-checkbox">
                      <span class="th-content"
                        >{$t("import.preview.table.select")}</span
                      >
                    </th>
                    <th class="col-date">
                      <span class="th-content"
                        >{$t("import.preview.table.date")}</span
                      >
                    </th>
                    <th class="col-partner">
                      <span class="th-content"
                        >{$t("import.preview.table.partner")}</span
                      >
                    </th>
                    <th class="col-description">
                      <span class="th-content"
                        >{$t("import.preview.table.description")}</span
                      >
                    </th>
                    <th class="col-amount">
                      <span class="th-content"
                        >{$t("import.preview.table.amount")}</span
                      >
                    </th>
                    <th class="col-status">
                      <span class="th-content"
                        >{$t("import.preview.table.status")}</span
                      >
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {#each displayedTransactions as transaction (transaction.id)}
                    <tr
                      class="transaction-row {transaction.isDuplicate
                        ? 'duplicate'
                        : ''}"
                    >
                      <td class="col-checkbox">
                        <div class="checkbox-wrapper">
                          <input
                            type="checkbox"
                            class="checkbox-acapulco"
                            id="tx-{transaction.id}"
                            checked={transaction.selected}
                            on:change={() => toggleTransaction(transaction.id)}
                          />
                          <label
                            for="tx-{transaction.id}"
                            class="checkbox-label"
                          >
                            <svg class="checkbox-icon" viewBox="0 0 24 24">
                              <path
                                d="M5 13l4 4L19 7"
                                stroke="currentColor"
                                stroke-width="2"
                                fill="none"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                              />
                            </svg>
                          </label>
                        </div>
                      </td>
                      <td class="col-date">
                        <div class="cell-content">
                          {transaction.date}
                        </div>
                      </td>
                      <td class="col-partner">
                        <div class="cell-content" title={transaction.partner}>
                          {transaction.partner}
                        </div>
                      </td>
                      <td class="col-description">
                        <div
                          class="cell-content"
                          title={transaction.description}
                        >
                          {transaction.description}
                        </div>
                      </td>
                      <td class="col-amount">
                        <div
                          class="amount-wrapper {transaction.amount >= 0
                            ? 'positive'
                            : 'negative'}"
                        >
                          <span class="amount-sign"
                            >{transaction.amount >= 0 ? "+" : ""}</span
                          >
                          <span class="amount-value"
                            >{Math.abs(transaction.amount).toFixed(2)}</span
                          >
                          <span class="amount-currency">€</span>
                        </div>
                      </td>
                      <td class="col-status">
                        {#if transaction.isDuplicate}
                          <div class="status-badge {transaction.selected ? 'duplicate-selected' : 'duplicate'}">
                            <span class="status-dot"></span>
                            <span class="status-text">
                              {transaction.selected ? $t("import.preview.status.duplicate_will_import") : $t("import.preview.status.duplicate")}
                            </span>
                          </div>
                          {#if transaction.duplicateReason}
                            <div
                              class="status-reason"
                              title={transaction.duplicateReason}
                            >
                              {transaction.duplicateReason}
                            </div>
                          {/if}
                        {:else if transaction.selected}
                          <div class="status-badge ready">
                            <span class="status-dot"></span>
                            <span class="status-text"
                              >{$t("import.preview.status.ready")}</span
                            >
                          </div>
                        {:else}
                          <div class="status-badge skipped">
                            <span class="status-dot"></span>
                            <span class="status-text"
                              >{$t("import.preview.status.skipped")}</span
                            >
                          </div>
                        {/if}
                      </td>
                    </tr>
                  {/each}
                </tbody>
              </table>
            </div>
            {/if}

            {#if !showAllTransactions && visibleTransactions.length > 10}
              <div class="pagination-info">
                <p class="pagination-text">
                  {$t("import.preview.pagination.showing", {
                    total: visibleTransactions.length,
                  })}
                </p>
                <button
                  class="show-all-btn"
                  on:click={() => (showAllTransactions = true)}
                >
                  {$t("import.preview.pagination.show_all")}
                </button>
              </div>
            {/if}
          </div>
        </div>
      {/if}

      <!-- Step 3: Complete -->
      {#if step === 3}
        <div class="complete-step">
          {#if loading}
            <div class="complete-loading">
              <div class="complete-spinner"></div>
              <h3 class="complete-title">{$t("import.complete.importing")}</h3>
              <p class="complete-subtitle">
                {$t("import.complete.importing_desc")}
              </p>
            </div>
          {:else}
            <div class="complete-success">
              <div class="success-icon">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h3 class="complete-title">{$t("import.complete.success")}</h3>
              <p class="complete-subtitle">
                {$t("import.complete.success_desc", { count: importedCount })}
              </p>
              {#if (window as any).lastImportDuplicates > 0}
                <p class="complete-info">
                  ⚠️ {(window as any).lastImportDuplicates} transacciones duplicadas fueron omitidas
                </p>
              {/if}
              {#if (window as any).lastImportDuplicatesForced > 0}
                <p class="complete-info">
                  ✅ {(window as any).lastImportDuplicatesForced} posibles duplicados fueron importados por petición del usuario
                </p>
              {/if}
            </div>
          {/if}
        </div>
      {/if}

      <!-- Footer -->
      {#if !loading}
        <div class="import-footer">
          <div class="footer-actions">
            {#if step === 2}
              <button class="btn-secondary" on:click={goBack}>
                {$t("common.back")}
              </button>
              <button
                class="btn-primary {selectedCount === 0 ? 'disabled' : ''}"
                disabled={selectedCount === 0}
                on:click={importTransactions}
              >
                {importButtonText}
              </button>
            {:else if step === 3 && !loading}
              <button
                class="btn-secondary"
                on:click={() => {
                  selectedFile = null;
                  transactions = [];
                  step = 1;
                  importedCount = 0;
                }}
              >
                {$t("import.complete.import_another")}
              </button>
              <button class="btn-primary" on:click={handleClose}>
                {$t("common.done")}
              </button>
            {/if}
          </div>
        </div>
      {/if}
    </div>
  </div>
</main>

<style>
  /* Import Page Layout */
  .import-page {
    max-width: 1400px;
    margin: 0 auto;
    padding: 1.5rem;
    min-height: 100vh;
    background: var(--surface);
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

  /* Progress Steps con círculos perfectos */
  .progress-steps {
    background: var(--surface-elevated);
    border: 1px solid var(--border-color);
    border-radius: 1rem;
    padding: 1.5rem;
    margin-bottom: 2rem;
  }

  .progress-container {
    display: flex;
    align-items: flex-start;
    justify-content: center;
    max-width: 40rem;
    margin: 0 auto;
    gap: 2rem;
    padding: 0 1rem;
  }

  .step-item {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
    flex-direction: column;
    align-items: center;
    min-width: 0;
  }

  .step-circle {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.875rem;
    font-weight: 500;
    background: var(--surface-muted);
    color: var(--text-muted);
    border: 2px solid var(--border-color);
    transition: all 0.3s ease;
    flex-shrink: 0;
  }

  .step-circle.active {
    background: var(--acapulco);
    color: var(--text-inverse);
    border-color: var(--acapulco);
    box-shadow: 0 4px 12px rgba(122, 186, 165, 0.3);
  }

  .step-check {
    width: 1.25rem;
    height: 1.25rem;
  }

  .step-text {
    text-align: center;
    min-width: 0;
    flex: 1;
    max-width: 120px;
  }

  .step-title {
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--text-muted);
    transition: color 0.3s ease;
    word-wrap: break-word;
    hyphens: auto;
    line-height: 1.2;
  }

  .step-title.active {
    color: var(--text-primary);
  }

  .step-desc {
    font-size: 0.75rem;
    color: var(--text-muted);
    margin-top: 0.25rem;
    word-wrap: break-word;
    hyphens: auto;
    line-height: 1.3;
  }

  .step-line {
    flex: 1;
    height: 2px;
    background: var(--border-color);
    transition: background-color 0.3s ease;
    margin-top: 20px;
    min-width: 2rem;
  }

  .step-line.active {
    background: var(--acapulco);
  }

  /* Content Card */
  .import-content {
    background: var(--surface-elevated);
    border: 1px solid var(--border-color);
    border-radius: 1rem;
    overflow: hidden;
  }

  /* Error Alert */
  .error-alert {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin: 1.5rem;
    padding: 1rem;
    background: rgba(245, 121, 108, 0.1);
    border: 1px solid rgba(245, 121, 108, 0.2);
    border-radius: 0.75rem;
    color: #f5796c;
  }

  .error-icon {
    width: 1.25rem;
    height: 1.25rem;
    flex-shrink: 0;
  }

  .error-message {
    flex: 1;
    font-size: 0.875rem;
    font-weight: 500;
  }

  .error-close {
    padding: 0.5rem;
    border: none;
    background: transparent;
    color: inherit;
    border-radius: 0.5rem;
    cursor: pointer;
    transition: background-color 0.2s ease;
  }

  .error-close:hover {
    background: rgba(245, 121, 108, 0.1);
  }

  .error-close svg {
    width: 1rem;
    height: 1rem;
  }

  /* Upload Step */
  .upload-step {
    padding: 2rem;
  }

  .settings-section {
    background: var(--surface-muted);
    border: 1px solid var(--border-color);
    border-radius: 0.75rem;
    padding: 1.5rem;
    margin-bottom: 2rem;
  }

  .settings-title {
    font-size: 1.125rem;
    font-weight: 500;
    color: var(--text-primary);
    margin-bottom: 1.5rem;
  }

  .setting-item {
    margin-bottom: 1.5rem;
  }

  .setting-label {
    display: flex;
    align-items: center;
    gap: 1rem;
    cursor: pointer;
  }

  .setting-text {
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--text-primary);
  }

  .setting-desc {
    font-size: 0.75rem;
    color: var(--text-muted);
    margin-top: 0.75rem;
    margin-left: 3.5rem;
  }

  /* Custom Acapulco Toggle */
  .toggle-acapulco {
    --tw-toggle-bg-on: var(--acapulco);
    --tw-toggle-border-on: var(--acapulco);
    background-color: var(--surface-muted);
    border-color: var(--border-color);
  }

  .toggle-acapulco:checked {
    background-color: var(--acapulco);
    border-color: var(--acapulco);
  }

  .toggle-acapulco:focus {
    box-shadow: 0 0 0 2px rgba(122, 186, 165, 0.2);
  }

  /* Upload Area */
  .upload-area {
    position: relative;
  }

  .upload-input {
    position: absolute;
    opacity: 0;
    pointer-events: none;
  }

  .upload-label {
    display: block;
    width: 100%;
    border: 2px dashed var(--border-color);
    border-radius: 1rem;
    padding: 3rem;
    text-align: center;
    cursor: pointer;
    transition: all 0.3s ease;
  }

  .upload-label:hover {
    border-color: var(--acapulco);
    background: rgba(122, 186, 165, 0.02);
  }

  .upload-label.loading {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .upload-icon {
    width: 4rem;
    height: 4rem;
    background: rgba(122, 186, 165, 0.1);
    border-radius: 1rem;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 1rem;
    transition: all 0.3s ease;
  }

  .upload-label:hover .upload-icon {
    background: rgba(122, 186, 165, 0.2);
    transform: scale(1.05);
  }

  .upload-icon svg {
    width: 2rem;
    height: 2rem;
    color: var(--acapulco);
  }

  .upload-spinner {
    width: 3rem;
    height: 3rem;
    border: 3px solid var(--border-color);
    border-top: 3px solid var(--acapulco);
    border-radius: 50%;
    margin: 0 auto 1rem;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }

  .upload-title {
    font-size: 1.125rem;
    font-weight: 500;
    color: var(--text-primary);
    margin-bottom: 0.5rem;
  }

  .upload-subtitle {
    font-size: 0.875rem;
    color: var(--text-muted);
  }

  /* File Info */
  .file-info {
    margin-top: 2rem;
    padding: 1rem;
    background: rgba(122, 186, 165, 0.05);
    border: 1px solid rgba(122, 186, 165, 0.2);
    border-radius: 0.75rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .file-details {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .file-icon {
    width: 3rem;
    height: 3rem;
    background: rgba(122, 186, 165, 0.2);
    border-radius: 0.75rem;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
  }

  .file-icon svg {
    width: 1.5rem;
    height: 1.5rem;
    color: var(--acapulco);
  }

  .file-name {
    font-weight: 500;
    color: var(--text-primary);
  }

  .file-size {
    font-size: 0.875rem;
    color: var(--text-secondary);
    margin-top: 0.25rem;
  }

  .file-badge {
    padding: 0.25rem 0.75rem;
    background: var(--acapulco);
    color: var(--text-inverse);
    border-radius: 0.5rem;
    font-size: 0.875rem;
    font-weight: 500;
  }

  /* Preview Step */
  .preview-step {
    padding: 1.5rem;
  }

  /* Stats Grid */
  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
    margin-bottom: 1.5rem;
  }

  .stat-card {
    background: var(--surface-muted);
    border: 1px solid var(--border-color);
    border-radius: 0.75rem;
    padding: 1.5rem;
    text-align: center;
  }

  .stat-card.accent {
    background: rgba(122, 186, 165, 0.1);
    border-color: rgba(122, 186, 165, 0.2);
  }

  .stat-card.warning {
    background: rgba(254, 205, 44, 0.1);
    border-color: rgba(254, 205, 44, 0.2);
  }

  .stat-card.error {
    background: rgba(245, 121, 108, 0.05);
    border-color: rgba(245, 121, 108, 0.1);
  }

  .stat-value {
    font-size: 1.5rem;
    font-weight: 300;
    color: var(--text-primary);
  }

  .stat-card.accent .stat-value {
    color: var(--acapulco);
  }

  .stat-card.warning .stat-value {
    color: #fecd2c;
  }

  .stat-card.error .stat-value {
    color: #f5796c;
  }

  .stat-label {
    font-size: 0.75rem;
    font-weight: 500;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-top: 0.5rem;
  }

  .stat-hint {
    font-size: 0.625rem;
    color: var(--text-muted);
    margin-top: 0.25rem;
    font-weight: normal;
    text-transform: none;
    letter-spacing: normal;
  }

  .stat-hint.accent {
    color: #8dc351;
    font-weight: 500;
  }

  .stat-card.warning.pulse {
    animation: pulse-warning 2s ease-in-out;
  }

  @keyframes pulse-warning {
    0%, 100% {
      background: rgba(254, 205, 44, 0.1);
      border-color: rgba(254, 205, 44, 0.2);
    }
    50% {
      background: rgba(254, 205, 44, 0.2);
      border-color: rgba(254, 205, 44, 0.4);
    }
  }

  /* Preview Controls */
  .preview-controls {
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: var(--surface-muted);
    border-radius: 0.75rem;
    padding: 1rem;
    margin-bottom: 1.5rem;
    flex-wrap: wrap;
    gap: 1rem;
  }

  /* New View Filters */
  .view-filters {
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: var(--surface);
    border-radius: 0.75rem;
    padding: 0.75rem;
    margin-bottom: 1.5rem;
    flex-wrap: wrap;
    gap: 1rem;
    border: 1px solid var(--border);
  }

  .filter-group {
    display: flex;
    gap: 0.5rem;
    background: var(--surface-muted);
    border-radius: 0.625rem;
    padding: 0.25rem;
  }

  .filter-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.625rem 1rem;
    background: transparent;
    border: none;
    border-radius: 0.5rem;
    color: var(--text-secondary);
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    position: relative;
  }

  .filter-btn:hover:not(:disabled) {
    background: rgba(122, 186, 165, 0.1);
    color: var(--text-primary);
  }

  .filter-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .filter-btn.active {
    background: var(--surface);
    color: var(--acapulco);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }

  .filter-icon {
    width: 16px;
    height: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .filter-icon.warning {
    color: #fecd2c;
  }

  .filter-icon.success {
    color: #8dc351;
  }

  .filter-text {
    font-weight: 500;
  }

  .filter-count {
    font-size: 0.75rem;
    padding: 0.125rem 0.375rem;
    background: rgba(122, 186, 165, 0.1);
    border-radius: 0.25rem;
    font-weight: 600;
  }

  .filter-btn.active .filter-count {
    background: rgba(122, 186, 165, 0.2);
  }

  .filter-badge {
    position: absolute;
    top: -4px;
    right: -4px;
    font-size: 0.625rem;
    padding: 0.125rem 0.25rem;
    background: #8dc351;
    color: white;
    border-radius: 0.25rem;
    font-weight: 600;
    min-width: 16px;
    text-align: center;
  }

  .control-actions {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .control-group {
    display: flex;
    gap: 1.5rem;
    flex-wrap: wrap;
  }

  .control-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    cursor: pointer;
  }

  .control-text {
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--text-primary);
  }

  .select-all-btn {
    padding: 0.5rem 1rem;
    background: transparent;
    border: none;
    color: var(--acapulco);
    font-size: 0.875rem;
    font-weight: 500;
    border-radius: 0.5rem;
    cursor: pointer;
    transition: background-color 0.2s ease;
  }

  .select-all-btn:hover {
    background: rgba(122, 186, 165, 0.1);
  }

  /* Improved Transactions Table */
  .table-container {
    background: var(--surface);
    border-radius: 0.75rem;
    overflow: hidden;
    border: 1px solid var(--border-color);
  }

  .table-wrapper {
    overflow-x: auto;
    overflow-y: visible;
  }

  .transactions-table {
    width: 100%;
    border-collapse: separate;
    border-spacing: 0;
    min-width: 600px;
  }

  .transactions-table thead {
    background: var(--surface-muted);
    position: sticky;
    top: 0;
    z-index: 10;
  }

  .transactions-table th {
    padding: 1rem;
    text-align: left;
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    border-bottom: 2px solid var(--border-color);
    white-space: nowrap;
  }

  .th-content {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  /* Column widths optimized */
  .col-checkbox {
    width: 50px;
    text-align: center;
  }

  .col-date {
    width: 110px;
  }

  .col-partner {
    width: 160px;
    min-width: 120px;
  }

  .col-description {
    width: auto;
    min-width: 150px;
  }

  .col-amount {
    width: 100px;
    text-align: right;
  }

  .col-status {
    width: 120px;
  }

  /* Table rows */
  .transaction-row {
    transition: background-color 0.2s ease;
    border-bottom: 1px solid var(--border-color);
  }

  .transaction-row:hover {
    background: var(--surface-muted);
  }

  .transaction-row.duplicate {
    background: rgba(254, 205, 44, 0.03);
  }

  .transactions-table td {
    padding: 0.875rem 0.75rem;
    vertical-align: middle;
  }

  /* Custom Checkbox */
  .checkbox-wrapper {
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .checkbox-acapulco {
    position: absolute;
    opacity: 0;
    pointer-events: none;
  }

  .checkbox-label {
    width: 1.125rem;
    height: 1.125rem;
    border: 2px solid var(--border-color);
    border-radius: 0.25rem;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s ease;
    background: var(--surface);
  }

  .checkbox-acapulco:checked + .checkbox-label {
    background: var(--acapulco);
    border-color: var(--acapulco);
  }

  .checkbox-acapulco:disabled + .checkbox-label {
    opacity: 0.5;
    cursor: not-allowed;
    background: var(--surface-muted);
  }

  .checkbox-icon {
    width: 0.75rem;
    height: 0.75rem;
    color: white;
    opacity: 0;
    transform: scale(0);
    transition: all 0.2s ease;
  }

  .checkbox-acapulco:checked + .checkbox-label .checkbox-icon {
    opacity: 1;
    transform: scale(1);
  }

  .checkbox-label:hover {
    border-color: var(--acapulco);
    box-shadow: 0 0 0 2px rgba(122, 186, 165, 0.1);
  }

  /* Cell content */
  .cell-content {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 0.8125rem;
    color: var(--text-primary);
  }

  .col-date .cell-content {
    font-family: "JetBrains Mono", "Courier New", monospace;
    font-size: 0.75rem;
    color: var(--text-secondary);
  }

  .col-partner .cell-content {
    font-weight: 500;
  }

  .col-description .cell-content {
    color: var(--text-secondary);
  }

  /* Amount styling */
  .amount-wrapper {
    display: flex;
    align-items: baseline;
    justify-content: flex-end;
    gap: 0.125rem;
    font-family: "JetBrains Mono", "Courier New", monospace;
    font-weight: 600;
  }

  .amount-wrapper.positive {
    color: var(--acapulco);
  }

  .amount-wrapper.negative {
    color: #f5796c;
  }

  .amount-sign {
    font-size: 0.6875rem;
  }

  .amount-value {
    font-size: 0.8125rem;
  }

  .amount-currency {
    font-size: 0.6875rem;
    opacity: 0.8;
  }

  /* Empty state */
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 3rem 2rem;
    text-align: center;
  }

  .empty-icon {
    margin-bottom: 1rem;
    color: var(--text-muted);
    opacity: 0.5;
  }

  .empty-title {
    font-size: 1.125rem;
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: 0.5rem;
  }

  .empty-subtitle {
    font-size: 0.875rem;
    color: var(--text-secondary);
    max-width: 400px;
  }

  /* Status badges */
  .status-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    padding: 0.125rem 0.5rem;
    border-radius: 0.75rem;
    font-size: 0.6875rem;
    font-weight: 500;
  }

  .status-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .status-badge.ready {
    background: rgba(122, 186, 165, 0.1);
    color: var(--acapulco);
  }

  .status-badge.ready .status-dot {
    background: var(--acapulco);
  }

  .status-badge.duplicate {
    background: rgba(254, 205, 44, 0.1);
    color: #d4a000;
  }

  .status-badge.duplicate .status-dot {
    background: #fecd2c;
  }

  .status-badge.duplicate-selected {
    background: rgba(141, 195, 81, 0.2);
    color: #8dc351;
    border: 1px solid rgba(141, 195, 81, 0.3);
  }

  .status-badge.duplicate-selected .status-dot {
    background: #8dc351;
    animation: pulse 2s infinite;
  }

  .status-badge.skipped {
    background: var(--surface-muted);
    color: var(--text-muted);
  }

  .status-badge.skipped .status-dot {
    background: var(--text-muted);
  }

  .status-reason {
    font-size: 0.625rem;
    color: var(--text-muted);
    margin-top: 0.25rem;
    max-width: 100px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  /* Pagination */
  .pagination-info {
    background: var(--surface-muted);
    padding: 1rem;
    text-align: center;
    border-top: 1px solid var(--border-color);
  }

  .pagination-text {
    font-size: 0.875rem;
    color: var(--text-secondary);
    margin-bottom: 0.5rem;
  }

  .show-all-btn {
    padding: 0.5rem 1rem;
    background: transparent;
    border: none;
    color: var(--acapulco);
    font-size: 0.875rem;
    font-weight: 500;
    border-radius: 0.5rem;
    cursor: pointer;
    transition: background-color 0.2s ease;
  }

  .show-all-btn:hover {
    background: rgba(122, 186, 165, 0.1);
  }

  /* Complete Step */
  .complete-step {
    padding: 3rem;
    text-align: center;
  }

  .complete-loading {
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .complete-spinner {
    width: 3rem;
    height: 3rem;
    border: 3px solid var(--border-color);
    border-top: 3px solid var(--acapulco);
    border-radius: 50%;
    margin-bottom: 1.5rem;
    animation: spin 1s linear infinite;
  }

  .complete-success {
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .success-icon {
    width: 5rem;
    height: 5rem;
    background: rgba(122, 186, 165, 0.1);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 1.5rem;
    box-shadow: 0 8px 24px rgba(122, 186, 165, 0.2);
  }

  .success-icon svg {
    width: 2.5rem;
    height: 2.5rem;
    color: var(--acapulco);
  }

  .complete-title {
    font-size: 1.25rem;
    font-weight: 300;
    color: var(--text-primary);
    margin-bottom: 0.5rem;
  }

  .complete-subtitle {
    color: var(--text-secondary);
    margin-bottom: 1rem;
  }

  .complete-info {
    font-size: 0.875rem;
    color: #d4a000;
    background: rgba(254, 205, 44, 0.1);
    padding: 0.5rem 1rem;
    border-radius: 0.5rem;
    margin-top: 1rem;
  }

  .complete-redirect {
    font-size: 0.875rem;
    color: var(--text-muted);
  }

  /* Footer */
  .import-footer {
    background: var(--surface-muted);
    padding: 1.5rem;
    border-top: 1px solid var(--border-color);
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 1rem;
  }

  .footer-left,
  .footer-right {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .back-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    background: transparent;
    border: 1px solid var(--border-color);
    border-radius: 0.5rem;
    color: var(--text-primary);
    font-size: 0.875rem;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .back-btn:hover {
    background: var(--surface-muted);
  }

  .back-btn svg {
    width: 1rem;
    height: 1rem;
  }

  .import-btn,
  .done-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1.5rem;
    background: linear-gradient(
      135deg,
      var(--acapulco),
      rgba(122, 186, 165, 0.9)
    );
    border: none;
    border-radius: 0.5rem;
    color: var(--text-inverse);
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    box-shadow: 0 4px 12px rgba(122, 186, 165, 0.2);
  }

  .import-btn:hover,
  .done-btn:hover {
    background: linear-gradient(
      135deg,
      rgba(122, 186, 165, 0.9),
      rgba(122, 186, 165, 0.8)
    );
    transform: translateY(-1px);
    box-shadow: 0 6px 16px rgba(122, 186, 165, 0.3);
  }

  .import-btn.disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }

  .import-btn svg {
    width: 1rem;
    height: 1rem;
  }

  /* Mejoras para evitar scroll horizontal */
  @media (min-width: 769px) and (max-width: 1100px) {
    .transactions-table {
      min-width: 580px;
    }

    .col-partner {
      width: 140px;
      min-width: 100px;
    }

    .col-description {
      width: auto;
      min-width: 120px;
    }

    .col-amount {
      width: 90px;
    }

    .col-status {
      width: 100px;
    }

    .transactions-table th,
    .transactions-table td {
      padding: 0.75rem 0.5rem;
    }

    .cell-content {
      font-size: 0.75rem;
    }

    .status-badge {
      padding: 0.125rem 0.375rem;
      font-size: 0.625rem;
    }

    .status-text {
      display: none;
    }

    .status-badge .status-dot {
      width: 8px;
      height: 8px;
    }
  }

  /* Optimización para pantallas medianas */
  @media (min-width: 900px) and (max-width: 1200px) {
    .import-container {
      max-width: calc(100vw - 320px);
    }

    .progress-container {
      max-width: 35rem;
    }

    .step-text {
      max-width: 110px;
    }
  }

  /* Ajustes para tablets */
  @media (min-width: 481px) and (max-width: 768px) {
    .progress-container {
      gap: 1.5rem;
      max-width: 36rem;
    }

    .step-item {
      min-width: 90px;
      max-width: 110px;
    }

    .step-text {
      max-width: 110px;
    }

    .step-line {
      margin-top: 18px;
      min-width: 1.5rem;
    }
  }

  /* Responsive Design */
  @media (max-width: 768px) {
    .import-page {
      padding: 1rem;
    }

    .progress-container {
      gap: 1rem;
      flex-wrap: wrap;
      justify-content: space-around;
    }

    .step-item {
      flex-direction: column;
      text-align: center;
      min-width: 80px;
      max-width: 100px;
    }

    .step-text {
      max-width: 100px;
    }

    .step-circle {
      width: 32px;
      height: 32px;
      font-size: 0.75rem;
    }

    .step-line {
      margin-top: 16px;
      min-width: 1.5rem;
    }

    .upload-step,
    .preview-step,
    .complete-step {
      padding: 1rem;
    }

    .stats-grid {
      grid-template-columns: repeat(2, 1fr);
    }

    .preview-controls {
      flex-direction: column;
      align-items: flex-start;
    }

    .table-wrapper {
      border-radius: 0;
    }

    .transactions-table {
      font-size: 0.75rem;
      min-width: 500px;
    }

    .transactions-table th {
      padding: 0.625rem 0.375rem;
      font-size: 0.625rem;
    }

    .transactions-table td {
      padding: 0.625rem 0.375rem;
    }

    .col-checkbox {
      width: 40px;
    }

    .col-date {
      width: 90px;
    }

    .col-partner {
      min-width: 100px;
    }

    .col-amount {
      width: 80px;
    }

    .col-status {
      width: 80px;
    }

    .amount-value {
      font-size: 0.75rem;
    }

    .status-badge {
      padding: 0.125rem 0.25rem;
      font-size: 0.5625rem;
    }

    .status-text {
      display: none;
    }

    .import-footer {
      flex-direction: column;
    }

    .footer-left,
    .footer-right {
      width: 100%;
      justify-content: center;
    }
  }

  @media (max-width: 480px) {
    .progress-container {
      max-width: 100%;
      gap: 0.5rem;
    }

    .step-item {
      min-width: 60px;
      max-width: 80px;
    }

    .step-text {
      max-width: 80px;
    }

    .step-title {
      font-size: 0.75rem;
    }

    .step-desc {
      font-size: 0.625rem;
    }

    .step-line {
      max-width: 1.5rem;
      min-width: 1rem;
      margin-top: 14px;
    }

    .stats-grid {
      gap: 0.5rem;
    }

    .stat-card {
      padding: 1rem;
    }

    .col-description {
      display: none;
    }

    .transactions-table {
      min-width: 350px;
    }
  }

  /* New Search Container */
  .search-container {
    margin-bottom: 1rem;
  }

  .search-wrapper {
    position: relative;
    max-width: 400px;
  }

  .search-icon {
    position: absolute;
    left: 0.75rem;
    top: 50%;
    transform: translateY(-50%);
    color: var(--text-muted);
    pointer-events: none;
  }

  .search-input {
    width: 100%;
    padding: 0.75rem 0.75rem 0.75rem 2.75rem;
    border: 1px solid var(--border-color);
    border-radius: 0.5rem;
    background: var(--surface);
    color: var(--text-primary);
    font-size: 0.875rem;
    transition: all 0.2s ease;
  }

  .search-input:focus {
    outline: none;
    border-color: var(--acapulco);
    box-shadow: 0 0 0 2px rgba(122, 186, 165, 0.1);
  }

  .search-input::placeholder {
    color: var(--text-muted);
  }

  /* New Minimalist Filter Tabs */
  .filter-tabs {
    display: flex;
    gap: 0.25rem;
    background: var(--surface-muted);
    border-radius: 0.5rem;
    padding: 0.25rem;
  }

  .filter-tab {
    padding: 0.5rem 1rem;
    background: transparent;
    border: none;
    border-radius: 0.375rem;
    color: var(--text-secondary);
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    position: relative;
    white-space: nowrap;
  }

  .filter-tab:hover:not(:disabled) {
    color: var(--text-primary);
    background: rgba(122, 186, 165, 0.1);
  }

  .filter-tab.active {
    color: var(--acapulco);
    background: var(--surface);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }

  .filter-tab:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .selected-badge {
    display: inline-block;
    margin-left: 0.5rem;
    padding: 0.125rem 0.375rem;
    background: var(--acapulco);
    color: var(--text-inverse);
    border-radius: 0.25rem;
    font-size: 0.75rem;
    font-weight: 600;
  }

  /* New Minimalist Footer */
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

  /* New Minimalist Button Styles */
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

  /* Mobile adjustments for new elements */
  @media (max-width: 768px) {
    .search-wrapper {
      max-width: 100%;
    }

    .filter-tabs {
      flex-wrap: wrap;
      gap: 0.125rem;
    }

    .filter-tab {
      padding: 0.375rem 0.75rem;
      font-size: 0.75rem;
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
</style>
