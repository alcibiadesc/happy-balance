<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { afterNavigate, goto } from '$app/navigation';
  import Chart from 'chart.js/auto';
  import {
    TrendingUp,
    TrendingDown,
    Plus,
    Pencil,
    Trash2,
    Star,
    History,
    ChevronLeft,
    X,
    Target,
    Wallet,
    PiggyBank,
    GripVertical,
    LayoutGrid,
    List,
    Calendar,
    Link2,
    ExternalLink,
  } from 'lucide-svelte';
  import { t as _t } from '$lib/stores/i18n';
  import { currentCurrency, formatCurrency } from '$lib/stores/currency';
  import { effectiveTheme } from '$lib/stores/theme';

  // Store
  import { createInvestmentsStore } from '$lib/modules/investments/presentation/stores/investmentsStore.svelte.ts';
  import ConfirmModal from '$lib/components/organisms/ConfirmModal.svelte';

  const store = createInvestmentsStore();

  // Charts refs
  let donutChartRef = $state<HTMLCanvasElement>();
  let lineChartRef = $state<HTMLCanvasElement>();
  let donutChart: Chart | null = null;
  let lineChart: Chart | null = null;

  // View state
  let viewMode = $state<'grid' | 'details'>('grid');
  let showIconPicker = $state(false);
  let activeForm = $state<'new' | 'edit' | null>(null);
  let pickerPosition = $state({ top: 0, left: 0 });

  // Goal
  let goal = $state(100000);
  let showGoalEdit = $state(false);

  // Time period filter for chart
  type TimePeriod = '1M' | '3M' | '6M' | '1Y' | 'ALL';
  let selectedPeriod = $state<TimePeriod>('ALL');

  const timePeriods: { label: TimePeriod; months: number | null }[] = [
    { label: '1M', months: 1 },
    { label: '3M', months: 3 },
    { label: '6M', months: 6 },
    { label: '1Y', months: 12 },
    { label: 'ALL', months: null },
  ];

  function getDateFromMonthsAgo(months: number): string {
    const date = new Date();
    date.setMonth(date.getMonth() - months);
    return date.toISOString().split('T')[0];
  }

  async function handlePeriodChange(period: TimePeriod) {
    selectedPeriod = period;
    const periodConfig = timePeriods.find((p) => p.label === period);

    if (periodConfig?.months) {
      const dateFrom = getDateFromMonthsAgo(periodConfig.months);
      await store.loadTimeline('day', dateFrom);
    } else {
      await store.loadTimeline('month');
    }
  }

  // Drag-and-drop state
  let draggedIndex = $state<number | null>(null);
  let dragOverIndex = $state<number | null>(null);

  function handleDragStart(e: DragEvent, index: number) {
    draggedIndex = index;
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', index.toString());
    }
  }

  function handleDragOver(e: DragEvent, index: number) {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== index) {
      dragOverIndex = index;
    }
  }

  function handleDragLeave() {
    dragOverIndex = null;
  }

  function handleDrop(e: DragEvent, toIndex: number) {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== toIndex) {
      store.reorderInvestments(draggedIndex, toIndex);
    }
    draggedIndex = null;
    dragOverIndex = null;
  }

  function handleDragEnd() {
    draggedIndex = null;
    dragOverIndex = null;
  }

  // View modes for investments list
  type InvestmentViewMode = 'individual' | 'grouped' | 'monthly';
  let investmentViewMode = $state<InvestmentViewMode>('individual');

  // Grouped investments by category
  const groupedInvestments = $derived(() => {
    const groups: Record<string, typeof store.investments> = {
      'Sin categoría': [],
    };

    for (const inv of store.investments) {
      const groupName = inv.categoryId ? inv.categoryName || 'Categoría' : 'Sin categoría';
      if (!groups[groupName]) {
        groups[groupName] = [];
      }
      groups[groupName].push(inv);
    }

    return Object.entries(groups)
      .filter(([_, items]) => items.length > 0)
      .map(([name, items]) => ({
        name,
        items,
        totalValue: items.reduce((sum, i) => sum + i.currentValue, 0),
        totalProfit: items.reduce((sum, i) => sum + i.profit, 0),
      }));
  });

  // Monthly contributions (current month)
  const monthlyContributions = $derived(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    return store.investments
      .map((inv) => {
        const monthlyHistory = (inv.history || []).filter((h) => {
          const date = new Date(h.date);
          return (
            date.getMonth() === currentMonth &&
            date.getFullYear() === currentYear &&
            h.type === 'CONTRIBUTION'
          );
        });

        const monthlyTotal = monthlyHistory.reduce((sum, h) => sum + Number(h.amount), 0);

        return {
          ...inv,
          monthlyContribution: monthlyTotal,
          monthlyHistory,
        };
      })
      .filter((inv) => inv.monthlyContribution > 0);
  });

  // Chart theme colors
  function getChartColors() {
    const isDark = $effectiveTheme === 'dark';
    return {
      text: isDark ? '#e5e7eb' : '#374151',
      grid: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
      green: '#10B981',
      red: '#EF4444',
      blue: '#3B82F6',
      purple: '#8B5CF6',
      orange: '#F59E0B',
      pink: '#EC4899',
      cyan: '#06B6D4',
      teal: '#14B8A6',
    };
  }

  // Donut chart for portfolio distribution
  function createDonutChart() {
    if (!donutChartRef || store.investments.length === 0) return;

    const colors = getChartColors();
    const investedAmount = store.portfolioSummary?.netContributions || 0;
    const profitAmount = store.portfolioSummary?.totalProfit || 0;

    if (donutChart) donutChart.destroy();

    donutChart = new Chart(donutChartRef, {
      type: 'doughnut',
      data: {
        labels: ['Invertido', profitAmount >= 0 ? 'Ganancia' : 'Pérdida'],
        datasets: [
          {
            data: [investedAmount, Math.abs(profitAmount)],
            backgroundColor: [colors.blue, profitAmount >= 0 ? colors.green : colors.red],
            borderWidth: 0,
            hoverOffset: 4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '70%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              color: colors.text,
              padding: 16,
              usePointStyle: true,
              pointStyle: 'circle',
            },
          },
          tooltip: {
            callbacks: {
              label: (ctx) => ` ${formatCurrency(ctx.raw as number, $currentCurrency)}`,
            },
          },
        },
      },
    });
  }

  // Line chart for evolution
  function createLineChart() {
    if (!lineChartRef || store.timeline.length === 0) return;

    const colors = getChartColors();

    // Cumulative contributions over time
    let cumulative = 0;
    const cumulativeData = store.timeline.map((t) => {
      cumulative += t.contributions - t.withdrawals;
      return cumulative;
    });

    if (lineChart) lineChart.destroy();

    lineChart = new Chart(lineChartRef, {
      type: 'line',
      data: {
        labels: store.timeline.map((t) => t.date),
        datasets: [
          {
            label: 'Aportaciones acumuladas',
            data: cumulativeData,
            borderColor: colors.green,
            backgroundColor: colors.green + '20',
            borderWidth: 2,
            fill: true,
            tension: 0.4,
            pointRadius: 3,
            pointHoverRadius: 5,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          intersect: false,
          mode: 'index',
        },
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            callbacks: {
              label: (ctx) => ` ${formatCurrency(ctx.raw as number, $currentCurrency)}`,
            },
          },
        },
        scales: {
          x: {
            grid: { color: colors.grid },
            ticks: { color: colors.text },
          },
          y: {
            grid: { color: colors.grid },
            ticks: {
              color: colors.text,
              callback: (value) => formatCurrency(value as number, $currentCurrency),
            },
          },
        },
      },
    });
  }

  // Icon picker
  function handleIconClick(e: Event, formType: 'new' | 'edit') {
    const buttonElement = e.currentTarget as HTMLElement;
    const rect = buttonElement.getBoundingClientRect();
    pickerPosition = {
      top: rect.bottom + 8,
      left: Math.max(8, rect.left - 100),
    };
    activeForm = formType;
    showIconPicker = true;
  }

  function selectIcon(icon: string) {
    if (activeForm === 'new') {
      store.newInvestmentForm.icon = icon;
    } else if (activeForm === 'edit') {
      store.editForm.icon = icon;
    }
    showIconPicker = false;
    activeForm = null;
  }

  function handleViewDetails(investment: any) {
    store.loadInvestmentDetails(investment.id);
    viewMode = 'details';
  }

  function backToGrid() {
    viewMode = 'grid';
    store.selectedInvestment = null;
  }

  function navigateToTransaction(transactionId: string) {
    goto(`/transactions?search=${transactionId}`);
  }

  // Goal progress
  const goalProgress = $derived(Math.min(100, (store.totalPortfolioValue / goal) * 100));

  // Reactivity for charts
  $effect(() => {
    if (store.investments.length > 0 && donutChartRef) {
      createDonutChart();
    }
  });

  $effect(() => {
    if (store.timeline.length > 0 && lineChartRef) {
      createLineChart();
    }
  });

  onMount(async () => {
    await store.loadAll();
    await store.loadTimeline('month');
  });

  // Reload data when navigating to this page (handles sync from other pages)
  afterNavigate(async () => {
    await store.loadAll();
  });

  onDestroy(() => {
    if (donutChart) donutChart.destroy();
    if (lineChart) lineChart.destroy();
  });
</script>

<svelte:head>
  <title>Portfolio - Happy Balance</title>
</svelte:head>

<div class="portfolio-page">
  {#if viewMode === 'grid'}
    <!-- Balance Header (Gofire-style) -->
    <header class="balance-header">
      <div class="balance-content">
        <span class="greeting">Tu portfolio</span>
        <div class="balance-amount">
          <span class="currency">{$currentCurrency}</span>
          <span class="amount"
            >{store.formatCurrency(store.totalPortfolioValue).replace(/[€$£]/g, '')}</span
          >
        </div>

        <!-- Goal Progress -->
        <div class="goal-section">
          <div class="goal-bar">
            <div class="goal-progress" style="width: {goalProgress}%"></div>
          </div>
          <div class="goal-info">
            <span class="goal-text">
              {goalProgress.toFixed(0)}% de tu meta
              {#if goalProgress < 100}
                <span class="goal-remaining">(faltan {store.formatCurrency(goal - store.totalPortfolioValue)})</span>
              {/if}
            </span>
            <button class="goal-edit" onclick={() => (showGoalEdit = !showGoalEdit)}>
              <Target size={14} />
              {store.formatCurrency(goal)}
            </button>
          </div>
        </div>

        {#if showGoalEdit}
          <div class="goal-input-wrapper">
            <input type="number" bind:value={goal} class="goal-input" placeholder="Meta..." />
            <button class="goal-save" onclick={() => (showGoalEdit = false)}>OK</button>
          </div>
        {/if}
      </div>

      <!-- Revenue Card -->
      <div
        class="revenue-card"
        class:positive={store.totalProfit >= 0}
        class:negative={store.totalProfit < 0}
      >
        <div class="revenue-header">
          <span class="revenue-label">Rentabilidad</span>
          {#if store.totalProfit >= 0}
            <TrendingUp size={18} />
          {:else}
            <TrendingDown size={18} />
          {/if}
        </div>
        <div class="revenue-value">
          {store.formatCurrency(store.totalProfit)}
          <span class="revenue-percentage">{store.formatPercentage(store.profitPercentage)}</span>
        </div>
      </div>
    </header>

    <!-- Charts Section -->
    <section class="charts-section">
      <div class="chart-card">
        <h3><PiggyBank size={16} /> Distribución</h3>
        <div class="chart-container donut">
          <canvas bind:this={donutChartRef}></canvas>
        </div>
      </div>
      <div class="chart-card">
        <div class="chart-header">
          <h3><TrendingUp size={16} /> Evolución</h3>
          <div class="period-filters">
            {#each timePeriods as period (period.label)}
              <button
                class="period-btn"
                class:active={selectedPeriod === period.label}
                onclick={() => handlePeriodChange(period.label)}
              >
                {period.label}
              </button>
            {/each}
          </div>
        </div>
        <div class="chart-container line">
          <canvas bind:this={lineChartRef}></canvas>
        </div>
      </div>
    </section>

    <!-- Investments Grid -->
    <section class="investments-section">
      <div class="section-header">
        <h2><Wallet size={18} /> Inversiones</h2>
        <div class="header-actions">
          <div class="view-mode-toggle">
            <button
              class="view-btn"
              class:active={investmentViewMode === 'individual'}
              onclick={() => (investmentViewMode = 'individual')}
              title="Vista individual"
            >
              <List size={14} />
            </button>
            <button
              class="view-btn"
              class:active={investmentViewMode === 'grouped'}
              onclick={() => (investmentViewMode = 'grouped')}
              title="Agrupar por categoría"
            >
              <LayoutGrid size={14} />
            </button>
            <button
              class="view-btn"
              class:active={investmentViewMode === 'monthly'}
              onclick={() => (investmentViewMode = 'monthly')}
              title="Aportaciones del mes"
            >
              <Calendar size={14} />
            </button>
          </div>
          <button class="add-btn" onclick={() => store.startNewInvestment()}>
            <Plus size={16} />
            Añadir
          </button>
        </div>
      </div>

      <!-- New Investment Form -->
      {#if store.showNewForm}
        <div class="investment-form">
          <div class="form-row">
            <button
              class="icon-picker-btn"
              onclick={(e) => handleIconClick(e, 'new')}
              style="background-color: {store.newInvestmentForm.color}"
            >
              {store.newInvestmentForm.icon}
            </button>
            <input
              type="text"
              class="form-input name"
              bind:value={store.newInvestmentForm.name}
              placeholder="Nombre de la inversión"
            />
            <input
              type="number"
              class="form-input value"
              bind:value={store.newInvestmentForm.currentValue}
              placeholder="Valor"
              step="0.01"
            />
          </div>
          <div class="form-row colors">
            {#each store.availableColors as color (color)}
              <button
                class="color-dot"
                class:selected={store.newInvestmentForm.color === color}
                style="background-color: {color}"
                onclick={() => (store.newInvestmentForm.color = color)}
              />
            {/each}
          </div>
          <div class="form-actions">
            <button class="btn-cancel" onclick={store.cancelNewInvestment}>Cancelar</button>
            <button class="btn-save" onclick={store.saveNewInvestment}>Guardar</button>
          </div>
        </div>
      {/if}

      <!-- Investments List -->
      {#if store.isLoading}
        <div class="loading">Cargando...</div>
      {:else if store.investments.length === 0 && !store.showNewForm}
        <div class="empty-state">
          <Wallet size={48} strokeWidth={1} />
          <p>Añade tu primera inversión</p>
        </div>
      {:else}
        <!-- Individual View -->
        {#if investmentViewMode === 'individual'}
          <div class="investments-grid">
            {#each store.investments as investment, index (investment.id)}
              {#if store.editingInvestment === investment.id}
                <!-- Edit Mode -->
                <div class="investment-row editing">
                  <button
                    class="icon-picker-btn small"
                    onclick={(e) => handleIconClick(e, 'edit')}
                    style="background-color: {store.editForm.color}"
                  >
                    {store.editForm.icon}
                  </button>
                  <input type="text" class="form-input name" bind:value={store.editForm.name} />
                  <input
                    type="number"
                    class="form-input value"
                    bind:value={store.editForm.currentValue}
                    step="0.01"
                  />
                  <div class="row-actions">
                    <button class="btn-icon" onclick={store.cancelEdit}>
                      <X size={16} />
                    </button>
                    <button class="btn-icon primary" onclick={store.saveEdit}>
                      <Plus size={16} />
                    </button>
                  </div>
                </div>
              {:else}
                <!-- Display Mode with Drag-and-Drop -->
                <div
                  class="investment-row"
                  class:highlighted={investment.highlight}
                  class:dragging={draggedIndex === index}
                  class:drag-over={dragOverIndex === index}
                  draggable="true"
                  ondragstart={(e) => handleDragStart(e, index)}
                  ondragover={(e) => handleDragOver(e, index)}
                  ondragleave={handleDragLeave}
                  ondrop={(e) => handleDrop(e, index)}
                  ondragend={handleDragEnd}
                  onclick={() => handleViewDetails(investment)}
                >
                  <div class="drag-handle" onclick={(e) => e.stopPropagation()}>
                    <GripVertical size={14} />
                  </div>
                  <div class="row-icon" style="background-color: {investment.color}">
                    {investment.icon}
                  </div>
                  <div class="row-info">
                    <span class="row-name">{investment.name}</span>
                    {#if investment.symbol}
                      <span class="row-symbol">{investment.symbol}</span>
                    {/if}
                  </div>
                  <div class="row-value" onclick={(e) => e.stopPropagation()}>
                    {#if store.inlineEditingId === investment.id}
                      <input
                        type="number"
                        class="inline-edit-input"
                        bind:value={store.inlineEditValue}
                        onblur={() => store.saveInlineEdit()}
                        onkeydown={(e) => {
                          if (e.key === 'Enter') store.saveInlineEdit();
                          if (e.key === 'Escape') store.cancelInlineEdit();
                        }}
                        step="0.01"
                      />
                    {:else}
                      <span
                        class="value editable"
                        onclick={() => store.startInlineEdit(investment)}
                        title="Click para editar"
                      >
                        {store.formatCurrency(investment.currentValue)}
                      </span>
                    {/if}
                    {#if investment.netContributions > 0}
                      <div class="profit-pills">
                        <span class="pill amount" class:positive={investment.profit >= 0} class:negative={investment.profit < 0}>
                          {investment.profit >= 0 ? '+' : ''}{store.formatCurrency(investment.profit)}
                        </span>
                        <span class="pill pct" class:positive={investment.profit >= 0} class:negative={investment.profit < 0}>
                          {store.formatPercentage(investment.profitPercentage)}
                        </span>
                      </div>
                    {/if}
                  </div>
                  <div class="row-actions" onclick={(e) => e.stopPropagation()}>
                    <button
                      class="btn-icon"
                      class:active={investment.highlight}
                      onclick={() => store.toggleHighlight(investment)}
                    >
                      <Star size={14} fill={investment.highlight ? 'currentColor' : 'none'} />
                    </button>
                    <button class="btn-icon" onclick={() => store.startAddHistory(investment.id)}>
                      <Plus size={14} />
                    </button>
                    <button class="btn-icon" onclick={() => store.startEdit(investment)}>
                      <Pencil size={14} />
                    </button>
                    <button class="btn-icon danger" onclick={() => store.prepareDelete(investment)}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              {/if}
            {/each}
          </div>

          <!-- Grouped by Category View -->
        {:else if investmentViewMode === 'grouped'}
          <div class="grouped-view">
            {#each groupedInvestments() as group (group.name)}
              <div class="group-section">
                <div class="group-header">
                  <span class="group-name">{group.name}</span>
                  <span class="group-total">{store.formatCurrency(group.totalValue)}</span>
                </div>
                <div class="investments-grid">
                  {#each group.items as investment (investment.id)}
                    <div
                      class="investment-row compact"
                      class:highlighted={investment.highlight}
                      onclick={() => handleViewDetails(investment)}
                    >
                      <div class="row-icon small" style="background-color: {investment.color}">
                        {investment.icon}
                      </div>
                      <div class="row-info">
                        <span class="row-name">{investment.name}</span>
                      </div>
                      <div class="row-value">
                        <span class="value">{store.formatCurrency(investment.currentValue)}</span>
                        {#if investment.netContributions > 0}
                          <div class="profit-pills">
                            <span class="pill amount" class:positive={investment.profit >= 0} class:negative={investment.profit < 0}>
                              {investment.profit >= 0 ? '+' : ''}{store.formatCurrency(investment.profit)}
                            </span>
                            <span class="pill pct" class:positive={investment.profit >= 0} class:negative={investment.profit < 0}>
                              {store.formatPercentage(investment.profitPercentage)}
                            </span>
                          </div>
                        {/if}
                      </div>
                    </div>
                  {/each}
                </div>
              </div>
            {/each}
          </div>

          <!-- Monthly Contributions View -->
        {:else if investmentViewMode === 'monthly'}
          <div class="monthly-view">
            <div class="monthly-header">
              <Calendar size={16} />
              <span>Aportaciones este mes</span>
              <span class="monthly-total">
                {store.formatCurrency(
                  monthlyContributions().reduce((sum, i) => sum + i.monthlyContribution, 0)
                )}
              </span>
            </div>
            {#if monthlyContributions().length === 0}
              <div class="empty-monthly">
                <p>Sin aportaciones este mes</p>
              </div>
            {:else}
              <div class="investments-grid">
                {#each monthlyContributions() as investment (investment.id)}
                  <div class="investment-row monthly" onclick={() => handleViewDetails(investment)}>
                    <div class="row-icon" style="background-color: {investment.color}">
                      {investment.icon}
                    </div>
                    <div class="row-info">
                      <span class="row-name">{investment.name}</span>
                      <span class="row-symbol"
                        >{investment.monthlyHistory.length} aportación(es)</span
                      >
                    </div>
                    <div class="row-value">
                      <span class="value monthly-contribution"
                        >+{store.formatCurrency(investment.monthlyContribution)}</span
                      >
                    </div>
                  </div>
                {/each}
              </div>
            {/if}
          </div>
        {/if}
      {/if}
    </section>
  {:else if viewMode === 'details' && store.selectedInvestment}
    <!-- Investment Details -->
    <header class="details-header">
      <button class="back-btn" onclick={backToGrid}>
        <ChevronLeft size={20} />
        Volver
      </button>
    </header>

    <div class="details-content">
      <div class="details-main">
        <div class="details-icon" style="background-color: {store.selectedInvestment.color}">
          {store.selectedInvestment.icon}
        </div>
        <div class="details-info">
          <h2>{store.selectedInvestment.name}</h2>
          {#if store.selectedInvestment.symbol}
            <span class="symbol">{store.selectedInvestment.symbol}</span>
          {/if}
        </div>
      </div>

      <div class="details-stats">
        <div class="stat">
          <span class="stat-label">Valor actual</span>
          <span class="stat-value"
            >{store.formatCurrency(store.selectedInvestment.currentValue)}</span
          >
        </div>
        <div class="stat">
          <span class="stat-label">Aportado</span>
          <span class="stat-value"
            >{store.formatCurrency(store.selectedInvestment.netContributions)}</span
          >
        </div>
        <div
          class="stat"
          class:positive={store.selectedInvestment.profit >= 0}
          class:negative={store.selectedInvestment.profit < 0}
        >
          <span class="stat-label">Rentabilidad</span>
          <span class="stat-value">
            {store.formatCurrency(store.selectedInvestment.profit)}
            ({store.formatPercentage(store.selectedInvestment.profitPercentage)})
          </span>
        </div>
      </div>

      <!-- History -->
      <div class="history-section">
        <div class="history-header">
          <h3><History size={16} /> Historial</h3>
          <button
            class="add-btn small"
            onclick={() => store.startAddHistory(store.selectedInvestment?.id || '')}
          >
            <Plus size={14} />
          </button>
        </div>

        {#if store.selectedInvestment.history && store.selectedInvestment.history.length > 0}
          <div class="history-list">
            {#each store.selectedInvestment.history as entry (entry.id)}
              {#if store.editingHistoryEntry?.historyId === entry.id}
                <!-- Editing Mode -->
                <div class="history-item editing">
                  <div class="history-edit-row">
                    <input
                      type="date"
                      class="form-input small"
                      bind:value={store.editingHistoryEntry.date}
                    />
                    <select class="form-input small" bind:value={store.editingHistoryEntry.type}>
                      <option value="CONTRIBUTION">Aportación</option>
                      <option value="WITHDRAWAL">Retirada</option>
                      <option value="VALUE_UPDATE">Actualización</option>
                    </select>
                    <input
                      type="number"
                      class="form-input small"
                      bind:value={store.editingHistoryEntry.amount}
                      step="0.01"
                    />
                  </div>
                  <div class="history-edit-row">
                    <input
                      type="text"
                      class="form-input small flex-1"
                      bind:value={store.editingHistoryEntry.notes}
                      placeholder="Notas (opcional)"
                    />
                    <button class="btn-icon small" onclick={() => store.cancelHistoryEntryEdit()}>
                      <X size={12} />
                    </button>
                    <button
                      class="btn-icon primary small"
                      onclick={() => store.saveHistoryEntryEdit()}
                    >
                      <Plus size={12} />
                    </button>
                  </div>
                </div>
              {:else}
                <!-- Display Mode -->
                <div
                  class="history-item"
                  class:linked={entry.transactionId}
                  onclick={() => entry.transactionId && navigateToTransaction(entry.transactionId)}
                  role={entry.transactionId ? 'button' : undefined}
                  tabindex={entry.transactionId ? 0 : undefined}
                >
                  <div class="history-date">{store.formatDate(entry.date)}</div>
                  <div class="history-type">
                    {store.getHistoryTypeLabel(entry.type)}
                    {#if entry.transactionId}
                      <span class="linked-badge" title="Vinculado a transacción">
                        <Link2 size={10} />
                      </span>
                    {/if}
                  </div>
                  <div class="history-amount {store.getHistoryTypeColor(entry.type)}">
                    {entry.type === 'WITHDRAWAL' ? '-' : '+'}{store.formatCurrency(entry.amount)}
                  </div>
                  {#if entry.transactionId}
                    <button
                      class="btn-icon small link-btn"
                      onclick={(e) => {
                        e.stopPropagation();
                        navigateToTransaction(entry.transactionId!);
                      }}
                      title="Ver transacción"
                    >
                      <ExternalLink size={12} />
                    </button>
                  {/if}
                  <button
                    class="btn-icon small"
                    onclick={(e) => {
                      e.stopPropagation();
                      store.startEditHistoryEntry(store.selectedInvestment?.id || '', entry);
                    }}
                  >
                    <Pencil size={12} />
                  </button>
                  <button
                    class="btn-icon danger small"
                    onclick={(e) => {
                      e.stopPropagation();
                      store.deleteHistoryEntry(store.selectedInvestment?.id || '', entry.id);
                    }}
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              {/if}
            {/each}
          </div>
        {:else}
          <p class="empty-history">Sin movimientos</p>
        {/if}
      </div>
    </div>
  {/if}
</div>

<!-- Icon Picker Overlay -->
{#if showIconPicker}
  <div class="picker-overlay" onclick={() => (showIconPicker = false)}>
    <div
      class="icon-picker"
      style="top: {pickerPosition.top}px; left: {pickerPosition.left}px;"
      onclick={(e) => e.stopPropagation()}
    >
      {#each store.availableIcons as icon (icon)}
        <button class="icon-option" onclick={() => selectIcon(icon)}>
          {icon}
        </button>
      {/each}
    </div>
  </div>
{/if}

<!-- Add History Modal -->
{#if store.showAddHistoryModal}
  <div class="add-history-overlay" onclick={store.cancelAddHistory}>
    <div class="add-history-modal" onclick={(e) => e.stopPropagation()}>
      <div class="add-history-header">
        <h3>Añadir movimiento</h3>
        <button class="btn-close" onclick={store.cancelAddHistory}>
          <X size={18} />
        </button>
      </div>
      <form
        class="add-history-body"
        onsubmit={(e) => {
          e.preventDefault();
          store.saveHistoryEntry();
        }}
      >
        <div class="form-group">
          <label for="history-type">Tipo</label>
          <select id="history-type" bind:value={store.addHistoryFormData.type}>
            <option value="CONTRIBUTION">Aportación</option>
            <option value="WITHDRAWAL">Retirada</option>
            <option value="VALUE_UPDATE">Actualización</option>
          </select>
        </div>
        <div class="form-group">
          <label for="history-amount">Cantidad</label>
          <input
            id="history-amount"
            type="number"
            step="0.01"
            min="0.01"
            required
            bind:value={store.addHistoryFormData.amount}
          />
        </div>
        <div class="form-group">
          <label for="history-date">Fecha</label>
          <input
            id="history-date"
            type="date"
            required
            bind:value={store.addHistoryFormData.date}
          />
        </div>
        <div class="form-group">
          <label for="history-notes">Notas</label>
          <input
            id="history-notes"
            type="text"
            bind:value={store.addHistoryFormData.notes}
            placeholder="Opcional"
          />
        </div>
        <div class="add-history-footer">
          <button type="button" class="btn-cancel" onclick={store.cancelAddHistory}>Cancelar</button
          >
          <button type="submit" class="btn-save">Guardar</button>
        </div>
      </form>
    </div>
  </div>
{/if}

<!-- Delete Confirmation -->
<ConfirmModal
  isOpen={store.showDeleteModal}
  title="Eliminar inversión"
  message={`¿Eliminar "${store.investmentToDelete?.name}"?`}
  confirmText="Eliminar"
  cancelText="Cancelar"
  type="danger"
  onConfirm={store.confirmDelete}
  onCancel={() => (store.showDeleteModal = false)}
/>

<style>
  .portfolio-page {
    max-width: 900px;
    margin: 0 auto;
    padding: 1.5rem;
    min-height: 100vh;
    background: var(--surface);
  }

  /* Balance Header */
  .balance-header {
    display: flex;
    flex-wrap: wrap;
    gap: 1.5rem;
    margin-bottom: 2rem;
  }

  .balance-content {
    flex: 1;
    min-width: 280px;
  }

  .greeting {
    font-size: 0.875rem;
    color: var(--text-muted);
    display: block;
    margin-bottom: 0.25rem;
  }

  .balance-amount {
    display: flex;
    align-items: baseline;
    gap: 0.5rem;
    margin-bottom: 1rem;
  }

  .currency {
    font-size: 1.25rem;
    color: var(--text-muted);
    font-weight: 300;
  }

  .amount {
    font-size: 2.5rem;
    font-weight: 600;
    color: var(--text-primary);
    letter-spacing: -0.02em;
  }

  .goal-section {
    margin-top: 1rem;
  }

  .goal-bar {
    height: 6px;
    background: var(--border-color);
    border-radius: 3px;
    overflow: hidden;
  }

  .goal-progress {
    height: 100%;
    background: var(--acapulco);
    border-radius: 3px;
    transition: width 0.5s ease;
  }

  .goal-info {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 0.5rem;
  }

  .goal-text {
    font-size: 0.75rem;
    color: var(--text-muted);
  }

  .goal-remaining {
    opacity: 0.7;
    font-size: 0.7rem;
  }

  .goal-edit {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    font-size: 0.75rem;
    color: var(--text-muted);
    background: none;
    border: none;
    cursor: pointer;
  }

  .goal-edit:hover {
    color: var(--acapulco);
  }

  .goal-input-wrapper {
    display: flex;
    gap: 0.5rem;
    margin-top: 0.5rem;
  }

  .goal-input {
    flex: 1;
    padding: 0.5rem;
    border: 1px solid var(--border-color);
    border-radius: 0.375rem;
    font-size: 0.875rem;
    background: var(--surface);
    color: var(--text-primary);
  }

  .goal-save {
    padding: 0.5rem 1rem;
    background: var(--acapulco);
    color: white;
    border: none;
    border-radius: 0.375rem;
    font-size: 0.875rem;
    cursor: pointer;
  }

  /* Revenue Card */
  .revenue-card {
    background: var(--surface-elevated);
    border: 1px solid var(--border-color);
    border-radius: 0.75rem;
    padding: 1rem 1.25rem;
    min-width: 160px;
  }

  .revenue-card.positive {
    border-color: rgba(16, 185, 129, 0.3);
    background: rgba(16, 185, 129, 0.05);
  }

  .revenue-card.negative {
    border-color: rgba(239, 68, 68, 0.3);
    background: rgba(239, 68, 68, 0.05);
  }

  .revenue-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;
  }

  .revenue-label {
    font-size: 0.75rem;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .revenue-card.positive .revenue-header {
    color: #10b981;
  }

  .revenue-card.negative .revenue-header {
    color: #ef4444;
  }

  .revenue-value {
    font-size: 1.5rem;
    font-weight: 600;
  }

  .revenue-card.positive .revenue-value {
    color: #10b981;
  }

  .revenue-card.negative .revenue-value {
    color: #ef4444;
  }

  .revenue-percentage {
    font-size: 0.875rem;
    opacity: 0.9;
    margin-left: 0.5rem;
    padding: 0.125rem 0.5rem;
    border-radius: 0.25rem;
    background: rgba(255, 255, 255, 0.15);
  }

  .revenue-card.positive .revenue-percentage {
    color: #10b981;
    background: rgba(16, 185, 129, 0.15);
  }

  .revenue-card.negative .revenue-percentage {
    color: #ef4444;
    background: rgba(239, 68, 68, 0.15);
  }

  /* Charts Section */
  .charts-section {
    display: grid;
    grid-template-columns: 1fr 1.5fr;
    gap: 1rem;
    margin-bottom: 2rem;
  }

  @media (max-width: 768px) {
    .charts-section {
      grid-template-columns: 1fr;
    }
  }

  .chart-card {
    background: var(--surface-elevated);
    border: 1px solid var(--border-color);
    border-radius: 0.75rem;
    padding: 1rem;
  }

  .chart-card h3 {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--text-primary);
    margin: 0;
  }

  .chart-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .period-filters {
    display: flex;
    gap: 0.25rem;
    background: var(--surface);
    border-radius: 0.375rem;
    padding: 0.125rem;
  }

  .period-btn {
    padding: 0.25rem 0.5rem;
    font-size: 0.6875rem;
    font-weight: 500;
    color: var(--text-muted);
    background: transparent;
    border: none;
    border-radius: 0.25rem;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .period-btn:hover {
    color: var(--text-primary);
  }

  .period-btn.active {
    background: var(--acapulco);
    color: white;
  }

  .chart-container.donut {
    height: 200px;
  }

  .chart-container.line {
    height: 200px;
  }

  /* Investments Section */
  .investments-section {
    background: var(--surface-elevated);
    border: 1px solid var(--border-color);
    border-radius: 0.75rem;
    padding: 1.25rem;
  }

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  }

  .section-header h2 {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 1rem;
    font-weight: 500;
    color: var(--text-primary);
    margin: 0;
  }

  .header-actions {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .view-mode-toggle {
    display: flex;
    gap: 0.125rem;
    background: var(--surface);
    border: 1px solid var(--border-color);
    border-radius: 0.375rem;
    padding: 0.125rem;
  }

  .view-btn {
    padding: 0.375rem;
    background: transparent;
    border: none;
    border-radius: 0.25rem;
    color: var(--text-muted);
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .view-btn:hover {
    color: var(--text-primary);
    background: var(--surface-elevated);
  }

  .view-btn.active {
    background: var(--acapulco);
    color: white;
  }

  .add-btn {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    padding: 0.5rem 0.75rem;
    background: var(--acapulco);
    color: white;
    border: none;
    border-radius: 0.375rem;
    font-size: 0.8125rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .add-btn:hover {
    filter: brightness(0.95);
  }

  .add-btn.small {
    padding: 0.375rem 0.5rem;
    font-size: 0.75rem;
  }

  /* Investment Form */
  .investment-form {
    background: var(--surface);
    border: 1px solid var(--border-color);
    border-radius: 0.5rem;
    padding: 1rem;
    margin-bottom: 1rem;
  }

  .form-row {
    display: flex;
    gap: 0.75rem;
    align-items: center;
    margin-bottom: 0.75rem;
  }

  .form-row.colors {
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .icon-picker-btn {
    width: 40px;
    height: 40px;
    border: none;
    border-radius: 0.5rem;
    font-size: 1.25rem;
    cursor: pointer;
    flex-shrink: 0;
    transition: transform 0.2s ease;
  }

  .icon-picker-btn:hover {
    transform: scale(1.05);
  }

  .icon-picker-btn.small {
    width: 32px;
    height: 32px;
    font-size: 1rem;
  }

  .form-input {
    padding: 0.5rem 0.75rem;
    border: 1px solid var(--border-color);
    border-radius: 0.375rem;
    font-size: 0.875rem;
    background: var(--surface);
    color: var(--text-primary);
  }

  .form-input.name {
    flex: 1;
  }

  .form-input.value {
    width: 100px;
  }

  .form-input:focus {
    outline: none;
    border-color: var(--acapulco);
  }

  .color-dot {
    width: 24px;
    height: 24px;
    border: 2px solid transparent;
    border-radius: 50%;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .color-dot.selected {
    border-color: var(--text-primary);
    transform: scale(1.1);
  }

  .form-actions {
    display: flex;
    justify-content: flex-end;
    gap: 0.5rem;
  }

  .btn-cancel {
    padding: 0.5rem 1rem;
    background: var(--surface);
    border: 1px solid var(--border-color);
    border-radius: 0.375rem;
    font-size: 0.8125rem;
    color: var(--text-primary);
    cursor: pointer;
  }

  .btn-save {
    padding: 0.5rem 1rem;
    background: var(--acapulco);
    color: white;
    border: none;
    border-radius: 0.375rem;
    font-size: 0.8125rem;
    font-weight: 500;
    cursor: pointer;
  }

  /* Investments Grid */
  .investments-grid {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .investment-row {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.875rem 1rem;
    background: var(--surface);
    border: 1px solid var(--border-color);
    border-radius: 0.625rem;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .investment-row:hover {
    border-color: var(--acapulco);
    background: var(--surface-elevated);
  }

  .investment-row.highlighted {
    border-color: #f59e0b;
    background: rgba(245, 158, 11, 0.04);
  }

  .investment-row.editing {
    border-color: var(--acapulco);
    cursor: default;
  }

  .investment-row.dragging {
    opacity: 0.5;
    border-color: var(--acapulco);
    background: var(--acapulco-light, rgba(75, 192, 169, 0.1));
  }

  .investment-row.drag-over {
    border-color: var(--acapulco);
    border-style: dashed;
    background: var(--acapulco-light, rgba(75, 192, 169, 0.1));
  }

  .drag-handle {
    cursor: grab;
    padding: 0.25rem;
    color: var(--text-muted);
    opacity: 0;
    transition: opacity 0.2s ease;
    flex-shrink: 0;
  }

  .drag-handle:active {
    cursor: grabbing;
  }

  .investment-row:hover .drag-handle {
    opacity: 1;
  }

  /* Grouped View Styles */
  .grouped-view {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .group-section {
    background: var(--surface);
    border: 1px solid var(--border-color);
    border-radius: 0.5rem;
    padding: 1rem;
  }

  .group-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.75rem;
    padding-bottom: 0.5rem;
    border-bottom: 1px solid var(--border-color);
  }

  .group-name {
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--text-primary);
  }

  .group-total {
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--acapulco);
  }

  .investment-row.compact {
    padding: 0.5rem;
  }

  .row-icon.small {
    width: 28px;
    height: 28px;
    font-size: 0.875rem;
  }

  /* Monthly View Styles */
  .monthly-view {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .monthly-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem;
    background: rgba(16, 185, 129, 0.1);
    border: 1px solid rgba(16, 185, 129, 0.2);
    border-radius: 0.5rem;
    color: #10b981;
    font-size: 0.875rem;
    font-weight: 500;
  }

  .monthly-total {
    margin-left: auto;
    font-weight: 600;
  }

  .empty-monthly {
    text-align: center;
    padding: 2rem;
    color: var(--text-muted);
  }

  .investment-row.monthly {
    border-color: rgba(16, 185, 129, 0.2);
    background: rgba(16, 185, 129, 0.02);
  }

  .monthly-contribution {
    color: #10b981 !important;
  }

  .row-icon {
    width: 38px;
    height: 38px;
    border-radius: 0.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.125rem;
    flex-shrink: 0;
  }

  .row-info {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 0.125rem;
  }

  .row-name {
    display: block;
    font-size: 0.9375rem;
    font-weight: 600;
    color: var(--text-primary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .row-symbol {
    font-size: 0.6875rem;
    font-weight: 500;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.03em;
  }

  .row-value {
    text-align: right;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
  }

  .row-value .value {
    display: block;
    font-size: 1rem;
    font-weight: 700;
    color: var(--text-primary);
    letter-spacing: -0.01em;
  }

  .row-value .value.editable {
    cursor: pointer;
    padding: 0.125rem 0.375rem;
    border-radius: 0.25rem;
    transition: background 0.2s ease;
  }

  .row-value .value.editable:hover {
    background: var(--surface-elevated);
  }

  .inline-edit-input {
    width: 90px;
    padding: 0.25rem 0.5rem;
    font-size: 0.875rem;
    font-weight: 600;
    border: 1px solid var(--acapulco);
    border-radius: 0.25rem;
    background: var(--surface);
    color: var(--text-primary);
    text-align: right;
  }

  .inline-edit-input:focus {
    outline: none;
    box-shadow: 0 0 0 2px rgba(75, 192, 169, 0.2);
  }

  .row-value .profit-pills {
    display: flex;
    gap: 0.375rem;
    margin-top: 0.25rem;
  }

  .row-value .pill {
    padding: 0.125rem 0.5rem;
    border-radius: 1rem;
    font-size: 0.6875rem;
    font-weight: 600;
  }

  .row-value .pill.positive {
    background: rgba(16, 185, 129, 0.12);
    color: #10b981;
  }

  .row-value .pill.negative {
    background: rgba(239, 68, 68, 0.12);
    color: #ef4444;
  }

  .row-actions {
    display: flex;
    gap: 0.25rem;
    opacity: 0;
    transition: opacity 0.2s ease;
  }

  .investment-row:hover .row-actions {
    opacity: 1;
  }

  .investment-row.editing .row-actions {
    opacity: 1;
  }

  .btn-icon {
    padding: 0.375rem;
    background: transparent;
    border: 1px solid var(--border-color);
    border-radius: 0.25rem;
    color: var(--text-muted);
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .btn-icon:hover {
    border-color: var(--acapulco);
    color: var(--acapulco);
  }

  .btn-icon.active {
    color: #f59e0b;
    border-color: #f59e0b;
  }

  .btn-icon.danger:hover {
    border-color: #ef4444;
    color: #ef4444;
  }

  .btn-icon.primary {
    background: var(--acapulco);
    border-color: var(--acapulco);
    color: white;
  }

  .btn-icon.small {
    padding: 0.25rem;
  }

  /* Loading & Empty */
  .loading,
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 3rem;
    color: var(--text-muted);
    text-align: center;
  }

  .empty-state p {
    margin-top: 1rem;
    font-size: 0.875rem;
  }

  /* Details View */
  .details-header {
    margin-bottom: 1.5rem;
  }

  .back-btn {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    padding: 0.5rem 0.75rem;
    background: var(--surface-elevated);
    border: 1px solid var(--border-color);
    border-radius: 0.375rem;
    font-size: 0.875rem;
    color: var(--text-primary);
    cursor: pointer;
  }

  .back-btn:hover {
    border-color: var(--acapulco);
  }

  .details-content {
    background: var(--surface-elevated);
    border: 1px solid var(--border-color);
    border-radius: 0.75rem;
    padding: 1.5rem;
  }

  .details-main {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 1.5rem;
  }

  .details-icon {
    width: 56px;
    height: 56px;
    border-radius: 0.75rem;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.75rem;
  }

  .details-info h2 {
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--text-primary);
    margin: 0;
  }

  .details-info .symbol {
    font-size: 0.75rem;
    color: var(--text-muted);
    text-transform: uppercase;
  }

  .details-stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    gap: 1rem;
    margin-bottom: 1.5rem;
    padding-bottom: 1.5rem;
    border-bottom: 1px solid var(--border-color);
  }

  .stat {
    text-align: center;
    padding: 1rem;
    background: var(--surface);
    border-radius: 0.5rem;
  }

  .stat-label {
    display: block;
    font-size: 0.6875rem;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: 0.25rem;
  }

  .stat-value {
    font-size: 1rem;
    font-weight: 600;
    color: var(--text-primary);
  }

  .stat.positive .stat-value {
    color: #10b981;
  }

  .stat.negative .stat-value {
    color: #ef4444;
  }

  .history-section h3 {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.875rem;
    font-weight: 500;
    margin: 0;
  }

  .history-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  }

  .history-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .history-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem;
    background: var(--surface);
    border-radius: 0.375rem;
    transition: all 0.2s ease;
  }

  .history-item.linked {
    cursor: pointer;
    border: 1px solid transparent;
  }

  .history-item.linked:hover {
    border-color: var(--acapulco);
    background: rgba(75, 192, 169, 0.05);
  }

  .linked-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    margin-left: 0.25rem;
    padding: 0.125rem;
    background: rgba(75, 192, 169, 0.15);
    color: var(--acapulco);
    border-radius: 0.25rem;
    vertical-align: middle;
  }

  .btn-icon.link-btn {
    color: var(--acapulco);
    border-color: var(--acapulco);
  }

  .btn-icon.link-btn:hover {
    background: var(--acapulco);
    color: white;
  }

  .history-item.editing {
    flex-direction: column;
    align-items: stretch;
    border: 1px solid var(--acapulco);
    padding: 0.75rem;
  }

  .history-edit-row {
    display: flex;
    gap: 0.5rem;
    align-items: center;
    margin-bottom: 0.5rem;
  }

  .history-edit-row:last-child {
    margin-bottom: 0;
  }

  .form-input.small {
    padding: 0.375rem 0.5rem;
    font-size: 0.75rem;
    border: 1px solid var(--border-color);
    border-radius: 0.25rem;
    background: var(--surface);
    color: var(--text-primary);
  }

  .form-input.small:focus {
    outline: none;
    border-color: var(--acapulco);
  }

  .flex-1 {
    flex: 1;
  }

  .history-date {
    font-size: 0.75rem;
    color: var(--text-muted);
    min-width: 80px;
  }

  .history-type {
    flex: 1;
    font-size: 0.8125rem;
    color: var(--text-primary);
  }

  .history-amount {
    font-size: 0.875rem;
    font-weight: 500;
  }

  .history-amount.text-green-600 {
    color: #10b981;
  }

  .history-amount.text-red-600 {
    color: #ef4444;
  }

  .history-amount.text-blue-600 {
    color: #3b82f6;
  }

  .empty-history {
    text-align: center;
    color: var(--text-muted);
    font-size: 0.875rem;
    padding: 2rem;
  }

  /* Picker Overlay */
  .picker-overlay {
    position: fixed;
    inset: 0;
    z-index: 100;
  }

  .icon-picker {
    position: fixed;
    z-index: 101;
    background: var(--surface-elevated);
    border: 1px solid var(--border-color);
    border-radius: 0.5rem;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
    padding: 0.75rem;
    display: grid;
    grid-template-columns: repeat(6, 1fr);
    gap: 0.25rem;
    width: 220px;
  }

  .icon-option {
    padding: 0.5rem;
    background: transparent;
    border: none;
    border-radius: 0.25rem;
    font-size: 1.125rem;
    cursor: pointer;
    transition: background 0.2s ease;
  }

  .icon-option:hover {
    background: var(--surface);
  }

  /* Add History Modal */
  .add-history-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;
    padding: 1rem;
  }

  .add-history-modal {
    position: relative;
    background: var(--surface-elevated);
    border-radius: 0.75rem;
    width: 100%;
    max-width: 360px;
    z-index: 10000;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  }

  .add-history-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 1.25rem;
    border-bottom: 1px solid var(--border-color);
  }

  .add-history-header h3 {
    font-size: 1rem;
    font-weight: 500;
    margin: 0;
    color: var(--text-primary);
  }

  .btn-close {
    padding: 0.25rem;
    background: transparent;
    border: none;
    color: var(--text-muted);
    cursor: pointer;
  }

  .add-history-body {
    padding: 1.25rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .add-history-footer {
    display: flex;
    justify-content: flex-end;
    gap: 0.5rem;
    padding: 1rem 1.25rem;
    border-top: 1px solid var(--border-color);
    margin: 1rem -1.25rem 0;
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 0.375rem;
  }

  .form-group label {
    font-size: 0.75rem;
    font-weight: 500;
    color: var(--text-muted);
    text-transform: uppercase;
  }

  .form-group input,
  .form-group select {
    padding: 0.625rem 0.75rem;
    border: 1px solid var(--border-color);
    border-radius: 0.375rem;
    font-size: 0.875rem;
    background: var(--surface);
    color: var(--text-primary);
  }

  .form-group input:focus,
  .form-group select:focus {
    outline: none;
    border-color: var(--acapulco);
  }

  @media (max-width: 640px) {
    .portfolio-page {
      padding: 1rem;
    }

    .balance-header {
      flex-direction: column;
    }

    .revenue-card {
      width: 100%;
    }

    .amount {
      font-size: 2rem;
    }

    .row-actions {
      opacity: 1;
    }
  }
</style>
