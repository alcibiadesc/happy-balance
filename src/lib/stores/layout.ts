import { writable } from 'svelte/store';
import { browser } from '$app/environment';

interface LayoutState {
  sidebarCollapsed: boolean;
  mobileMenuOpen: boolean;
}

function createLayoutStore() {
  const initialState: LayoutState = {
    sidebarCollapsed: false,
    mobileMenuOpen: false
  };

  const { subscribe, set, update } = writable<LayoutState>(initialState);

  // Load initial state from localStorage
  if (browser) {
    const savedCollapsed = localStorage.getItem('sidebar-collapsed');
    if (savedCollapsed !== null) {
      initialState.sidebarCollapsed = JSON.parse(savedCollapsed);
      set(initialState);
    }
  }

  return {
    subscribe,
    toggleSidebar: () => update((state) => {
      const newState = { ...state, sidebarCollapsed: !state.sidebarCollapsed };
      if (browser) {
        localStorage.setItem('sidebar-collapsed', JSON.stringify(newState.sidebarCollapsed));
      }
      return newState;
    }),
    toggleMobileMenu: () => update((state) => ({
      ...state,
      mobileMenuOpen: !state.mobileMenuOpen
    })),
    closeMobileMenu: () => update((state) => ({
      ...state,
      mobileMenuOpen: false
    })),
    setSidebarCollapsed: (collapsed: boolean) => update((state) => {
      const newState = { ...state, sidebarCollapsed: collapsed };
      if (browser) {
        localStorage.setItem('sidebar-collapsed', JSON.stringify(collapsed));
      }
      return newState;
    })
  };
}

export const layoutStore = createLayoutStore();