<script lang="ts">
  import { Upload, BarChart3, CreditCard, Settings, FolderOpen, Calculator } from 'lucide-svelte';
  import { page } from '$app/stores';
  import NavItem from '../atoms/NavItem.svelte';
  
  // Navigation items with emphasis on import
  const navigationItems = [
    {
      href: '/dashboard',
      icon: BarChart3,
      label: 'ダッシュボード',
      section: 'main'
    },
    {
      href: '/import',
      icon: Upload,
      label: 'インポート',
      section: 'main',
      isImportant: true // Emphasized per user request
    },
    {
      href: '/transactions',
      icon: CreditCard,
      label: 'トランザクション',
      section: 'main'
    },
    {
      href: '/categories',
      icon: FolderOpen,
      label: 'カテゴリ',
      section: 'manage'
    },
    {
      href: '/budgets',
      icon: Calculator,
      label: '予算',
      section: 'manage'
    },
    {
      href: '/settings',
      icon: Settings,
      label: '設定',
      section: 'manage'
    }
  ];
  
  // Group items by section
  const mainItems = navigationItems.filter(item => item.section === 'main');
  const manageItems = navigationItems.filter(item => item.section === 'manage');
  
  function isActive(href: string): boolean {
    if (href === '/dashboard' && $page.url.pathname === '/') {
      return true;
    }
    return $page.url.pathname === href || $page.url.pathname.startsWith(href + '/');
  }
</script>

<nav class="nav-list" aria-label="主要ナビゲーション">
  <!-- Main Section -->
  <div class="nav-section">
    <h2 class="nav-section__title">メイン</h2>
    <ul class="nav-section__list">
      {#each mainItems as item}
        <li>
          <NavItem 
            href={item.href}
            icon={item.icon}
            label={item.label}
            isActive={isActive(item.href)}
            isImportant={item.isImportant}
          />
        </li>
      {/each}
    </ul>
  </div>
  
  <!-- Divider with Ma (間) spacing -->
  <div class="nav-divider" role="separator" aria-hidden="true"></div>
  
  <!-- Management Section -->
  <div class="nav-section">
    <h2 class="nav-section__title">管理</h2>
    <ul class="nav-section__list">
      {#each manageItems as item}
        <li>
          <NavItem 
            href={item.href}
            icon={item.icon}
            label={item.label}
            isActive={isActive(item.href)}
          />
        </li>
      {/each}
    </ul>
  </div>
</nav>

<style>
  .nav-list {
    @apply flex flex-col;
    padding: var(--space-md) 0;
  }
  
  .nav-section {
    @apply flex flex-col;
  }
  
  .nav-section + .nav-section {
    margin-top: var(--space-lg);
  }
  
  .nav-section__title {
    @apply text-xs font-medium uppercase tracking-wider mb-3 px-3;
    color: var(--text-muted);
    letter-spacing: 0.1em;
    font-weight: 500;
  }
  
  .nav-section__list {
    @apply flex flex-col space-y-1;
    list-style: none;
    padding: 0;
    margin: 0;
  }
  
  /* Ma (間) - Japanese aesthetic divider */
  .nav-divider {
    @apply self-center my-6;
    width: 24px;
    height: 1px;
    background: linear-gradient(90deg, transparent, var(--text-muted), transparent);
    opacity: 0.3;
  }
  
  /* Subtle animation for section transitions */
  .nav-section {
    animation: fadeInUp 0.3s ease-out;
  }
  
  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(8px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  /* Focus management for accessibility */
  .nav-list:focus-within .nav-section__title {
    color: var(--text-secondary);
  }
</style>
