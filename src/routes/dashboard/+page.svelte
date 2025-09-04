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
      
      if (analyticsResult.success) {
        analyticsData = analyticsResult.data;
      }
      
      // Load category data for pie chart
      if (categoryResult.success && categoryResult.data) {
        categoryData = categoryResult.data.map(item => ({
          categoryName: item.categoryName || 'Sin categoría',
          categoryType: item.categoryType || 'DISCRETIONARY_EXPENSE',
          amount: item.amount || 0,
          color: getCategoryColor(item.categoryType)
        }));
      }
      
      // Generate trend data (for now, we'll use mock data based on current analytics)
      generateTrendData();
      
    } catch (error) {
      console.error('Error loading analytics data:', error);
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
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      // Mock data with some variation
      const baseIncome = analyticsData.monthlyIncome / 30; // Daily average
      const baseExpenses = analyticsData.monthlyExpenses / 30; // Daily average
      
      const income = baseIncome * (0.8 + Math.random() * 0.4); // ±20% variation
      const expenses = baseExpenses * (0.8 + Math.random() * 0.4); // ±20% variation
      
      data.push({
        date: date.toISOString(),
        income: income,
        expenses: -expenses, // Negative for expenses
        balance: income - expenses
      });
    }
    
    trendData = data;
  }

  function formatCurrency(amount: number): string {
    // Protect against NaN, Infinity, and null values
    const safeAmount = isFinite(amount) ? amount : 0;
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(safeAmount);
  }

  function formatPercentage(ratio: number): string {
    // Protect against NaN and Infinity
    const safeRatio = isFinite(ratio) ? Math.max(0, ratio) : 0;
    return `${(safeRatio * 100).toFixed(1)}%`;
  }

  // Calculate financial freedom insights with NaN protection
  const insights = $derived.by(() => {
    const safeIncome = isFinite(analyticsData.monthlyIncome) ? analyticsData.monthlyIncome : 0;
    const safeExpenses = isFinite(analyticsData.monthlyExpenses) ? analyticsData.monthlyExpenses : 0;
    
    const monthlyNet = safeIncome - safeExpenses;
    const yearsToFreedom = monthlyNet > 0 && safeExpenses > 0 
      ? Math.min(100, Math.ceil((safeExpenses * 12 * 25) / (monthlyNet * 12)))
      : 0;
    
    return {
      monthlyNet: isFinite(monthlyNet) ? monthlyNet : 0,
      yearsToFreedom: isFinite(yearsToFreedom) ? yearsToFreedom : 0,
      emergencyFund: safeExpenses * 6,
      rule4: safeExpenses * 12 * 25, // 4% rule
      monthsOfExpensesCovered: monthlyNet > 0 && safeExpenses > 0 
        ? Math.min(999, Math.floor(monthlyNet / safeExpenses * 12))
        : 0
    };
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

<div class="min-h-screen bg-soft-white">
  <!-- Header -->
  <div class="glass-effect sticky top-0 z-10 border-b border-warm">
    <div class="container-editorial">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between py-4 gap-4">
        <div>
          <h1 class="text-h3">Dashboard Financiero</h1>
          <p class="text-body-small mt-1">Análisis inteligente de tus finanzas hacia la libertad financiera</p>
        </div>
        <div>
          <select
            bind:value={selectedPeriod}
            class="input-editorial"
          >
            <option value="current_month">Este mes</option>
            <option value="last_month">Mes pasado</option>
            <option value="last_3_months">Últimos 3 meses</option>
            <option value="last_6_months">Últimos 6 meses</option>
            <option value="this_year">Este año</option>
          </select>
        </div>
      </div>
    </div>
  </div>

  <div class="container-editorial py-6 space-y-8">
    {#if isLoading}
      <div class="flex items-center justify-center py-12">
        <div class="flex items-center gap-3 text-gray-600">
          <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-sage-green"></div>
          <span>Analizando tus finanzas...</span>
        </div>
      </div>
    {:else}
      <!-- Key Financial Metrics -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <!-- Income -->
        <div class="metric-card income">
          <div class="flex items-start justify-between">
            <div class="flex-1">
              <p class="text-caption mb-1">Ingresos Mensuales</p>
              <p class="text-h4 status-success text-mono mb-2">{formatCurrency(analyticsData.monthlyIncome)}</p>
              <div class="flex items-center gap-1 text-xs">
                <TrendingUp class="w-3 h-3 text-green-600" />
                <span class="text-green-600">+{formatPercentage(analyticsData.trends.incomeGrowth)}</span>
              </div>
            </div>
            <div class="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
              <TrendingUp class="w-6 h-6 status-success" />
            </div>
          </div>
        </div>

        <!-- Expenses -->
        <div class="metric-card expense">
          <div class="flex items-start justify-between">
            <div class="flex-1">
              <p class="text-caption mb-1">Gastos Mensuales</p>
              <p class="text-h4 status-error text-mono mb-2">{formatCurrency(analyticsData.monthlyExpenses)}</p>
              <div class="flex items-center gap-1 text-xs">
                <TrendingDown class="w-3 h-3 text-red-600" />
                <span class="text-red-600">+{formatPercentage(analyticsData.expenseGrowth)}</span>
              </div>
            </div>
            <div class="w-12 h-12 bg-red-50 rounded-lg flex items-center justify-center">
              <TrendingDown class="w-6 h-6 status-error" />
            </div>
          </div>
        </div>

        <!-- Net Income -->
        <div class="metric-card {insights.monthlyNet >= 0 ? 'income' : 'expense'}">
          <div class="flex items-start justify-between">
            <div class="flex-1">
              <p class="text-caption mb-1">Ahorro Mensual</p>
              <p class="text-h4 text-mono mb-2 {insights.monthlyNet >= 0 ? 'status-success' : 'status-error'}">
                {formatCurrency(insights.monthlyNet)}
              </p>
              <div class="flex items-center gap-1 text-xs">
                <Target class="w-3 h-3 text-indigo-600" />
                <span class="text-indigo-600">{formatPercentage(analyticsData.savingsRate)}</span>
              </div>
            </div>
            <div class="w-12 h-12 bg-indigo-50 rounded-lg flex items-center justify-center">
              <PiggyBank class="w-6 h-6 status-info" />
            </div>
          </div>
        </div>

        <!-- Financial Freedom Progress -->
        <div class="metric-card neutral">
          <div class="flex items-start justify-between">
            <div class="flex-1">
              <p class="text-caption mb-1">Progreso Libertad Financiera</p>
              <p class="text-h4 text-mono mb-2">
                {formatPercentage(analyticsData.financialFreedomProgress)}
              </p>
              <div class="flex items-center gap-1 text-xs">
                <Calendar class="w-3 h-3 text-gray-600" />
                <span class="text-gray-600">Regla del 4%</span>
              </div>
            </div>
            <div class="w-12 h-12 bg-gray-50 rounded-lg flex items-center justify-center">
              <Target class="w-6 h-6 text-gray-500" />
            </div>
          </div>
        </div>
      </div>

      <!-- Savings Overview -->
      <div class="card-editorial p-6">
        <div class="flex items-center justify-between mb-6">
          <div>
            <h3 class="text-h4 flex items-center gap-2">
              <PiggyBank class="w-5 h-5 text-blue-600" />
              Resumen de Ahorros
            </h3>
            <p class="text-body-small mt-1">Estado actual de tus cuentas de ahorro y progreso hacia libertad financiera</p>
          </div>
          <a href="/savings" class="btn-editorial btn-secondary">
            Ver Detalles
          </a>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <!-- Total Savings -->
          <div class="p-4 bg-blue-50 rounded-lg">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-blue-900">Ahorros Totales</p>
                <p class="text-lg font-bold text-blue-600">
                  {formatCurrency(analyticsData.savingsData.totalSavings)}
                </p>
              </div>
              <PiggyBank class="w-8 h-8 text-blue-600" />
            </div>
          </div>

          <!-- Account Count -->
          <div class="p-4 bg-green-50 rounded-lg">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-green-900">Cuentas Activas</p>
                <p class="text-lg font-bold text-green-600">
                  {analyticsData.savingsData.accountCount}
                </p>
              </div>
              <BarChart3 class="w-8 h-8 text-green-600" />
            </div>
          </div>

          <!-- Monthly Withdraw Capacity -->
          <div class="p-4 bg-purple-50 rounded-lg">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-purple-900">Capacidad Mensual</p>
                <p class="text-lg font-bold text-purple-600">
                  {formatCurrency(analyticsData.savingsData.monthlyWithdrawCapacity)}
                </p>
              </div>
              <DollarSign class="w-8 h-8 text-purple-600" />
            </div>
          </div>

          <!-- Years Covered -->
          <div class="p-4 bg-orange-50 rounded-lg">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-orange-900">Años Cubiertos</p>
                <p class="text-lg font-bold text-orange-600">
                  {analyticsData.savingsData.yearsOfExpensesCovered.toFixed(1)}
                </p>
              </div>
              <Calendar class="w-8 h-8 text-orange-600" />
            </div>
          </div>
        </div>

        <!-- Financial Freedom Progress Bar -->
        <div class="space-y-4">
          <div class="flex justify-between items-center">
            <h4 class="font-medium text-gray-900">Progreso hacia Libertad Financiera</h4>
            <span class="text-sm text-gray-600">
              {formatPercentage(analyticsData.financialFreedomProgress)} completado
            </span>
          </div>
          
          <div class="w-full bg-gray-200 rounded-full h-3">
            <div 
              class="h-3 rounded-full transition-all duration-500 bg-gradient-to-r from-blue-500 to-purple-500"
              style="width: {Math.min(analyticsData.financialFreedomProgress * 100, 100)}%"
            ></div>
          </div>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div class="flex justify-between">
              <span class="text-gray-600">Ahorros actuales:</span>
              <span class="font-medium">{formatCurrency(analyticsData.savingsData.totalSavings)}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-600">Objetivo libertad financiera:</span>
              <span class="font-medium">{formatCurrency(analyticsData.savingsData.targetAmount)}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-600">Restante:</span>
              <span class="font-medium">{formatCurrency(analyticsData.savingsData.remainingToTarget)}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-600">Con ahorros actuales (4%):</span>
              <span class="font-medium">{formatCurrency(analyticsData.savingsData.monthlyWithdrawCapacity * 12)} anuales</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Financial Health Insights -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <!-- Financial Rules & Goals -->
        <div class="card-editorial p-6">
          <h3 class="text-h4 mb-4 flex items-center gap-2">
            <BarChart3 class="w-5 h-5 text-indigo-600" />
            Análisis Financiero
          </h3>
          
          <div class="space-y-4">
            <!-- Expense Ratio -->
            <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p class="font-medium text-gray-900">Ratio de Gastos</p>
                <p class="text-sm text-gray-600">De cada 10€ que ingresas, gastas {(isFinite(analyticsData.expenseRatio) ? analyticsData.expenseRatio * 10 : 0).toFixed(1)}€</p>
              </div>
              <div class="text-right">
                <p class="text-xl font-semibold {analyticsData.expenseRatio > 0.8 ? 'text-red-600' : analyticsData.expenseRatio > 0.6 ? 'text-orange-600' : 'text-green-600'}">
                  {formatPercentage(analyticsData.expenseRatio)}
                </p>
              </div>
            </div>

            <!-- Emergency Fund -->
            <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p class="font-medium text-gray-900">Fondo de Emergencia</p>
                <p class="text-sm text-gray-600">Recomendado: 6 meses de gastos</p>
              </div>
              <div class="text-right">
                <p class="text-xl font-semibold text-indigo-600">
                  {formatCurrency(insights.emergencyFund)}
                </p>
              </div>
            </div>

            <!-- 4% Rule -->
            <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p class="font-medium text-gray-900">Capital para Libertad Financiera</p>
                <p class="text-sm text-gray-600">Regla del 4% (25x gastos anuales)</p>
              </div>
              <div class="text-right">
                <p class="text-xl font-semibold text-purple-600">
                  {formatCurrency(insights.rule4)}
                </p>
              </div>
            </div>
          </div>
        </div>

      </div>

      <!-- Charts Section -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Expense Ratio Gauge -->
        <div class="card-editorial p-6">
          <h3 class="text-h4 mb-4 flex items-center gap-2">
            <Target class="w-5 h-5 text-indigo-600" />
            Ratio de Gastos
          </h3>
          <ExpenseRatioGauge 
            expenseRatio={analyticsData.expenseRatio} 
            height={200}
            class="mt-4"
          />
          <div class="mt-4 p-3 bg-gray-50 rounded-lg">
            <p class="text-sm text-gray-600 text-center">
              Por cada <strong>€10</strong> que ingresas, gastas <strong>€{(isFinite(analyticsData.expenseRatio) ? analyticsData.expenseRatio * 10 : 0).toFixed(1)}</strong>
            </p>
          </div>
        </div>
        
        <!-- Category Breakdown -->
        <div class="lg:col-span-2 card-editorial p-6">
          <h3 class="text-h4 mb-4 flex items-center gap-2">
            <PieChart class="w-5 h-5 text-blue-600" />
            Gastos por Categoría
          </h3>
          <CategoryPieChart 
            data={categoryData}
            height={250}
            class="mt-4"
          />
        </div>
      </div>
      
      <!-- Trend Chart -->
      <div class="card-editorial p-6">
        <h3 class="text-h4 mb-4 flex items-center gap-2">
          <BarChart3 class="w-5 h-5 text-gray-600" />
          Evolución Semanal
        </h3>
        <TrendChart 
          data={trendData}
          height={300}
          class="mt-4"
        />
        <div class="mt-4 flex items-center justify-center gap-6 text-sm text-gray-600">
          <div class="flex items-center gap-2">
            <div class="w-3 h-3 rounded-full bg-green-500"></div>
            <span>Ingresos</span>
          </div>
          <div class="flex items-center gap-2">
            <div class="w-3 h-3 rounded-full bg-red-500"></div>
            <span>Gastos</span>
          </div>
          <div class="flex items-center gap-2">
            <div class="w-3 h-3 rounded-full bg-indigo-500"></div>
            <span>Balance Neto</span>
          </div>
        </div>
      </div>
    {/if}
  </div>
</div>