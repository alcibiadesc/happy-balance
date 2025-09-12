<script lang="ts">
	import { Plus, ArrowLeft, TrendingUp, TrendingDown } from 'lucide-svelte';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

	// Form state using $state
	let formData = $state({
		partnerName: '',
		amount: 0,
		type: 'expense' as 'income' | 'expense',
		categoryId: '',
		description: '',
		date: new Date().toISOString().split('T')[0]
	});

	let isLoading = $state(false);
	let error = $state('');
	let categories = $state([]);
	let defaultAccount = $state(null);
	let success = $state('');

	// Load initial data
	onMount(async () => {
		try {
			// Initialize app and get default data
			const setupResponse = await fetch('/api/setup');
			const setupData = await setupResponse.json();
			
			if (setupData.success) {
				defaultAccount = setupData.data.defaultAccount;
				categories = setupData.data.categories;
			} else {
				console.error('Failed to load setup data:', setupData.error);
			}
		} catch (err) {
			console.error('Error loading initial data:', err);
		}
	});

	const availableCategories = $derived(
		categories.filter(cat => {
			if (formData.type === 'income') {
				return cat.type === 'INCOME';
			} else {
				return cat.type === 'ESSENTIAL_EXPENSE' || cat.type === 'DISCRETIONARY_EXPENSE';
			}
		})
	);

	async function handleSubmit(event: Event) {
		event.preventDefault();
		
		// Validation
		if (!formData.partnerName.trim() || !formData.amount || !formData.categoryId) {
			error = 'Por favor completa todos los campos requeridos (concepto, cantidad y categoría)';
			return;
		}

		if (formData.amount <= 0) {
			error = 'La cantidad debe ser mayor que 0';
			return;
		}

		if (!defaultAccount) {
			error = 'No se pudo cargar la cuenta por defecto';
			return;
		}

		isLoading = true;
		error = '';
		success = '';

		try {
			// Prepare transaction data
			const transactionData = {
				partnerName: formData.partnerName.trim(),
				amount: formData.type === 'expense' ? -Math.abs(formData.amount) : Math.abs(formData.amount),
				bookingDate: formData.date,
				categoryId: formData.categoryId,
				accountId: defaultAccount.id,
				description: formData.description.trim() || null,
				type: formData.type.toUpperCase()
			};

			// Create transaction via API
			const response = await fetch('/api/transactions', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(transactionData)
			});

			const result = await response.json();

			if (result.success) {
				success = 'Transacción creada exitosamente!';
				// Reset form
				formData.partnerName = '';
				formData.amount = 0;
				formData.categoryId = '';
				formData.description = '';
				formData.date = new Date().toISOString().split('T')[0];
				
				// Redirect after short delay to show success message
				setTimeout(() => goto('/'), 1500);
			} else {
				error = result.error || 'Error al crear la transacción';
			}
		} catch (err) {
			console.error('Error creating transaction:', err);
			error = 'Error de conexión. Por favor intenta de nuevo.';
		} finally {
			isLoading = false;
		}
	}

	function goBack() {
		goto('/');
	}

	function formatCurrency(amount: number) {
		return new Intl.NumberFormat('es-ES', {
			style: 'currency',
			currency: 'EUR'
		}).format(amount);
	}
</script>

<svelte:head>
	<title>Nueva Transacción - Happy Balance</title>
</svelte:head>

<div class="min-h-screen bg-gray-50">
	<!-- Header -->
	<div class="bg-white border-b border-gray-200 sticky top-0 z-10">
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
			<div class="flex items-center gap-4 py-4">
				<button 
					class="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors" 
					onclick={goBack}
					aria-label="Volver atrás"
				>
					<ArrowLeft class="w-5 h-5" />
				</button>
				<div>
					<h1 class="text-xl sm:text-2xl font-bold text-gray-900">Nueva Transacción</h1>
					<p class="text-sm text-gray-500 mt-1">Añade un ingreso o gasto</p>
				</div>
			</div>
		</div>
	</div>

	<!-- Form Content -->
	<div class="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
		<form onsubmit={handleSubmit} class="space-y-6">
			<!-- Transaction Type -->
			<div class="bg-white rounded-lg border border-gray-200 p-6">
				<h2 class="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
					<Plus class="w-5 h-5" />
					Tipo de Transacción
				</h2>
				<div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
					<label class="relative cursor-pointer">
						<input
							type="radio"
							name="type"
							value="income"
							bind:group={formData.type}
							class="sr-only"
						/>
						<div class="flex items-center p-4 border-2 rounded-lg transition-all {formData.type === 'income' ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-green-300'}">
							<TrendingUp class="w-6 h-6 text-green-600 mr-3" />
							<div>
								<div class="font-medium text-gray-900">Ingreso</div>
								<div class="text-sm text-gray-500">Dinero que entra</div>
							</div>
						</div>
					</label>
					
					<label class="relative cursor-pointer">
						<input
							type="radio"
							name="type"
							value="expense"
							bind:group={formData.type}
							class="sr-only"
						/>
						<div class="flex items-center p-4 border-2 rounded-lg transition-all {formData.type === 'expense' ? 'border-red-500 bg-red-50' : 'border-gray-200 hover:border-red-300'}">
							<TrendingDown class="w-6 h-6 text-red-600 mr-3" />
							<div>
								<div class="font-medium text-gray-900">Gasto</div>
								<div class="text-sm text-gray-500">Dinero que sale</div>
							</div>
						</div>
					</label>
				</div>
			</div>

			<!-- Transaction Details -->
			<div class="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
				<h2 class="text-lg font-semibold text-gray-900">Detalles</h2>
				
				<!-- Concept/Partner Name -->
				<div class="space-y-2">
					<label for="partnerName" class="block text-sm font-medium text-gray-700">
						Concepto <span class="text-red-500">*</span>
					</label>
					<input
						id="partnerName"
						type="text"
						bind:value={formData.partnerName}
						placeholder="ej. Nómina, Mercadona, Netflix..."
						required
						class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
					/>
					<p class="text-xs text-gray-500">Describe la transacción o el comercio</p>
				</div>

				<!-- Amount -->
				<div class="space-y-2">
					<label for="amount" class="block text-sm font-medium text-gray-700">
						Cantidad (€) <span class="text-red-500">*</span>
					</label>
					<input
						id="amount"
						type="number"
						step="0.01"
						min="0"
						bind:value={formData.amount}
						placeholder="0.00"
						required
						class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg font-mono"
					/>
					{#if formData.amount > 0}
						<div class="mt-2 p-3 bg-gray-50 rounded-lg">
							<span class="text-sm text-gray-600">Vista previa: </span>
							<span class="font-semibold {formData.type === 'expense' ? 'text-red-600' : 'text-green-600'}">
								{formData.type === 'expense' ? '-' : '+'}{formatCurrency(formData.amount)}
							</span>
						</div>
					{/if}
				</div>

				<!-- Category -->
				<div class="space-y-2">
					<label for="category" class="block text-sm font-medium text-gray-700">
						Categoría <span class="text-red-500">*</span>
					</label>
					<select
						id="category"
						bind:value={formData.categoryId}
						required
						class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
					>
						<option value="">Selecciona una categoría</option>
						{#each availableCategories as category}
							<option value={category.id}>{category.icon} {category.name}</option>
						{/each}
					</select>
					{#if availableCategories.length === 0 && categories.length > 0}
						<p class="text-xs text-orange-600">No hay categorías disponibles para este tipo de transacción</p>
					{/if}
				</div>

				<!-- Date -->
				<div class="space-y-2">
					<label for="date" class="block text-sm font-medium text-gray-700">
						Fecha <span class="text-red-500">*</span>
					</label>
					<input
						id="date"
						type="date"
						bind:value={formData.date}
						required
						class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
					/>
				</div>

				<!-- Description (Optional) -->
				<div class="space-y-2">
					<label for="description" class="block text-sm font-medium text-gray-700">
						Descripción <span class="text-gray-400 text-xs">(opcional)</span>
					</label>
					<textarea
						id="description"
						bind:value={formData.description}
						placeholder="Detalles adicionales..."
						rows="3"
						class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
					></textarea>
				</div>
			</div>

			<!-- Success Display -->
			{#if success}
				<div class="bg-green-50 border border-green-200 rounded-lg p-4">
					<div class="flex items-start gap-3">
						<div class="flex-shrink-0">
							<div class="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
								<span class="text-green-600 text-xs font-bold">✓</span>
							</div>
						</div>
						<div>
							<span class="text-sm font-medium text-green-800">Éxito: </span>
							<span class="text-sm text-green-700">{success}</span>
						</div>
					</div>
				</div>
			{/if}

			<!-- Error Display -->
			{#if error}
				<div class="bg-red-50 border border-red-200 rounded-lg p-4">
					<div class="flex items-start gap-3">
						<div class="flex-shrink-0">
							<div class="w-5 h-5 bg-red-100 rounded-full flex items-center justify-center">
								<span class="text-red-600 text-xs font-bold">!</span>
							</div>
						</div>
						<div>
							<span class="text-sm font-medium text-red-800">Error: </span>
							<span class="text-sm text-red-700">{error}</span>
						</div>
					</div>
				</div>
			{/if}

			<!-- Submit Buttons -->
			<div class="flex flex-col-reverse sm:flex-row gap-3 sm:justify-end pt-6">
				<button 
					type="button" 
					class="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-colors" 
					onclick={goBack}
				>
					Cancelar
				</button>
				<button 
					type="submit" 
					class="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
					disabled={isLoading}
				>
					{#if isLoading}
						<svg class="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
							<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
							<path class="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
						</svg>
						Creando...
					{:else}
						Crear Transacción
					{/if}
				</button>
			</div>
		</form>
	</div>
</div>