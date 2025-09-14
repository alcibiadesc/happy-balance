<script lang="ts">
  import { onMount } from 'svelte';
  import {
    Plus, Trash2, Edit2, Check, X, ChevronLeft,
    DollarSign, Home, ShoppingBag, TrendingUp
  } from 'lucide-svelte';
  import { apiCategories } from '$lib/stores/api-transactions';
  import type { Category } from '$lib/types/transaction';

  // State
  let categories = $state<Category[]>([]);
  let editingId = $state<string | null>(null);
  let editForm = $state<Partial<Category>>({});
  let showAddModal = $state(false);
  let newCategory = $state<Partial<Category>>({
    name: '',
    type: 'essential' as const,
    color: '#7abaa5',
    icon: '💰'
  });
  let selectedType = $state<string>('all');
  let loading = $state(false);
  let error = $state<string>('');

  // Icons for category types
  const typeIcons = {
    essential: '🏠',
    discretionary: '🛍️',
    investment: '📈',
    income: '💰'
  };

  const typeColors = {
    essential: '#023c46',
    discretionary: '#fecd2c',
    investment: '#023c46',
    income: '#7abaa5'
  };

  // Filtered categories
  let filteredCategories = $derived(() => {
    if (selectedType === 'all') return categories;
    return categories.filter(c => c.type === selectedType);
  });

  // Count by type
  let categoryCounts = $derived(() => {
    const counts = {
      essential: 0,
      discretionary: 0,
      investment: 0,
      income: 0
    };
    categories.forEach(c => {
      counts[c.type]++;
    });
    return counts;
  });

  // Actions
  async function loadCategories() {
    loading = true;
    try {
      await apiCategories.load();
      categories = [...$apiCategories];
    } catch (err) {
      error = 'Failed to load categories';
      console.error(err);
    } finally {
      loading = false;
    }
  }

  async function createCategory() {
    if (!newCategory.name?.trim()) {
      error = 'Category name is required';
      return;
    }

    loading = true;
    try {
      await apiCategories.add({
        name: newCategory.name,
        type: newCategory.type || 'essential',
        color: newCategory.color || '#7abaa5',
        icon: newCategory.icon || '💰'
      });
      await loadCategories();
      showAddModal = false;
      newCategory = {
        name: '',
        type: 'essential',
        color: '#7abaa5',
        icon: '💰'
      };
    } catch (err) {
      error = 'Failed to create category';
      console.error(err);
    } finally {
      loading = false;
    }
  }

  async function updateCategory(id: string) {
    if (!editForm.name?.trim()) {
      error = 'Category name is required';
      return;
    }

    loading = true;
    try {
      await apiCategories.update(id, editForm);
      await loadCategories();
      editingId = null;
      editForm = {};
    } catch (err) {
      error = 'Failed to update category';
      console.error(err);
    } finally {
      loading = false;
    }
  }

  async function deleteCategory(id: string) {
    if (!confirm('Are you sure you want to delete this category? Transactions will need to be reassigned.')) {
      return;
    }

    loading = true;
    try {
      await apiCategories.delete(id);
      await loadCategories();
    } catch (err) {
      error = 'Failed to delete category. It may have associated transactions.';
      console.error(err);
    } finally {
      loading = false;
    }
  }

  function startEdit(category: Category) {
    editingId = category.id;
    editForm = { ...category };
  }

  function cancelEdit() {
    editingId = null;
    editForm = {};
  }

  function getTypeLabel(type: string): string {
    const labels = {
      essential: 'Essential',
      discretionary: 'Discretionary',
      investment: 'Investment',
      income: 'Income'
    };
    return labels[type as keyof typeof labels] || type;
  }

  onMount(() => {
    loadCategories();
  });
</script>

<div class="categories-page">
  <!-- Header -->
  <header class="categories-header">
    <div class="header-content">
      <div class="header-left">
        <button class="back-btn" onclick={() => history.back()}>
          <ChevronLeft size={20} />
        </button>
        <div>
          <h1>Category Management</h1>
          <p class="subtitle">Organize your transactions with custom categories</p>
        </div>
      </div>
      <button class="add-btn" onclick={() => showAddModal = true}>
        <Plus size={20} />
        Add Category
      </button>
    </div>
  </header>

  <!-- Type Filter -->
  <div class="type-filter">
    <button
      class="type-btn"
      class:active={selectedType === 'all'}
      onclick={() => selectedType = 'all'}
    >
      All ({categories.length})
    </button>
    <button
      class="type-btn"
      class:active={selectedType === 'essential'}
      onclick={() => selectedType = 'essential'}
    >
      <span class="type-icon">🏠</span>
      Essential ({categoryCounts().essential})
    </button>
    <button
      class="type-btn"
      class:active={selectedType === 'discretionary'}
      onclick={() => selectedType = 'discretionary'}
    >
      <span class="type-icon">🛍️</span>
      Discretionary ({categoryCounts().discretionary})
    </button>
    <button
      class="type-btn"
      class:active={selectedType === 'investment'}
      onclick={() => selectedType = 'investment'}
    >
      <span class="type-icon">📈</span>
      Investment ({categoryCounts().investment})
    </button>
    <button
      class="type-btn"
      class:active={selectedType === 'income'}
      onclick={() => selectedType = 'income'}
    >
      <span class="type-icon">💰</span>
      Income ({categoryCounts().income})
    </button>
  </div>

  <!-- Error Message -->
  {#if error}
    <div class="error-banner">
      {error}
      <button onclick={() => error = ''}>
        <X size={16} />
      </button>
    </div>
  {/if}

  <!-- Categories Grid -->
  <main class="categories-grid">
    {#if loading && categories.length === 0}
      <div class="loading-state">Loading categories...</div>
    {:else if filteredCategories().length === 0}
      <div class="empty-state">
        <p>No categories found</p>
        <button class="add-btn-empty" onclick={() => showAddModal = true}>
          <Plus size={20} />
          Create your first category
        </button>
      </div>
    {:else}
      {#each filteredCategories() as category}
        <div class="category-card">
          {#if editingId === category.id}
            <!-- Edit Mode -->
            <div class="edit-mode">
              <input
                type="text"
                bind:value={editForm.name}
                placeholder="Category name"
                class="edit-input"
              />
              <div class="edit-controls">
                <select bind:value={editForm.type} class="type-select">
                  <option value="essential">Essential</option>
                  <option value="discretionary">Discretionary</option>
                  <option value="investment">Investment</option>
                  <option value="income">Income</option>
                </select>
                <input
                  type="text"
                  bind:value={editForm.icon}
                  placeholder="Icon"
                  class="icon-input"
                  maxlength="2"
                />
                <input
                  type="color"
                  bind:value={editForm.color}
                  class="color-input"
                />
              </div>
              <div class="edit-actions">
                <button class="save-btn" onclick={() => updateCategory(category.id)}>
                  <Check size={16} />
                  Save
                </button>
                <button class="cancel-btn" onclick={cancelEdit}>
                  <X size={16} />
                  Cancel
                </button>
              </div>
            </div>
          {:else}
            <!-- View Mode -->
            <div class="category-header">
              <div
                class="category-icon"
                style="background-color: {category.color}20; color: {category.color}"
              >
                {category.icon}
              </div>
              <div class="category-info">
                <h3>{category.name}</h3>
                <span class="category-type" data-type={category.type}>
                  {getTypeLabel(category.type)}
                </span>
              </div>
            </div>
            <div class="category-actions">
              <button class="action-btn" onclick={() => startEdit(category)}>
                <Edit2 size={14} />
              </button>
              <button class="action-btn delete" onclick={() => deleteCategory(category.id)}>
                <Trash2 size={14} />
              </button>
            </div>
          {/if}
        </div>
      {/each}
    {/if}
  </main>

  <!-- Add Category Modal -->
  {#if showAddModal}
    <div class="modal-overlay" onclick={() => showAddModal = false}>
      <div class="modal" onclick={(e) => e.stopPropagation()}>
        <h2>Add New Category</h2>

        <div class="form-group">
          <label>Name</label>
          <input
            type="text"
            bind:value={newCategory.name}
            placeholder="e.g., Groceries"
            class="form-input"
          />
        </div>

        <div class="form-group">
          <label>Type</label>
          <div class="type-options">
            {#each ['essential', 'discretionary', 'investment', 'income'] as type}
              <button
                class="type-option"
                class:selected={newCategory.type === type}
                onclick={() => newCategory.type = type as any}
              >
                <span class="type-icon">{typeIcons[type as keyof typeof typeIcons]}</span>
                <span>{getTypeLabel(type)}</span>
              </button>
            {/each}
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>Icon</label>
            <input
              type="text"
              bind:value={newCategory.icon}
              placeholder="💰"
              maxlength="2"
              class="form-input"
            />
          </div>
          <div class="form-group">
            <label>Color</label>
            <input
              type="color"
              bind:value={newCategory.color}
              class="form-input color-picker"
            />
          </div>
        </div>

        <div class="modal-actions">
          <button class="btn-secondary" onclick={() => showAddModal = false}>
            Cancel
          </button>
          <button class="btn-primary" onclick={createCategory} disabled={loading}>
            {loading ? 'Creating...' : 'Create Category'}
          </button>
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  .categories-page {
    min-height: 100vh;
    background: var(--surface);
  }

  .categories-header {
    background: var(--surface-elevated);
    border-bottom: 1px solid rgba(2, 60, 70, 0.08);
    padding: var(--space-lg);
  }

  .header-content {
    max-width: 1200px;
    margin: 0 auto;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .header-left {
    display: flex;
    align-items: center;
    gap: var(--space-md);
  }

  .back-btn {
    width: 2.5rem;
    height: 2.5rem;
    border-radius: var(--radius-md);
    border: 1px solid rgba(2, 60, 70, 0.1);
    background: var(--surface);
    color: var(--text-secondary);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
  }

  .back-btn:hover {
    border-color: var(--acapulco);
    color: var(--acapulco);
  }

  h1 {
    font-size: 1.5rem;
    font-weight: 600;
    color: var(--text);
    margin: 0;
  }

  .subtitle {
    font-size: 0.875rem;
    color: var(--text-muted);
    margin: 0.25rem 0 0;
  }

  .add-btn {
    display: flex;
    align-items: center;
    gap: var(--space-xs);
    padding: var(--space-sm) var(--space-md);
    background: var(--acapulco);
    color: white;
    border: none;
    border-radius: var(--radius-md);
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
  }

  .add-btn:hover {
    background: #5ca98a;
    transform: translateY(-1px);
  }

  .type-filter {
    max-width: 1200px;
    margin: 0 auto;
    padding: var(--space-md) var(--space-lg);
    display: flex;
    gap: var(--space-sm);
    border-bottom: 1px solid rgba(2, 60, 70, 0.08);
  }

  .type-btn {
    display: flex;
    align-items: center;
    gap: var(--space-xs);
    padding: var(--space-sm) var(--space-md);
    background: var(--surface);
    border: 1px solid rgba(2, 60, 70, 0.1);
    border-radius: var(--radius-lg);
    color: var(--text-secondary);
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
  }

  .type-btn:hover {
    border-color: var(--acapulco);
    background: var(--surface-elevated);
  }

  .type-btn.active {
    background: var(--acapulco);
    border-color: var(--acapulco);
    color: white;
  }

  .type-icon {
    font-size: 1rem;
  }

  .error-banner {
    max-width: 1200px;
    margin: var(--space-md) auto;
    padding: var(--space-md) var(--space-lg);
    background: rgba(245, 121, 108, 0.1);
    border: 1px solid var(--froly);
    border-radius: var(--radius-md);
    color: var(--froly);
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .error-banner button {
    background: none;
    border: none;
    color: var(--froly);
    cursor: pointer;
  }

  .categories-grid {
    max-width: 1200px;
    margin: 0 auto;
    padding: var(--space-lg);
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: var(--space-md);
  }

  .category-card {
    background: var(--surface-elevated);
    border: 1px solid rgba(2, 60, 70, 0.08);
    border-radius: var(--radius-lg);
    padding: var(--space-md);
    transition: all 0.2s;
  }

  .category-card:hover {
    border-color: rgba(2, 60, 70, 0.15);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  }

  .category-header {
    display: flex;
    align-items: center;
    gap: var(--space-md);
    margin-bottom: var(--space-sm);
  }

  .category-icon {
    width: 3rem;
    height: 3rem;
    border-radius: var(--radius-md);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.5rem;
  }

  .category-info h3 {
    margin: 0;
    font-size: 1rem;
    font-weight: 600;
    color: var(--text);
  }

  .category-type {
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    padding: 0.125rem 0.375rem;
    border-radius: var(--radius-sm);
    letter-spacing: 0.025em;
  }

  .category-type[data-type="essential"] {
    background: rgba(2, 60, 70, 0.1);
    color: #023c46;
  }

  .category-type[data-type="discretionary"] {
    background: rgba(254, 205, 44, 0.15);
    color: #d89e00;
  }

  .category-type[data-type="investment"] {
    background: rgba(2, 60, 70, 0.08);
    color: #023c46;
  }

  .category-type[data-type="income"] {
    background: rgba(122, 186, 165, 0.15);
    color: #5ca98a;
  }

  .category-actions {
    display: flex;
    gap: var(--space-xs);
    justify-content: flex-end;
  }

  .action-btn {
    width: 2rem;
    height: 2rem;
    border-radius: var(--radius-sm);
    border: 1px solid rgba(2, 60, 70, 0.1);
    background: var(--surface);
    color: var(--text-secondary);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
  }

  .action-btn:hover {
    border-color: var(--acapulco);
    color: var(--acapulco);
    background: var(--surface-elevated);
  }

  .action-btn.delete:hover {
    border-color: var(--froly);
    color: var(--froly);
    background: rgba(245, 121, 108, 0.1);
  }

  /* Edit Mode */
  .edit-mode {
    display: flex;
    flex-direction: column;
    gap: var(--space-sm);
  }

  .edit-input {
    width: 100%;
    padding: var(--space-sm);
    border: 1px solid rgba(2, 60, 70, 0.1);
    border-radius: var(--radius-md);
    font-size: 0.875rem;
  }

  .edit-controls {
    display: flex;
    gap: var(--space-sm);
  }

  .type-select {
    flex: 1;
    padding: var(--space-sm);
    border: 1px solid rgba(2, 60, 70, 0.1);
    border-radius: var(--radius-md);
    font-size: 0.875rem;
    background: var(--surface);
  }

  .icon-input {
    width: 3rem;
    padding: var(--space-sm);
    border: 1px solid rgba(2, 60, 70, 0.1);
    border-radius: var(--radius-md);
    font-size: 0.875rem;
    text-align: center;
  }

  .color-input {
    width: 3rem;
    height: 2.25rem;
    border: 1px solid rgba(2, 60, 70, 0.1);
    border-radius: var(--radius-md);
    cursor: pointer;
  }

  .edit-actions {
    display: flex;
    gap: var(--space-sm);
  }

  .save-btn, .cancel-btn {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-xs);
    padding: var(--space-sm);
    border-radius: var(--radius-md);
    border: none;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
  }

  .save-btn {
    background: var(--acapulco);
    color: white;
  }

  .save-btn:hover {
    background: #5ca98a;
  }

  .cancel-btn {
    background: var(--surface);
    color: var(--text-secondary);
    border: 1px solid rgba(2, 60, 70, 0.1);
  }

  .cancel-btn:hover {
    border-color: var(--froly);
    color: var(--froly);
  }

  /* Modal */
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }

  .modal {
    background: var(--surface-elevated);
    border-radius: var(--radius-lg);
    padding: var(--space-xl);
    width: 90%;
    max-width: 500px;
    box-shadow: 0 20px 50px rgba(0, 0, 0, 0.2);
  }

  .modal h2 {
    margin: 0 0 var(--space-lg);
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--text);
  }

  .form-group {
    margin-bottom: var(--space-md);
  }

  .form-group label {
    display: block;
    margin-bottom: var(--space-xs);
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--text-secondary);
  }

  .form-input {
    width: 100%;
    padding: var(--space-sm) var(--space-md);
    border: 1px solid rgba(2, 60, 70, 0.1);
    border-radius: var(--radius-md);
    font-size: 0.875rem;
    background: var(--surface);
  }

  .form-input:focus {
    outline: none;
    border-color: var(--acapulco);
  }

  .form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--space-md);
  }

  .color-picker {
    height: 2.5rem;
    cursor: pointer;
  }

  .type-options {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--space-sm);
  }

  .type-option {
    display: flex;
    align-items: center;
    gap: var(--space-xs);
    padding: var(--space-sm) var(--space-md);
    border: 1px solid rgba(2, 60, 70, 0.1);
    border-radius: var(--radius-md);
    background: var(--surface);
    color: var(--text-secondary);
    font-size: 0.875rem;
    cursor: pointer;
    transition: all 0.2s;
  }

  .type-option:hover {
    border-color: var(--acapulco);
    background: var(--surface-elevated);
  }

  .type-option.selected {
    background: var(--acapulco);
    border-color: var(--acapulco);
    color: white;
  }

  .modal-actions {
    display: flex;
    gap: var(--space-sm);
    margin-top: var(--space-lg);
  }

  .btn-primary, .btn-secondary {
    flex: 1;
    padding: var(--space-sm) var(--space-md);
    border-radius: var(--radius-md);
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
  }

  .btn-primary {
    background: var(--acapulco);
    color: white;
    border: none;
  }

  .btn-primary:hover:not(:disabled) {
    background: #5ca98a;
  }

  .btn-primary:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .btn-secondary {
    background: var(--surface);
    color: var(--text-secondary);
    border: 1px solid rgba(2, 60, 70, 0.1);
  }

  .btn-secondary:hover {
    border-color: var(--text-secondary);
    background: var(--surface-elevated);
  }

  /* Empty State */
  .empty-state, .loading-state {
    grid-column: 1 / -1;
    text-align: center;
    padding: var(--space-xl);
    color: var(--text-muted);
  }

  .add-btn-empty {
    display: inline-flex;
    align-items: center;
    gap: var(--space-xs);
    margin-top: var(--space-md);
    padding: var(--space-sm) var(--space-lg);
    background: var(--acapulco);
    color: white;
    border: none;
    border-radius: var(--radius-md);
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
  }

  .add-btn-empty:hover {
    background: #5ca98a;
    transform: translateY(-1px);
  }
</style>