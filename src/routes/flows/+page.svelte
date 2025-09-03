<script lang="ts">
	import { ArrowUpCircle, ArrowDownCircle, Filter, Calendar, PieChart, TrendingUp, TrendingDown, Receipt, Building } from 'lucide-svelte';
	import { onMount } from 'svelte';

	// State variables using $state
	let flowData = $state({
		summary: {
			totalIncome: 0,
			totalExpenses: 0,
			netFlow: 0,
			transactionCount: 0,
			period: '30d'
		},
		incomeData: [],
		expenseData: [],
		topMerchants: []
	});

	let isLoading = $state(false);
	let error = $state('');

	// Filter states
	let selectedPeriod = $state('30d');
	let selectedSource = $state('all');
	let showFilters = $state(false);

	// Load flow data
	async function loadFlowData() {
		isLoading = true;
		error = '';
		
		try {
			const params = new URLSearchParams({
				period: selectedPeriod
			});
			
			const response = await fetch(`/api/analytics/flows?${params}`);
			const result = await response.json();
			
			if (result.success) {
				flowData = result.data;
			} else {
				error = result.error || 'Error al cargar los datos de flujos';
			}
		} catch (err) {
			console.error('Error loading flow data:', err);
			error = 'Error de conexión. Por favor intenta de nuevo.';
		} finally {
			isLoading = false;
		}
	}

	// Load data on mount and when period changes
	onMount(() => {
		loadFlowData();
	});

	// Reload data when period changes
	$effect(() => {
		if (selectedPeriod) {
			loadFlowData();
		}
	});

	const periods = [
		{ value: '7d', label: '7 días' },
		{ value: '30d', label: '30 días' },
		{ value: '90d', label: '90 días' },
		{ value: '1y', label: '1 año' }
	];

	const formatCurrency = (amount: number) => {
		return new Intl.NumberFormat('es-ES', {
			style: 'currency',
			currency: 'EUR'
		}).format(amount);
	};

	const getTrendIcon = (trend: string) => {
		switch (trend) {
			case 'up':
				return TrendingUp;
			case 'down':
				return TrendingDown;
			default:
				return PieChart;
		}
	};

	const getTrendColor = (trend: string) => {
		switch (trend) {
			case 'up':
				return 'text-green-600';
			case 'down':
				return 'text-red-600';
			default:
				return 'text-gray-600';
		}
	};
</script>

<svelte:head>
	<title>Análisis de Flujos - Expense Tracker</title>
</svelte:head>

<!-- Main Content -->
<div class="p-6">
	<!-- Page Header -->
	<div class="mb-6">
		<div class="flex items-center justify-between">
			<div>
				<h1 class="text-2xl font-bold text-gray-900 mb-2">Análisis de Flujos</h1>
				<p class="text-gray-600">Ingresos y gastos por fuentes</p>
			</div>
			<button
				onclick={() => showFilters = !showFilters}
				class="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
			>
				<Filter class="w-4 h-4" />
				Filtros
			</button>
		</div>
	</div>

	<!-- Filters -->
	{#if showFilters}
		<div class="bg-white border border-gray-200 rounded-lg p-4 mb-6">
				<div class="flex flex-col sm:flex-row gap-4">
					<div class="flex-1">
						<label for="period-select" class="block text-sm font-medium text-gray-700 mb-2">
							<Calendar class="w-4 h-4 inline mr-1" />
							Período
						</label>
						<select id="period-select" bind:value={selectedPeriod} class="w-full sm:w-auto px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
							{#each periods as period}
								<option value={period.value}>{period.label}</option>
							{/each}
						</select>
					</div>
					<div class="flex-1">
						<label for="source-select" class="block text-sm font-medium text-gray-700 mb-2">
							Fuente de datos
						</label>
						<select id="source-select" bind:value={selectedSource} class="w-full sm:w-auto px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
							<option value="all">Todas las fuentes</option>
							<option value="manual">Entrada manual</option>
							<option value="csv">Importación CSV</option>
						</select>
					</div>
				</div>
		</div>
	{/if}

	<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
		<!-- Summary Cards -->
		<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
			<div class="bg-white rounded-lg border border-gray-200 p-4">
				<div class="flex items-center justify-between">
					<div>
						<p class="text-sm font-medium text-gray-500">Total Ingresos</p>
						<p class="text-2xl font-bold text-green-600">{formatCurrency(flowData.summary.totalIncome)}</p>
					</div>
					<ArrowUpCircle class="w-8 h-8 text-green-600" />
				</div>
			</div>
			<div class="bg-white rounded-lg border border-gray-200 p-4">
				<div class="flex items-center justify-between">
					<div>
						<p class="text-sm font-medium text-gray-500">Total Gastos</p>
						<p class="text-2xl font-bold text-red-600">{formatCurrency(flowData.summary.totalExpenses)}</p>
					</div>
					<ArrowDownCircle class="w-8 h-8 text-red-600" />
				</div>
			</div>
			<div class="bg-white rounded-lg border border-gray-200 p-4">
				<div class="flex items-center justify-between">
					<div>
						<p class="text-sm font-medium text-gray-500">Flujo Neto</p>
						<p class="text-2xl font-bold {flowData.summary.netFlow >= 0 ? 'text-green-600' : 'text-red-600'}">
							{formatCurrency(flowData.summary.netFlow)}
						</p>
					</div>
					<PieChart class="w-8 h-8 text-gray-600" />
				</div>
			</div>
			<div class="bg-white rounded-lg border border-gray-200 p-4">
				<div class="flex items-center justify-between">
					<div>
						<p class="text-sm font-medium text-gray-500">Transacciones</p>
						<p class="text-2xl font-bold text-gray-900">{flowData.summary.transactionCount}</p>
					</div>
					<Receipt class="w-8 h-8 text-gray-600" />
				</div>
			</div>
		</div>

		<!-- Main Content Grid -->
		<div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
			<!-- Income Sources -->
			<div class="bg-white rounded-lg border border-gray-200 p-6">
				<div class="flex items-center justify-between mb-6">
					<h2 class="text-lg font-semibold text-gray-900">Fuentes de Ingresos</h2>
					<ArrowUpCircle class="w-5 h-5 text-green-600" />
				</div>
				<div class="space-y-4">
					{#if isLoading}
						<div class="animate-pulse space-y-4">
							{#each Array(4) as _}
								<div class="h-16 bg-gray-200 rounded-lg"></div>
							{/each}
						</div>
					{:else if flowData.incomeData.length > 0}
						{#each flowData.incomeData as income}
							<div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
								<div class="flex items-center gap-3">
									<svelte:component 
										this={getTrendIcon(income.trend)} 
										class="w-4 h-4 {getTrendColor(income.trend)}" 
									/>
									<div>
										<p class="font-medium text-gray-900">{income.source}</p>
										<p class="text-sm text-gray-500">{income.percentage}% del total</p>
									</div>
								</div>
								<div class="text-right">
									<p class="font-semibold text-green-600">{formatCurrency(income.amount)}</p>
								</div>
							</div>
						{/each}
					{:else}
						<div class="text-center py-8 text-gray-500">
							<p class="text-sm">No hay ingresos en el período seleccionado</p>
						</div>
					{/if}
				</div>
			</div>

			<!-- Expense Categories -->
			<div class="bg-white rounded-lg border border-gray-200 p-6">
				<div class="flex items-center justify-between mb-6">
					<h2 class="text-lg font-semibold text-gray-900">Categorías de Gastos</h2>
					<ArrowDownCircle class="w-5 h-5 text-red-600" />
				</div>
				<div class="space-y-4">
					{#if isLoading}
						<div class="animate-pulse space-y-4">
							{#each Array(4) as _}
								<div class="h-16 bg-gray-200 rounded-lg"></div>
							{/each}
						</div>
					{:else if flowData.expenseData.length > 0}
						{#each flowData.expenseData as expense}
							<div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
								<div class="flex items-center gap-3">
									<div class="w-3 h-3 rounded-full {expense.essential ? 'bg-red-500' : 'bg-orange-500'}"></div>
									<div>
										<p class="font-medium text-gray-900">{expense.category}</p>
										<p class="text-sm text-gray-500">
											{expense.percentage}% • {expense.essential ? 'Esencial' : 'Discrecional'}
										</p>
									</div>
								</div>
								<div class="text-right">
									<p class="font-semibold text-red-600">{formatCurrency(expense.amount)}</p>
								</div>
							</div>
						{/each}
					{:else}
						<div class="text-center py-8 text-gray-500">
							<p class="text-sm">No hay gastos en el período seleccionado</p>
						</div>
					{/if}
				</div>
			</div>
		</div>

		<!-- Top Merchants -->
		<div class="bg-white rounded-lg border border-gray-200 p-6">
			<div class="flex items-center justify-between mb-6">
				<h2 class="text-lg font-semibold text-gray-900">Principales Comercios</h2>
				<Building class="w-5 h-5 text-gray-600" />
			</div>
			<div class="overflow-x-auto">
				<table class="w-full">
					<thead class="border-b border-gray-200">
						<tr>
							<th class="text-left py-3 px-4 font-medium text-gray-900">Comercio</th>
							<th class="text-right py-3 px-4 font-medium text-gray-900">Importe</th>
							<th class="text-right py-3 px-4 font-medium text-gray-900">Transacciones</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-gray-200">
						{#if isLoading}
							{#each Array(4) as _}
								<tr class="animate-pulse">
									<td class="py-3 px-4"><div class="h-4 bg-gray-200 rounded w-24"></div></td>
									<td class="py-3 px-4 text-right"><div class="h-4 bg-gray-200 rounded w-16 ml-auto"></div></td>
									<td class="py-3 px-4 text-right"><div class="h-4 bg-gray-200 rounded w-8 ml-auto"></div></td>
								</tr>
							{/each}
						{:else if flowData.topMerchants.length > 0}
							{#each flowData.topMerchants as merchant}
								<tr class="hover:bg-gray-50">
									<td class="py-3 px-4">
										<p class="font-medium text-gray-900">{merchant.name}</p>
									</td>
									<td class="py-3 px-4 text-right">
										<p class="font-semibold text-gray-900">{formatCurrency(merchant.amount)}</p>
									</td>
									<td class="py-3 px-4 text-right">
										<p class="text-gray-600">{merchant.transactions}</p>
									</td>
								</tr>
							{/each}
						{:else}
							<tr>
								<td colspan="3" class="py-8 px-4 text-center text-gray-500">
									<p class="text-sm">No hay datos de comercios en el período seleccionado</p>
								</td>
							</tr>
						{/if}
					</tbody>
				</table>
			</div>
		</div>

		<!-- Error Display -->
		{#if error}
			<div class="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
				<div class="text-red-600 mb-4">
					<p class="font-medium">Error al cargar datos</p>
					<p class="text-sm text-red-500 mt-1">{error}</p>
				</div>
				<button 
					onclick={loadFlowData}
					class="inline-flex items-center justify-center px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors"
				>
					Reintentar
				</button>
			</div>
		{/if}

		<!-- Empty State Message -->
		{#if !isLoading && !error && flowData.summary.transactionCount === 0}
			<div class="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
				<Receipt class="w-12 h-12 text-blue-600 mx-auto mb-4" />
				<h3 class="text-lg font-semibold text-blue-900 mb-2">Comenzar análisis</h3>
				<p class="text-blue-700 mb-4">
					Para ver análisis detallados, comienza agregando transacciones manualmente o importa datos CSV.
				</p>
				<div class="flex flex-col sm:flex-row gap-3 justify-center">
					<a 
						href="/transactions/new" 
						class="inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
					>
						Agregar Transacción
					</a>
					<a 
						href="/import" 
						class="inline-flex items-center justify-center px-4 py-2 border border-blue-600 text-blue-600 font-medium rounded-lg hover:bg-blue-50 transition-colors"
					>
						Importar CSV
					</a>
				</div>
			</div>
		{/if}
	</div>
</div>