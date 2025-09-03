<script lang="ts">
  import { DollarSign, Building, ShoppingBag, CreditCard, PiggyBank, TrendingUp } from 'lucide-svelte';
  interface FinancialMetrics {
    income: number;
    essentialExpenses: number;
    discretionalExpenses: number;
    debtPayments: number;
    savings: number;
    investments: number;
    incomePercentage: number;
    essentialExpensesPercentage: number;
    discretionalExpensesPercentage: number;
    savingsRate: number;
  }

  interface Props {
    metrics: FinancialMetrics;
    class?: string;
  }

  let { metrics, class: className }: Props = $props();

  let totalExpenses = $derived(metrics.essentialExpenses + metrics.discretionalExpenses + metrics.debtPayments);
  let expensesPercentage = $derived(metrics.income > 0 ? (totalExpenses / metrics.income) * 100 : 0);
</script>

<div class={`space-y-8 sm:space-y-12 lg:space-y-16 ${className || ''}`}>
  <!-- Mobile-First Metrics Grid -->
  <section class="slide-up">
    <div class="text-center mb-6 sm:mb-8">
      <span class="text-xs sm:text-sm mb-2 block text-text-grey uppercase tracking-wider">Resumen Financiero</span>
      <h3 class="text-xl sm:text-2xl lg:text-3xl font-semibold text-charcoal">Posición Actual</h3>
    </div>
    
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
      <!-- Mobile-First Income Card -->
      <div class="bg-white rounded-lg sm:rounded-xl border border-gray-200 p-4 sm:p-6 transition-all duration-default hover:shadow-lg hover:translate-y-[-1px]">
        <div class="flex items-center justify-between mb-4">
          <span class="text-xs sm:text-sm font-medium text-gray-600 uppercase tracking-wide">Ingresos</span>
          <div class="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-green-100 flex items-center justify-center">
            <DollarSign class="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
          </div>
        </div>
        <div class="space-y-2 sm:space-y-3">
          <div class="text-2xl sm:text-3xl font-bold text-green-600 font-mono">
            €{metrics.income.toLocaleString()}
          </div>
          {#if metrics.income > 0}
            <div class="flex items-center gap-2 text-xs sm:text-sm text-gray-500">
              <span class="text-green-600">↗</span>
              <span class="text-green-600">+{metrics.incomePercentage}%</span>
              <span>vs mes anterior</span>
            </div>
          {:else}
            <div class="text-xs sm:text-sm text-gray-500">
              <span>Importa transacciones para ver datos</span>
            </div>
          {/if}
        </div>
      </div>
      
      <!-- Mobile-First Essential Expenses -->
      <div class="bg-white rounded-lg sm:rounded-xl border border-gray-200 p-4 sm:p-6 transition-all duration-default hover:shadow-lg hover:translate-y-[-1px]">
        <div class="flex items-center justify-between mb-4">
          <span class="text-xs sm:text-sm font-medium text-gray-600 uppercase tracking-wide">Gastos Esenciales</span>
          <div class="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-red-100 flex items-center justify-center">
            <Building class="w-4 h-4 sm:w-5 sm:h-5 text-red-600" />
          </div>
        </div>
        <div class="space-y-2 sm:space-y-3">
          <div class="text-2xl sm:text-3xl font-bold text-red-600 font-mono">
            €{metrics.essentialExpenses.toLocaleString()}
          </div>
          {#if metrics.essentialExpenses > 0}
            <div class="flex items-center gap-2 text-xs sm:text-sm text-gray-500">
              <span class="text-red-600">↗</span>
              <span class="text-red-600">+{metrics.essentialExpensesPercentage}%</span>
              <span>vs mes anterior</span>
            </div>
          {:else}
            <div class="text-xs sm:text-sm text-gray-500">
              <span>Sin gastos registrados</span>
            </div>
          {/if}
        </div>
      </div>
      
      <!-- Mobile-First Discretional Expenses -->
      <div class="bg-white rounded-lg sm:rounded-xl border border-gray-200 p-4 sm:p-6 transition-all duration-default hover:shadow-lg hover:translate-y-[-1px]">
        <div class="flex items-center justify-between mb-4">
          <span class="text-xs sm:text-sm font-medium text-gray-600 uppercase tracking-wide">Discrecionales</span>
          <div class="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-orange-100 flex items-center justify-center">
            <ShoppingBag class="w-4 h-4 sm:w-5 sm:h-5 text-orange-600" />
          </div>
        </div>
        <div class="space-y-2 sm:space-y-3">
          <div class="text-2xl sm:text-3xl font-bold text-orange-600 font-mono">
            €{metrics.discretionalExpenses.toLocaleString()}
          </div>
          {#if metrics.discretionalExpenses > 0}
            <div class="flex items-center gap-2 text-xs sm:text-sm text-gray-500">
              <span class="text-orange-600">↗</span>
              <span class="text-orange-600">+{metrics.discretionalExpensesPercentage}%</span>
              <span>vs mes anterior</span>
            </div>
          {:else}
            <div class="text-xs sm:text-sm text-gray-500">
              <span>Sin gastos discrecionales</span>
            </div>
          {/if}
        </div>
      </div>
      
      <!-- Mobile-First Debt Payments -->
      <div class="bg-white rounded-lg sm:rounded-xl border border-gray-200 p-4 sm:p-6 transition-all duration-default hover:shadow-lg hover:translate-y-[-1px]">
        <div class="flex items-center justify-between mb-4">
          <span class="text-xs sm:text-sm font-medium text-gray-600 uppercase tracking-wide">Pagos de Deuda</span>
          <div class="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gray-100 flex items-center justify-center">
            <CreditCard class="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
          </div>
        </div>
        <div class="space-y-2 sm:space-y-3">
          <div class="text-2xl sm:text-3xl font-bold text-gray-600 font-mono">
            €{metrics.debtPayments.toLocaleString()}
          </div>
          <div class="text-xs sm:text-sm text-gray-500">
            {#if metrics.debtPayments === 0}
              <span>Sin deudas activas</span>
            {:else}
              <span>Pagando deudas consistentemente</span>
            {/if}
          </div>
        </div>
      </div>
      
      <!-- Mobile-First Savings -->
      <div class="bg-white rounded-lg sm:rounded-xl border border-gray-200 p-4 sm:p-6 transition-all duration-default hover:shadow-lg hover:translate-y-[-1px]">
        <div class="flex items-center justify-between mb-4">
          <span class="text-xs sm:text-sm font-medium text-gray-600 uppercase tracking-wide">Ahorros</span>
          <div class="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-blue-100 flex items-center justify-center">
            <PiggyBank class="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
          </div>
        </div>
        <div class="space-y-2 sm:space-y-3">
          <div class="text-2xl sm:text-3xl font-bold text-blue-600 font-mono">
            €{metrics.savings.toLocaleString()}
          </div>
          <div class="text-xs sm:text-sm text-gray-500">
            {#if metrics.savings > 0}
              <span class="text-blue-600">Creciendo constantemente</span>
            {:else}
              <span>Comienza a ahorrar hoy</span>
            {/if}
          </div>
        </div>
      </div>
      
      <!-- Mobile-First Investments -->
      <div class="bg-white rounded-lg sm:rounded-xl border border-gray-200 p-4 sm:p-6 transition-all duration-default hover:shadow-lg hover:translate-y-[-1px]">
        <div class="flex items-center justify-between mb-4">
          <span class="text-xs sm:text-sm font-medium text-gray-600 uppercase tracking-wide">Inversiones</span>
          <div class="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-purple-100 flex items-center justify-center">
            <TrendingUp class="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
          </div>
        </div>
        <div class="space-y-2 sm:space-y-3">
          <div class="text-2xl sm:text-3xl font-bold text-purple-600 font-mono">
            €{metrics.investments.toLocaleString()}
          </div>
          <div class="text-xs sm:text-sm text-gray-500">
            {#if metrics.investments > 0}
              <span class="text-purple-600">Portafolio en crecimiento</span>
            {:else}
              <span>Considera invertir para el futuro</span>
            {/if}
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- Mobile-First Summary Section -->
  {#if metrics.income > 0 || totalExpenses > 0}
  <section class="slide-up">
    <div class="text-center mb-6 sm:mb-8">
      <span class="text-xs sm:text-sm mb-2 block text-text-grey uppercase tracking-wider">Insights Financieros</span>
      <h3 class="text-xl sm:text-2xl lg:text-3xl font-semibold text-charcoal">Rendimiento Clave</h3>
    </div>
    
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
      <!-- Mobile-Optimized Spending Summary -->
      <div class="bg-white rounded-lg sm:rounded-xl border border-gray-200 p-4 sm:p-6 transition-all duration-default hover:shadow-lg hover:translate-y-[-1px]">
        <div class="flex items-center justify-between mb-4">
          <h4 class="text-base sm:text-lg font-medium text-charcoal">Gastos Totales</h4>
          <div class="w-1 h-8 sm:h-12 bg-red-500 rounded-full"></div>
        </div>
        
        <div class="space-y-3 sm:space-y-4">
          <div>
            <div class="text-xs sm:text-sm text-gray-600 mb-1 sm:mb-2">Gastos del Mes</div>
            <div class="text-xl sm:text-2xl lg:text-3xl font-bold text-red-600 font-mono mb-1 sm:mb-2">
              €{totalExpenses.toLocaleString()}
            </div>
            <div class="text-xs sm:text-sm text-gray-500">
              <span class="text-red-600 font-medium">{expensesPercentage.toFixed(1)}%</span> del ingreso total
            </div>
          </div>
        </div>
      </div>

      <!-- Mobile-Optimized Wealth Building -->
      <div class="bg-white rounded-lg sm:rounded-xl border border-gray-200 p-4 sm:p-6 transition-all duration-default hover:shadow-lg hover:translate-y-[-1px]">
        <div class="flex items-center justify-between mb-4">
          <h4 class="text-base sm:text-lg font-medium text-charcoal">Patrimonio</h4>
          <div class="w-1 h-8 sm:h-12 bg-green-500 rounded-full"></div>
        </div>
        
        <div class="space-y-3 sm:space-y-4">
          <div>
            <div class="text-xs sm:text-sm text-gray-600 mb-1 sm:mb-2">Activos Combinados</div>
            <div class="text-xl sm:text-2xl lg:text-3xl font-bold text-green-600 font-mono mb-1 sm:mb-2">
              €{(metrics.savings + metrics.investments).toLocaleString()}
            </div>
            <div class="text-xs sm:text-sm text-gray-500">
              <span class="text-green-600 font-medium">{metrics.savingsRate.toFixed(1)}%</span> tasa de ahorro
            </div>
          </div>
        </div>
      </div>

      <!-- Mobile-Optimized Balance -->
      <div class="bg-white rounded-lg sm:rounded-xl border border-gray-200 p-4 sm:p-6 transition-all duration-default hover:shadow-lg hover:translate-y-[-1px] sm:col-span-2 lg:col-span-1">
        <div class="flex items-center justify-between mb-4">
          <h4 class="text-base sm:text-lg font-medium text-charcoal">Balance</h4>
          <div class="w-1 h-8 sm:h-12 bg-blue-500 rounded-full"></div>
        </div>
        
        <div class="space-y-3 sm:space-y-4">
          <div>
            <div class="text-xs sm:text-sm text-gray-600 mb-1 sm:mb-2">Flujo Neto</div>
            <div class="text-xl sm:text-2xl lg:text-3xl font-bold font-mono mb-1 sm:mb-2 {(metrics.income - totalExpenses) >= 0 ? 'text-green-600' : 'text-red-600'}">
              €{(metrics.income - totalExpenses).toLocaleString()}
            </div>
            <div class="text-xs sm:text-sm text-gray-500">
              {#if metrics.income > 0}
                <span class="{(metrics.income - totalExpenses) >= 0 ? 'text-green-600' : 'text-red-600'} font-medium">
                  {(metrics.income - totalExpenses) >= 0 ? 'Superávit' : 'Déficit'} mensual
                </span>
              {:else}
                <span>Importa datos para análisis</span>
              {/if}
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
  {/if}
</div>