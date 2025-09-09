<script lang="ts">
  import { Upload, FileText, CheckCircle, AlertCircle } from 'lucide-svelte';
  import { CurrencyDisplay } from '$lib/ui/components/molecules/CurrencyDisplay/index.js';

  interface Props {
    onComplete?: (result: any) => void;
  }

  let { onComplete }: Props = $props();
  
  // State
  let currentStep = $state(1);
  let selectedFile: File | null = $state(null);
  let isLoading = $state(false);
  let error = $state('');

  const MAIN_ACCOUNT_ID = 'a524e6f2-647f-498f-beda-e710ff2a9423';

  function handleFileSelect(event: Event) {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    
    if (!file) return;
    
    error = '';
    
    if (!file.name.toLowerCase().endsWith('.csv')) {
      error = 'Por favor selecciona un archivo CSV válido';
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
      error = 'El archivo es demasiado grande. Máximo 5MB';
      return;
    }
    
    selectedFile = file;
  }

  async function processFile() {
    if (!selectedFile) return;
    
    isLoading = true;
    error = '';
    
    try {
      // Simple validation - just go to next step
      currentStep = 2;
    } catch (err) {
      error = 'Error al procesar el archivo';
    } finally {
      isLoading = false;
    }
  }

  async function confirmImport() {
    if (!selectedFile) return;

    isLoading = true;
    error = '';

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('accountId', MAIN_ACCOUNT_ID);
      formData.append('overwriteExisting', 'false');

      const response = await fetch('/api/transactions/import', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error(`Error del servidor: ${response.status}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Error en la importación');
      }

      if (onComplete) {
        onComplete(result.data);
      }

      currentStep = 3;
    } catch (err) {
      error = err instanceof Error ? err.message : 'Error de red';
    } finally {
      isLoading = false;
    }
  }

  function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
</script>

<div class="max-w-2xl mx-auto p-6">
  <!-- Progress -->
  <div class="mb-8">
    <div class="flex items-center justify-between">
      <div class="flex flex-col items-center">
        <div class={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${currentStep >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
          1
        </div>
        <div class="mt-2 text-xs text-center">Subir</div>
      </div>
      <div class={`flex-1 h-0.5 mx-4 ${currentStep > 1 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
      <div class="flex flex-col items-center">
        <div class={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${currentStep >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
          2
        </div>
        <div class="mt-2 text-xs text-center">Confirmar</div>
      </div>
      <div class={`flex-1 h-0.5 mx-4 ${currentStep > 2 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
      <div class="flex flex-col items-center">
        <div class={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${currentStep >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
          3
        </div>
        <div class="mt-2 text-xs text-center">Listo</div>
      </div>
    </div>
  </div>

  <!-- Content -->
  <div class="bg-white rounded-lg border p-6">
    {#if currentStep === 1}
      <!-- Step 1: Upload -->
      <div class="text-center">
        <Upload class="w-12 h-12 mx-auto text-blue-600 mb-4" />
        <h2 class="text-xl font-bold mb-2">Subir archivo CSV</h2>
        <p class="text-gray-600 mb-6">Selecciona tu archivo de transacciones</p>

        <div class="border-2 border-dashed border-gray-300 rounded-lg p-8 mb-4">
          <input
            type="file"
            accept=".csv"
            class="hidden"
            id="file-upload"
            onchange={handleFileSelect}
          />
          <label for="file-upload" class="cursor-pointer">
            <Upload class="w-8 h-8 mx-auto text-gray-400 mb-2" />
            <p class="text-gray-600">Haz clic para seleccionar archivo</p>
          </label>
        </div>

        {#if selectedFile}
          <div class="bg-green-50 border border-green-200 rounded p-4 mb-4">
            <div class="flex items-center gap-3">
              <FileText class="w-5 h-5 text-green-600" />
              <div class="flex-1 text-left">
                <div class="font-medium">{selectedFile.name}</div>
                <div class="text-sm text-gray-500">{formatFileSize(selectedFile.size)}</div>
              </div>
              <CheckCircle class="w-5 h-5 text-green-600" />
            </div>
          </div>
        {/if}

        {#if error}
          <div class="bg-red-50 border border-red-200 rounded p-4 mb-4">
            <div class="flex items-center gap-3">
              <AlertCircle class="w-5 h-5 text-red-600" />
              <div class="text-red-700 text-sm">{error}</div>
            </div>
          </div>
        {/if}

        <button
          class="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          onclick={processFile}
          disabled={!selectedFile || isLoading}
        >
          {isLoading ? 'Procesando...' : 'Continuar'}
        </button>
      </div>

    {:else if currentStep === 2}
      <!-- Step 2: Confirm -->
      <div class="text-center">
        <AlertCircle class="w-12 h-12 mx-auto text-yellow-600 mb-4" />
        <h2 class="text-xl font-bold mb-2">Confirmar importación</h2>
        <p class="text-gray-600 mb-6">
          Se importará el archivo: <strong>{selectedFile?.name}</strong>
        </p>

        <div class="bg-blue-50 border border-blue-200 rounded p-4 mb-6">
          <p class="text-blue-800 text-sm">
            Las transacciones se agregarán a tu cuenta principal.
          </p>
        </div>

        {#if error}
          <div class="bg-red-50 border border-red-200 rounded p-4 mb-4">
            <div class="flex items-center gap-3">
              <AlertCircle class="w-5 h-5 text-red-600" />
              <div class="text-red-700 text-sm">{error}</div>
            </div>
          </div>
        {/if}

        <div class="flex gap-4 justify-center">
          <button
            class="bg-gray-100 text-gray-900 px-6 py-2 rounded hover:bg-gray-200"
            onclick={() => currentStep = 1}
          >
            Atrás
          </button>
          <button
            class="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
            onclick={confirmImport}
            disabled={isLoading}
          >
            {isLoading ? 'Importando...' : 'Confirmar Importación'}
          </button>
        </div>
      </div>

    {:else if currentStep === 3}
      <!-- Step 3: Success -->
      <div class="text-center">
        <CheckCircle class="w-12 h-12 mx-auto text-green-600 mb-4" />
        <h2 class="text-xl font-bold mb-2">¡Importación completada!</h2>
        <p class="text-gray-600 mb-6">
          Tu archivo se ha importado exitosamente.
        </p>

        <div class="flex gap-4 justify-center">
          <button
            class="bg-gray-100 text-gray-900 px-6 py-2 rounded hover:bg-gray-200"
            onclick={() => { currentStep = 1; selectedFile = null; error = ''; }}
          >
            Nueva Importación
          </button>
          <button
            class="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
            onclick={() => window.location.href = '/dashboard'}
          >
            Ir al Dashboard
          </button>
        </div>
      </div>
    {/if}
  </div>
</div>