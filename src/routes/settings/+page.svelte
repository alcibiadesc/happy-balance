<script>
  import ThemeToggle from '../../lib/components/atoms/ThemeToggle.svelte';
</script>

<div class="settings-page">
  <h1 class="text-3xl font-medium text-emphasis mb-6">
    Settings
  </h1>
  
  <div class="settings-grid">
    <div class="setting-card">
      <h2 class="text-xl font-medium mb-3">Appearance</h2>
      <p class="text-light text-subtle mb-4">
        Customize how Happy Balance looks and feels.
      </p>
      
      <div class="setting-item">
        <div class="setting-item__content">
          <h3 class="font-medium text-emphasis">Theme</h3>
          <p class="text-sm text-subtle">Choose between light and dark mode</p>
        </div>
        <div class="setting-item__control">
          <ThemeToggle size="md" />
        </div>
      </div>
    </div>
    
    <div class="setting-card">
      <h2 class="text-xl font-medium mb-3">Data & Privacy</h2>
      <p class="text-light text-subtle mb-4">
        Manage your financial data and privacy preferences.
      </p>
      
      <div class="setting-item">
        <div class="setting-item__content">
          <h3 class="font-medium text-emphasis">Export Data</h3>
          <p class="text-sm text-subtle">Download all your financial data</p>
        </div>
        <div class="setting-item__control">
          <button class="btn-secondary">Export</button>
        </div>
      </div>
    </div>
  </div>
</div>

<style>
  .settings-page {
    animation: fadeInUp 0.3s ease-out;
  }
  
  .settings-grid {
    display: grid;
    gap: var(--space-lg);
    grid-template-columns: 1fr;
  }
  
  @media (min-width: 768px) {
    .settings-grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }
  
  .setting-card {
    background: var(--surface-elevated);
    padding: var(--space-xl);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-sm);
    border: 1px solid rgba(2, 60, 70, 0.08);
    transition: all 0.2s ease;
  }
  
  .setting-card:hover {
    transform: translateY(-1px);
    box-shadow: var(--shadow-md);
  }
  
  .setting-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--space-md);
    border-radius: var(--radius-md);
    background: var(--surface-muted);
    margin-top: var(--space-md);
  }
  
  .setting-item__content {
    flex: 1;
  }
  
  .setting-item__control {
    flex-shrink: 0;
    margin-left: var(--space-md);
  }
  
  .btn-secondary {
    padding: 0.5rem 1rem;
    border-radius: var(--radius-md);
    border: 1px solid var(--text-muted);
    background: transparent;
    color: var(--text-secondary);
    font-size: 0.875rem;
    cursor: pointer;
    transition: all 0.15s ease;
  }
  
  .btn-secondary:hover {
    background: var(--primary-light);
    color: var(--primary);
    border-color: var(--primary);
  }
  
  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(16px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  /* Dark mode adjustments */
  html.dark .setting-card {
    border-color: rgba(254, 247, 238, 0.1);
  }
  
  html.dark .setting-item {
    background: var(--surface-muted);
  }
</style>
