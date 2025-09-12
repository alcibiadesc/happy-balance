<script lang="ts">
  import { onMount } from 'svelte';
  import { Settings, Trash2, AlertTriangle, Shield, Database, Download, Upload, X, Check } from 'lucide-svelte';
  import { notifications } from '$lib/shared/stores/notifications.js';

  let isLoading = $state(false);
  let showDeleteConfirmation = $state(false);
  let deleteConfirmationInput = $state('');
  let deleteStep = $state(1); // 1: Warning, 2: Type confirmation, 3: Final confirmation
  let stats = $state({
    transactions: 0,
    categories: 0,
    budgets: 0,
    totalSize: '0 MB'
  });

  onMount(() => {
    loadStats();
  });

  async function loadStats() {
    try {
      // Get basic stats about data size
      const [transactionsRes, categoriesRes, budgetsRes] = await Promise.all([
        fetch('/api/transactions?limit=1'),
        fetch('/api/categories'),
        fetch('/api/budgets')
      ]);

      if (transactionsRes.ok) {
        const transactionsData = await transactionsRes.json();
        stats.transactions = transactionsData.total || 0;
      }

      if (categoriesRes.ok) {
        const categoriesData = await categoriesRes.json();
        stats.categories = categoriesData.data?.length || 0;
      }

      if (budgetsRes.ok) {
        const budgetsData = await budgetsRes.json();
        stats.budgets = budgetsData.data?.length || 0;
      }

      // Estimate total size (rough calculation)
      const estimatedSize = (stats.transactions * 0.5) + (stats.categories * 0.1) + (stats.budgets * 0.1);
      stats.totalSize = estimatedSize > 1 ? `${estimatedSize.toFixed(1)} MB` : `${(estimatedSize * 1000).toFixed(0)} KB`;
      
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  }

  function startDeleteConfirmation() {
    showDeleteConfirmation = true;
    deleteStep = 1;
    deleteConfirmationInput = '';
  }

  function nextDeleteStep() {
    if (deleteStep === 1) {
      deleteStep = 2;
    } else if (deleteStep === 2 && deleteConfirmationInput.toLowerCase() === 'delete') {
      deleteStep = 3;
    }
  }

  function cancelDeleteConfirmation() {
    showDeleteConfirmation = false;
    deleteStep = 1;
    deleteConfirmationInput = '';
  }

  async function executeDeleteAllData() {
    if (deleteConfirmationInput.toLowerCase() !== 'delete' || deleteStep !== 3) {
      notifications.add({
        type: 'error',
        message: 'Confirmación incorrecta',
        timeout: 3000
      });
      return;
    }

    try {
      isLoading = true;
      
      const response = await fetch('/api/settings/delete-all-data', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          confirmation: deleteConfirmationInput.toLowerCase()
        })
      });

      if (response.ok) {
        const result = await response.json();
        
        if (result.success) {
          notifications.add({
            type: 'success',
            message: 'Todos los datos han sido eliminados exitosamente',
            timeout: 5000
          });
          
          // Reset stats
          stats = {
            transactions: 0,
            categories: 0,
            budgets: 0,
            totalSize: '0 KB'
          };
          
          cancelDeleteConfirmation();
        } else {
          throw new Error(result.error || 'Error desconocido');
        }
      } else {
        throw new Error('Error del servidor');
      }
    } catch (error) {
      console.error('Error deleting data:', error);
      notifications.add({
        type: 'error',
        message: `Error al eliminar los datos: ${error.message}`,
        timeout: 5000
      });
    } finally {
      isLoading = false;
    }
  }

  async function exportData() {
    try {
      isLoading = true;
      
      const response = await fetch('/api/settings/export-data');
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `expense-tracker-backup-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        notifications.add({
          type: 'success',
          message: 'Datos exportados exitosamente',
          timeout: 3000
        });
      } else {
        throw new Error('Error del servidor');
      }
    } catch (error) {
      console.error('Error exporting data:', error);
      notifications.add({
        type: 'error',
        message: 'Error al exportar los datos',
        timeout: 3000
      });
    } finally {
      isLoading = false;
    }
  }

  // Computed values for confirmation validation
  const isDeleteInputValid = $derived(deleteConfirmationInput.toLowerCase() === 'delete');
  const canProceedToNextStep = $derived(
    deleteStep === 1 || 
    (deleteStep === 2 && isDeleteInputValid) ||
    (deleteStep === 3 && isDeleteInputValid)
  );
</script>

<svelte:head>
  <title>Configuración - Happy Balance</title>
</svelte:head>

<div class="min-h-screen" style="background-color: var(--color-background-primary);">
  <!-- Header -->
  <div class="glass-effect sticky top-0 z-10" style="border-color: var(--color-border-primary); background-color: var(--color-background-elevated);">
    <div class="container-editorial">
      <div class="flex items-center gap-3 py-4">
        <div class="w-10 h-10 rounded-lg flex items-center justify-center" style="background-color: var(--color-background-secondary);">
          <Settings class="w-5 h-5 text-secondary" />
        </div>
        <div>
          <h1 class="text-h3" style="color: var(--color-text-primary);">Configuración</h1>
          <p class="text-secondary mt-1">Administra tu aplicación y datos</p>
        </div>
      </div>
    </div>
  </div>

  <div class="container-editorial py-6 space-y-8">
    <!-- Data Overview -->
    <section>
      <h2 class="text-h4 mb-4 flex items-center gap-2">
        <Database class="w-5 h-5 text-indigo-600" />
        Resumen de Datos
      </h2>
      
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="card-editorial p-4">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <span class="text-sm font-semibold text-green-600">{stats.transactions}</span>
            </div>
            <div>
              <h3 class="text-sm font-medium text-primary">Transacciones</h3>
              <p class="text-xs text-tertiary">Registros financieros</p>
            </div>
          </div>
        </div>

        <div class="card-editorial p-4">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <span class="text-sm font-semibold text-blue-600">{stats.categories}</span>
            </div>
            <div>
              <h3 class="text-sm font-medium text-primary">Categorías</h3>
              <p class="text-xs text-tertiary">Clasificaciones</p>
            </div>
          </div>
        </div>

        <div class="card-editorial p-4">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <span class="text-sm font-semibold text-purple-600">{stats.budgets}</span>
            </div>
            <div>
              <h3 class="text-sm font-medium text-primary">Presupuestos</h3>
              <p class="text-xs text-tertiary">Límites de gasto</p>
            </div>
          </div>
        </div>

        <div class="card-editorial p-4">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-lg flex items-center justify-center" style="background-color: var(--color-background-secondary);">
              <Database class="w-4 h-4 text-secondary" />
            </div>
            <div>
              <h3 class="text-sm font-medium text-primary">Tamaño Total</h3>
              <p class="text-xs text-tertiary">{stats.totalSize}</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Data Management -->
    <section>
      <h2 class="text-h4 mb-4 flex items-center gap-2">
        <Shield class="w-5 h-5 text-blue-600" />
        Gestión de Datos
      </h2>
      
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Export Data -->
        <div class="card-editorial p-6">
          <div class="flex items-start gap-4">
            <div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Download class="w-6 h-6 text-green-600" />
            </div>
            <div class="flex-1">
              <h3 class="text-h5 mb-2">Exportar Datos</h3>
              <p class="text-caption mb-4">
                Descarga una copia de seguridad de todos tus datos en formato JSON. 
                Incluye transacciones, categorías, presupuestos y configuraciones.
              </p>
              <button
                onclick={exportData}
                disabled={isLoading}
                class="btn-editorial btn-primary flex items-center gap-2"
              >
                <Download class="w-4 h-4" />
                {isLoading ? 'Exportando...' : 'Exportar Datos'}
              </button>
            </div>
          </div>
        </div>

        <!-- Import Data -->
        <div class="card-editorial p-6 border-2 border-dashed border-gray-300">
          <div class="flex items-start gap-4">
            <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Upload class="w-6 h-6 text-blue-600" />
            </div>
            <div class="flex-1">
              <h3 class="text-h5 mb-2">Importar Datos</h3>
              <p class="text-caption mb-4">
                Próximamente: Restaura datos desde un archivo de respaldo JSON.
                Esta función estará disponible en una próxima actualización.
              </p>
              <button
                disabled
                class="btn-editorial btn-secondary opacity-50 cursor-not-allowed"
              >
                Próximamente
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Danger Zone -->
    <section>
      <div class="border-2 border-red-200 rounded-lg bg-red-50">
        <div class="p-6">
          <h2 class="text-h4 mb-4 flex items-center gap-2 text-red-700">
            <AlertTriangle class="w-5 h-5" />
            Zona de Peligro
          </h2>
          
          <div class="space-y-4">
            <div class="bg-white border border-red-200 rounded-lg p-4">
              <div class="flex items-start gap-4">
                <div class="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Trash2 class="w-6 h-6 text-red-600" />
                </div>
                <div class="flex-1">
                  <h3 class="text-h5 mb-2 text-red-700">Eliminar Todos los Datos</h3>
                  <p class="text-caption mb-4 text-red-600">
                    <strong>⚠️ ACCIÓN IRREVERSIBLE:</strong> Esto eliminará permanentemente todas tus transacciones, 
                    categorías, presupuestos y configuraciones. No hay forma de deshacer esta acción.
                  </p>
                  
                  <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4 text-xs">
                    <div class="bg-red-50 p-2 rounded border border-red-200">
                      <strong>{stats.transactions}</strong> transacciones se eliminarán
                    </div>
                    <div class="bg-red-50 p-2 rounded border border-red-200">
                      <strong>{stats.categories}</strong> categorías se eliminarán
                    </div>
                    <div class="bg-red-50 p-2 rounded border border-red-200">
                      <strong>{stats.budgets}</strong> presupuestos se eliminarán
                    </div>
                  </div>
                  
                  <button
                    onclick={startDeleteConfirmation}
                    disabled={isLoading}
                    class="btn-editorial bg-red-600 hover:bg-red-700 text-white border-red-600 hover:border-red-700 flex items-center gap-2"
                  >
                    <Trash2 class="w-4 h-4" />
                    Eliminar Todos los Datos
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>

  <!-- Delete Confirmation Modal -->
  {#if showDeleteConfirmation}
    <div class="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
      <div class="bg-white rounded-lg p-6 w-full max-w-md">
        <!-- Step 1: Warning -->
        {#if deleteStep === 1}
          <div class="text-center mb-6">
            <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle class="w-8 h-8 text-red-600" />
            </div>
            <h3 class="text-h4 mb-2 text-red-700">⚠️ Confirmación Requerida</h3>
            <p class="text-sm text-secondary">
              Estás a punto de eliminar <strong>TODOS</strong> tus datos financieros de forma permanente.
            </p>
          </div>

          <div class="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <h4 class="font-medium text-red-800 mb-2">Datos que se eliminarán:</h4>
            <ul class="text-sm text-red-700 space-y-1">
              <li>• {stats.transactions} transacciones</li>
              <li>• {stats.categories} categorías</li>
              <li>• {stats.budgets} presupuestos</li>
              <li>• Todas las configuraciones</li>
            </ul>
          </div>

          <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <p class="text-sm text-yellow-800">
              <strong>💡 Recomendación:</strong> Exporta una copia de seguridad antes de continuar.
            </p>
          </div>

          <div class="flex gap-3">
            <button
              onclick={cancelDeleteConfirmation}
              class="btn-editorial btn-secondary flex-1"
            >
              Cancelar
            </button>
            <button
              onclick={nextDeleteStep}
              class="btn-editorial bg-red-600 hover:bg-red-700 text-white border-red-600 hover:border-red-700 flex-1"
            >
              Continuar
            </button>
          </div>
        {/if}

        <!-- Step 2: Type Confirmation -->
        {#if deleteStep === 2}
          <div class="text-center mb-6">
            <div class="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield class="w-8 h-8 text-orange-600" />
            </div>
            <h3 class="text-h4 mb-2 text-orange-700">Confirmación de Seguridad</h3>
            <p class="text-sm text-secondary">
              Para continuar, escribe exactamente la palabra <code class="px-2 py-1 rounded text-red-600" style="background-color: var(--color-background-secondary);">delete</code>
            </p>
          </div>

          <div class="mb-6">
            <label for="delete-confirmation" class="block text-sm font-medium text-gray-700 mb-2">
              Escribir "delete" para confirmar:
            </label>
            <input
              id="delete-confirmation"
              type="text"
              class="input-editorial w-full {isDeleteInputValid ? 'border-green-400 focus:border-green-500' : 'border-red-400 focus:border-red-500'}"
              placeholder="delete"
              bind:value={deleteConfirmationInput}
              autocomplete="off"
            />
            {#if deleteConfirmationInput && !isDeleteInputValid}
              <p class="text-xs text-red-600 mt-1">Debe escribir exactamente "delete"</p>
            {/if}
          </div>

          <div class="flex gap-3">
            <button
              onclick={cancelDeleteConfirmation}
              class="btn-editorial btn-secondary flex-1"
            >
              Cancelar
            </button>
            <button
              onclick={nextDeleteStep}
              disabled={!canProceedToNextStep}
              class="btn-editorial bg-orange-600 hover:bg-orange-700 text-white border-orange-600 hover:border-orange-700 flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Siguiente
            </button>
          </div>
        {/if}

        <!-- Step 3: Final Confirmation -->
        {#if deleteStep === 3}
          <div class="text-center mb-6">
            <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 class="w-8 h-8 text-red-600" />
            </div>
            <h3 class="text-h4 mb-2 text-red-700">🚨 Última Oportunidad</h3>
            <p class="text-sm text-secondary">
              Esta acción es <strong>IRREVERSIBLE</strong>. ¿Estás completamente seguro?
            </p>
          </div>

          <div class="bg-red-100 border-2 border-red-300 rounded-lg p-4 mb-6">
            <p class="text-sm text-red-800 font-medium text-center">
              Se eliminarán {stats.transactions + stats.categories + stats.budgets} elementos de forma permanente
            </p>
          </div>

          <div class="flex gap-3">
            <button
              onclick={cancelDeleteConfirmation}
              class="btn-editorial bg-green-600 hover:bg-green-700 text-white border-green-600 hover:border-green-700 flex-1"
            >
              <X class="w-4 h-4 mr-2" />
              Cancelar
            </button>
            <button
              onclick={executeDeleteAllData}
              disabled={isLoading}
              class="btn-editorial bg-red-600 hover:bg-red-700 text-white border-red-600 hover:border-red-700 flex-1"
            >
              {#if isLoading}
                <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Eliminando...
              {:else}
                <Trash2 class="w-4 h-4 mr-2" />
                SÍ, Eliminar Todo
              {/if}
            </button>
          </div>
        {/if}
      </div>
    </div>
  {/if}
</div>