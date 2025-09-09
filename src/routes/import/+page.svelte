<script lang="ts">
  import { ImportWizard } from '$lib/ui/components/organisms/ImportWizard/index.js';
  import { goto } from '$app/navigation';
  import { CheckCircle, ArrowLeft, Upload, FileText, AlertTriangle } from 'lucide-svelte';
  import { onMount } from 'svelte';

  // State management
  let importComplete = $state(false);
  let importResult = $state<any>(null);
  let mounted = $state(false);

  onMount(() => {
    mounted = true;
  });

  function handleImportComplete(result: any) {
    console.log('Import completed with result:', result);
    importResult = result;
    importComplete = true;
  }

  function startNewImport() {
    importComplete = false;
    importResult = null;
  }

  function handleGoBack() {
    goto('/dashboard');
  }
</script>

<svelte:head>
  <title>Importar Transacciones - Expense Tracker</title>
  <meta name="description" content="Importa transacciones desde archivos CSV de forma rápida y segura" />
</svelte:head>

<!-- Header -->
<div class="glass-effect sticky top-0 z-10 border-b" style="border-color: var(--color-border-primary); background-color: var(--color-background-elevated);">
  <div class="container mx-auto px-4 sm:px-6 lg:px-8">
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between py-4 gap-4">
      <div class="flex items-center gap-4">
        <button
          class="btn-ghost p-2"
          onclick={handleGoBack}
          aria-label="Volver al dashboard"
        >
          <ArrowLeft class="w-5 h-5" />
        </button>
        <div>
          <h1 class="text-2xl font-bold" style="color: var(--color-text-primary);">Importar Transacciones</h1>
          <p class="text-sm opacity-70 mt-1">Importa transacciones desde tu archivo CSV</p>
        </div>
      </div>

      {#if !importComplete}
        <div class="flex items-center gap-2 text-sm opacity-60">
          <Upload class="w-4 h-4" />
          <span>Formatos soportados: CSV</span>
        </div>
      {/if}
    </div>
  </div>
</div>

<!-- Main Content -->
<main class="min-h-screen py-8" style="background-color: var(--color-background-primary);">
  <div class="container mx-auto px-4 sm:px-6 lg:px-8">

    {#if !mounted}
      <!-- Loading state -->
      <div class="flex items-center justify-center py-12">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>

    {:else if !importComplete}
      <!-- Import Wizard -->
      <div class="max-w-4xl mx-auto">
        <!-- Progress Info -->
        <div class="mb-8 p-6 bg-blue-50 border border-blue-200 rounded-lg">
          <div class="flex items-start gap-3">
            <FileText class="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h3 class="font-semibold text-blue-900 mb-2">Información importante</h3>
              <ul class="text-sm text-blue-800 space-y-1">
                <li>• Asegúrate de que tu archivo CSV tenga columnas para fecha, cantidad y descripción</li>
                <li>• Se detectarán automáticamente formatos de N26 y CSVs genéricos</li>
                <li>• Las transacciones duplicadas serán omitidas automáticamente</li>
              </ul>
            </div>
          </div>
        </div>

        <ImportWizard onComplete={handleImportComplete} />
      </div>

    {:else}
      <!-- Success State -->
      <div class="max-w-4xl mx-auto">
        <div class="bg-white border border-gray-200 rounded-lg p-8 text-center shadow-sm">

          <!-- Success Icon -->
          <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle class="w-10 h-10 text-green-600" />
          </div>

          <!-- Success Message -->
          <h2 class="text-2xl font-bold text-gray-900 mb-4">¡Importación Completada!</h2>
          <p class="text-gray-600 mb-8 max-w-md mx-auto">
            {importResult?.message || 'La importación se ha completado exitosamente'}
          </p>

          <!-- Import Summary -->
          {#if importResult}
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">

              <!-- Imported Count -->
              <div class="bg-green-50 border border-green-200 p-6 rounded-lg">
                <div class="text-3xl font-bold text-green-600 mb-2">
                  {importResult.imported || importResult.data?.imported || 0}
                </div>
                <div class="text-sm text-green-700">Transacciones Importadas</div>
              </div>

              <!-- Skipped Count -->
              {#if (importResult.skipped || importResult.data?.skipped || 0) > 0}
                <div class="bg-yellow-50 border border-yellow-200 p-6 rounded-lg">
                  <div class="text-3xl font-bold text-yellow-600 mb-2">
                    {importResult.skipped || importResult.data?.skipped || 0}
                  </div>
                  <div class="text-sm text-yellow-700">Duplicadas (Omitidas)</div>
                </div>
              {/if}

              <!-- Errors Count -->
              {#if (importResult.errors?.length || importResult.data?.errors?.length || 0) > 0}
                <div class="bg-red-50 border border-red-200 p-6 rounded-lg">
                  <div class="text-3xl font-bold text-red-600 mb-2">
                    {importResult.errors?.length || importResult.data?.errors?.length || 0}
                  </div>
                  <div class="text-sm text-red-700">Errores</div>
                </div>
              {/if}

            </div>

            <!-- Error Details -->
            {#if importResult.errors?.length > 0 || importResult.data?.errors?.length > 0}
              <div class="bg-red-50 border border-red-200 rounded-lg p-4 mb-8 text-left">
                <div class="flex items-center gap-2 mb-3">
                  <AlertTriangle class="w-5 h-5 text-red-600" />
                  <h4 class="font-semibold text-red-900">Errores encontrados:</h4>
                </div>
                <div class="space-y-2 text-sm text-red-800">
                  {#each (importResult.errors || importResult.data?.errors || []) as error}
                    <div class="bg-white p-2 rounded border border-red-200">
                      {error.message || error}
                    </div>
                  {/each}
                </div>
              </div>
            {/if}
          {/if}

          <!-- Next Steps -->
          <div class="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-8 text-left">
            <h3 class="font-semibold text-gray-900 mb-4">¿Qué sigue?</h3>
            <div class="text-sm text-gray-700 space-y-2">
              <p>• Tus transacciones están ahora disponibles en el dashboard</p>
              <p>• Puedes categorizarlas manualmente o configurar reglas automáticas</p>
              <p>• Revisa y edita cualquier transacción según sea necesario</p>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="flex flex-col sm:flex-row justify-center gap-3">
            <button
              class="btn-primary px-6 py-3"
              onclick={() => goto('/dashboard')}
            >
              Ir al Dashboard
            </button>
            <button
              class="btn-secondary px-6 py-3"
              onclick={() => goto('/transactions')}
            >
              Ver Transacciones
            </button>
            <button
              class="btn-ghost px-6 py-3"
              onclick={startNewImport}
            >
              <ArrowLeft class="w-4 h-4 mr-2" />
              Nueva Importación
            </button>
          </div>
        </div>
      </div>
    {/if}
  </div>
</main>

<style>
  .btn-primary {
    @apply bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors;
  }

  .btn-secondary {
    @apply bg-gray-100 text-gray-900 font-medium rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors;
  }

  .btn-ghost {
    @apply text-gray-700 font-medium rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors;
  }

  .glass-effect {
    backdrop-filter: blur(8px);
    background-color: rgba(255, 255, 255, 0.95);
  }
</style>
