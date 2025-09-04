<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { X, Check, Brain, AlertTriangle } from 'lucide-svelte';
  
  const dispatch = createEventDispatcher();
  
  let {
    transaction = null,
    showOptions = false
  } = $props();
  
  let omitAction = $state('single'); // 'single', 'similar_future', 'all_future'
  
  function handleOmitAction() {
    dispatch('omit', {
      transaction,
      action: omitAction
    });
    showOptions = false;
    omitAction = 'single'; // Reset
  }
  
  function showOmitOptions() {
    showOptions = true;
  }
  
  function cancelOmit() {
    showOptions = false;
    omitAction = 'single';
  }
</script>

{#if showOptions}
  <!-- Omit Options Modal -->
  <div class="absolute top-full left-0 mt-1 w-80 bg-white border border-orange-200 rounded-lg shadow-lg z-50 p-4">
    <div class="space-y-4">
      <!-- Header -->
      <div class="flex items-center gap-2 pb-2 border-b border-gray-200">
        <AlertTriangle class="w-5 h-5 text-orange-600" />
        <div class="flex-1">
          <h3 class="font-medium text-gray-900">Omitir Transacción</h3>
          <p class="text-xs text-gray-500">¿Cómo deseas aplicar esta acción?</p>
        </div>
      </div>
      
      <!-- Omit Action Options -->
      <div class="space-y-2">
        <label class="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer">
          <input 
            type="radio" 
            bind:group={omitAction} 
            value="single" 
            class="mt-0.5 text-orange-600 focus:ring-orange-500"
          />
          <div class="flex-1">
            <div class="text-sm font-medium text-gray-900">Solo esta transacción</div>
            <div class="text-xs text-gray-500">Omitir únicamente esta transacción</div>
          </div>
        </label>
        
        <label class="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer">
          <input 
            type="radio" 
            bind:group={omitAction} 
            value="similar_future" 
            class="mt-0.5 text-orange-600 focus:ring-orange-500"
          />
          <div class="flex-1">
            <div class="text-sm font-medium text-gray-900">Similares futuras</div>
            <div class="text-xs text-gray-500">Crear regla para omitir automáticamente transacciones similares</div>
          </div>
        </label>
        
        <label class="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer">
          <input 
            type="radio" 
            bind:group={omitAction} 
            value="all_future" 
            class="mt-0.5 text-orange-600 focus:ring-orange-500"
          />
          <div class="flex-1">
            <div class="text-sm font-medium text-gray-900">Todas las futuras de este comercio</div>
            <div class="text-xs text-gray-500">Omitir automáticamente todas las futuras transacciones de "{transaction?.partnerName || 'este comercio'}"</div>
          </div>
        </label>
      </div>
      
      <!-- Action Buttons -->
      <div class="flex items-center gap-2 pt-2 border-t border-gray-200">
        <button
          class="flex items-center gap-1 px-3 py-1.5 bg-orange-600 text-white text-sm rounded hover:bg-orange-700 transition-colors flex-1"
          onclick={handleOmitAction}
        >
          <X class="w-3 h-3" />
          Omitir
        </button>
        <button
          class="flex items-center gap-1 px-3 py-1.5 bg-gray-300 text-gray-700 text-sm rounded hover:bg-gray-400 transition-colors"
          onclick={cancelOmit}
        >
          Cancelar
        </button>
      </div>
    </div>
  </div>
{:else}
  <!-- Omit Button -->
  <div class="relative">
    <button
      onclick={showOmitOptions}
      class="p-2 text-orange-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
      title="Omitir transacción"
    >
      <X class="w-4 h-4" />
    </button>
  </div>
{/if}