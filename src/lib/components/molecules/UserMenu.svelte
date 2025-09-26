<script lang="ts">
  import { authStore } from '$lib/modules/auth/presentation/stores/authStore.svelte';
  import { goto } from '$app/navigation';
  import { fade, fly } from 'svelte/transition';
  import { clickOutside } from '$lib/utils/clickOutside';

  let isMenuOpen = $state(false);
  let menuButton: HTMLButtonElement;
  let dropdownStyle = $state('');

  async function handleLogout() {
    await authStore.logout();
    goto('/login');
  }

  function toggleMenu() {
    isMenuOpen = !isMenuOpen;

    if (isMenuOpen && menuButton) {
      const rect = menuButton.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;

      // If there's not enough space below (less than 300px), show above
      if (spaceBelow < 300 && spaceAbove > 300) {
        dropdownStyle = `
          position: fixed;
          bottom: ${window.innerHeight - rect.top + 8}px;
          right: ${window.innerWidth - rect.right}px;
          z-index: 9999;
        `;
      } else {
        dropdownStyle = `
          position: fixed;
          top: ${rect.bottom + 8}px;
          right: ${window.innerWidth - rect.right}px;
          z-index: 9999;
        `;
      }
    }
  }

  function closeMenu() {
    isMenuOpen = false;
  }

  // Role badge colors and icons
  function getRoleConfig(role: string) {
    switch (role) {
      case 'admin':
        return {
          color: 'var(--error)',
          bg: 'var(--error-bg)',
          border: 'var(--error-border)',
          icon: 'shield',
          label: 'Admin'
        };
      case 'user':
        return {
          color: 'var(--info)',
          bg: 'var(--info-bg)',
          border: 'var(--info-border)',
          icon: 'user',
          label: 'User'
        };
      case 'viewer':
        return {
          color: 'var(--warning)',
          bg: 'var(--warning-bg)',
          border: 'var(--warning-border)',
          icon: 'eye',
          label: 'Viewer'
        };
      default:
        return {
          color: 'var(--text-secondary)',
          bg: 'var(--surface-muted)',
          border: 'var(--border-color)',
          icon: 'user',
          label: 'User'
        };
    }
  }

  let roleConfig = $derived(authStore.currentUser ? getRoleConfig(authStore.currentUser.role) : null);
</script>

{#if authStore.currentUser}
  <div class="user-menu-container" use:clickOutside={closeMenu}>
    <button
      bind:this={menuButton}
      onclick={toggleMenu}
      class="user-menu-trigger"
      aria-label="User menu"
      aria-expanded={isMenuOpen}
    >
      <div class="user-avatar">
        {authStore.currentUser.displayName.charAt(0).toUpperCase()}
      </div>
      <svg
        class="chevron"
        class:chevron--open={isMenuOpen}
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <polyline points="6 9 12 15 18 9"></polyline>
      </svg>
    </button>

    {#if isMenuOpen}
      <div
        class="user-menu-dropdown"
        style={dropdownStyle}
        in:fly={{ y: -10, duration: 200 }}
        out:fade={{ duration: 150 }}
      >
        <div class="menu-header">
          <div class="user-info">
            <span class="user-display-name">{authStore.currentUser.displayName}</span>
          </div>
        </div>

        <div class="menu-divider"></div>

        {#if authStore.isAdmin}
          <a
            href="/admin/users"
            onclick={closeMenu}
            class="menu-item"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
            <span>Manage Users</span>
          </a>
          <div class="menu-divider"></div>
        {/if}

        <a
          href="/settings"
          onclick={closeMenu}
          class="menu-item"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="3"/>
            <path d="M12 1v6m0 6v6m4.22-13.22l4.24 4.24M1.54 1.54l4.24 4.24M20.46 20.46l-4.24-4.24M1.54 20.46l4.24-4.24M22 12h-6m-6 0H1"/>
          </svg>
          <span>Settings</span>
        </a>

        <button
          onclick={handleLogout}
          class="menu-item menu-item--danger"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          <span>Sign Out</span>
        </button>
      </div>
    {/if}
  </div>
{/if}

<style>
  .user-menu-container {
    position: relative;
  }

  .user-menu-trigger {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.25rem 0.5rem 0.25rem 0.25rem;
    background: transparent;
    border: none;
    border-radius: 10px;
    cursor: pointer;
    transition: all 0.2s ease;
    color: var(--text-primary);
  }

  .user-menu-trigger:hover {
    background: var(--surface-muted);
  }

  .user-menu-trigger:active {
    transform: scale(0.98);
  }

  .user-avatar {
    width: 36px;
    height: 36px;
    border-radius: 10px;
    background: var(--evening-sea);
    color: var(--bridesmaid);
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 600;
    font-size: 0.875rem;
    box-shadow: 0 2px 8px rgba(var(--evening-sea-rgb), 0.15);
  }

  .chevron {
    transition: transform 0.2s ease;
    color: var(--text-tertiary);
  }

  .chevron--open {
    transform: rotate(180deg);
  }

  .user-menu-dropdown {
    width: 280px;
    background: var(--surface-elevated);
    border-radius: 16px;
    box-shadow: var(--shadow-xl);
    border: 1px solid var(--border-color);
    overflow: hidden;
  }

  .menu-header {
    padding: 1.25rem 1rem 1rem;
  }

  .user-info {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .user-display-name {
    font-size: 0.938rem;
    font-weight: 600;
    color: var(--text-primary);
    letter-spacing: -0.01em;
  }



  .menu-divider {
    height: 1px;
    background: var(--border-color);
    margin: 0;
  }

  .menu-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    width: 100%;
    padding: 0.75rem 1rem;
    background: transparent;
    border: none;
    color: var(--text-primary);
    font-size: 0.875rem;
    font-weight: 500;
    text-decoration: none;
    cursor: pointer;
    transition: all 0.2s ease;
    position: relative;
  }

  .menu-item::before {
    content: '';
    position: absolute;
    left: 0;
    top: 50%;
    transform: translateY(-50%);
    width: 3px;
    height: 0;
    background: var(--primary);
    transition: height 0.2s ease;
  }

  .menu-item:hover {
    background: var(--surface-muted);
    color: var(--text-primary);
  }

  .menu-item:hover::before {
    height: 60%;
  }

  .menu-item svg {
    color: var(--text-tertiary);
    transition: color 0.2s ease;
  }

  .menu-item:hover svg {
    color: var(--primary);
  }

  .menu-item--danger {
    color: var(--error);
  }

  .menu-item--danger:hover {
    background: var(--error-bg);
  }

  .menu-item--danger svg {
    color: var(--error);
  }

  @media (max-width: 640px) {
    .user-menu-dropdown {
      width: 240px;
    }
  }
</style>