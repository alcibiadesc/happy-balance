<script lang="ts">
  import { DashboardMetrics } from '$lib/ui/components/organisms/DashboardMetrics/index.js';
  import { Plus, Upload, Settings, TrendingUp, Hash, Home, BarChart3, FileText } from 'lucide-svelte';
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';

  // State for real data
  let dashboardData = $state({
    summary: {
      totalIncome: 0,
      totalExpenses: 0,
      netFlow: 0,
      transactionCount: 0,
      period: '30d'
    },
    recentTransactions: [],
    isLoading: true,
    error: null
  });

  // Computed metrics for DashboardMetrics component
  const metrics = $derived({
    income: dashboardData.summary.totalIncome,
    essentialExpenses: dashboardData.summary.totalExpenses * 0.6, // Estimate
    discretionalExpenses: dashboardData.summary.totalExpenses * 0.4, // Estimate
    debtPayments: 0,
    savings: Math.max(0, dashboardData.summary.netFlow),
    investments: 0,
    incomePercentage: 100,
    essentialExpensesPercentage: 60,
    discretionalExpensesPercentage: 40,
    savingsRate: dashboardData.summary.totalIncome > 0 ? 
      Math.round((Math.max(0, dashboardData.summary.netFlow) / dashboardData.summary.totalIncome) * 100) : 0
  });

  // Load dashboard data
  async function loadDashboardData() {
    try {
      dashboardData.isLoading = true;
      dashboardData.error = null;
      
      // Load analytics data
      const [analyticsResponse, transactionsResponse] = await Promise.all([
        fetch('/api/analytics/flows?period=30d'),
        fetch('/api/transactions?limit=5')
      ]);
      
      if (analyticsResponse.ok) {
        const analyticsData = await analyticsResponse.json();
        if (analyticsData.success) {
          dashboardData.summary = analyticsData.data.summary;
        }
      }
      
      if (transactionsResponse.ok) {
        const transactionsData = await transactionsResponse.json();
        if (transactionsData.success) {
          dashboardData.recentTransactions = transactionsData.data.slice(0, 5);
        }
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      dashboardData.error = 'Error al cargar datos';
    } finally {
      dashboardData.isLoading = false;
    }
  }

  onMount(() => {
    loadDashboardData();
  });
</script>

<svelte:head>
  <title>Expense Tracker - Dashboard</title>
</svelte:head>

<!-- Main Content Container -->
<div class="p-6">
  <!-- Page Header -->
  <div class="mb-8">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 mb-2">Dashboard</h1>
        <p class="text-gray-600">Resumen de tus finanzas personales</p>
      </div>
      <div class="flex items-center gap-3">
        <button
          onclick={() => goto('/transactions/new')}
          class="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          <Plus class="w-4 h-4" />
          Nueva Transacción
        </button>
      </div>
    </div>
  </div>

  <!-- Mobile-First Main Content -->
  <main class="px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16 fade-in max-w-7xl mx-auto">
    <!-- Mobile-Optimized Dashboard Header -->
    <header class="mb-12 sm:mb-16 lg:mb-20 text-center">
      <h2 class="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl mb-4 sm:mb-6 tracking-tight text-charcoal leading-tight font-semibold">Dashboard Financiero</h2>
      <p class="text-base sm:text-lg text-text-grey max-w-2xl mx-auto leading-relaxed px-2">Monitorea tu salud financiera con claridad y simplicidad</p>
    </header>
    
    <!-- Mobile-First Metrics Section -->
    <section class="mb-12 sm:mb-16 lg:mb-24" aria-labelledby="metrics-heading">
      {#if dashboardData.isLoading}
        <div class="animate-pulse">
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {#each Array(6) as _}
              <div class="bg-gray-200 h-32 rounded-lg"></div>
            {/each}
          </div>
        </div>
      {:else if dashboardData.error}
        <div class="text-center py-8">
          <p class="text-red-600 mb-4">{dashboardData.error}</p>
          <button 
            onclick={loadDashboardData}
            class="btn-primary px-4 py-2"
          >
            Reintentar
          </button>
        </div>
      {:else}
        <DashboardMetrics metrics={metrics} class="slide-up" />
      {/if}
    </section>

    <!-- Mobile-First Analytics Section -->
    <section class="mb-12 sm:mb-16 lg:mb-24" aria-labelledby="analytics-heading">
      <header class="text-center mb-8 sm:mb-12">
        <span class="text-xs sm:text-sm mb-2 sm:mb-3 block text-text-grey uppercase tracking-wider">Insights Visuales</span>
        <h3 id="analytics-heading" class="text-xl sm:text-2xl lg:text-3xl mb-3 sm:mb-4 text-charcoal font-semibold">Análisis y Tendencias</h3>
        <p class="text-sm sm:text-base text-text-grey px-4">Representaciones visuales de tus patrones financieros</p>
      </header>
      
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
        <!-- Mobile-Optimized Monthly Trend Chart -->
        <div class="bg-white rounded-lg sm:rounded-xl border border-gray-200 p-4 sm:p-6 lg:p-8 group transition-all duration-default hover:shadow-lg hover:translate-y-[-1px] sm:hover:translate-y-[-2px]">
          <div class="flex items-center justify-between mb-4 sm:mb-6">
            <h4 class="text-lg sm:text-xl text-charcoal font-medium">Tendencia Mensual</h4>
            <div class="w-1 h-6 sm:h-8 bg-charcoal rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-default"></div>
          </div>
          <div class="h-48 sm:h-56 lg:h-64 flex items-center justify-center bg-gray-50 rounded-lg border border-gray-100 transition-all duration-default group-hover:bg-gray-100">
            <div class="text-center">
              <TrendingUp class="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 sm:mb-4 text-text-grey transition-colors duration-default group-hover:text-charcoal" />
              <p class="text-xs sm:text-sm text-text-grey px-4">Gráfico interactivo próximamente</p>
            </div>
          </div>
        </div>

        <!-- Mobile-Optimized Category Distribution Chart -->
        <div class="bg-white rounded-lg sm:rounded-xl border border-gray-200 p-4 sm:p-6 lg:p-8 group transition-all duration-default hover:shadow-lg hover:translate-y-[-1px] sm:hover:translate-y-[-2px]">
          <div class="flex items-center justify-between mb-4 sm:mb-6">
            <h4 class="text-lg sm:text-xl text-charcoal font-medium">Distribución por Categoría</h4>
            <div class="w-1 h-6 sm:h-8 bg-charcoal rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-default"></div>
          </div>
          <div class="h-48 sm:h-56 lg:h-64 flex items-center justify-center bg-gray-50 rounded-lg border border-gray-100 transition-all duration-default group-hover:bg-gray-100">
            <div class="text-center">
              <div class="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 sm:mb-4 rounded-full bg-text-grey/20 transition-colors duration-default group-hover:bg-charcoal/20"></div>
              <p class="text-xs sm:text-sm text-text-grey px-4">Gráfico de distribución próximamente</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Mobile-First Recent Transactions -->
    <section aria-labelledby="transactions-heading">
      <div class="bg-white rounded-lg sm:rounded-xl border border-gray-200 p-4 sm:p-6 lg:p-8 group transition-all duration-default hover:shadow-lg hover:translate-y-[-1px]">
        <header class="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8 gap-2">
          <h3 id="transactions-heading" class="text-xl sm:text-2xl text-charcoal font-semibold">Transacciones Recientes</h3>
          <span class="text-xs sm:text-sm text-text-grey">Actividad Reciente</span>
        </header>
        
        {#if dashboardData.isLoading}
          <div class="animate-pulse space-y-4">
            {#each Array(3) as _}
              <div class="flex items-center space-x-4">
                <div class="w-12 h-12 bg-gray-200 rounded-lg"></div>
                <div class="flex-1">
                  <div class="h-4 bg-gray-200 rounded mb-2"></div>
                  <div class="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
                <div class="w-20 h-4 bg-gray-200 rounded"></div>
              </div>
            {/each}
          </div>
        {:else if dashboardData.recentTransactions.length > 0}
          <div class="space-y-4">
            {#each dashboardData.recentTransactions as transaction}
              <div class="flex items-center justify-between py-4 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors rounded-lg px-2">
                <div class="flex items-center gap-4">
                  <div class="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                    <span class="text-xl">{transaction.amount > 0 ? '📈' : '💸'}</span>
                  </div>
                  <div>
                    <p class="font-medium text-gray-900">{transaction.partnerName}</p>
                    <p class="text-sm text-gray-500">{new Date(transaction.bookingDate).toLocaleDateString('es-ES')}</p>
                  </div>
                </div>
                <div class="text-right">
                  <p class="font-semibold {transaction.amount > 0 ? 'text-green-600' : 'text-red-600'}">
                    {transaction.amount > 0 ? '+' : ''}{transaction.amount.toFixed(2)}€
                  </p>
                  {#if transaction.category}
                    <p class="text-xs text-gray-500">{transaction.category.name}</p>
                  {/if}
                </div>
              </div>
            {/each}
            <div class="pt-4">
              <button 
                class="w-full text-center text-blue-600 hover:text-blue-700 text-sm font-medium py-2 hover:bg-blue-50 rounded-lg transition-colors"
                onclick={() => goto('/transactions')}
              >
                Ver todas las transacciones →
              </button>
            </div>
          </div>
        {:else}
          <div class="text-center py-12 sm:py-16">
            <div class="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-6 sm:mb-8 rounded-full bg-gray-50 border border-gray-200 flex items-center justify-center shadow-sm transition-all duration-default group-hover:shadow-md group-hover:scale-105">
              <Upload class="w-8 h-8 sm:w-10 sm:h-10 text-text-grey transition-colors duration-default group-hover:text-charcoal" aria-hidden="true" />
            </div>
            <h4 class="text-lg sm:text-xl lg:text-2xl mb-3 sm:mb-4 text-charcoal font-medium">Sin transacciones aún</h4>
            <p class="text-sm sm:text-base text-text-grey mb-8 sm:mb-10 max-w-md mx-auto leading-relaxed px-4">Comienza agregando tu primera transacción o importa datos CSV</p>
            
            <!-- Mobile-First Action Buttons -->
            <div class="flex flex-col sm:flex-row gap-3 sm:gap-4 max-w-md mx-auto">
              <button 
                class="btn-primary w-full sm:flex-1 flex items-center justify-center gap-2 py-3 sm:py-2 text-sm sm:text-base transition-all duration-default hover:translate-y-[-1px] hover:shadow-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white" 
                onclick={() => goto('/transactions/new')}
                aria-label="Create new transaction manually"
              >
                <Plus class="w-4 h-4" aria-hidden="true" />
                <span>Agregar Transacción</span>
              </button>
              <button 
                class="btn-secondary w-full sm:flex-1 flex items-center justify-center gap-2 py-3 sm:py-2 text-sm sm:text-base transition-all duration-default hover:translate-y-[-1px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-charcoal" 
                onclick={() => goto('/import')}
                aria-label="Import CSV file to get started"
              >
                <Upload class="w-4 h-4" aria-hidden="true" />
                <span>Importar CSV</span>
              </button>
            </div>
          </div>
        {/if}
      </div>
    </section>
  </main>
  
  <!-- Mobile-First Footer -->
  <footer class="px-4 sm:px-6 lg:px-8 py-8 sm:py-12 border-t border-gray-200 max-w-7xl mx-auto">
    <div class="text-center">
      <div class="w-8 sm:w-12 h-0.5 bg-gradient-to-r from-transparent via-text-grey/30 to-transparent mx-auto mb-4 sm:mb-6"></div>
      <p class="text-xs sm:text-sm text-text-grey/70 mb-2">Creado con confianza y simplicidad moderna</p>
      <div class="flex items-center justify-center gap-2 text-text-grey/50">
        <span class="w-1 h-1 rounded-full bg-current"></span>
        <span class="text-xs">2025</span>
        <span class="w-1 h-1 rounded-full bg-current"></span>
      </div>
    </div>
  </footer>

</div>
