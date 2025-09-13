<script>
  // Dashboard page - temporary content
</script>

<div class="dashboard">
  <h1 class="text-3xl font-medium text-emphasis mb-6">
    Dashboard
  </h1>
  
  <div class="welcome-card">
    <h2 class="text-xl font-medium mb-3">Welcome to Happy Balance</h2>
    <p class="text-light text-subtle">
      Your minimalist financial clarity dashboard. Navigate using the sidebar to import data and explore your financial insights.
    </p>
    
    <div class="mt-6 p-4 rounded-lg" style="background: var(--primary-light);">
      <p class="text-sm text-emphasis">
        ✨ <strong>Next:</strong> Click "Import" in the sidebar to upload your financial data and see personalized metrics like "2 out of every 10 euros you spend" and investment tracking.
      </p>
    </div>
  </div>
</div>

<style>
  .dashboard {
    animation: fadeInUp 0.3s ease-out;
  }
  
  .welcome-card {
    background: var(--surface-elevated);
    padding: var(--space-xl);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-sm);
    border: 1px solid rgba(2, 60, 70, 0.08);
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
</style>
