<script lang="ts">
  import { Button } from '$lib/ui/components/atoms';
  import { SavingsAccountType } from '$lib/domain/entities/SavingsAccount.js';

  interface Props {
    account?: any;
    onSave: (data: any) => void;
    onCancel: () => void;
  }

  let { account, onSave, onCancel }: Props = $props();

  let formData = $state({
    name: account?.name || '',
    type: account?.type || SavingsAccountType.HIGH_YIELD_SAVINGS,
    balance: account?.balance?.toString() || '0',
    goalAmount: account?.goalAmount?.toString() || '',
    currency: account?.currency || 'EUR',
    description: account?.description || '',
    isActive: account?.isActive !== undefined ? account.isActive : true
  });

  let errors = $state<Record<string, string>>({});
  let isSubmitting = $state(false);

  const typeOptions = [
    { value: SavingsAccountType.EMERGENCY_FUND, label: 'Fondo de Emergencia' },
    { value: SavingsAccountType.HIGH_YIELD_SAVINGS, label: 'Ahorro de Alto Rendimiento' },
    { value: SavingsAccountType.INVESTMENT_ACCOUNT, label: 'Cuenta de Inversión' },
    { value: SavingsAccountType.RETIREMENT_ACCOUNT, label: 'Cuenta de Jubilación' },
    { value: SavingsAccountType.OTHER, label: 'Otros Ahorros' }
  ];

  const currencyOptions = [
    { value: 'EUR', label: 'EUR (€)' },
    { value: 'USD', label: 'USD ($)' },
    { value: 'GBP', label: 'GBP (£)' }
  ];

  function validateForm(): boolean {
    errors = {};

    if (!formData.name.trim()) {
      errors.name = 'El nombre es obligatorio';
    }

    if (!formData.balance.trim()) {
      errors.balance = 'El saldo es obligatorio';
    } else {
      const balance = parseFloat(formData.balance);
      if (isNaN(balance) || balance < 0) {
        errors.balance = 'El saldo debe ser un número válido mayor o igual a 0';
      }
    }

    if (formData.goalAmount.trim()) {
      const goalAmount = parseFloat(formData.goalAmount);
      if (isNaN(goalAmount) || goalAmount <= 0) {
        errors.goalAmount = 'El objetivo debe ser un número válido mayor a 0';
      }
    }

    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!validateForm()) return;

    isSubmitting = true;
    try {
      const submitData = {
        name: formData.name.trim(),
        type: formData.type,
        balance: parseFloat(formData.balance),
        goalAmount: formData.goalAmount.trim() ? parseFloat(formData.goalAmount) : undefined,
        currency: formData.currency,
        description: formData.description.trim() || undefined,
        isActive: formData.isActive
      };

      await onSave(submitData);
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      isSubmitting = false;
    }
  }

  // Calculate progress if both balance and goal are available
  let progress = $derived(formData.goalAmount && formData.balance 
    ? Math.min(parseFloat(formData.balance) / parseFloat(formData.goalAmount), 1) * 100
    : 0);
</script>

<div class="p-6">
  <div class="flex justify-between items-center mb-6">
    <h2 class="text-lg font-semibold text-gray-900">
      {account ? 'Editar Cuenta de Ahorro' : 'Nueva Cuenta de Ahorro'}
    </h2>
    <button 
      onclick={onCancel}
      class="text-gray-400 hover:text-gray-600"
    >
      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
      </svg>
    </button>
  </div>

  <form onsubmit={handleSubmit} class="space-y-6">
    <!-- Name -->
    <div>
      <label for="name" class="block text-sm font-medium text-gray-700 mb-2">
        Nombre de la Cuenta <span class="text-red-500">*</span>
      </label>
      <input
        id="name"
        type="text"
        bind:value={formData.name}
        placeholder="Ej: Fondo de emergencia personal"
        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        class:border-red-500={errors.name}
      />
      {#if errors.name}
        <p class="text-red-500 text-sm mt-1">{errors.name}</p>
      {/if}
    </div>

    <!-- Type -->
    <div>
      <label for="type" class="block text-sm font-medium text-gray-700 mb-2">
        Tipo de Cuenta <span class="text-red-500">*</span>
      </label>
      <select
        id="type"
        bind:value={formData.type}
        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      >
        {#each typeOptions as option}
          <option value={option.value}>{option.label}</option>
        {/each}
      </select>
    </div>

    <!-- Balance and Currency -->
    <div class="grid grid-cols-2 gap-4">
      <div>
        <label for="balance" class="block text-sm font-medium text-gray-700 mb-2">
          Saldo Actual <span class="text-red-500">*</span>
        </label>
        <input
          id="balance"
          type="number"
          step="0.01"
          min="0"
          bind:value={formData.balance}
          placeholder="0.00"
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          class:border-red-500={errors.balance}
        />
        {#if errors.balance}
          <p class="text-red-500 text-sm mt-1">{errors.balance}</p>
        {/if}
      </div>

      <div>
        <label for="currency" class="block text-sm font-medium text-gray-700 mb-2">
          Moneda
        </label>
        <select
          id="currency"
          bind:value={formData.currency}
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          {#each currencyOptions as option}
            <option value={option.value}>{option.label}</option>
          {/each}
        </select>
      </div>
    </div>

    <!-- Goal Amount -->
    <div>
      <label for="goalAmount" class="block text-sm font-medium text-gray-700 mb-2">
        Objetivo de Ahorro (Opcional)
      </label>
      <input
        id="goalAmount"
        type="number"
        step="0.01"
        min="0.01"
        bind:value={formData.goalAmount}
        placeholder="Ej: 10000.00"
        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        class:border-red-500={errors.goalAmount}
      />
      {#if errors.goalAmount}
        <p class="text-red-500 text-sm mt-1">{errors.goalAmount}</p>
      {/if}
      
      {#if progress > 0}
        <div class="mt-2">
          <div class="flex justify-between text-sm text-gray-600 mb-1">
            <span>Progreso hacia objetivo</span>
            <span>{progress.toFixed(1)}%</span>
          </div>
          <div class="w-full bg-gray-200 rounded-full h-2">
            <div 
              class="bg-green-500 h-2 rounded-full transition-all duration-300"
              style="width: {Math.min(progress, 100)}%"
            ></div>
          </div>
        </div>
      {/if}
    </div>

    <!-- Description -->
    <div>
      <label for="description" class="block text-sm font-medium text-gray-700 mb-2">
        Descripción (Opcional)
      </label>
      <textarea
        id="description"
        bind:value={formData.description}
        placeholder="Añade una descripción opcional..."
        rows="3"
        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      ></textarea>
    </div>

    <!-- Active Status -->
    <div class="flex items-center">
      <input
        id="isActive"
        type="checkbox"
        bind:checked={formData.isActive}
        class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
      />
      <label for="isActive" class="ml-2 block text-sm text-gray-900">
        Cuenta activa
      </label>
    </div>

    <!-- Actions -->
    <div class="flex justify-end space-x-3 pt-4 border-t border-gray-200">
      <Button
        type="button"
        variant="secondary"
        size="md"
        onclick={onCancel}
      >
        Cancelar
      </Button>
      
      <Button
        type="submit"
        variant="primary"
        size="md"
        disabled={isSubmitting}
      >
        {#if isSubmitting}
          <div class="flex items-center">
            <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            Guardando...
          </div>
        {:else}
          {account ? 'Actualizar' : 'Crear'} Cuenta
        {/if}
      </Button>
    </div>
  </form>
</div>