<script lang="ts">
  import { X } from 'lucide-svelte';
  import Brand from '../atoms/Brand.svelte';
  import NavList from '../molecules/NavList.svelte';

  interface Props {
    isOpen: boolean;
    onClose: () => void;
  }

  let { isOpen, onClose }: Props = $props();

  // Close on escape key
  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape' && isOpen) {
      onClose();
    }
  }
</script>

<!-- Mobile Overlay -->
{#if isOpen}
  <div
    class="mobile-overlay"
    onclick={onClose}
    aria-hidden="true"
  ></div>
{/if}

<!-- Mobile Sidebar -->
<aside
  class="mobile-sidebar"
  class:mobile-sidebar--open={isOpen}
  aria-hidden={!isOpen}
>
  <div class="mobile-sidebar-container">
    <!-- Mobile Header -->
    <header class="mobile-sidebar-header">
      <Brand size="md" />
      <button
        class="mobile-sidebar-close"
        onclick={onClose}
        aria-label="Close menu"
      >
        <X size={20} strokeWidth={2} />
      </button>
    </header>

    <!-- Mobile Navigation -->
    <nav class="mobile-sidebar-navigation">
      <NavList collapsed={false} onItemClick={onClose} />
    </nav>
  </div>
</aside>

<svelte:window onkeydown={handleKeydown} />

<style>
  .mobile-overlay {
    position: fixed;
    inset: 0;
    z-index: 45;
    background: rgba(2, 60, 70, 0.4);
    backdrop-filter: blur(8px);
    animation: fadeIn 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
      backdrop-filter: blur(0);
    }
    to {
      opacity: 1;
      backdrop-filter: blur(8px);
    }
  }

  .mobile-sidebar {
    position: fixed;
    top: 0;
    left: 0;
    height: 100vh;
    width: min(320px, 85vw);
    z-index: 50;
    background: var(--surface-elevated);
    box-shadow: var(--shadow-lg);
    transform: translateX(-100%);
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    display: block;
  }

  .mobile-sidebar--open {
    transform: translateX(0);
  }

  .mobile-sidebar-container {
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;
  }

  .mobile-sidebar-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--space-lg);
    border-bottom: 1px solid var(--border-color);
    min-height: 80px;
  }

  .mobile-sidebar-close {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border-radius: var(--radius-lg);
    border: none;
    background: transparent;
    color: var(--text-secondary);
    cursor: pointer;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .mobile-sidebar-close:hover {
    background: var(--surface-muted);
    color: var(--text-primary);
    transform: scale(1.05);
  }

  .mobile-sidebar-close:focus {
    outline: none;
    box-shadow: 0 0 0 2px var(--primary-light);
  }

  .mobile-sidebar-navigation {
    flex: 1;
    padding: var(--space-lg);
    overflow-y: auto;
  }

  /* Hide on desktop */
  @media (min-width: 1024px) {
    .mobile-sidebar,
    .mobile-overlay {
      display: none;
    }
  }

  /* Handle reduced motion */
  @media (prefers-reduced-motion: reduce) {
    .mobile-sidebar {
      transition: none;
    }

    .mobile-overlay {
      animation: none;
    }
  }
</style>