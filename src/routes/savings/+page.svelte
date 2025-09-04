<script lang="ts">
  import { onMount } from 'svelte';
  import { Button } from '$lib/ui/components/atoms';
  import ConfirmationDialog from '$lib/ui/components/molecules/ConfirmationDialog/ConfirmationDialog.svelte';
  import SavingsAccountForm from '$lib/ui/SavingsAccountForm.svelte';
  import SavingsAccountCard from '$lib/ui/SavingsAccountCard.svelte';
  import type { SavingsAccount } from '$lib/domain/entities/SavingsAccount';

  let savingsAccounts = $state<any[]>([]);
  let totalSavings = $state(0);
  let totalGoal = $state(0);
  let loading = $state(true);
  let showForm = $state(false);
  let editingAccount = $state<any | null>(null);
  let deleteDialog = $state({ show: false, account: null as any });

  onMount(async () => {
    await loadSavingsAccounts();
  });

  async function loadSavingsAccounts() {
    try {
      loading = true;
      const response = await fetch('/api/savings-accounts');
      if (response.ok) {
        const data = await response.json();
        savingsAccounts = data.savingsAccounts || [];
        
        // Calculate totals
        totalSavings = savingsAccounts.reduce((sum, account) => sum + account.balance, 0);
        totalGoal = savingsAccounts.reduce((sum, account) => sum + (account.goalAmount || 0), 0);
      }
    } catch (error) {
      console.error('Error loading savings accounts:', error);
    } finally {
      loading = false;
    }
  }

  async function handleSaveAccount(accountData: any) {
    try {
      const url = editingAccount 
        ? `/api/savings-accounts/${editingAccount.id}` 
        : '/api/savings-accounts';
      
      const method = editingAccount ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(accountData)
      });

      if (response.ok) {
        await loadSavingsAccounts();
        showForm = false;
        editingAccount = null;
      } else {
        const error = await response.json();
        alert('Error: ' + (error.error || 'Failed to save account'));
      }
    } catch (error) {
      console.error('Error saving account:', error);
      alert('Error saving account');
    }
  }

  async function handleDeleteAccount(account: any) {
    try {
      const response = await fetch(`/api/savings-accounts/${account.id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        await loadSavingsAccounts();
        deleteDialog = { show: false, account: null };
      } else {
        const error = await response.json();
        alert('Error: ' + (error.error || 'Failed to delete account'));
      }
    } catch (error) {
      console.error('Error deleting account:', error);
      alert('Error deleting account');
    }
  }

  function openEditForm(account: any) {
    editingAccount = account;
    showForm = true;
  }

  function openDeleteDialog(account: any) {
    deleteDialog = { show: true, account };
  }

  function closeForm() {
    showForm = false;
    editingAccount = null;
  }

  // Financial freedom calculations
  let overallProgress = $derived(totalGoal > 0 ? Math.min(totalSavings / totalGoal, 1) : 0);
  let monthlyWithdrawCapacity = $derived(totalSavings * 0.04 / 12);
  let activeSavingsAccounts = $derived(savingsAccounts.filter(account => account.isActive));
</script>

<svelte:head>
  <title>Ahorros - Expense Tracker</title>
</svelte:head>

<div class="container mx-auto px-4 py-8">
  <div class="flex justify-between items-center mb-8">
    <div>
      <h1 class="text-3xl font-bold text-gray-900">Gestión de Ahorros</h1>
      <p class="text-gray-600 mt-2">
        Administra tus cuentas de ahorro y sigue tu progreso hacia la libertad financiera
      </p>
    </div>
    
    <Button 
      variant="primary"
      size="md"
      onclick={() => showForm = true}
    >
      Nueva Cuenta
    </Button>
  </div>

  {#if loading}
    <div class="text-center py-12">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
      <p class="mt-4 text-gray-600">Cargando cuentas de ahorro...</p>
    </div>
  {:else}
    <!-- Summary Cards -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      <div class="bg-white rounded-lg shadow p-6">
        <h3 class="text-sm font-medium text-gray-500">Total Ahorros</h3>
        <p class="text-2xl font-bold text-green-600">
          €{totalSavings.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
        </p>
      </div>
      
      <div class="bg-white rounded-lg shadow p-6">
        <h3 class="text-sm font-medium text-gray-500">Cuentas Activas</h3>
        <p class="text-2xl font-bold text-blue-600">{activeSavingsAccounts.length}</p>
      </div>
      
      <div class="bg-white rounded-lg shadow p-6">
        <h3 class="text-sm font-medium text-gray-500">Progreso Objetivos</h3>
        <p class="text-2xl font-bold text-purple-600">
          {(overallProgress * 100).toFixed(1)}%
        </p>
      </div>
      
      <div class="bg-white rounded-lg shadow p-6">
        <h3 class="text-sm font-medium text-gray-500">Capacidad Mensual (4%)</h3>
        <p class="text-2xl font-bold text-orange-600">
          €{monthlyWithdrawCapacity.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
        </p>
      </div>
    </div>

    <!-- Savings Accounts Grid -->
    {#if savingsAccounts.length === 0}
      <div class="text-center py-12">
        <div class="mx-auto h-24 w-24 text-gray-400">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                  d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
          </svg>
        </div>
        <h3 class="mt-2 text-sm font-medium text-gray-900">No hay cuentas de ahorro</h3>
        <p class="mt-1 text-sm text-gray-500">
          Comienza añadiendo tu primera cuenta de ahorro para hacer seguimiento de tu progreso.
        </p>
        <div class="mt-6">
          <Button 
            variant="primary"
            size="md"
            onclick={() => showForm = true}
          >
            Crear Cuenta de Ahorro
          </Button>
        </div>
      </div>
    {:else}
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {#each savingsAccounts as account (account.id)}
          <SavingsAccountCard 
            {account}
            onEdit={() => openEditForm(account)}
            onDelete={() => openDeleteDialog(account)}
          />
        {/each}
      </div>
    {/if}
  {/if}
</div>

<!-- Savings Account Form Modal -->
{#if showForm}
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
    <div class="bg-white rounded-lg shadow-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
      <SavingsAccountForm 
        account={editingAccount}
        onSave={handleSaveAccount}
        onCancel={closeForm}
      />
    </div>
  </div>
{/if}

<!-- Delete Confirmation Dialog -->
{#if deleteDialog.show && deleteDialog.account}
  <ConfirmationDialog
    type="danger"
    title="Eliminar Cuenta de Ahorro"
    message="¿Estás seguro de que quieres eliminar la cuenta '{deleteDialog.account.name}'? Esta acción no se puede deshacer."
    confirmText="Eliminar"
    cancelText="Cancelar"
    onConfirm={() => handleDeleteAccount(deleteDialog.account)}
    onCancel={() => deleteDialog = { show: false, account: null }}
  />
{/if}