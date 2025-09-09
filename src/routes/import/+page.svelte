<script lang="ts">
  import { ImportWizard } from '$lib/ui/components/organisms/ImportWizard/index.js';
  import { goto } from '$app/navigation';
  import { CheckCircle, ArrowLeft } from 'lucide-svelte';

  let importComplete = $state(false);
  let importResult = $state<any>(null);

  function handleImportComplete(result: any) {
    importResult = result;
    importComplete = true;
  }

  function startNewImport() {
    importComplete = false;
    importResult = null;
  }
</script>

<svelte:head>
  <title>Importar Transacciones - Expense Tracker</title>
</svelte:head>

<!-- Header -->
<div class="glass-effect sticky top-0 z-10" style="border-color: var(--color-border-primary); background-color: var(--color-background-elevated);">
  <div class="container-editorial">
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between py-4 gap-4">
      <div>
        <h1 class="text-h3" style="color: var(--color-text-primary);">Importar Transacciones</h1>
        <p class="text-secondary mt-1">Importa datos desde tu archivo CSV de N26</p>
      </div>
    </div>
  </div>
</div>

<!-- Main Content -->
<div class="py-6" style="background-color: var(--color-background-primary);">
  {#if !importComplete}
    <!-- Import Wizard -->
    <ImportWizard onComplete={handleImportComplete} />
  {:else}
    <!-- Success Message -->
    <div class="max-w-4xl mx-auto px-6">
      <div class="card-editorial p-8 scale-in text-center">
        <div class="w-16 h-16 bg-sage-green/10 rounded-lg flex items-center justify-center mx-auto mb-6">
          <CheckCircle class="w-10 h-10 text-sage-green" />
        </div>
        
        <h2 class="text-h3 mb-4 text-primary">¡Importación Completada!</h2>
        <p class="text-body text-tertiary mb-8 max-w-md mx-auto">
          {importResult?.message || 'La importación se ha completado exitosamente'}
        </p>

        <!-- Import Summary -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div class="bg-sage-green/5 border border-sage-green/20 p-6 rounded-lg">
            <div class="text-mono text-3xl font-semibold text-sage-green mb-2">
              {importResult?.imported || 0}
            </div>
            <div class="text-caption text-tertiary">Transacciones Importadas</div>
          </div>
          
          {#if importResult?.skipped > 0}
            <div class="bg-amber/5 border border-amber/20 p-6 rounded-lg">
              <div class="text-mono text-3xl font-semibold text-amber mb-2">
                {importResult.skipped}
              </div>
              <div class="text-caption text-tertiary">Duplicadas (Omitidas)</div>
            </div>
          {/if}
          
          {#if importResult?.errors?.length > 0}
            <div class="bg-coral-red/5 border border-coral-red/20 p-6 rounded-lg">
              <div class="text-mono text-3xl font-semibold text-coral-red mb-2">
                {importResult.errors.length}
              </div>
              <div class="text-caption text-tertiary">Errores</div>
            </div>
          {/if}
        </div>

        <!-- Next Steps -->
        <div class="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-8">
          <h3 class="text-h4 text-primary mb-4">¿Qué sigue?</h3>
          <div class="text-body-small text-tertiary space-y-2">
            <p>• Tus transacciones están ahora disponibles en el dashboard</p>
            <p>• Puedes categorizarlas manualmente o configurar reglas automáticas</p>
            <p>• Revisa y edita cualquier transacción según sea necesario</p>
          </div>
        </div>
        
        <div class="flex justify-center gap-4">
          <button 
            class="btn-secondary" 
            onclick={() => goto('/transactions')}
          >
            Ver Transacciones
          </button>
          <button 
            class="btn-primary" 
            onclick={() => goto('/dashboard')}
          >
            Ir al Dashboard
          </button>
          <button 
            class="btn-ghost" 
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