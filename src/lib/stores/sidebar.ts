import { writable } from 'svelte/store';
import { browser } from '$app/environment';

// Create a writable store for sidebar state
export const sidebarCollapsed = writable(false);

// Function to toggle sidebar
export function toggleSidebar() {
  sidebarCollapsed.update(collapsed => {
    const newState = !collapsed;
    if (browser) {
      localStorage.setItem('sidebar-collapsed', JSON.stringify(newState));
    }
    return newState;
  });
}

// Initialize sidebar state from localStorage
if (browser) {
  const saved = localStorage.getItem('sidebar-collapsed');
  if (saved !== null) {
    sidebarCollapsed.set(JSON.parse(saved));
  }
}
