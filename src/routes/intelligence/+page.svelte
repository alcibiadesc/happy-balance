<script lang="ts">
  import { onMount } from 'svelte';
  import { Plus, Edit, Trash2, Play, Brain, Target, ArrowRight, Check, X, AlertCircle, Eye, EyeOff, Tabs } from 'lucide-svelte';

  interface Category {
    id: string;
    name: string;
    color: string;
    type: string;
  }

  interface CategorizationRule {
    id: string;
    name: string;
    ruleType: string;
    pattern: any;
    priority: number;
    isActive: boolean;
    categoryId: string;
    category?: Category;
    createdAt: string;
    updatedAt: string;
  }

  interface HidingRule {
    id: string;
    name: string;
    ruleType: string;
    pattern: any;
    priority: number;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
  }

  interface CategorizationStatistics {
    totalTransactions: number;
    categorizedTransactions: number;
    uncategorizedTransactions: number;
    activeRules: number;
    categorizationRate: number;
  }

  interface HidingStatistics {
    totalTransactions: number;
    visibleTransactions: number;
    hiddenTransactions: number;
    activeRules: number;
    hidingRate: number;
  }

  let activeTab = $state<'categorization' | 'hiding'>('categorization');
  let categorizationRules: CategorizationRule[] = $state([]);
  let hidingRules: HidingRule[] = $state([]);
  let categories: Category[] = $state([]);
  let categorizationStatistics: CategorizationStatistics = $state({
    totalTransactions: 0,
    categorizedTransactions: 0,
    uncategorizedTransactions: 0,
    activeRules: 0,
    categorizationRate: 0
  });
  let hidingStatistics: HidingStatistics = $state({
    totalTransactions: 0,
    visibleTransactions: 0,
    hiddenTransactions: 0,
    activeRules: 0,
    hidingRate: 0
  });
  let loading = $state(true);
  let applyingRules = $state(false);
  
  // Form state
  let showForm = $state(false);
  let editingCategorizationRule: CategorizationRule | null = $state(null);
  let editingHidingRule: HidingRule | null = $state(null);
  let formData = $state({
    name: '',
    categoryId: '',
    ruleType: 'counterparty',
    pattern: { value: '' },
    priority: 1,
    isActive: true
  });

  const ruleTypes = [
    { value: 'counterparty', label: 'Contraparte', description: 'Coincidencia en la contraparte de la transacción' },
    { value: 'paymentReference', label: 'Referencia de Pago', description: 'Coincidencia en la referencia de pago' },
    { value: 'description', label: 'Descripción', description: 'Búsqueda en contraparte y referencia' },
    { value: 'keyword', label: 'Palabras Clave', description: 'Múltiples palabras clave' },
    { value: 'amount', label: 'Importe', description: 'Rango de importes' }
  ];

  onMount(async () => {
    await Promise.all([
      loadCategorizationRules(),
      loadHidingRules(),
      loadCategories(),
      loadCategorizationStatistics(),
      loadHidingStatistics()
    ]);
    
    // Check for URL parameters to pre-fill form
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      if (url.searchParams.get('prefill') === 'true') {
        const name = url.searchParams.get('name');
        const ruleType = url.searchParams.get('ruleType');
        const pattern = url.searchParams.get('pattern');
        
        if (name && ruleType && pattern) {
          try {
            formData = {
              name,
              categoryId: '',
              ruleType,
              pattern: JSON.parse(pattern),
              priority: 1,
              isActive: true
            };
            showForm = true;
            
            // Clear URL parameters
            url.searchParams.delete('prefill');
            url.searchParams.delete('name');
            url.searchParams.delete('ruleType');
            url.searchParams.delete('pattern');
            url.searchParams.delete('transactionId');
            window.history.replaceState({}, '', url.toString());
          } catch (error) {
            console.error('Error parsing pre-fill data:', error);
          }
        }
      }
    }
    
    loading = false;
  });

  async function loadCategorizationRules() {
    try {
      const response = await fetch('/api/intelligence/rules');
      const data = await response.json();
      if (data.success) {
        categorizationRules = data.rules;
      }
    } catch (error) {
      console.error('Error loading categorization rules:', error);
    }
  }

  async function loadHidingRules() {
    try {
      const response = await fetch('/api/intelligence/hiding-rules');
      const data = await response.json();
      if (data.success) {
        hidingRules = data.rules;
      }
    } catch (error) {
      console.error('Error loading hiding rules:', error);
    }
  }

  async function loadCategories() {
    try {
      const response = await fetch('/api/categories');
      const data = await response.json();
      if (data.success) {
        categories = data.data || data.categories || [];
      }
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  }

  async function loadCategorizationStatistics() {
    try {
      const response = await fetch('/api/intelligence/apply-rules');
      const data = await response.json();
      if (data.success) {
        categorizationStatistics = data.statistics;
      }
    } catch (error) {
      console.error('Error loading categorization statistics:', error);
    }
  }

  async function loadHidingStatistics() {
    try {
      const response = await fetch('/api/intelligence/apply-hiding');
      const data = await response.json();
      if (data.success) {
        hidingStatistics = data.statistics;
      }
    } catch (error) {
      console.error('Error loading hiding statistics:', error);
    }
  }

  async function applyRules() {
    if (applyingRules) return;
    
    applyingRules = true;
    try {
      const response = await fetch('/api/intelligence/apply-rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applyToAll: true })
      });
      
      const data = await response.json();
      if (data.success) {
        alert(`✅ Reglas aplicadas exitosamente!\n\nAplicadas a ${data.applied} de ${data.total} transacciones.`);
        await loadCategorizationStatistics();
      } else {
        alert(`❌ Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error applying rules:', error);
      alert('❌ Error aplicando reglas');
    } finally {
      applyingRules = false;
    }
  }

  function openCreateForm() {
    editingCategorizationRule = null;
    formData = {
      name: '',
      categoryId: '',
      ruleType: 'counterparty',
      pattern: { value: '' },
      priority: 1,
      isActive: true
    };
    showForm = true;
  }

  function openEditForm(rule: CategorizationRule) {
    editingCategorizationRule = rule;
    formData = {
      name: rule.name,
      categoryId: rule.categoryId,
      ruleType: rule.ruleType,
      pattern: rule.pattern,
      priority: rule.priority,
      isActive: rule.isActive
    };
    showForm = true;
  }

  function closeForm() {
    showForm = false;
    editingCategorizationRule = null;
    formData = {
      name: '',
      categoryId: '',
      ruleType: 'counterparty',
      pattern: { value: '' },
      priority: 1,
      isActive: true
    };
  }

  async function saveRule(event) {
		event.preventDefault();
    try {
      let payload = { ...formData };
      
      // Prepare pattern based on rule type
      if (formData.ruleType === 'keyword') {
        payload.pattern = {
          keywords: formData.pattern.keywords || []
        };
      } else if (formData.ruleType === 'amount') {
        payload.pattern = {
          minAmount: formData.pattern.minAmount,
          maxAmount: formData.pattern.maxAmount
        };
      } else {
        payload.pattern = {
          value: formData.pattern.value
        };
      }

      const url = '/api/intelligence/rules';
      const method = editingCategorizationRule ? 'PUT' : 'POST';
      
      if (editingCategorizationRule) {
        payload = { ...payload, id: editingCategorizationRule.id };
      }

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const data = await response.json();
      if (data.success) {
        alert(`✅ ${editingCategorizationRule ? 'Regla actualizada' : 'Regla creada'} exitosamente!`);
        await loadCategorizationRules();
        await loadCategorizationStatistics();
        closeForm();
      } else {
        alert(`❌ Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error saving rule:', error);
      alert('❌ Error guardando regla');
    }
  }

  async function deleteRule(ruleId: string) {
    if (!confirm('¿Estás seguro de que quieres eliminar esta regla?')) {
      return;
    }
    
    try {
      const response = await fetch('/api/intelligence/rules', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: ruleId })
      });
      
      const data = await response.json();
      if (data.success) {
        alert('✅ Regla eliminada exitosamente!');
        await loadCategorizationRules();
        await loadCategorizationStatistics();
      } else {
        alert(`❌ Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error deleting rule:', error);
      alert('❌ Error eliminando regla');
    }
  }

  async function toggleRuleStatus(rule: CategorizationRule) {
    try {
      const response = await fetch('/api/intelligence/rules', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          id: rule.id, 
          isActive: !rule.isActive 
        })
      });
      
      const data = await response.json();
      if (data.success) {
        await loadCategorizationRules();
        await loadCategorizationStatistics();
      } else {
        alert(`❌ Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error toggling rule status:', error);
      alert('❌ Error cambiando estado de regla');
    }
  }

  function getPatternDisplay(rule: CategorizationRule): string {
    switch (rule.ruleType) {
      case 'counterparty':
      case 'paymentReference':
      case 'description':
        return rule.pattern.value || '';
      case 'keyword':
        return rule.pattern.keywords?.join(', ') || '';
      case 'amount':
        const min = rule.pattern.minAmount ? `≥${rule.pattern.minAmount}€` : '';
        const max = rule.pattern.maxAmount ? `≤${rule.pattern.maxAmount}€` : '';
        return [min, max].filter(Boolean).join(' y ');
      default:
        return JSON.stringify(rule.pattern);
    }
  }

  function getRuleTypeLabel(ruleType: string): string {
    return ruleTypes.find(t => t.value === ruleType)?.label || ruleType;
  }
</script>

<svelte:head>
  <title>Inteligencia - Happy Balance</title>
</svelte:head>

<div class="min-h-screen bg-primary">
  <!-- Header -->
  <div class="glass-effect sticky top-0 z-10 border-b border-gray-200 bg-white/80 backdrop-blur">
    <div class="container mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex items-center justify-between py-4">
        <div class="flex items-center gap-3">
          <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-sm">
            <Brain class="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 class="text-2xl font-bold text-gray-900">Inteligencia de Categorización</h1>
            <p class="text-gray-600">Automatiza la categorización de transacciones con reglas inteligentes</p>
          </div>
        </div>
      </div>
    </div>
  </div>

  <div class="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
    {#if loading}
      <div class="flex justify-center py-12">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    {:else}
      <!-- Statistics Cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div class="card-editorial p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-secondary">Transacciones Totales</p>
              <p class="text-2xl font-bold text-primary">{categorizationStatistics.totalTransactions}</p>
            </div>
            <Target class="w-8 h-8 text-info" />
          </div>
        </div>
        
        <div class="card-editorial p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-secondary">Categorizadas</p>
              <p class="text-2xl font-bold status-success">{categorizationStatistics.categorizedTransactions}</p>
            </div>
            <Check class="w-8 h-8 status-success" />
          </div>
        </div>
        
        <div class="card-editorial p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-secondary">Sin Categorizar</p>
              <p class="text-2xl font-bold status-error">{categorizationStatistics.uncategorizedTransactions}</p>
            </div>
            <AlertCircle class="w-8 h-8 status-error" />
          </div>
        </div>
        
        <div class="card-editorial p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-secondary">Tasa de Categorización</p>
              <p class="text-2xl font-bold text-primary">{categorizationStatistics.categorizationRate}%</p>
            </div>
            <Brain class="w-8 h-8 status-info" />
          </div>
        </div>
      </div>

      <!-- Actions Bar -->
      <div class="card-editorial p-4 mb-6">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-4">
            <h2 class="text-xl font-semibold text-primary">Reglas de Categorización</h2>
            <span class="px-3 py-1 text-sm rounded-full {categorizationStatistics.activeRules > 0 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}">
              {categorizationStatistics.activeRules} reglas activas
            </span>
            {#if categorizationStatistics.uncategorizedTransactions > 0}
              <div class="flex items-center gap-2 text-sm px-3 py-1 rounded-full bg-red-100 text-red-800">
                <AlertCircle class="w-4 h-4" />
                {categorizationStatistics.uncategorizedTransactions} sin categorizar
              </div>
            {/if}
          </div>
          <div class="flex items-center gap-3">
            <button
              onclick={applyRules}
              disabled={applyingRules || categorizationStatistics.activeRules === 0}
              class="btn-secondary gap-2 disabled:opacity-50"
            >
              {#if applyingRules}
                <div class="w-4 h-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                Aplicando...
              {:else}
                <Play class="w-4 h-4" />
                Aplicar Reglas
              {/if}
            </button>
            <button
              onclick={openCreateForm}
              class="btn-primary gap-2"
            >
              <Plus class="w-4 h-4" />
              Nueva Regla
            </button>
          </div>
        </div>
      </div>

      <!-- Rules List -->
      <div class="space-y-4">
        {#each categorizationRules as rule (rule.id)}
          <div class="card-editorial p-6">
            <div class="flex items-start justify-between">
              <div class="flex-1">
                <div class="flex items-center gap-3 mb-2">
                  <h3 class="text-lg font-semibold text-primary">{rule.name}</h3>
                  <span class="px-2 py-1 text-xs font-medium rounded-full {rule.isActive ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}">
                    {rule.isActive ? 'Activa' : 'Inactiva'}
                  </span>
                  <span class="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                    {getRuleTypeLabel(rule.ruleType)}
                  </span>
                </div>
                
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <p class="text-sm font-medium mb-1 text-secondary">Categoría</p>
                    <div class="flex items-center gap-2">
                      <div class="w-3 h-3 rounded-full" style="background-color: {rule.category?.color || '#999'};"></div>
                      <span class="text-sm text-primary">{rule.category?.name || 'Sin categoría'}</span>
                    </div>
                  </div>
                  
                  <div>
                    <p class="text-sm font-medium mb-1 text-secondary">Patrón</p>
                    <p class="text-sm text-primary">{getPatternDisplay(rule)}</p>
                  </div>
                  
                  <div>
                    <p class="text-sm font-medium mb-1 text-secondary">Prioridad</p>
                    <p class="text-sm text-primary">{rule.priority}</p>
                  </div>
                </div>
              </div>
              
              <div class="flex items-center gap-2 ml-4">
                <button
                  onclick={() => toggleRuleStatus(rule)}
                  class="btn-ghost btn-sm"
                  title={rule.isActive ? 'Desactivar regla' : 'Activar regla'}
                >
                  {#if rule.isActive}
                    <X class="w-4 h-4" />
                  {:else}
                    <Check class="w-4 h-4" />
                  {/if}
                </button>
                <button
                  onclick={() => openEditForm(rule)}
                  class="btn-ghost btn-sm"
                  title="Editar regla"
                >
                  <Edit class="w-4 h-4" />
                </button>
                <button
                  onclick={() => deleteRule(rule.id)}
                  class="btn-ghost btn-sm text-red-600"
                  title="Eliminar regla"
                >
                  <Trash2 class="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        {/each}
        
        {#if categorizationRules.length === 0}
          <div class="card-editorial p-12 text-center">
            <Brain class="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 class="text-xl font-semibold mb-2 text-primary">No hay reglas configuradas</h3>
            <p class="mb-6 text-secondary">Crea tu primera regla para automatizar la categorización de transacciones</p>
            <button
              onclick={openCreateForm}
              class="btn-primary gap-2 mx-auto"
            >
              <Plus class="w-4 h-4" />
              Crear Primera Regla
            </button>
          </div>
        {/if}
      </div>
    {/if}
  </div>
</div>

<!-- Rule Form Modal -->
{#if showForm}
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
    <div class="card-editorial max-w-2xl w-full max-h-[90vh] overflow-y-auto">
      <div class="p-6 border-b border-gray-200">
        <h2 class="text-xl font-semibold text-primary">
          {editingCategorizationRule ? 'Editar Regla' : 'Nueva Regla de Categorización'}
        </h2>
      </div>
      
      <form class="p-6 space-y-6" onsubmit={saveRule}>
        <!-- Rule Name -->
        <div>
          <label class="block text-sm font-medium mb-2 text-primary">
            Nombre de la Regla
          </label>
          <input
            type="text"
            bind:value={formData.name}
            required
            placeholder="Ej: Supermercado Mercadona"
            class="input-editorial"
          />
        </div>

        <!-- Category -->
        <div>
          <label class="block text-sm font-medium mb-2 text-primary">
            Categoría de Destino
          </label>
          <select
            bind:value={formData.categoryId}
            required
            class="input-editorial"
          >
            <option value="">Selecciona una categoría</option>
            {#each categories as category}
              <option value={category.id}>{category.name}</option>
            {/each}
          </select>
        </div>

        <!-- Rule Type -->
        <div>
          <label class="block text-sm font-medium mb-2 text-primary">
            Tipo de Regla
          </label>
          <select
            bind:value={formData.ruleType}
            class="input-editorial"
          >
            {#each ruleTypes as ruleType}
              <option value={ruleType.value}>{ruleType.label} - {ruleType.description}</option>
            {/each}
          </select>
        </div>

        <!-- Pattern Configuration -->
        <div>
          <label class="block text-sm font-medium mb-2 text-primary">
            Configuración del Patrón
          </label>
          
          {#if formData.ruleType === 'keyword'}
            <div>
              <textarea
                bind:value={formData.pattern.keywords}
                placeholder="Escribe palabras clave separadas por comas (ej: mercadona, supermercado, alimentación)"
                class="input-editorial"
                rows="3"
                oninput={(e) => {
                  const target = e.target;
                  formData.pattern.keywords = target.value.split(',').map(k => k.trim()).filter(k => k);
                }}
              ></textarea>
            </div>
          {:else if formData.ruleType === 'amount'}
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-medium mb-1 text-secondary">
                  Importe Mínimo (€)
                </label>
                <input
                  type="number"
                  step="0.01"
                  bind:value={formData.pattern.minAmount}
                  placeholder="0.00"
                  class="input-editorial"
                />
              </div>
              <div>
                <label class="block text-xs font-medium mb-1 text-secondary">
                  Importe Máximo (€)
                </label>
                <input
                  type="number"
                  step="0.01"
                  bind:value={formData.pattern.maxAmount}
                  placeholder="999.99"
                  class="input-editorial"
                />
              </div>
            </div>
          {:else}
            <input
              type="text"
              bind:value={formData.pattern.value}
              required
              placeholder={
                formData.ruleType === 'counterparty' ? 'Ej: MERCADONA' :
                formData.ruleType === 'paymentReference' ? 'Ej: COMPRA TARJETA' :
                'Ej: texto a buscar'
              }
              class="input-editorial"
            />
          {/if}
        </div>

        <!-- Priority and Status -->
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium mb-2 text-primary">
              Prioridad (1-10)
            </label>
            <input
              type="number"
              min="1"
              max="10"
              bind:value={formData.priority}
              class="input-editorial"
            />
          </div>
          <div>
            <label class="block text-sm font-medium mb-2 text-primary">
              Estado
            </label>
            <select
              bind:value={formData.isActive}
              class="input-editorial"
            >
              <option value={true}>Activa</option>
              <option value={false}>Inactiva</option>
            </select>
          </div>
        </div>

        <!-- Form Actions -->
        <div class="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <button
            type="button"
            onclick={closeForm}
            class="btn-secondary"
          >
            Cancelar
          </button>
          <button
            type="submit"
            class="btn-primary gap-2"
          >
            <Check class="w-4 h-4" />
            {editingCategorizationRule ? 'Actualizar' : 'Crear'} Regla
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}
