import { writable } from 'svelte/store';
import { browser } from '$app/environment';
import {
  METRIC_DEFINITIONS,
  SECTION_DEFINITIONS,
  type MetricType,
  type SectionType,
} from '$lib/config/dashboardSections';

// Re-export types for convenience
export type { MetricType, SectionType };

export interface MetricConfig {
  id: MetricType;
  visible: boolean;
  order: number;
  size: 'normal' | 'large';
}

export interface SectionConfig {
  id: SectionType;
  visible: boolean;
  order: number;
}

export interface DashboardConfig {
  metrics: MetricConfig[];
  sections: SectionConfig[];
  editMode: boolean;
}

// Generate default config from definitions
const DEFAULT_CONFIG: DashboardConfig = {
  metrics: METRIC_DEFINITIONS.map((m) => ({
    id: m.id,
    visible: m.defaultVisible,
    order: m.defaultOrder,
    size: 'normal' as const,
  })),
  sections: SECTION_DEFINITIONS.map((s) => ({
    id: s.id,
    visible: s.defaultVisible,
    order: s.defaultOrder,
  })),
  editMode: false,
};

const STORAGE_KEY = 'dashboard-config';

function loadConfig(): DashboardConfig {
  if (!browser) return DEFAULT_CONFIG;

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        metrics: DEFAULT_CONFIG.metrics.map((defaultMetric) => {
          const saved = parsed.metrics?.find((m: MetricConfig) => m.id === defaultMetric.id);
          return saved ? { ...defaultMetric, ...saved } : defaultMetric;
        }),
        sections: DEFAULT_CONFIG.sections.map((defaultSection) => {
          const saved = parsed.sections?.find((s: SectionConfig) => s.id === defaultSection.id);
          return saved ? { ...defaultSection, ...saved } : defaultSection;
        }),
        editMode: false,
      };
    }
  } catch {
    // Ignore parse errors
  }
  return DEFAULT_CONFIG;
}

function saveConfig(config: DashboardConfig) {
  if (!browser) return;
  const toSave = { ...config, editMode: false };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
}

function createDashboardConfigStore() {
  const { subscribe, set, update } = writable<DashboardConfig>(loadConfig());

  // Generic visibility toggle
  const setItemVisibility = <T extends { id: string; visible: boolean }>(
    items: T[],
    id: string,
    visible: boolean
  ): T[] => items.map((item) => (item.id === id ? { ...item, visible } : item));

  // Generic reorder function
  const reorderItems = <T extends { id: string; order: number }>(
    items: T[],
    fromId: string,
    toId: string
  ): T[] => {
    const sorted = [...items].sort((a, b) => a.order - b.order);
    const fromIndex = sorted.findIndex((item) => item.id === fromId);
    const toIndex = sorted.findIndex((item) => item.id === toId);

    if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) return items;

    const [moved] = sorted.splice(fromIndex, 1);
    sorted.splice(toIndex, 0, moved);

    return sorted.map((item, i) => ({ ...item, order: i }));
  };

  return {
    subscribe,

    // Edit mode
    toggleEditMode() {
      update((config) => ({ ...config, editMode: !config.editMode }));
    },

    setEditMode(value: boolean) {
      update((config) => ({ ...config, editMode: value }));
    },

    // Metrics
    toggleMetric(id: MetricType) {
      update((config) => {
        const metric = config.metrics.find((m) => m.id === id);
        const newConfig = {
          ...config,
          metrics: setItemVisibility(config.metrics, id, !metric?.visible),
        };
        saveConfig(newConfig);
        return newConfig;
      });
    },

    showMetric(id: MetricType) {
      update((config) => {
        const newConfig = {
          ...config,
          metrics: setItemVisibility(config.metrics, id, true),
        };
        saveConfig(newConfig);
        return newConfig;
      });
    },

    hideMetric(id: MetricType) {
      update((config) => {
        const newConfig = {
          ...config,
          metrics: setItemVisibility(config.metrics, id, false),
        };
        saveConfig(newConfig);
        return newConfig;
      });
    },

    toggleMetricSize(id: MetricType) {
      update((config) => {
        const newConfig: DashboardConfig = {
          ...config,
          metrics: config.metrics.map((m) =>
            m.id === id ? { ...m, size: m.size === 'large' ? 'normal' : 'large' } : m
          ),
        };
        saveConfig(newConfig);
        return newConfig;
      });
    },

    reorderMetrics(fromId: MetricType, toId: MetricType) {
      update((config) => {
        const newConfig = {
          ...config,
          metrics: reorderItems(config.metrics, fromId, toId),
        };
        saveConfig(newConfig);
        return newConfig;
      });
    },

    // Sections
    toggleSection(id: SectionType) {
      update((config) => {
        const section = config.sections.find((s) => s.id === id);
        const newConfig = {
          ...config,
          sections: setItemVisibility(config.sections, id, !section?.visible),
        };
        saveConfig(newConfig);
        return newConfig;
      });
    },

    showSection(id: SectionType) {
      update((config) => {
        const newConfig = {
          ...config,
          sections: setItemVisibility(config.sections, id, true),
        };
        saveConfig(newConfig);
        return newConfig;
      });
    },

    hideSection(id: SectionType) {
      update((config) => {
        const newConfig = {
          ...config,
          sections: setItemVisibility(config.sections, id, false),
        };
        saveConfig(newConfig);
        return newConfig;
      });
    },

    reorderSections(fromId: SectionType, toId: SectionType) {
      update((config) => {
        const newConfig = {
          ...config,
          sections: reorderItems(config.sections, fromId, toId),
        };
        saveConfig(newConfig);
        return newConfig;
      });
    },

    // Legacy arrow-based reordering (kept for compatibility)
    moveMetric(id: MetricType, direction: 'up' | 'down') {
      update((config) => {
        const metrics = [...config.metrics].sort((a, b) => a.order - b.order);
        const index = metrics.findIndex((m) => m.id === id);

        if (index === -1) return config;
        if (direction === 'up' && index === 0) return config;
        if (direction === 'down' && index === metrics.length - 1) return config;

        const swapIndex = direction === 'up' ? index - 1 : index + 1;
        [metrics[index].order, metrics[swapIndex].order] = [
          metrics[swapIndex].order,
          metrics[index].order,
        ];

        const newConfig = { ...config, metrics };
        saveConfig(newConfig);
        return newConfig;
      });
    },

    moveSection(id: SectionType, direction: 'up' | 'down') {
      update((config) => {
        const sections = [...config.sections].sort((a, b) => a.order - b.order);
        const index = sections.findIndex((s) => s.id === id);

        if (index === -1) return config;
        if (direction === 'up' && index === 0) return config;
        if (direction === 'down' && index === sections.length - 1) return config;

        const swapIndex = direction === 'up' ? index - 1 : index + 1;
        [sections[index].order, sections[swapIndex].order] = [
          sections[swapIndex].order,
          sections[index].order,
        ];

        const newConfig = { ...config, sections };
        saveConfig(newConfig);
        return newConfig;
      });
    },

    reset() {
      const resetConfig = { ...DEFAULT_CONFIG, editMode: false };
      saveConfig(resetConfig);
      set(resetConfig);
    },
  };
}

export const dashboardConfig = createDashboardConfigStore();
