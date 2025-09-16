import { writable } from "svelte/store";
import { browser } from "$app/environment";

// Create a writable store for sidebar state
export const sidebarCollapsed = writable(false);

// Function to toggle sidebar
export function toggleSidebar() {
  sidebarCollapsed.update((collapsed) => {
    const newState = !collapsed;
    if (browser) {
      localStorage.setItem("sidebar-collapsed", JSON.stringify(newState));
      // Update body class immediately
      document.body.classList.toggle("sidebar-collapsed", newState);
    }
    return newState;
  });
}

// Initialize sidebar state from localStorage on client
export function initSidebar() {
  if (browser) {
    const saved = localStorage.getItem("sidebar-collapsed");
    if (saved !== null) {
      const isCollapsed = JSON.parse(saved);
      sidebarCollapsed.set(isCollapsed);
      document.body.classList.toggle("sidebar-collapsed", isCollapsed);
    }
  }
}
