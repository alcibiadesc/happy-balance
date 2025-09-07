<script lang="ts">
  import { onMount } from 'svelte';
  import { TrendingUp, TrendingDown, Target, PiggyBank, DollarSign, BarChart3, Calendar, AlertCircle, PieChart } from 'lucide-svelte';
  import { TrendChart } from '$lib/ui/components/organisms/TrendChart/index.js';
  import { CategoryPieChart } from '$lib/ui/components/organisms/CategoryPieChart/index.js';
  import { ExpenseRatioGauge } from '$lib/ui/components/organisms/ExpenseRatioGauge/index.js';

  let analyticsData = $state({
    monthlyIncome: 0,
    monthlyExpenses: 0,
    savingsRate: 0,
    expenseRatio: 0,
    financialFreedomProgress: 0,
    monthlyBreakdown: [],
    categoryBreakdown: [],
    trends: {
      incomeGrowth: 0,
      expenseGrowth: 0,
      savingsGrowth: 0
    },
    savingsData: {
      totalSavings: 0,
      accountCount: 0,
      monthlyWithdrawCapacity: 0,
      yearsOfExpensesCovered: 0,
      targetAmount: 0,
      remainingToTarget: 0
    }
  });

  let isLoading = $state(true);
  let selectedPeriod = $state('current_month');
  
  // Chart data
  let trendData = $state([]);
  let categoryData = $state([]);

  onMount(() => {
    loadAnalyticsData();
  });

  async function loadAnalyticsData() {
    try {
      isLoading = true;
      
      // Load main analytics data
      const [analyticsResponse, categoryResponse] = await Promise.all([
        fetch(`/api/analytics/dashboard?period=${selectedPeriod}`),
        fetch(`/api/analytics/category-spending?period=${selectedPeriod}`)
      ]);
      
      const [analyticsResult, categoryResult] = await Promise.all([
        analyticsResponse.json(),
        categoryResponse.json()
      ]);
      
      if (analyticsResult.success && analyticsResult.data) {
        // Sanitize all numeric fields
        analyticsData = {
          monthlyIncome: Number(analyticsResult.data.monthlyIncome) || 0,
          monthlyExpenses: Number(analyticsResult.data.monthlyExpenses) || 0,
          savingsRate: Number(analyticsResult.data.savingsRate) || 0,
          expenseRatio: Number(analyticsResult.data.expenseRatio) || 0,
          financialFreedomProgress: Number(analyticsResult.data.financialFreedomProgress) || 0,
          monthlyBreakdown: analyticsResult.data.monthlyBreakdown || [],
          categoryBreakdown: analyticsResult.data.categoryBreakdown || [],
          trends: {
            incomeGrowth: Number(analyticsResult.data.trends?.incomeGrowth) || 0,
            expenseGrowth: Number(analyticsResult.data.trends?.expenseGrowth) || 0,
            savingsGrowth: Number(analyticsResult.data.trends?.savingsGrowth) || 0
          },
          savingsData: {
            totalSavings: Number(analyticsResult.data.savingsData?.totalSavings) || 0,
            accountCount: Number(analyticsResult.data.savingsData?.accountCount) || 0,
            monthlyWithdrawCapacity: Number(analyticsResult.data.savingsData?.monthlyWithdrawCapacity) || 0,
            yearsOfExpensesCovered: Number(analyticsResult.data.savingsData?.yearsOfExpensesCovered) || 0,
            targetAmount: Number(analyticsResult.data.savingsData?.targetAmount) || 0,
            remainingToTarget: Number(analyticsResult.data.savingsData?.remainingToTarget) || 0
          }
        };
      }
      
      // Load category data for pie chart
      if (categoryResult.success && categoryResult.data) {
        categoryData = categoryResult.data.map(item => ({
          categoryName: item.categoryName || 'Sin categoría',
          categoryType: item.categoryType || 'DISCRETIONARY_EXPENSE',
          amount: Number(item.amount) || 0,
          color: getCategoryColor(item.categoryType)
        }));
      }
      
      // Generate trend data (for now, we'll use mock data based on current analytics)
      generateTrendData();
      
    } catch (error) {
      console.error('Error loading analytics data:', error);
      // Set safe default values on error
      analyticsData = {
        monthlyIncome: 0,
        monthlyExpenses: 0,
        savingsRate: 0,
        expenseRatio: 0,
        financialFreedomProgress: 0,
        monthlyBreakdown: [],
        categoryBreakdown: [],
        trends: {
          incomeGrowth: 0,
          expenseGrowth: 0,
          savingsGrowth: 0
        },
        savingsData: {
          totalSavings: 0,
          accountCount: 0,
          monthlyWithdrawCapacity: 0,
          yearsOfExpensesCovered: 0,
          targetAmount: 0,
          remainingToTarget: 0
        }
      };
      categoryData = [];
      trendData = [];
    } finally {
      isLoading = false;
    }
  }
  
  function getCategoryColor(categoryType: string): string {
    const colorMap = {
      'INCOME': '#22C55E',
      'ESSENTIAL_EXPENSE': '#EF4444',
      'DISCRETIONARY_EXPENSE': '#F97316',
      'DEBT_PAYMENT': '#7C2D12',
      'SAVINGS': '#3B82F6',
      'INVESTMENT': '#8B5CF6',
      'OMIT': '#6B7280'
    };
    return colorMap[categoryType] || '#6B7280';
  }
  
  function generateTrendData() {
    // Generate mock trend data for the last 7 days
    // In a real app, this would come from an API endpoint
    const today = new Date();
    const data = [];
    
    // Ensure we have valid base values
    const safeIncome = Number(analyticsData.monthlyIncome) || 0;
    const safeExpenses = Number(analyticsData.monthlyExpenses) || 0;
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      // Mock data with some variation - ensure no division by zero
      const baseIncome = safeIncome > 0 ? safeIncome / 30 : 0; // Daily average
      const baseExpenses = safeExpenses > 0 ? safeExpenses / 30 : 0; // Daily average
      
      const income = baseIncome * (0.8 + Math.random() * 0.4); // ±20% variation
      const expenses = baseExpenses * (0.8 + Math.random() * 0.4); // ±20% variation
      
      // Ensure all values are finite
      const safeIncomeValue = isFinite(income) ? income : 0;
      const safeExpenseValue = isFinite(expenses) ? expenses : 0;
      const balanceValue = safeIncomeValue - safeExpenseValue;
      
      data.push({
        date: date.toISOString(),
        income: safeIncomeValue,
        expenses: -safeExpenseValue, // Negative for expenses
        balance: isFinite(balanceValue) ? balanceValue : 0
      });
    }
    
    trendData = data;
  }

  function formatCurrency(amount: number): string {
    // Comprehensive protection against all invalid values
    if (amount === null || amount === undefined) return '€0,00';
    
    const numAmount = Number(amount);
    if (!isFinite(numAmount) || isNaN(numAmount)) return '€0,00';
    
    const safeAmount = numAmount;
    try {
      return new Intl.NumberFormat('es-ES', {
        style: 'currency',
        currency: 'EUR'
      }).format(safeAmount);
    } catch (error) {
      console.warn('Currency formatting error:', error);
      return `€${safeAmount.toFixed(2).replace('.', ',')}`;
    }
  }

  function formatPercentage(ratio: number): string {
    // Comprehensive protection against all invalid values
    if (ratio === null || ratio === undefined) return '0,0%';
    
    const numRatio = Number(ratio);
    if (!isFinite(numRatio) || isNaN(numRatio)) return '0,0%';
    
    const safeRatio = Math.max(0, Math.min(1, numRatio)); // Clamp between 0 and 1
    const percentage = safeRatio * 100;
    
    try {
      return `${percentage.toFixed(1).replace('.', ',')}%`;
    } catch (error) {
      console.warn('Percentage formatting error:', error);
      return '0,0%';
    }
  }

  // Calculate financial freedom insights with comprehensive NaN protection
  const insights = $derived.by(() => {
    // Convert to numbers and ensure they're valid
    const safeIncome = Number(analyticsData.monthlyIncome) || 0;
    const safeExpenses = Number(analyticsData.monthlyExpenses) || 0;
    
    // Calculate monthly net with protection
    const monthlyNet = safeIncome - safeExpenses;
    const safeMonthlyNet = isFinite(monthlyNet) ? monthlyNet : 0;
    
    // Calculate years to freedom with multiple protections
    let yearsToFreedom = 0;
    if (safeMonthlyNet > 0 && safeExpenses > 0) {
      const targetAmount = safeExpenses * 12 * 25; // 4% rule target
      const annualSavings = safeMonthlyNet * 12;
      if (annualSavings > 0) {
        const calculatedYears = targetAmount / annualSavings;
        yearsToFreedom = isFinite(calculatedYears) ? Math.min(100, Math.max(0, Math.ceil(calculatedYears))) : 0;
      }
    }
    
    // Calculate emergency fund
    const emergencyFund = safeExpenses * 6;
    const safeEmergencyFund = isFinite(emergencyFund) ? Math.max(0, emergencyFund) : 0;
    
    // Calculate 4% rule target
    const rule4 = safeExpenses * 12 * 25;
    const safeRule4 = isFinite(rule4) ? Math.max(0, rule4) : 0;
    
    // Calculate months of expenses covered
    let monthsOfExpensesCovered = 0;
    if (safeMonthlyNet > 0 && safeExpenses > 0) {
      const monthsRatio = safeMonthlyNet / safeExpenses * 12;
      monthsOfExpensesCovered = isFinite(monthsRatio) ? Math.min(999, Math.max(0, Math.floor(monthsRatio))) : 0;
    }
    
    return {
      monthlyNet: safeMonthlyNet,
      yearsToFreedom: yearsToFreedom,
      emergencyFund: safeEmergencyFund,
      rule4: safeRule4,
      monthsOfExpensesCovered: monthsOfExpensesCovered
    };
  });

  // Safe ratio calculation for expense ratio gauge
  const safeExpenseRatio = $derived.by(() => {
    const ratio = Number(analyticsData.expenseRatio) || 0;
    return isFinite(ratio) ? Math.max(0, Math.min(1, ratio)) : 0;
  });

  $effect(() => {
    if (selectedPeriod) {
      loadAnalyticsData();
    }
  });
</script>

<svelte:head>
  <title>Dashboard - Análisis Financiero</title>
</svelte:head>

<main class="min-h-screen" style="background-color: var(--color-background-primary);" role="main">
  <!-- Header -->
  <header class="sticky top-0 z-10 border-b" style="background-color: var(--color-background-elevated); border-color: var(--color-border-primary); backdrop-filter: blur(8px);">
    <div class="container-editorial">
      <div class="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div class="min-w-0 flex-1">
          <h1 class="text-2xl font-semibold sm:text-h3" style="color: var(--color-text-primary);">Dashboard Financiero</h1>
          <p class="text-body-small mt-1" style="color: var(--color-text-secondary);">Análisis inteligente de tus finanzas hacia la libertad financiera</p>
        </div>
        <div class="flex-shrink-0">
          <label for="period-select" class="sr-only">Seleccionar período de análisis</label>
          <select
            id="period-select"
            bind:value={selectedPeriod}
            class="input-editorial text-sm sm:text-base w-full sm:w-auto min-w-[160px]"
            aria-describedby="period-description"
          >
            <option value="current_month">Este mes</option>
            <option value="last_month">Mes pasado</option>
            <option value="last_3_months">Últimos 3 meses</option>
            <option value="last_6_months">Últimos 6 meses</option>
            <option value="this_year">Este año</option>
          </select>
          <p id="period-description" class="sr-only">Cambie el período para actualizar los datos del dashboard</p>
        </div>
      </div>
    </div>
  </header>

  <div class="container-editorial py-4 sm:py-6 space-y-6 sm:space-y-8">
    {#if isLoading}
      <div class="flex items-center justify-center py-12" role="status" aria-live="polite">
        <div class="flex items-center gap-3 text-secondary">
          <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-sage-green" aria-hidden="true"></div>
          <span>Analizando tus finanzas...</span>
        </div>
        <span class="sr-only">Cargando datos del dashboard financiero</span>
      </div>
    {:else}
      <!-- Hero Section - Financial Health Summary -->
      <section class="relative overflow-hidden fade-in">
        <div class="card-editorial p-4 sm:p-6 lg:p-8 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 hover-lift-subtle">
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-center">
            <div>
              <div class="flex items-center gap-3 mb-4 sm:mb-6">
                <div class="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-sm">
                  <BarChart3 class="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div>
                  <h2 class="text-lg sm:text-h4 font-semibold text-primary">Estado Financiero</h2>
                  <p class="text-xs sm:text-caption text-secondary">Resumen del período actual</p>
                </div>
              </div>
              
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4 sm:mb-6">
                <div class="p-3 bg-white/50 rounded-lg border border-white/60">
                  <p class="text-xs sm:text-caption text-secondary mb-1">Balance Mensual</p>
                  <p class="text-xl sm:text-h3 text-mono font-semibold {insights.monthlyNet >= 0 ? 'text-green-600' : 'text-red-600'}">
                    {formatCurrency(insights.monthlyNet)}
                  </p>
                </div>
                <div class="p-3 bg-white/50 rounded-lg border border-white/60">
                  <p class="text-xs sm:text-caption text-secondary mb-1">Tasa de Ahorro</p>
                  <p class="text-xl sm:text-h3 text-mono font-semibold text-blue-600">
                    {formatPercentage(analyticsData.savingsRate)}
                  </p>
                </div>
              </div>
              
              <div class="flex flex-wrap gap-2">
                {#if insights.monthlyNet > 0}
                  <span class="inline-flex items-center gap-1 px-2.5 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                    <TrendingUp class="w-3 h-3" />
                    Balance positivo
                  </span>
                {:else}
                  <span class="inline-flex items-center gap-1 px-2.5 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                    <AlertCircle class="w-3 h-3" />
                    Balance negativo
                  </span>
                {/if}
                
                {#if analyticsData.savingsRate > 0.2}
                  <span class="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                    <Target class="w-3 h-3" />
                    Excelente ahorro
                  </span>
                {/if}
              </div>
            </div>
            
            <div class="flex justify-center lg:justify-end mt-4 lg:mt-0">
              <div class="w-full max-w-sm lg:max-w-none">
                <ExpenseRatioGauge ratio={safeExpenseRatio} />
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Quick Actions -->
      <section class="slide-up stagger-1">
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4" role="region" aria-label="Acciones rápidas del dashboard">
          <a href="/transactions?filter=income" class="card-editorial p-4 sm:p-5 hover:shadow-md transition-all duration-200 text-left group block touch-manipulation hover-lift-subtle fade-in stagger-1" 
             aria-label="Ver ingresos: {formatCurrency(analyticsData.monthlyIncome)} con tendencia de +{formatPercentage(analyticsData.trends.incomeGrowth)}"
             tabindex="0">
            <div class="flex items-center gap-3 mb-3 sm:mb-4">
              <div class="w-10 h-10 sm:w-11 sm:h-11 bg-green-50 rounded-lg flex items-center justify-center group-hover:bg-green-100 transition-colors hover-scale" aria-hidden="true">
                <DollarSign class="w-5 h-5 sm:w-5.5 sm:h-5.5 text-green-600" />
              </div>
              <div class="min-w-0 flex-1">
                <p class="text-sm font-medium text-primary truncate">Ingresos</p>
                <p class="text-xs text-tertiary">Ver detalles</p>
              </div>
            </div>
            <p class="text-lg sm:text-xl font-bold text-green-600 text-mono truncate" aria-label="Ingresos totales: {formatCurrency(analyticsData.monthlyIncome)}">{formatCurrency(analyticsData.monthlyIncome)}</p>
            <p class="text-xs text-gray-400 mt-1">
              <span class="inline-flex items-center gap-1" aria-label="Crecimiento: {formatPercentage(analyticsData.trends.incomeGrowth)}">
                <TrendingUp class="w-3 h-3" aria-hidden="true" />
                +{formatPercentage(analyticsData.trends.incomeGrowth)}
              </span>
            </p>
          </a>
          
          <a href="/transactions?filter=expenses" class="card-editorial p-4 sm:p-5 hover:shadow-md transition-all duration-200 text-left group block touch-manipulation hover-lift-subtle fade-in stagger-2"
             aria-label="Ver gastos: {formatCurrency(analyticsData.monthlyExpenses)} con tendencia de +{formatPercentage(analyticsData.trends.expenseGrowth)}"
             tabindex="0">
            <div class="flex items-center gap-3 mb-3 sm:mb-4">
              <div class="w-10 h-10 sm:w-11 sm:h-11 bg-red-50 rounded-lg flex items-center justify-center group-hover:bg-red-100 transition-colors hover-scale" aria-hidden="true">
                <TrendingDown class="w-5 h-5 sm:w-5.5 sm:h-5.5 text-red-600" />
              </div>
              <div class="min-w-0 flex-1">
                <p class="text-sm font-medium text-primary truncate">Gastos</p>
                <p class="text-xs text-tertiary">Ver categorías</p>
              </div>
            </div>
            <p class="text-lg sm:text-xl font-bold text-red-600 text-mono truncate" aria-label="Gastos totales: {formatCurrency(analyticsData.monthlyExpenses)}">{formatCurrency(analyticsData.monthlyExpenses)}</p>
            <p class="text-xs text-gray-400 mt-1">
              <span class="inline-flex items-center gap-1" aria-label="Crecimiento: {formatPercentage(analyticsData.trends.expenseGrowth)}">
                <TrendingDown class="w-3 h-3" aria-hidden="true" />
                +{formatPercentage(analyticsData.trends.expenseGrowth)}
              </span>
            </p>
          </a>
          
          <a href="/savings" class="card-editorial p-4 sm:p-5 hover:shadow-md transition-all duration-200 text-left group block touch-manipulation hover-lift-subtle fade-in stagger-3">
            <div class="flex items-center gap-3 mb-3 sm:mb-4">
              <div class="w-10 h-10 sm:w-11 sm:h-11 bg-blue-50 rounded-lg flex items-center justify-center group-hover:bg-blue-100 transition-colors hover-scale">
                <PiggyBank class="w-5 h-5 sm:w-5.5 sm:h-5.5 text-blue-600" />
              </div>
              <div class="min-w-0 flex-1">
                <p class="text-sm font-medium text-primary truncate">Ahorros</p>
                <p class="text-xs text-tertiary">Gestionar</p>
              </div>
            </div>
            <p class="text-lg sm:text-xl font-bold text-blue-600 text-mono truncate">{formatCurrency(analyticsData.savingsData.totalSavings)}</p>
            <p class="text-xs text-gray-400 mt-1">
              {analyticsData.savingsData.accountCount} cuentas
            </p>
          </a>
          
          <a href="/budgets" class="card-editorial p-4 sm:p-5 hover:shadow-md transition-all duration-200 text-left group block touch-manipulation hover-lift-subtle fade-in stagger-4">
            <div class="flex items-center gap-3 mb-3 sm:mb-4">
              <div class="w-10 h-10 sm:w-11 sm:h-11 bg-purple-50 rounded-lg flex items-center justify-center group-hover:bg-purple-100 transition-colors hover-scale">
                <Target class="w-5 h-5 sm:w-5.5 sm:h-5.5 text-purple-600" />
              </div>
              <div class="min-w-0 flex-1">
                <p class="text-sm font-medium text-primary truncate">Libertad Financiera</p>
                <p class="text-xs text-tertiary">Proyección</p>
              </div>
            </div>
            <p class="text-lg sm:text-xl font-bold text-purple-600 truncate">
              {insights.yearsToFreedom > 0 ? `${insights.yearsToFreedom} años` : 'N/A'}
            </p>
            <p class="text-xs text-gray-400 mt-1">
              Regla del 4%
            </p>
          </a>
        </div>
      </section>
      <!-- Smart Insights Section -->
      <section class="slide-up stagger-2">
        <div class="card-editorial p-4 sm:p-6 hover-lift-subtle">
          <div class="flex items-center gap-3 mb-4 sm:mb-6">
            <div class="w-8 h-8 sm:w-9 sm:h-9 bg-purple-50 rounded-lg flex items-center justify-center flex-shrink-0">
              <AlertCircle class="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
            </div>
            <div class="min-w-0">
              <h3 class="text-base sm:text-h5 font-medium text-primary">Insights Inteligentes</h3>
              <p class="text-xs sm:text-caption text-secondary">Recomendaciones basadas en tus datos</p>
            </div>
          </div>
          
          <div class="space-y-3 sm:space-y-4">
            {#if insights.monthlyNet < 0}
              <div class="flex items-start gap-3 p-4 bg-red-50 rounded-lg border border-red-100">
                <AlertCircle class="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p class="text-sm font-medium text-red-800">Gastos superiores a ingresos</p>
                  <p class="text-xs text-red-700 mt-1">
                    Tus gastos superan tus ingresos en {formatCurrency(Math.abs(insights.monthlyNet))}. 
                    Revisa tus categorías de gastos para identificar oportunidades de ahorro.
                  </p>
                </div>
              </div>
            {:else if analyticsData.savingsRate < 0.1}
              <div class="flex items-start gap-3 p-4 bg-yellow-50 rounded-lg border border-yellow-100">
                <AlertCircle class="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p class="text-sm font-medium text-yellow-800">Tasa de ahorro baja</p>
                  <p class="text-xs text-yellow-700 mt-1">
                    Tu tasa de ahorro es del {formatPercentage(analyticsData.savingsRate)}. 
                    Intenta alcanzar al menos el 20% para una salud financiera óptima.
                  </p>
                </div>
              </div>
            {:else}
              <div class="flex items-start gap-3 p-4 bg-green-50 rounded-lg border border-green-100">
                <TrendingUp class="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p class="text-sm font-medium text-green-800">¡Excelente gestión financiera!</p>
                  <p class="text-xs text-green-700 mt-1">
                    Con una tasa de ahorro del {formatPercentage(analyticsData.savingsRate)}, 
                    estás en camino hacia la libertad financiera.
                  </p>
                </div>
              </div>
            {/if}
            
            {#if insights.yearsToFreedom > 0 && insights.yearsToFreedom <= 25}
              <div class="flex items-start gap-3 p-4 bg-blue-50 rounded-lg border border-blue-100">
                <Target class="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p class="text-sm font-medium text-blue-800">Proyección de libertad financiera</p>
                  <p class="text-xs text-blue-700 mt-1">
                    Al ritmo actual, podrías alcanzar la libertad financiera en {insights.yearsToFreedom} años
                    (necesitarías {formatCurrency(insights.rule4)} según la regla del 4%).
                  </p>
                </div>
              </div>
            {/if}
          </div>
        </div>
      </section>

      <!-- Expandable Analytics Sections -->
      <section class="slide-up stagger-3">
        <div class="space-y-3 sm:space-y-4">
          <!-- Spending Analysis -->
          <details class="card-editorial overflow-hidden hover-lift-subtle fade-in stagger-1">
            <summary class="p-4 sm:p-6 cursor-pointer hover:bg-secondary transition-colors flex items-center justify-between touch-manipulation list-none">
              <div class="flex items-center gap-3 min-w-0 flex-1">
                <div class="w-8 h-8 sm:w-9 sm:h-9 bg-red-50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <PieChart class="w-4 h-4 sm:w-5 sm:h-5 text-red-600" />
                </div>
                <div class="min-w-0 flex-1">
                  <h3 class="text-sm sm:text-base font-medium text-primary truncate">Análisis de Gastos</h3>
                  <p class="text-xs sm:text-caption text-secondary">Distribución por categorías</p>
                </div>
              </div>
              <div class="text-lg sm:text-2xl font-bold text-red-600 flex-shrink-0 ml-2">
                <span class="block sm:hidden">{formatCurrency(analyticsData.monthlyExpenses).replace(',00', '')}</span>
                <span class="hidden sm:block">{formatCurrency(analyticsData.monthlyExpenses)}</span>
              </div>
            </summary>
            <div class="px-4 sm:px-6 pb-4 sm:pb-6 border-t border-gray-100">
              <div class="mt-4">
                {#if categoryData.length > 0}
                  <CategoryPieChart 
                    data={categoryData}
                    height={250}
                  />
                {:else}
                  <div class="text-center py-6 sm:py-8 text-tertiary">
                    <PieChart class="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 text-gray-300" />
                    <p class="text-sm">No hay datos de categorías disponibles</p>
                  </div>
                {/if}
              </div>
            </div>
          </details>
          
          <!-- Savings Progress -->
          <details class="card-editorial overflow-hidden hover-lift-subtle fade-in stagger-2">
            <summary class="p-4 sm:p-6 cursor-pointer hover:bg-secondary transition-colors flex items-center justify-between touch-manipulation list-none">
              <div class="flex items-center gap-3 min-w-0 flex-1">
                <div class="w-8 h-8 sm:w-9 sm:h-9 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <PiggyBank class="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                </div>
                <div class="min-w-0 flex-1">
                  <h3 class="text-sm sm:text-base font-medium text-primary truncate">Estado de Ahorros</h3>
                  <p class="text-xs sm:text-caption text-secondary">Cuentas y objetivos</p>
                </div>
              </div>
              <div class="text-lg sm:text-2xl font-bold text-blue-600 flex-shrink-0 ml-2">
                <span class="block sm:hidden">{formatCurrency(analyticsData.savingsData.totalSavings).replace(',00', '')}</span>
                <span class="hidden sm:block">{formatCurrency(analyticsData.savingsData.totalSavings)}</span>
              </div>
            </summary>
            <div class="px-4 sm:px-6 pb-4 sm:pb-6 border-t border-gray-100">
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                <div class="p-4 bg-secondary rounded-lg">
                  <p class="text-caption text-secondary mb-1">Fondo de Emergencia</p>
                  <p class="text-h6 text-mono">{formatCurrency(insights.emergencyFund)}</p>
                  <p class="text-xs text-tertiary mt-1">6 meses de gastos</p>
                </div>
                <div class="p-4 bg-secondary rounded-lg">
                  <p class="text-caption text-secondary mb-1">Cuentas Activas</p>
                  <p class="text-h6">{analyticsData.savingsData.accountCount}</p>
                  <p class="text-xs text-tertiary mt-1">cuentas de ahorro</p>
                </div>
                <div class="p-4 bg-secondary rounded-lg">
                  <p class="text-caption text-secondary mb-1">Capacidad Mensual</p>
                  <p class="text-h6 text-mono">{formatCurrency(analyticsData.savingsData.monthlyWithdrawCapacity)}</p>
                  <p class="text-xs text-tertiary mt-1">retiro sostenible</p>
                </div>
                <div class="p-4 bg-secondary rounded-lg">
                  <p class="text-caption text-secondary mb-1">Años Cubiertos</p>
                  <p class="text-h6">{analyticsData.savingsData.yearsOfExpensesCovered}</p>
                  <p class="text-xs text-tertiary mt-1">al ritmo actual</p>
                </div>
              </div>
              
              {#if analyticsData.savingsData.targetAmount > 0}
                <div class="mt-4 p-4 bg-blue-50 rounded-lg">
                  <div class="flex justify-between items-center mb-2">
                    <span class="text-sm font-medium text-blue-800">Progreso hacia objetivo</span>
                    <span class="text-sm text-blue-600">
                      {((analyticsData.savingsData.totalSavings / analyticsData.savingsData.targetAmount) * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div class="w-full bg-blue-200 rounded-full h-2">
                    <div 
                      class="bg-blue-500 h-2 rounded-full transition-all duration-500"
                      style="width: {Math.min(100, (analyticsData.savingsData.totalSavings / analyticsData.savingsData.targetAmount) * 100)}%"
                    ></div>
                  </div>
                  <p class="text-xs text-blue-700 mt-2">
                    Faltan {formatCurrency(analyticsData.savingsData.remainingToTarget)} para alcanzar tu objetivo
                  </p>
                </div>
              {/if}
            </div>
          </details>
          
          <!-- Trends Analysis -->
          <details class="card-editorial overflow-hidden hover-lift-subtle fade-in stagger-3">
            <summary class="p-4 sm:p-6 cursor-pointer hover:bg-secondary transition-colors flex items-center justify-between touch-manipulation list-none">
              <div class="flex items-center gap-3 min-w-0 flex-1">
                <div class="w-8 h-8 sm:w-9 sm:h-9 bg-indigo-50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <BarChart3 class="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600" />
                </div>
                <div class="min-w-0 flex-1">
                  <h3 class="text-sm sm:text-base font-medium text-primary truncate">Evolución Temporal</h3>
                  <p class="text-xs sm:text-caption text-secondary">Tendencias de ingresos y gastos</p>
                </div>
              </div>
              <div class="text-right flex-shrink-0 ml-2">
                <div class="text-base sm:text-lg font-bold {insights.monthlyNet >= 0 ? 'text-green-600' : 'text-red-600'}">
                  <span class="block sm:hidden">{formatCurrency(insights.monthlyNet).replace(',00', '')}</span>
                  <span class="hidden sm:block">{formatCurrency(insights.monthlyNet)}</span>
                </div>
                <div class="text-xs text-tertiary">balance mensual</div>
              </div>
            </summary>
            <div class="px-4 sm:px-6 pb-4 sm:pb-6 border-t border-gray-100">
              <div class="mt-4">
                {#if trendData.length > 0}
                  <TrendChart 
                    data={trendData}
                    height={250}
                  />
                  <div class="mt-4 flex items-center justify-center gap-4 sm:gap-6 text-xs sm:text-sm text-secondary">
                    <div class="flex items-center gap-1.5 sm:gap-2">
                      <div class="w-3 h-3 rounded-full bg-green-500 flex-shrink-0"></div>
                      <span>Ingresos</span>
                    </div>
                    <div class="flex items-center gap-1.5 sm:gap-2">
                      <div class="w-3 h-3 rounded-full bg-red-500 flex-shrink-0"></div>
                      <span>Gastos</span>
                    </div>
                    <div class="flex items-center gap-1.5 sm:gap-2">
                      <div class="w-3 h-3 rounded-full bg-indigo-500 flex-shrink-0"></div>
                      <span>Balance</span>
                    </div>
                  </div>
                {:else}
                  <div class="text-center py-6 sm:py-8 text-tertiary">
                    <BarChart3 class="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 text-gray-300" />
                    <p class="text-sm">Generando datos de tendencias...</p>
                  </div>
                {/if}
              </div>
            </div>
          </details>
        </div>
      </section>
    {/if}
  </div>
</main>