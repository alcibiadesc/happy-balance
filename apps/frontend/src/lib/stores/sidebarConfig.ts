import { writable } from 'svelte/store';
import { browser } from '$app/environment';

export type NavItemId = 'dashboard' | 'transactions' | 'categories' | 'portfolio' | 'settings' | 'import';

export interface NavItemConfig {
  id: NavItemId;
  href: string;
  icon: string;
  labelKey: string;
  visible: boolean;
  order: number;
  /** If true, this item cannot be hidden */
  required?: boolean;
}

export interface SidebarConfig {
  items: NavItemConfig[];
}

// Default configuration for sidebar navigation items
const DEFAULT_NAV_ITEMS: NavItemConfig[] = [
  { id: 'dashboard', href: '/', icon: 'layout-dashboard', labelKey: 'navigation.dashboard', visible: true, order: 0, required: true },
  { id: 'transactions', href: '/transactions', icon: 'receipt', labelKey: 'navigation.transactions', visible: true, order: 1, required: true },
  { id: 'categories', href: '/categories', icon: 'tag', labelKey: 'navigation.categories', visible: true, order: 2 },
  { id: 'portfolio', href: '/portfolio', icon: 'trending-up', labelKey: 'navigation.portfolio', visible: true, order: 3 },
  { id: 'settings', href: '/settings', icon: 'settings', labelKey: 'navigation.settings', visible: true, order: 4, required: true },
];

const DEFAULT_CONFIG: SidebarConfig = {
  items: DEFAULT_NAV_ITEMS,
};

const STORAGE_KEY = 'sidebar-config';

function loadConfig(): SidebarConfig {
  if (!browser) return DEFAULT_CONFIG;

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Merge with defaults to handle new items
      return {
        items: DEFAULT_NAV_ITEMS.map(defaultItem => {
          const saved = parsed.items?.find((item: NavItemConfig) => item.id === defaultItem.id);
          return saved ? { ...defaultItem, ...saved, required: defaultItem.required } : defaultItem;
        }),
      };
    }
  } catch {
    // Ignore parse errors
  }
  return DEFAULT_CONFIG;
}

function saveConfig(config: SidebarConfig) {
  if (!browser) return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}

function createSidebarConfigStore() {
  const { subscribe, set, update } = writable<SidebarConfig>(loadConfig());

  return {
    subscribe,

    /**
     * Toggle visibility of a nav item
     */
    toggleItem(id: NavItemId) {
      update(config => {
        const item = config.items.find(i => i.id === id);
        if (item?.required) return config; // Cannot hide required items

        const newConfig = {
          ...config,
          items: config.items.map(item =>
            item.id === id ? { ...item, visible: !item.visible } : item
          ),
        };
        saveConfig(newConfig);
        return newConfig;
      });
    },

    /**
     * Show a specific nav item
     */
    showItem(id: NavItemId) {
      update(config => {
        const newConfig = {
          ...config,
          items: config.items.map(item =>
            item.id === id ? { ...item, visible: true } : item
          ),
        };
        saveConfig(newConfig);
        return newConfig;
      });
    },

    /**
     * Hide a specific nav item
     */
    hideItem(id: NavItemId) {
      update(config => {
        const item = config.items.find(i => i.id === id);
        if (item?.required) return config; // Cannot hide required items

        const newConfig = {
          ...config,
          items: config.items.map(item =>
            item.id === id ? { ...item, visible: false } : item
          ),
        };
        saveConfig(newConfig);
        return newConfig;
      });
    },

    /**
     * Set visibility for a specific nav item
     */
    setItemVisibility(id: NavItemId, visible: boolean) {
      update(config => {
        const item = config.items.find(i => i.id === id);
        if (!visible && item?.required) return config; // Cannot hide required items

        const newConfig = {
          ...config,
          items: config.items.map(item =>
            item.id === id ? { ...item, visible } : item
          ),
        };
        saveConfig(newConfig);
        return newConfig;
      });
    },

    /**
     * Get visible items sorted by order
     */
    getVisibleItems(config: SidebarConfig): NavItemConfig[] {
      return config.items
        .filter(item => item.visible)
        .sort((a, b) => a.order - b.order);
    },

    /**
     * Reset to default configuration
     */
    reset() {
      saveConfig(DEFAULT_CONFIG);
      set(DEFAULT_CONFIG);
    },
  };
}

export const sidebarConfig = createSidebarConfigStore();
