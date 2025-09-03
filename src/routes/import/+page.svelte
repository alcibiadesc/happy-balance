<script lang="ts">
  import { Upload, FileText, AlertCircle, CheckCircle, Download, RotateCw, ArrowLeft } from 'lucide-svelte';
  import { goto } from '$app/navigation';

  let files = $state<FileList | null>(null);
  let isDragOver = $state(false);
  let isUploading = $state(false);
  let uploadResult = $state<any>(null);
  let error = $state('');

  // Handle file input change
  function handleFileChange(event: Event) {
    const target = event.target as HTMLInputElement;
    files = target.files;
  }

  // Handle drag and drop
  function handleDragOver(event: DragEvent) {
    event.preventDefault();
    isDragOver = true;
  }

  function handleDragLeave(event: DragEvent) {
    event.preventDefault();
    isDragOver = false;
  }

  function handleDrop(event: DragEvent) {
    event.preventDefault();
    isDragOver = false;
    files = event.dataTransfer?.files || null;
  }

  // Upload file
  async function uploadFile() {
    if (!files || files.length === 0) {
      error = 'Por favor selecciona un archivo CSV';
      return;
    }

    const file = files[0];
    
    if (!file.name.toLowerCase().endsWith('.csv')) {
      error = 'Solo se permiten archivos CSV';
      return;
    }

    isUploading = true;
    error = '';
    uploadResult = null;

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/import', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();

      if (result.success) {
        uploadResult = result.data;
      } else {
        error = result.error || 'Error al procesar el archivo';
      }
    } catch (err) {
      console.error('Upload error:', err);
      error = 'Error de conexión al subir el archivo';
    } finally {
      isUploading = false;
    }
  }

  // Download sample CSV
  function downloadSample() {
    const sampleContent = `Booking Date	Value Date	Partner Name	Partner Iban	Type	Payment Reference	Account Name	Amount (EUR)	Original Amount	Original Currency	Exchange Rate
2024-08-01	2024-08-01	Mercadona	ES1234567890123456789012	Debit Transfer	Compra supermercado	Cuenta Principal	-45.67			
2024-08-01	2024-08-01	Empresa XYZ	ES2345678901234567890123	Credit Transfer	Nómina Agosto	Cuenta Principal	2500.00			
2024-08-02	2024-08-02	Netflix		Debit Transfer	Suscripción mensual	Cuenta Principal	-15.99			
2024-08-02	2024-08-02	Uber		Debit Transfer	Viaje al aeropuerto	Cuenta Principal	-23.45	-25.00	USD	0.9380`;

    const blob = new Blob([sampleContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', 'sample-n26.csv');
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  // Reset form
  function resetForm() {
    files = null;
    uploadResult = null;
    error = '';
    // Reset file input
    const fileInput = document.getElementById('file-input') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  }
</script>

<svelte:head>
  <title>Importar Transacciones - Expense Tracker</title>
</svelte:head>

<!-- Main Content -->
<div class="p-6">
  <!-- Page Header -->
  <div class="mb-8">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 mb-2">Importar Transacciones</h1>
        <p class="text-gray-600">Importa datos desde tu archivo CSV de N26</p>
      </div>
    </div>
  </div>

    {#if !uploadResult}
      <!-- Upload Form -->
      <div class="bg-white rounded-lg border border-gray-200 p-6 sm:p-8">
        <div class="text-center mb-8">
          <div class="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
            <Upload class="w-8 h-8 text-blue-600" />
          </div>
          <h2 class="text-xl font-semibold text-gray-900 mb-2">Sube tu archivo N26 CSV</h2>
          <p class="text-gray-600 max-w-md mx-auto">
            Importa todas tus transacciones de N26 de una vez. El archivo debe estar en formato CSV exportado desde tu cuenta N26.
          </p>
        </div>

        <!-- File Upload Area -->
        <div class="mb-6">
          <div
            class="border-2 border-dashed rounded-lg p-8 text-center transition-colors {isDragOver ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}"
            ondragover={handleDragOver}
            ondragleave={handleDragLeave}
            ondrop={handleDrop}
          >
            <input
              id="file-input"
              type="file"
              accept=".csv"
              onchange={handleFileChange}
              class="hidden"
            />
            
            <div class="w-12 h-12 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <FileText class="w-6 h-6 text-gray-400" />
            </div>
            
            {#if files && files.length > 0}
              <p class="text-sm font-medium text-gray-900 mb-2">{files[0].name}</p>
              <p class="text-xs text-gray-500 mb-4">
                {(files[0].size / 1024).toFixed(1)} KB
              </p>
            {:else}
              <p class="text-sm font-medium text-gray-900 mb-2">
                Arrastra tu archivo CSV aquí, o 
                <button
                  onclick={() => document.getElementById('file-input')?.click()}
                  class="text-blue-600 hover:text-blue-500"
                >
                  haz clic para seleccionar
                </button>
              </p>
              <p class="text-xs text-gray-500 mb-4">Archivos CSV hasta 5MB</p>
            {/if}

            {#if files && files.length > 0}
              <button
                onclick={() => document.getElementById('file-input')?.click()}
                class="text-sm text-gray-600 hover:text-gray-500"
              >
                Cambiar archivo
              </button>
            {/if}
          </div>
        </div>

        <!-- Error Message -->
        {#if error}
          <div class="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle class="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p class="text-sm text-red-700">{error}</p>
          </div>
        {/if}

        <!-- Actions -->
        <div class="flex flex-col sm:flex-row gap-4 justify-between items-center">
          <button
            onclick={downloadSample}
            class="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Download class="w-4 h-4" />
            Descargar Ejemplo
          </button>

          <button
            onclick={uploadFile}
            disabled={!files || files.length === 0 || isUploading}
            class="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {#if isUploading}
              <RotateCw class="w-4 h-4 animate-spin" />
              Procesando...
            {:else}
              <Upload class="w-4 h-4" />
              Importar Transacciones
            {/if}
          </button>
        </div>

        <!-- Format Info -->
        <div class="mt-8 p-4 bg-gray-50 rounded-lg">
          <h3 class="text-sm font-medium text-gray-900 mb-2">Formato Soportado</h3>
          <ul class="text-xs text-gray-600 space-y-1">
            <li>• Archivo CSV exportado desde N26</li>
            <li>• Columnas requeridas: Booking Date, Partner Name, Amount (EUR)</li>
            <li>• Separadores: Tab o coma</li>
            <li>• Codificación: UTF-8</li>
            <li>• Tamaño máximo: 5MB</li>
          </ul>
        </div>
      </div>
    {:else}
      <!-- Upload Results -->
      <div class="bg-white rounded-lg border border-gray-200 p-6 sm:p-8">
        <div class="text-center mb-8">
          <div class="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle class="w-8 h-8 text-green-600" />
          </div>
          <h2 class="text-xl font-semibold text-gray-900 mb-2">Importación Completada</h2>
          <p class="text-gray-600">
            Se han procesado {uploadResult.summary.totalRows} transacciones del archivo "{uploadResult.fileName}"
          </p>
        </div>

        <!-- Statistics -->
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div class="bg-green-50 p-4 rounded-lg text-center">
            <div class="text-2xl font-bold text-green-600">{uploadResult.summary.savedRows}</div>
            <div class="text-sm text-green-700">Importadas</div>
          </div>
          <div class="bg-yellow-50 p-4 rounded-lg text-center">
            <div class="text-2xl font-bold text-yellow-600">{uploadResult.summary.duplicateRows}</div>
            <div class="text-sm text-yellow-700">Duplicadas</div>
          </div>
          <div class="bg-red-50 p-4 rounded-lg text-center">
            <div class="text-2xl font-bold text-red-600">{uploadResult.summary.errorRows}</div>
            <div class="text-sm text-red-700">Con Errores</div>
          </div>
          <div class="bg-gray-50 p-4 rounded-lg text-center">
            <div class="text-2xl font-bold text-gray-600">{uploadResult.summary.skippedRows}</div>
            <div class="text-sm text-gray-700">Omitidas</div>
          </div>
        </div>

        <!-- Errors (if any) -->
        {#if uploadResult.errors && uploadResult.errors.length > 0}
          <div class="mb-8">
            <h3 class="text-lg font-medium text-gray-900 mb-4">Errores Encontrados</h3>
            <div class="bg-red-50 border border-red-200 rounded-lg p-4 max-h-60 overflow-y-auto">
              <ul class="space-y-2">
                {#each uploadResult.errors as error}
                  <li class="text-sm text-red-700 flex items-start gap-2">
                    <AlertCircle class="w-4 h-4 flex-shrink-0 mt-0.5" />
                    {error}
                  </li>
                {/each}
              </ul>
            </div>
          </div>
        {/if}

        <!-- Actions -->
        <div class="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onclick={() => goto('/transactions')}
            class="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Ver Transacciones
          </button>
          <button
            onclick={resetForm}
            class="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
          >
            Importar Otro Archivo
          </button>
        </div>
      </div>
    {/if}

    <!-- Help Section -->
    <div class="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
      <h3 class="text-lg font-medium text-blue-900 mb-3">¿Cómo exportar desde N26?</h3>
      <ol class="text-sm text-blue-800 space-y-2 list-decimal list-inside">
        <li>Abre la app de N26 o ve al sitio web</li>
        <li>Ve a tu historial de transacciones</li>
        <li>Busca la opción "Exportar" o "Descargar"</li>
        <li>Selecciona el formato CSV</li>
        <li>Elige el rango de fechas que deseas importar</li>
        <li>Descarga el archivo y súbelo aquí</li>
      </ol>
      <p class="text-xs text-blue-700 mt-4">
        <strong>Nota:</strong> Las transacciones duplicadas serán detectadas automáticamente y no se importarán nuevamente.
      </p>
    </div>
</div>