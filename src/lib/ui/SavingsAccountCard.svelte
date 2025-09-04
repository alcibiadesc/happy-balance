<script lang="ts">
  import { Button } from '$lib/ui/components/atoms';

  interface Props {
    account: any;
    onEdit: () => void;
    onDelete: () => void;
  }

  let { account, onEdit, onDelete }: Props = $props();

  // Calculate derived values
  let progress = $derived(account.goalProgress || 0);
  let remainingToGoal = $derived(account.remainingToGoal || 0);
  let isGoalReached = $derived(account.isGoalReached || false);
  let monthlyContribution = $derived(account.balance * 0.04 / 12); // 4% rule monthly

  // Get appropriate icon for account type
  function getAccountTypeIcon(type: string): string {
    switch (type) {
      case 'EMERGENCY_FUND':
        return '🚨';
      case 'INVESTMENT_ACCOUNT':
        return '📈';
      case 'RETIREMENT_ACCOUNT':
        return '🏖️';
      case 'HIGH_YIELD_SAVINGS':
        return '💰';
      default:
        return '💳';
    }
  }

  // Get color scheme based on account type
  function getColorScheme(type: string): { bg: string; text: string; accent: string } {
    switch (type) {
      case 'EMERGENCY_FUND':
        return { bg: 'bg-red-50', text: 'text-red-800', accent: 'border-red-200' };
      case 'INVESTMENT_ACCOUNT':
        return { bg: 'bg-green-50', text: 'text-green-800', accent: 'border-green-200' };
      case 'RETIREMENT_ACCOUNT':
        return { bg: 'bg-blue-50', text: 'text-blue-800', accent: 'border-blue-200' };
      case 'HIGH_YIELD_SAVINGS':
        return { bg: 'bg-yellow-50', text: 'text-yellow-800', accent: 'border-yellow-200' };
      default:
        return { bg: 'bg-gray-50', text: 'text-gray-800', accent: 'border-gray-200' };
    }
  }

  let colorScheme = $derived(getColorScheme(account.type));
</script>

<div class="bg-white rounded-lg shadow-md border {colorScheme.accent} p-6 hover:shadow-lg transition-shadow duration-200">
  <!-- Header -->
  <div class="flex justify-between items-start mb-4">
    <div class="flex items-center space-x-2">
      <span class="text-2xl">{getAccountTypeIcon(account.type)}</span>
      <div>
        <h3 class="text-lg font-semibold text-gray-900 truncate" title={account.name}>
          {account.name}
        </h3>
        <div class="flex items-center space-x-2">
          <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium {colorScheme.bg} {colorScheme.text}">
            {account.typeDisplayName}
          </span>
          {#if !account.isActive}
            <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
              Inactiva
            </span>
          {/if}
        </div>
      </div>
    </div>
    
    <div class="flex space-x-1">
      <button
        onclick={onEdit}
        class="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
        title="Editar cuenta"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
        </svg>
      </button>
      
      <button
        onclick={onDelete}
        class="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
        title="Eliminar cuenta"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
        </svg>
      </button>
    </div>
  </div>

  <!-- Balance -->
  <div class="mb-4">
    <div class="text-2xl font-bold text-gray-900">
      €{account.balance.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
    </div>
    <div class="text-sm text-gray-500">
      Capacidad mensual: €{monthlyContribution.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
    </div>
  </div>

  <!-- Goal Progress -->
  {#if account.goalAmount}
    <div class="mb-4">
      <div class="flex justify-between items-center mb-2">
        <span class="text-sm font-medium text-gray-700">Progreso hacia objetivo</span>
        <span class="text-sm text-gray-600">
          {(progress * 100).toFixed(1)}%
        </span>
      </div>
      
      <div class="w-full bg-gray-200 rounded-full h-2 mb-2">
        <div 
          class="h-2 rounded-full transition-all duration-300 {isGoalReached ? 'bg-green-500' : 'bg-blue-500'}"
          style="width: {Math.min(progress * 100, 100)}%"
        ></div>
      </div>
      
      <div class="flex justify-between text-sm text-gray-600">
        <span>
          Objetivo: €{account.goalAmount.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
        </span>
        {#if !isGoalReached}
          <span>
            Faltan: €{remainingToGoal.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
          </span>
        {:else}
          <span class="text-green-600 font-medium">¡Objetivo alcanzado!</span>
        {/if}
      </div>
    </div>
  {/if}

  <!-- Description -->
  {#if account.description}
    <div class="mb-4">
      <p class="text-sm text-gray-600 italic">
        "{account.description}"
      </p>
    </div>
  {/if}

  <!-- Footer Info -->
  <div class="flex justify-between items-center text-xs text-gray-500 pt-4 border-t border-gray-100">
    <span>
      Creada: {new Date(account.createdAt).toLocaleDateString('es-ES')}
    </span>
    <span>
      {account.currency}
    </span>
  </div>
</div>