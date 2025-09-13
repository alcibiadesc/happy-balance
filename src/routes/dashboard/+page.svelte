<script>
	import { onMount } from 'svelte';
	import ThemeToggle from '$lib/components/ThemeToggle.svelte';
	import { 
		TrendingUp, 
		TrendingDown, 
		DollarSign, 
		CreditCard,
		ShoppingCart,
		Home,
		Car,
		Heart,
		Zap,
		Coffee,
		Gift,
		MoreHorizontal,
		Plus,
		Download,
		Filter
	} from 'lucide-svelte';

	// Estado reactivo con Svelte 5
	let isLoading = $state(true);
	let error = $state(null);
	let dashboardData = $state({
		balance: 0,
		income: 0,
		expenses: 0,
		savings: 0,
		transactions: [],
		categories: []
	});

	// Función para cargar datos del dashboard
	async function loadDashboardData() {
		try {
			isLoading = true;
			// Simulando carga de datos - Reemplazar con tu API real
			await new Promise(resolve => setTimeout(resolve, 1000));
			
			dashboardData = {
				balance: 15750.50,
				income: 8500.00,
				expenses: 6749.50,
				savings: 1750.50,
				transactions: [
					{ id: 1, description: 'Supermercado Whole Foods', amount: -125.30, category: 'Alimentación', date: '2024-01-15', icon: ShoppingCart },
					{ id: 2, description: 'Transferencia salario', amount: 3500.00, category: 'Ingresos', date: '2024-01-14', icon: DollarSign },
					{ id: 3, description: 'Netflix mensual', amount: -15.99, category: 'Suscripciones', date: '2024-01-13', icon: Zap },
					{ id: 4, description: 'Gasolina Shell', amount: -65.00, category: 'Transporte', date: '2024-01-12', icon: Car },
					{ id: 5, description: 'Café Blue Bottle', amount: -5.50, category: 'Alimentación', date: '2024-01-12', icon: Coffee },
				],
				categories: [
					{ name: 'Alimentación', spent: 1850, budget: 2000, icon: ShoppingCart, percentage: 92.5 },
					{ name: 'Transporte', spent: 450, budget: 600, icon: Car, percentage: 75 },
					{ name: 'Vivienda', spent: 2500, budget: 2500, icon: Home, percentage: 100 },
					{ name: 'Salud', spent: 200, budget: 400, icon: Heart, percentage: 50 },
					{ name: 'Entretenimiento', spent: 320, budget: 500, icon: Gift, percentage: 64 },
				]
			};
		} catch (err) {
			error = err.message;
		} finally {
			isLoading = false;
		}
	}

	// Formatear moneda
	function formatCurrency(amount) {
		return new Intl.NumberFormat('es-ES', {
			style: 'currency',
			currency: 'EUR'
		}).format(amount);
	}

	// Formatear fecha
	function formatDate(dateString) {
		return new Date(dateString).toLocaleDateString('es-ES', {
			day: 'numeric',
			month: 'short'
		});
	}

	// Obtener color según el porcentaje
	function getProgressColor(percentage) {
		if (percentage >= 90) return 'progress-error';
		if (percentage >= 70) return 'progress-warning';
		return 'progress-success';
	}

	// Cargar datos al montar el componente
	onMount(() => {
		loadDashboardData();
	});
</script>

<div class="min-h-screen bg-base-100 p-4 md:p-6">
	<!-- Header -->
	<div class="navbar bg-base-200 rounded-box mb-6 shadow-sm">
		<div class="flex-1">
			<h1 class="text-2xl font-bold text-base-content">Dashboard Financiero</h1>
		</div>
		<div class="flex-none gap-2">
			<button class="btn btn-primary btn-sm gap-2">
				<Plus size={16} />
				Nueva Transacción
			</button>
			<button class="btn btn-ghost btn-sm btn-square">
				<Filter size={16} />
			<ThemeToggle />
			</button>
			<button class="btn btn-ghost btn-sm btn-square">
				<Download size={16} />
			</button>
		</div>
	</div>

	{#if isLoading}
		<!-- Loading State con DaisyUI -->
		<div class="flex items-center justify-center min-h-[400px]">
			<div class="loading loading-spinner loading-lg text-primary"></div>
		</div>
	{:else if error}
		<!-- Error State -->
		<div class="alert alert-error">
			<svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
			</svg>
			<span>Error: {error}</span>
		</div>
	{:else}
		<!-- Resumen Financiero con Cards de DaisyUI -->
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
			<div class="card bg-base-200 shadow-sm">
				<div class="card-body p-4">
					<div class="flex items-center justify-between">
						<div>
							<p class="text-sm opacity-70">Balance Total</p>
							<p class="text-2xl font-bold text-primary">{formatCurrency(dashboardData.balance)}</p>
						</div>
						<div class="avatar placeholder">
							<div class="bg-primary text-primary-content rounded-full w-12">
								<DollarSign size={24} />
							</div>
						</div>
					</div>
				</div>
			</div>

			<div class="card bg-base-200 shadow-sm">
				<div class="card-body p-4">
					<div class="flex items-center justify-between">
						<div>
							<p class="text-sm opacity-70">Ingresos</p>
							<p class="text-2xl font-bold text-success">{formatCurrency(dashboardData.income)}</p>
						</div>
						<div class="avatar placeholder">
							<div class="bg-success text-success-content rounded-full w-12">
								<TrendingUp size={24} />
							</div>
						</div>
					</div>
				</div>
			</div>

			<div class="card bg-base-200 shadow-sm">
				<div class="card-body p-4">
					<div class="flex items-center justify-between">
						<div>
							<p class="text-sm opacity-70">Gastos</p>
							<p class="text-2xl font-bold text-error">{formatCurrency(dashboardData.expenses)}</p>
						</div>
						<div class="avatar placeholder">
							<div class="bg-error text-error-content rounded-full w-12">
								<TrendingDown size={24} />
							</div>
						</div>
					</div>
				</div>
			</div>

			<div class="card bg-base-200 shadow-sm">
				<div class="card-body p-4">
					<div class="flex items-center justify-between">
						<div>
							<p class="text-sm opacity-70">Ahorros</p>
							<p class="text-2xl font-bold text-accent">{formatCurrency(dashboardData.savings)}</p>
						</div>
						<div class="avatar placeholder">
							<div class="bg-accent text-accent-content rounded-full w-12">
								<CreditCard size={24} />
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>

		<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
			<!-- Transacciones Recientes -->
			<div class="lg:col-span-2">
				<div class="card bg-base-200 shadow-sm">
					<div class="card-body">
						<h2 class="card-title text-lg mb-4">Transacciones Recientes</h2>
						<div class="overflow-x-auto">
							<table class="table table-zebra">
								<tbody>
									{#each dashboardData.transactions as transaction}
										<tr class="hover">
											<td class="w-12">
												<div class="avatar placeholder">
													<div class="bg-base-300 text-base-content rounded-full w-10">
														<svelte:component this={transaction.icon} size={20} />
													</div>
												</div>
											</td>
											<td>
												<div>
													<div class="font-medium">{transaction.description}</div>
													<div class="text-sm opacity-50">{transaction.category}</div>
												</div>
											</td>
											<td class="text-right">
												<div class="badge badge-ghost badge-sm">
													{formatDate(transaction.date)}
												</div>
											</td>
											<td class="text-right">
												<span class="font-semibold" class:text-success={transaction.amount > 0} class:text-error={transaction.amount < 0}>
													{formatCurrency(Math.abs(transaction.amount))}
												</span>
											</td>
										</tr>
									{/each}
								</tbody>
							</table>
						</div>
						<div class="card-actions justify-end mt-4">
							<button class="btn btn-ghost btn-sm">Ver todas</button>
						</div>
					</div>
				</div>
			</div>

			<!-- Presupuesto por Categoría -->
			<div>
				<div class="card bg-base-200 shadow-sm">
					<div class="card-body">
						<h2 class="card-title text-lg mb-4">Presupuesto por Categoría</h2>
						<div class="space-y-4">
							{#each dashboardData.categories as category}
								<div class="space-y-2">
									<div class="flex items-center justify-between">
										<div class="flex items-center gap-2">
											<div class="avatar placeholder">
												<div class="bg-base-300 text-base-content rounded-full w-8">
													<svelte:component this={category.icon} size={16} />
												</div>
											</div>
											<span class="text-sm font-medium">{category.name}</span>
										</div>
										<span class="text-xs opacity-70">
											{formatCurrency(category.spent)} / {formatCurrency(category.budget)}
										</span>
									</div>
									<progress 
										class="progress {getProgressColor(category.percentage)} w-full" 
										value={category.percentage} 
										max="100"
									></progress>
								</div>
							{/each}
						</div>
					</div>
				</div>

				<!-- Metas de Ahorro -->
				<div class="card bg-base-200 shadow-sm mt-4">
					<div class="card-body">
						<h2 class="card-title text-lg mb-4">Meta de Ahorro</h2>
						<div class="text-center py-4">
							<div class="radial-progress text-primary" style="--value:{(dashboardData.savings / 5000) * 100}; --size:8rem;">
								{Math.round((dashboardData.savings / 5000) * 100)}%
							</div>
							<p class="mt-4 text-sm opacity-70">
								{formatCurrency(dashboardData.savings)} de {formatCurrency(5000)}
							</p>
							<p class="text-xs opacity-50 mt-1">Objetivo: Fondo de emergencia</p>
						</div>
					</div>
				</div>
			</div>
		</div>

		<!-- Stats adicionales -->
		<div class="stats stats-vertical lg:stats-horizontal shadow-sm bg-base-200 mt-6 w-full">
			<div class="stat">
				<div class="stat-title">Promedio diario</div>
				<div class="stat-value text-2xl">{formatCurrency(dashboardData.expenses / 30)}</div>
				<div class="stat-desc">En los últimos 30 días</div>
			</div>
			
			<div class="stat">
				<div class="stat-title">Mayor gasto</div>
				<div class="stat-value text-2xl">Vivienda</div>
				<div class="stat-desc">37% del presupuesto total</div>
			</div>
			
			<div class="stat">
				<div class="stat-title">Tasa de ahorro</div>
				<div class="stat-value text-2xl text-success">20.6%</div>
				<div class="stat-desc text-success">↗︎ 2% más que el mes anterior</div>
			</div>
		</div>
	{/if}
</div>

<style>
	/* Transiciones suaves para elementos interactivos */
	:global(.card) {
		transition: transform 0.2s ease, box-shadow 0.2s ease;
	}
	
	:global(.card:hover) {
		transform: translateY(-2px);
	}

	/* Animación para el loading */
	:global(.loading) {
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		from { transform: rotate(0deg); }
		to { transform: rotate(360deg); }
	}
</style>
