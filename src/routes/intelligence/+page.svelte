<script lang="ts">
  import { onMount } from 'svelte';
  import { Plus, Edit, Trash2, Play, Brain, Target, ArrowRight, Check, X, AlertCircle, Eye, EyeOff, Tabs } from 'lucide-svelte';
  import { Button } from '$lib/ui/components/atoms/Button/index.js';
  import LoadingSpinner from '$lib/ui/components/atoms/LoadingSpinner/LoadingSpinner.svelte';
  import StatusBadge from '$lib/ui/components/atoms/StatusBadge/StatusBadge.svelte';

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
        categories = data.categories;
      }
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  }

  async function loadStatistics() {
    try {
      const response = await fetch('/api/intelligence/apply-rules');
      const data = await response.json();
      if (data.success) {
        statistics = data.statistics;
      }
    } catch (error) {
      console.error('Error loading statistics:', error);
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
        await loadStatistics();
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
    editingRule = null;
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
    editingRule = rule;
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
    editingRule = null;
    formData = {
      name: '',
      categoryId: '',
      ruleType: 'counterparty',
      pattern: { value: '' },
      priority: 1,
      isActive: true
    };
  }

  async function saveRule() {
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

      const url = editingRule ? '/api/intelligence/rules' : '/api/intelligence/rules';
      const method = editingRule ? 'PUT' : 'POST';
      
      if (editingRule) {
        payload = { ...payload, id: editingRule.id };
      }

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const data = await response.json();
      if (data.success) {
        alert(`✅ ${editingRule ? 'Regla actualizada' : 'Regla creada'} exitosamente!`);
        await loadRules();
        await loadStatistics();
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
        await loadRules();
        await loadStatistics();
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
        await loadRules();
        await loadStatistics();
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

<div class="max-w-7xl mx-auto p-6">
  <!-- Header -->
  <div class="mb-8">
    <div class="flex items-center gap-3 mb-4">
      <div class="w-12 h-12 rounded-xl flex items-center justify-center" style="background: linear-gradient(135deg, var(--color-dusty-pink), var(--color-coral-pastel));">
        <Brain class="w-6 h-6 text-white" />
      </div>
      <div>
        <h1 class="text-3xl font-bold" style="color: var(--color-text-primary);">Inteligencia de Categorización</h1>
        <p class="text-lg" style="color: var(--color-text-secondary);">Automatiza la categorización de transacciones con reglas inteligentes</p>
      </div>
    </div>
  </div>

  {#if loading}
    <div class="flex justify-center py-12">
      <LoadingSpinner size="lg" />
    </div>
  {:else}
    <!-- Statistics Cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <div class="p-6 rounded-xl border" style="background-color: var(--color-background-elevated); border-color: var(--color-border-primary);">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium" style="color: var(--color-text-secondary);">Transacciones Totales</p>
            <p class="text-2xl font-bold" style="color: var(--color-text-primary);">{statistics.totalTransactions}</p>
          </div>
          <Target class="w-8 h-8" style="color: var(--color-dusty-pink);" />
        </div>
      </div>
      
      <div class="p-6 rounded-xl border" style="background-color: var(--color-background-elevated); border-color: var(--color-border-primary);">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium" style="color: var(--color-text-secondary);">Categorizadas</p>
            <p class="text-2xl font-bold" style="color: var(--color-sage-green);">{statistics.categorizedTransactions}</p>
          </div>
          <Check class="w-8 h-8" style="color: var(--color-sage-green);" />
        </div>
      </div>
      
      <div class="p-6 rounded-xl border" style="background-color: var(--color-background-elevated); border-color: var(--color-border-primary);">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium" style="color: var(--color-text-secondary);">Sin Categorizar</p>
            <p class="text-2xl font-bold" style="color: var(--color-coral-pastel);">{statistics.uncategorizedTransactions}</p>
          </div>
          <AlertCircle class="w-8 h-8" style="color: var(--color-coral-pastel);" />
        </div>
      </div>
      
      <div class="p-6 rounded-xl border" style="background-color: var(--color-background-elevated); border-color: var(--color-border-primary);">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium" style="color: var(--color-text-secondary);">Tasa de Categorización</p>
            <p class="text-2xl font-bold" style="color: var(--color-text-primary);">{statistics.categorizationRate}%</p>
          </div>
          <Brain class="w-8 h-8" style="color: var(--color-aqua-seafoam);" />
        </div>
      </div>
    </div>

    <!-- Actions Bar -->
    <div class="flex items-center justify-between mb-6 p-4 rounded-xl border" style="background-color: var(--color-background-elevated); border-color: var(--color-border-primary);">
      <div class="flex items-center gap-4">
        <h2 class="text-xl font-semibold" style="color: var(--color-text-primary);">Reglas de Categorización</h2>
        <StatusBadge 
          status={statistics.activeRules > 0 ? 'success' : 'warning'}
          text="{statistics.activeRules} reglas activas"
        />
        {#if statistics.uncategorizedTransactions > 0}
          <div class="flex items-center gap-2 text-sm px-3 py-1 rounded-full" style="background-color: var(--color-coral-pastel-light); color: var(--color-coral-pastel);">
            <AlertCircle class="w-4 h-4" />
            {statistics.uncategorizedTransactions} sin categorizar
          </div>
        {/if}
      </div>
      <div class="flex items-center gap-3">
        <Button
          variant="secondary"
          size="medium"
          onclick={applyRules}
          disabled={applyingRules || statistics.activeRules === 0}
          class="flex items-center gap-2"
        >
          {#if applyingRules}
            <LoadingSpinner size="sm" />
            Aplicando...
          {:else}
            <Play class="w-4 h-4" />
            Aplicar Reglas
          {/if}
        </Button>
        <Button
          variant="primary"
          size="medium"
          onclick={openCreateForm}
          class="flex items-center gap-2"
        >
          <Plus class="w-4 h-4" />
          Nueva Regla
        </Button>
      </div>
    </div>

    <!-- Rules List -->
    <div class="space-y-4">
      {#each rules as rule (rule.id)}
        <div class="p-6 rounded-xl border transition-all duration-200 hover:shadow-md" 
             style="background-color: var(--color-background-elevated); border-color: var(--color-border-primary);">
          <div class="flex items-start justify-between">
            <div class="flex-1">
              <div class="flex items-center gap-3 mb-2">
                <h3 class="text-lg font-semibold" style="color: var(--color-text-primary);">{rule.name}</h3>
                <StatusBadge 
                  status={rule.isActive ? 'success' : 'warning'}
                  text={rule.isActive ? 'Activa' : 'Inactiva'}
                />
                <span class="px-2 py-1 text-xs font-medium rounded-full" 
                      style="background-color: var(--color-dusty-pink-light); color: var(--color-dusty-pink);">
                  {getRuleTypeLabel(rule.ruleType)}
                </span>
              </div>
              
              <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <p class="text-sm font-medium mb-1" style="color: var(--color-text-secondary);">Categoría</p>
                  <div class="flex items-center gap-2">
                    <div class="w-3 h-3 rounded-full" style="background-color: {rule.category?.color || '#999'};"></div>
                    <span class="text-sm" style="color: var(--color-text-primary);">{rule.category?.name || 'Sin categoría'}</span>
                  </div>
                </div>
                
                <div>
                  <p class="text-sm font-medium mb-1" style="color: var(--color-text-secondary);">Patrón</p>
                  <p class="text-sm" style="color: var(--color-text-primary);">{getPatternDisplay(rule)}</p>
                </div>
                
                <div>
                  <p class="text-sm font-medium mb-1" style="color: var(--color-text-secondary);">Prioridad</p>
                  <p class="text-sm" style="color: var(--color-text-primary);">{rule.priority}</p>
                </div>
              </div>
            </div>
            
            <div class="flex items-center gap-2 ml-4">
              <button
                onclick={() => toggleRuleStatus(rule)}
                class="p-2 rounded-lg transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
                title={rule.isActive ? 'Desactivar regla' : 'Activar regla'}
              >
                {#if rule.isActive}
                  <X class="w-4 h-4" style="color: var(--color-coral-pastel);" />
                {:else}
                  <Check class="w-4 h-4" style="color: var(--color-sage-green);" />
                {/if}
              </button>
              <button
                onclick={() => openEditForm(rule)}
                class="p-2 rounded-lg transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
                title="Editar regla"
              >
                <Edit class="w-4 h-4" style="color: var(--color-text-secondary);" />
              </button>
              <button
                onclick={() => deleteRule(rule.id)}
                class="p-2 rounded-lg transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
                title="Eliminar regla"
              >
                <Trash2 class="w-4 h-4" style="color: var(--color-coral-pastel);" />
              </button>
            </div>
          </div>
        </div>
      {/each}
      
      {#if rules.length === 0}
        <div class="text-center py-12">
          <Brain class="w-16 h-16 mx-auto mb-4" style="color: var(--color-text-tertiary);" />
          <h3 class="text-xl font-semibold mb-2" style="color: var(--color-text-primary);">No hay reglas configuradas</h3>
          <p class="mb-6" style="color: var(--color-text-secondary);">Crea tu primera regla para automatizar la categorización de transacciones</p>
          <Button
            variant="primary"
            size="medium"
            onclick={openCreateForm}
            class="flex items-center gap-2 mx-auto"
          >
            <Plus class="w-4 h-4" />
            Crear Primera Regla
          </Button>
        </div>
      {/if}
    </div>
  {/if}
</div>

<!-- Rule Form Modal -->
{#if showForm}
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
    <div class="max-w-2xl w-full max-h-[90vh] overflow-y-auto rounded-xl border" 
         style="background-color: var(--color-background-elevated); border-color: var(--color-border-primary);">
      <div class="p-6 border-b" style="border-color: var(--color-border-primary);">
        <h2 class="text-xl font-semibold" style="color: var(--color-text-primary);">
          {editingRule ? 'Editar Regla' : 'Nueva Regla de Categorización'}
        </h2>
      </div>
      
      <form class="p-6 space-y-6" onsubmit|preventDefault={saveRule}>
        <!-- Rule Name -->
        <div>
          <label class="block text-sm font-medium mb-2" style="color: var(--color-text-primary);">
            Nombre de la Regla
          </label>
          <input
            type="text"
            bind:value={formData.name}
            required
            placeholder="Ej: Supermercado Mercadona"
            class="w-full px-3 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            style="background-color: var(--color-background-primary); border-color: var(--color-border-primary); color: var(--color-text-primary);"
          />
        </div>

        <!-- Category -->
        <div>
          <label class="block text-sm font-medium mb-2" style="color: var(--color-text-primary);">
            Categoría de Destino
          </label>
          <select
            bind:value={formData.categoryId}
            required
            class="w-full px-3 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            style="background-color: var(--color-background-primary); border-color: var(--color-border-primary); color: var(--color-text-primary);"
          >
            <option value="">Selecciona una categoría</option>
            {#each categories as category}
              <option value={category.id}>{category.name}</option>
            {/each}
          </select>
        </div>

        <!-- Rule Type -->
        <div>
          <label class="block text-sm font-medium mb-2" style="color: var(--color-text-primary);">
            Tipo de Regla
          </label>
          <select
            bind:value={formData.ruleType}
            class="w-full px-3 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            style="background-color: var(--color-background-primary); border-color: var(--color-border-primary); color: var(--color-text-primary);"
          >
            {#each ruleTypes as ruleType}
              <option value={ruleType.value}>{ruleType.label} - {ruleType.description}</option>
            {/each}
          </select>
        </div>

        <!-- Pattern Configuration -->
        <div>
          <label class="block text-sm font-medium mb-2" style="color: var(--color-text-primary);">
            Configuración del Patrón
          </label>
          
          {#if formData.ruleType === 'keyword'}
            <div>
              <textarea
                bind:value={formData.pattern.keywords}
                placeholder="Escribe palabras clave separadas por comas (ej: mercadona, supermercado, alimentación)"
                class="w-full px-3 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                style="background-color: var(--color-background-primary); border-color: var(--color-border-primary); color: var(--color-text-primary);"
                rows="3"
                oninput={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  formData.pattern.keywords = target.value.split(',').map(k => k.trim()).filter(k => k);
                }}
              ></textarea>
            </div>
          {:else if formData.ruleType === 'amount'}
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-medium mb-1" style="color: var(--color-text-secondary);">
                  Importe Mínimo (€)
                </label>
                <input
                  type="number"
                  step="0.01"
                  bind:value={formData.pattern.minAmount}
                  placeholder="0.00"
                  class="w-full px-3 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  style="background-color: var(--color-background-primary); border-color: var(--color-border-primary); color: var(--color-text-primary);"
                />
              </div>
              <div>
                <label class="block text-xs font-medium mb-1" style="color: var(--color-text-secondary);">
                  Importe Máximo (€)
                </label>
                <input
                  type="number"
                  step="0.01"
                  bind:value={formData.pattern.maxAmount}
                  placeholder="999.99"
                  class="w-full px-3 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  style="background-color: var(--color-background-primary); border-color: var(--color-border-primary); color: var(--color-text-primary);"
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
              class="w-full px-3 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              style="background-color: var(--color-background-primary); border-color: var(--color-border-primary); color: var(--color-text-primary);"
            />
          {/if}
        </div>

        <!-- Priority and Status -->
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium mb-2" style="color: var(--color-text-primary);">
              Prioridad (1-10)
            </label>
            <input
              type="number"
              min="1"
              max="10"
              bind:value={formData.priority}
              class="w-full px-3 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              style="background-color: var(--color-background-primary); border-color: var(--color-border-primary); color: var(--color-text-primary);"
            />
          </div>
          <div>
            <label class="block text-sm font-medium mb-2" style="color: var(--color-text-primary);">
              Estado
            </label>
            <select
              bind:value={formData.isActive}
              class="w-full px-3 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              style="background-color: var(--color-background-primary); border-color: var(--color-border-primary); color: var(--color-text-primary);"
            >
              <option value={true}>Activa</option>
              <option value={false}>Inactiva</option>
            </select>
          </div>
        </div>

        <!-- Form Actions -->
        <div class="flex justify-end gap-3 pt-4 border-t" style="border-color: var(--color-border-primary);">
          <Button
            type="button"
            variant="secondary"
            size="medium"
            onclick={closeForm}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="medium"
            class="flex items-center gap-2"
          >
            <Check class="w-4 h-4" />
            {editingRule ? 'Actualizar' : 'Crear'} Regla
          </Button>
        </div>
      </form>
    </div>
  </div>
{/if}