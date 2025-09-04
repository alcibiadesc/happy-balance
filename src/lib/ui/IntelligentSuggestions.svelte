<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import { Brain, Check, X, Lightbulb, Zap } from 'lucide-svelte';
  
  const dispatch = createEventDispatcher();
  
  let { transaction = null, isVisible = false } = $props();
  
  let suggestions = $state([]);
  let isLoading = $state(false);
  let smartActions = $state([]);
  
  // Simulated intelligent suggestions based on patterns
  const simulatedSuggestions = [
    {
      id: 'suggest-1',
      type: 'category',
      title: 'Sugerencia de categoría',
      description: 'Basado en transacciones similares anteriores',
      action: 'Categorizar como "Supermercado"',
      confidence: 85,
      reason: 'Has categorizado 3 transacciones de "MERCADONA" como Supermercado'
    },
    {
      id: 'suggest-2', 
      type: 'rule',
      title: 'Crear regla automática',
      description: 'Para evitar categorizar manualmente en el futuro',
      action: 'Todas las transacciones de MERCADONA → Supermercado',
      confidence: 92,
      reason: 'Patrón detectado en 5 transacciones recientes'
    },
    {
      id: 'suggest-3',
      type: 'bulk',
      title: 'Acción masiva inteligente',
      description: 'Aplicar a transacciones similares',
      action: 'Categorizar 12 transacciones similares sin categoría',
      confidence: 78,
      reason: 'Encontradas transacciones con patrones similares'
    }
  ];

  const smartActionsList = [
    {
      id: 'smart-1',
      icon: Brain,
      title: 'Aprender de esta acción',
      description: 'Crear regla para transacciones futuras similares',
      action: 'learn'
    },
    {
      id: 'smart-2', 
      icon: Zap,
      title: 'Aplicar a similares',
      description: 'Buscar y aplicar a transacciones parecidas',
      action: 'apply_similar'
    },
    {
      id: 'smart-3',
      icon: Lightbulb,
      title: 'Sugerir para futuras',
      description: 'Solo sugerir, no aplicar automáticamente',
      action: 'suggest_only'
    }
  ];
  
  function loadSuggestions() {
    if (!transaction) return;
    
    isLoading = true;
    // Simulate API call delay
    setTimeout(() => {
      suggestions = simulatedSuggestions;
      smartActions = smartActionsList;
      isLoading = false;
    }, 500);
  }
  
  function applySuggestion(suggestion: any) {
    dispatch('applySuggestion', {
      suggestion,
      transactionId: transaction?.id
    });
  }
  
  function dismissSuggestion(suggestionId: string) {
    suggestions = suggestions.filter(s => s.id !== suggestionId);
  }
  
  function executeSmartAction(action: string) {
    dispatch('smartAction', {
      action,
      transactionId: transaction?.id
    });
  }
  
  $effect(() => {
    if (isVisible && transaction) {
      loadSuggestions();
    }
  });
</script>

{#if isVisible}
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" 
       onclick={() => dispatch('close')}
       onkeydown={(e) => e.key === 'Escape' && dispatch('close')}
       role="button"
       aria-label="Close suggestions"
       tabindex="0">
    
    <div class="bg-white rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden"
         onclick={(e) => e.stopPropagation()}>
      
      <!-- Header -->
      <div class="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-purple-50">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <Brain class="w-6 h-6 text-indigo-600" />
            <div>
              <h3 class="text-lg font-semibold text-gray-900">Sugerencias Inteligentes</h3>
              <p class="text-sm text-gray-600">IA aprende de tus acciones</p>
            </div>
          </div>
          <button
            onclick={() => dispatch('close')}
            class="p-2 text-gray-400 hover:text-gray-600 hover:bg-white rounded-lg transition-colors"
          >
            <X class="w-5 h-5" />
          </button>
        </div>
      </div>
      
      <div class="p-6 overflow-y-auto max-h-[60vh]">
        {#if isLoading}
          <div class="flex items-center justify-center py-8">
            <div class="flex items-center gap-3 text-gray-600">
              <div class="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600"></div>
              <span>Analizando patrones...</span>
            </div>
          </div>
        {:else}
          <!-- Transaction Info -->
          {#if transaction}
            <div class="mb-6 p-4 bg-gray-50 rounded-lg">
              <div class="flex justify-between items-start">
                <div>
                  <h4 class="font-medium text-gray-900">{transaction.partnerName}</h4>
                  <p class="text-sm text-gray-600">{transaction.paymentReference || 'Sin referencia'}</p>
                </div>
                <span class="font-mono text-lg {transaction.amount > 0 ? 'text-green-600' : 'text-red-600'}">
                  {transaction.amount > 0 ? '+' : ''}{transaction.amount}€
                </span>
              </div>
            </div>
          {/if}
          
          <!-- Suggestions -->
          {#if suggestions.length > 0}
            <div class="space-y-4 mb-6">
              <h4 class="font-medium text-gray-900 flex items-center gap-2">
                <Lightbulb class="w-4 h-4 text-yellow-500" />
                Sugerencias Automáticas
              </h4>
              
              {#each suggestions as suggestion}
                <div class="border border-gray-200 rounded-lg p-4 hover:border-indigo-300 transition-colors">
                  <div class="flex justify-between items-start mb-2">
                    <div>
                      <h5 class="font-medium text-gray-900">{suggestion.title}</h5>
                      <p class="text-sm text-gray-600">{suggestion.description}</p>
                    </div>
                    <div class="flex items-center gap-1 text-xs">
                      <span class="px-2 py-1 bg-indigo-100 text-indigo-700 rounded">
                        {suggestion.confidence}% confianza
                      </span>
                    </div>
                  </div>
                  
                  <div class="mb-3">
                    <p class="text-sm font-medium text-indigo-600">{suggestion.action}</p>
                    <p class="text-xs text-gray-500 mt-1">{suggestion.reason}</p>
                  </div>
                  
                  <div class="flex gap-2">
                    <button
                      onclick={() => applySuggestion(suggestion)}
                      class="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-700 transition-colors"
                    >
                      <Check class="w-3 h-3" />
                      Aplicar
                    </button>
                    <button
                      onclick={() => dismissSuggestion(suggestion.id)}
                      class="flex items-center gap-1 px-3 py-1.5 bg-gray-200 text-gray-700 text-sm rounded hover:bg-gray-300 transition-colors"
                    >
                      <X class="w-3 h-3" />
                      Descartar
                    </button>
                  </div>
                </div>
              {/each}
            </div>
          {/if}
          
          <!-- Smart Actions -->
          {#if smartActions.length > 0}
            <div class="space-y-4">
              <h4 class="font-medium text-gray-900 flex items-center gap-2">
                <Brain class="w-4 h-4 text-purple-500" />
                Acciones Inteligentes
              </h4>
              
              <div class="grid grid-cols-1 gap-3">
                {#each smartActions as action}
                  <button
                    onclick={() => executeSmartAction(action.action)}
                    class="flex items-start gap-3 p-4 border border-gray-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-colors text-left"
                  >
                    <svelte:component this={action.icon} class="w-5 h-5 text-purple-600 mt-0.5" />
                    <div>
                      <h5 class="font-medium text-gray-900">{action.title}</h5>
                      <p class="text-sm text-gray-600">{action.description}</p>
                    </div>
                  </button>
                {/each}
              </div>
            </div>
          {/if}
          
          {#if suggestions.length === 0 && smartActions.length === 0}
            <div class="text-center py-8">
              <Brain class="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <h4 class="font-medium text-gray-900 mb-2">Sin sugerencias disponibles</h4>
              <p class="text-sm text-gray-600">
                La IA aprenderá de tus acciones para ofrecerte mejores sugerencias en el futuro.
              </p>
            </div>
          {/if}
        {/if}
      </div>
    </div>
  </div>
{/if}