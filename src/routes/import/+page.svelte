<script lang="ts">
  import { goto } from '$app/navigation';
  import { CheckCircle, ArrowLeft, Upload, FileText, AlertTriangle, Eye } from 'lucide-svelte';
  import { onMount } from 'svelte';
  import ImportPreview from '$lib/ui/ImportPreview.svelte';

  // State management
  let currentStep = $state('upload'); // 'upload', 'preview', 'complete'
  let selectedFile = $state(null);
  let isUploading = $state(false);
  let isImporting = $state(false);
  let previewData = $state(null);
  let importResult = $state(null);
  let errorMessage = $state('');
  let mounted = $state(false);
  let selectedAccountId = $state('a524e6f2-647f-498f-beda-e710ff2a9423'); // Default account

  onMount(() => {
    mounted = true;
  });

  // Handle file selection
  function handleFileSelect(event) {
    const file = event.target.files?.[0];
    if (file) {
      selectedFile = file;
      errorMessage = '';
    }
  }

  // Handle drag and drop
  function handleDragOver(event) {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
  }

  function handleDrop(event) {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0];
    if (file && file.name.toLowerCase().endsWith('.csv')) {
      selectedFile = file;
      errorMessage = '';
    } else {
      errorMessage = 'Por favor, selecciona un archivo CSV válido';
    }
  }

  // Generate preview
  async function generatePreview() {
    if (!selectedFile) return;

    isUploading = true;
    errorMessage = '';

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('accountId', selectedAccountId);

      const response = await fetch('/api/import/preview', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Error al generar la previsualización');
      }

      previewData = result.data;
      currentStep = 'preview';

    } catch (error) {
      console.error('Preview error:', error);
      errorMessage = error.message || 'Error al procesar el archivo';
    } finally {
      isUploading = false;
    }
  }

  // Confirm import
  async function confirmImport(event) {
    const { transactions } = event.detail;

    isImporting = true;
    errorMessage = '';

    try {
      const response = await fetch('/api/import/confirm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          accountId: selectedAccountId,
          transactions: transactions.map(tx => ({
            id: tx.id,
            date: tx.date,
            description: tx.description,
            amount: tx.amount,
            paymentReference: tx.paymentReference,
            counterparty: tx.counterparty,
            categoryId: tx.categoryId,
            willBeHidden: tx.willBeHidden,
            originalData: tx.originalData
          }))
        })
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Error al importar las transacciones');
      }

      importResult = result.data;
      currentStep = 'complete';

    } catch (error) {
      console.error('Import error:', error);
      errorMessage = error.message || 'Error al importar las transacciones';
    } finally {
      isImporting = false;
    }
  }

  // Cancel preview and go back to upload
  function cancelPreview() {
    currentStep = 'upload';
    previewData = null;
    selectedFile = null;
    errorMessage = '';
  }

  // Start new import
  function startNewImport() {
    currentStep = 'upload';
    previewData = null;
    importResult = null;
    selectedFile = null;
    errorMessage = '';
  }

  // Go back to dashboard
  function handleGoBack() {
    goto('/dashboard');
  }

  // Format file size
  function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }
</script>

<svelte:head>
  <title>Importar Transacciones - Happy Balance</title>
  <meta name="description" content="Importa transacciones desde archivos CSV con previsualización" />
</svelte:head>

<!-- Header -->
<div class="glass-effect sticky top-0 z-10 border-b border-gray-200 bg-white/80 backdrop-blur">
  <div class="container mx-auto px-4 sm:px-6 lg:px-8">
    <div class="flex items-center justify-between py-4">
      <div class="flex items-center gap-4">
        <button
          class="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          onclick={handleGoBack}
          aria-label="Volver al dashboard"
        >
          <ArrowLeft class="w-5 h-5" />
        </button>
        <div>
          <h1 class="text-2xl font-bold text-gray-900">
            {currentStep === 'upload' ? 'Importar Transacciones' :
             currentStep === 'preview' ? 'Previsualización' :
             'Importación Completada'}
          </h1>
          <p class="text-gray-600">
            {currentStep === 'upload' ? 'Importa transacciones desde tu archivo CSV' :
             currentStep === 'preview' ? 'Revisa y edita antes de importar' :
             'Tus transacciones han sido importadas'}
          </p>
        </div>
      </div>

      <!-- Step indicator -->
      <div class="flex items-center space-x-4">
        <div class="flex items-center space-x-2">
          <div class="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium {currentStep === 'upload' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600'}">1</div>
          <span class="text-sm text-gray-600">Subir</span>
        </div>
        <div class="w-4 h-px bg-gray-300"></div>
        <div class="flex items-center space-x-2">
          <div class="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium {currentStep === 'preview' ? 'bg-blue-500 text-white' : currentStep === 'complete' ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'}">2</div>
          <span class="text-sm text-gray-600">Previsualizar</span>
        </div>
        <div class="w-4 h-px bg-gray-300"></div>
        <div class="flex items-center space-x-2">
          <div class="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium {currentStep === 'complete' ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'}">3</div>
          <span class="text-sm text-gray-600">Completar</span>
        </div>
      </div>
    </div>
  </div>
</div>

<div class="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
  {#if currentStep === 'upload'}
    <!-- Upload Step -->
    <div class="max-w-2xl mx-auto space-y-6">
      <!-- File Upload Area -->
      <div class="bg-white rounded-xl shadow-sm border-2 border-dashed border-gray-300 p-8 text-center hover:border-blue-400 transition-colors"
           ondragover={handleDragOver}
           ondrop={handleDrop}>

        {#if selectedFile}
          <!-- File Selected State -->
          <div class="space-y-4">
            <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <FileText class="w-8 h-8 text-green-600" />
            </div>
            <div>
              <h3 class="text-lg font-medium text-gray-900">{selectedFile.name}</h3>
              <p class="text-gray-500">{formatFileSize(selectedFile.size)}</p>
            </div>
            <button
              onclick={() => selectedFile = null}
              class="text-sm text-gray-500 hover:text-gray-700 underline"
            >
              Seleccionar otro archivo
            </button>
          </div>
        {:else}
          <!-- Upload State -->
          <div class="space-y-4">
            <div class="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
              <Upload class="w-8 h-8 text-blue-600" />
            </div>
            <div>
              <h3 class="text-lg font-medium text-gray-900">Arrastra tu archivo CSV aquí</h3>
              <p class="text-gray-500">o selecciónalo desde tu dispositivo</p>
            </div>
            <label class="inline-block">
              <input
                type="file"
                accept=".csv"
                onchange={handleFileSelect}
                class="hidden"
              />
              <span class="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors cursor-pointer">
                Seleccionar Archivo
              </span>
            </label>
          </div>
        {/if}
      </div>

      <!-- Error Message -->
      {#if errorMessage}
        <div class="flex items-center space-x-3 p-4 bg-red-50 border border-red-200 rounded-lg">
          <AlertTriangle class="w-5 h-5 text-red-600" />
          <p class="text-red-800">{errorMessage}</p>
        </div>
      {/if}

      <!-- File Info -->
      <div class="bg-gray-50 rounded-lg p-4">
        <h4 class="font-medium text-gray-900 mb-2">Formatos soportados:</h4>
        <ul class="text-sm text-gray-600 space-y-1">
          <li>• Archivos CSV con columnas estándar (Fecha, Descripción, Importe)</li>
          <li>• Formato N26 admitido</li>
          <li>• Tamaño máximo: 5MB</li>
          <li>• Codificación UTF-8 recomendada</li>
        </ul>
      </div>

      <!-- Action Button -->
      <div class="flex justify-center">
        <button
          onclick={generatePreview}
          disabled={!selectedFile || isUploading}
          class="px-8 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-3"
        >
          {#if isUploading}
            <div class="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            <span>Procesando...</span>
          {:else}
            <Eye class="w-5 h-5" />
            <span>Generar Previsualización</span>
          {/if}
        </button>
      </div>
    </div>

  {:else if currentStep === 'preview'}
    <!-- Preview Step -->
    <ImportPreview
      transactions={previewData.transactions}
      summary={previewData.summary}
      fileName={previewData.fileName}
      loading={isImporting}
      on:confirm={confirmImport}
      on:cancel={cancelPreview}
    />

    {#if errorMessage}
      <div class="mt-6 flex items-center space-x-3 p-4 bg-red-50 border border-red-200 rounded-lg">
        <AlertTriangle class="w-5 h-5 text-red-600" />
        <p class="text-red-800">{errorMessage}</p>
      </div>
    {/if}

  {:else if currentStep === 'complete'}
    <!-- Completion Step -->
    <div class="max-w-2xl mx-auto text-center space-y-6">
      <div class="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
        <CheckCircle class="w-10 h-10 text-green-600" />
      </div>

      <div>
        <h2 class="text-2xl font-bold text-gray-900 mb-2">¡Importación Completada!</h2>
        <p class="text-gray-600">Tus transacciones han sido importadas exitosamente</p>
      </div>

      {#if importResult}
        <div class="bg-green-50 border border-green-200 rounded-xl p-6">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div>
              <div class="text-3xl font-bold text-green-600">{importResult.imported}</div>
              <div class="text-sm text-gray-600">Transacciones Importadas</div>
            </div>
            {#if importResult.skipped > 0}
              <div>
                <div class="text-3xl font-bold text-yellow-600">{importResult.skipped}</div>
                <div class="text-sm text-gray-600">Omitidas (duplicados)</div>
              </div>
            {/if}
            {#if importResult.errors?.length > 0}
              <div>
                <div class="text-3xl font-bold text-red-600">{importResult.errors.length}</div>
                <div class="text-sm text-gray-600">Errores</div>
              </div>
            {/if}
          </div>
        </div>

        {#if importResult.errors?.length > 0}
          <div class="bg-red-50 border border-red-200 rounded-lg p-4">
            <h4 class="font-medium text-red-800 mb-2">Errores encontrados:</h4>
            <ul class="text-sm text-red-700 space-y-1">
              {#each importResult.errors as error}
                <li>• {error}</li>
              {/each}
            </ul>
          </div>
        {/if}

        {#if importResult.warnings?.length > 0}
          <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h4 class="font-medium text-yellow-800 mb-2">Advertencias:</h4>
            <ul class="text-sm text-yellow-700 space-y-1">
              {#each importResult.warnings as warning}
                <li>• {warning}</li>
              {/each}
            </ul>
          </div>
        {/if}
      {/if}

      <!-- Next Steps -->
      <div class="bg-gray-50 rounded-xl p-6">
        <h3 class="font-medium text-gray-900 mb-4">¿Qué sigue?</h3>
        <ul class="text-sm text-gray-600 space-y-2">
          <li>• Tus transacciones están ahora disponibles en el dashboard</li>
          <li>• Puedes categorizarlas manualmente o configurar reglas automáticas</li>
          <li>• Revisa y edita cualquier transacción según sea necesario</li>
        </ul>
      </div>

      <!-- Action Buttons -->
      <div class="flex flex-col sm:flex-row gap-4 justify-center">
        <button
          onclick={() => goto('/dashboard')}
          class="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          Ir al Dashboard
        </button>

        <button
          onclick={() => goto('/transactions')}
          class="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
        >
          Ver Transacciones
        </button>

        <button
          onclick={startNewImport}
          class="px-6 py-3 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
        >
          Nueva Importación
        </button>
      </div>
    </div>
  {/if}
</div>
