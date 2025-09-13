<script lang="ts">
  import '../app.css';
  import '../lib/styles/japan-palette.css';
  import { env } from '$env/dynamic/public';
  import Navbar from '../lib/components/organisms/Navbar.svelte';
  
  let { children } = $props();
  
  // Demo mode detection
  let isDemoMode = $derived(env.PUBLIC_DEMO_MODE === 'true');
</script>

<svelte:head>
  <!-- Japanese font support -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@300;400;500;700&display=swap" rel="stylesheet">
</svelte:head>

<!-- Application Shell with Japanese minimalism -->
<div class="app-shell japan">
  <!-- Navigation -->
  <Navbar />
  
  <!-- Main Content Area -->
  <main class="main-content">
    <!-- Demo Banner -->
    {#if isDemoMode}
      <div class="demo-banner">
        <div class="demo-banner__content">
          <div class="demo-banner__icon">🌸</div>
          <div class="demo-banner__text">
            <strong>デモモード</strong>
            <span>すべてのデータはテスト用の架空のものです</span>
          </div>
        </div>
      </div>
    {/if}
    
    <!-- Page Content -->
    <div class="content-container">
      {@render children?.()}
    </div>
  </main>
</div>

<style>
  :global(html) {
    font-family: 'Noto Sans JP', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  }
  
  .app-shell {
    @apply min-h-screen;
    background: var(--surface);
    color: var(--text-primary);
    font-feature-settings: 'liga' 1, 'kern' 1;
  }
  
  /* Main content area with proper spacing for navbar */
  .main-content {
    @apply flex flex-col min-h-screen;
    margin-left: 0;
    padding-top: 64px; /* Mobile header height */
  }
  
  @media (min-width: 1024px) {
    .main-content {
      margin-left: 280px; /* Desktop sidebar width */
      padding-top: 0;
    }
  }
  
  /* Demo Banner */
  .demo-banner {
    @apply flex items-center justify-center py-3 px-4;
    background: linear-gradient(135deg, var(--warning), var(--sunglow));
    color: var(--text-inverse);
    border-bottom: 1px solid rgba(2, 60, 70, 0.1);
  }
  
  .demo-banner__content {
    @apply flex items-center gap-3 max-w-4xl;
  }
  
  .demo-banner__icon {
    @apply text-lg;
  }
  
  .demo-banner__text {
    @apply flex flex-col;
  }
  
  .demo-banner__text strong {
    @apply font-medium text-sm;
    letter-spacing: 0.025em;
  }
  
  .demo-banner__text span {
    @apply text-xs opacity-90;
    font-weight: 300;
  }
  
  /* Content Container with Ma (間) spacing */
  .content-container {
    @apply flex-1 p-4;
    max-width: 1200px;
    margin: 0 auto;
    width: 100%;
  }
  
  @media (min-width: 768px) {
    .content-container {
      @apply p-6;
    }
  }
  
  @media (min-width: 1024px) {
    .content-container {
      @apply p-8;
    }
  }
  
  /* Global typography improvements */
  :global(h1, h2, h3, h4, h5, h6) {
    color: var(--text-primary);
    font-weight: 500;
    letter-spacing: 0.01em;
    line-height: 1.4;
  }
  
  :global(p) {
    color: var(--text-secondary);
    line-height: 1.7;
    font-weight: 300;
  }
  
  /* Subtle page transitions */
  :global(.page-transition) {
    animation: fadeInUp 0.3s ease-out;
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
  
  /* Focus management for better accessibility */
  :global(.skip-nav) {
    @apply sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 z-50;
    @apply px-4 py-2 rounded-md;
    background: var(--primary);
    color: var(--text-inverse);
  }
  
  /* Custom scrollbar with Japan aesthetics */
  :global(body) {
    scrollbar-width: thin;
    scrollbar-color: var(--primary) var(--surface-muted);
  }
  
  :global(body::-webkit-scrollbar) {
    width: 8px;
  }
  
  :global(body::-webkit-scrollbar-track) {
    background: var(--surface-muted);
  }
  
  :global(body::-webkit-scrollbar-thumb) {
    background: var(--primary);
    border-radius: 4px;
    border: 2px solid var(--surface-muted);
  }
  
  :global(body::-webkit-scrollbar-thumb:hover) {
    background: var(--primary-hover);
  }
  
  /* Dark mode enhancements */
  @media (prefers-color-scheme: dark) {
    .demo-banner {
      background: linear-gradient(135deg, var(--warning), rgba(254, 205, 44, 0.8));
      border-bottom-color: rgba(254, 247, 238, 0.1);
    }
  }
  
  /* Print styles */
  @media print {
    .demo-banner {
      display: none;
    }
    
    .main-content {
      margin-left: 0;
      padding-top: 0;
    }
  }
  
  /* High contrast mode support */
  @media (prefers-contrast: high) {
    .app-shell {
      --shadow-sm: none;
      --shadow-md: none;
      --shadow-lg: none;
    }
  }
  
  /* Reduced motion support */
  @media (prefers-reduced-motion: reduce) {
    :global(*) {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
    }
  }
</style>
