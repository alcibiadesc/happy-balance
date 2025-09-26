<script lang="ts">
  import { Menu } from 'lucide-svelte';
  import Brand from '../atoms/Brand.svelte';
  import ThemeToggle from '../atoms/ThemeToggle.svelte';
  import UserMenu from '../molecules/UserMenu.svelte';

  interface Props {
    onMenuToggle: () => void;
    isMenuOpen: boolean;
  }

  let { onMenuToggle, isMenuOpen }: Props = $props();
</script>

<header class="mobile-header" class:mobile-header--blur={isMenuOpen}>
  <div class="mobile-header-content">
    <div class="mobile-header-start">
      <button
        class="mobile-menu-toggle"
        onclick={onMenuToggle}
        aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
        aria-expanded={isMenuOpen}
      >
        <Menu size={22} strokeWidth={2} />
      </button>
      <Brand showText={false} size="sm" />
    </div>

    <div class="mobile-header-end">
      <ThemeToggle size="sm" />
      <UserMenu />
    </div>
  </div>
</header>

<style>
  .mobile-header {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 40;
    display: block;
    background: var(--surface-elevated);
    backdrop-filter: blur(20px);
    border-bottom: 1px solid var(--border-color);
    box-shadow: var(--shadow-sm);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .mobile-header--blur {
    backdrop-filter: blur(8px);
    background: rgba(254, 247, 238, 0.95);
  }

  :global(html.dark) .mobile-header--blur {
    background: rgba(28, 25, 23, 0.95);
  }

  .mobile-header-content {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--space-md) var(--space-lg);
    height: 72px;
  }

  .mobile-header-start {
    display: flex;
    align-items: center;
    gap: var(--space-md);
  }

  .mobile-header-end {
    display: flex;
    align-items: center;
  }

  .mobile-menu-toggle {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 44px;
    height: 44px;
    border-radius: var(--radius-lg);
    border: none;
    background: transparent;
    color: var(--text-secondary);
    cursor: pointer;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .mobile-menu-toggle:hover {
    background: var(--surface-muted);
    color: var(--text-primary);
    transform: scale(1.05);
  }

  .mobile-menu-toggle:focus {
    outline: none;
    background: var(--surface-muted);
    box-shadow: 0 0 0 2px var(--primary-light);
  }

  .mobile-menu-toggle:active {
    transform: scale(0.95);
  }

  /* Hide on desktop */
  @media (min-width: 1024px) {
    .mobile-header {
      display: none;
    }
  }

  /* Handle reduced motion */
  @media (prefers-reduced-motion: reduce) {
    .mobile-header {
      transition: none;
    }

    .mobile-menu-toggle {
      transition: none;
    }
  }
</style>