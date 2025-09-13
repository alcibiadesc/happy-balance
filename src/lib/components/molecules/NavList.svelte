<script lang="ts">
  import { Upload, BarChart3, CreditCard, Settings, FolderOpen, Calculator } from 'lucide-svelte';
  import { page } from '$app/stores';
  import NavItem from '../atoms/NavItem.svelte';
  
  // Navigation items with emphasis on import
  const navigationItems = [
    {
      href: '/dashboard',
      icon: BarChart3,
      label: 'Dashboard',
      section: 'main'
    },
    {
      href: '/import',
      icon: Upload,
      label: 'Import',
      section: 'main',
      isImportant: true // Emphasized as requested
    },
    {
      href: '/transactions',
      icon: CreditCard,
      label: 'Transactions',
      section: 'main'
    },
    {
      href: '/categories',
      icon: FolderOpen,
      label: 'Categories',
      section: 'manage'
    },
    {
      href: '/budgets',
      icon: Calculator,
      label: 'Budgets',
      section: 'manage'
    },
    {
      href: '/settings',
      icon: Settings,
      label: 'Settings',
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

<nav class="nav-list" aria-label="Main navigation">
  <!-- Main Section -->
  <div class="nav-section">
    <h2 class="nav-section__title">Main</h2>
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
  
  <!-- Divider -->
  <div class="nav-divider" role="separator" aria-hidden="true"></div>
  
  <!-- Management Section -->
  <div class="nav-section">
    <h2 class="nav-section__title">Management</h2>
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
    display: flex;
    flex-direction: column;
    padding: var(--space-md) 0;
  }
  
  .nav-section {
    display: flex;
    flex-direction: column;
  }
  
  .nav-section + .nav-section {
    margin-top: var(--space-lg);
  }
  
  .nav-section__title {
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.1em;
    margin-bottom: 0.75rem;
    padding: 0 0.75rem;
  }
  
  .nav-section__list {
    display: flex;
    flex-direction: column;
    gap: var(--space-xs);
    list-style: none;
    padding: 0;
    margin: 0;
  }
  
  /* Minimal divider */
  .nav-divider {
    align-self: center;
    margin: var(--space-lg) 0;
    width: 24px;
    height: 1px;
    background: linear-gradient(90deg, transparent, var(--text-muted), transparent);
    opacity: 0.3;
  }
  
  /* Subtle animation for sections */
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
  
  /* Focus management */
  .nav-list:focus-within .nav-section__title {
    color: var(--text-secondary);
  }
</style>
