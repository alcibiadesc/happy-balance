import { Settings } from '../../domain/entities/Settings';
import { Theme, type ThemeType } from '../../domain/value-objects/Theme';
import { Language } from '../../domain/value-objects/Language';
import { t } from '$lib/stores/i18n';
import { currentLanguage, setLanguage } from '$lib/stores/i18n';
import { currentCurrency, setCurrency } from '$lib/stores/currency';
import { setTheme, effectiveTheme } from '$lib/stores/theme';
import { userPreferences } from '$lib/stores/user-preferences';
import { get } from 'svelte/store';
import { authFetch, TOAST_DURATION } from '$lib/utils/authFetch';
import { browser } from '$app/environment';

// ============================================================================
// Types
// ============================================================================

export interface Transaction {
  id: string;
  date: string;
  amount: number;
  merchant: string;
  description?: string;
  categoryId?: string;
  hash?: string;
}

export interface Category {
  id: string;
  name: string;
  color: string;
  icon?: string;
  type: string;
}

export interface Investment {
  id: string;
  name: string;
  ticker?: string;
  currentValue: number;
  totalInvested: number;
}

export interface InvestmentHistoryEntry {
  id: string;
  investmentId: string;
  date: string;
  value: number;
}

export interface ExportSummary {
  totalTransactions: number;
  totalCategories: number;
  totalInvestments: number;
  totalHistoryEntries: number;
  dateRange: {
    from: string | null;
    to: string | null;
  };
}

export interface FrontendSettings {
  dashboardConfig: Record<string, unknown> | null;
  sidebarConfig: Record<string, unknown> | null;
  userPreferences: {
    theme?: ThemeType;
    language?: string;
    currency?: string;
  } | null;
}

export interface CompleteExportData {
  exportDate: string;
  version: string;
  user: {
    id: string;
    exportedAt: string;
  };
  data: {
    transactions: Transaction[];
    categories: Category[];
    investments: Investment[];
    investmentHistory: InvestmentHistoryEntry[];
    summary: ExportSummary;
  };
  frontendSettings: FrontendSettings;
}

export interface ImportData {
  // New complete format
  data?: {
    transactions?: Transaction[];
    categories?: Category[];
    investments?: Investment[];
    investmentHistory?: InvestmentHistoryEntry[];
  };
  frontendSettings?: FrontendSettings;
  // Legacy format compatibility
  transactions?: Transaction[];
  transactionHashes?: string[];
  categories?: Category[];
  settings?: {
    currency?: string;
    language?: string;
    theme?: string;
  };
}

export type ImportMode = 'merge' | 'replace';

export type ExportType = 'all' | 'transactions' | 'investments' | 'categories';

export const exportTypeLabels: Record<ExportType, string> = {
  all: 'Todo',
  transactions: 'Transacciones',
  investments: 'Portfolio',
  categories: 'Categorías',
};

// ============================================================================
// Store Factory
// ============================================================================

export function createSettingsStore(_apiBase: string) {
  // Store values
  let currentTheme = $state(get(effectiveTheme));
  let currentLangCode = $state(get(currentLanguage));
  let currentCurrencyCode = $state(get(currentCurrency));

  // State
  let settings = $state<Settings>(
    Settings.create({
      theme: currentTheme as ThemeType,
      language: currentLangCode,
      currency: currentCurrencyCode,
    })
  );
  let importStatus = $state('');
  let importError = $state('');
  let importSuccess = $state(false);
  let importing = $state(false);

  // Modal states
  let showImportModal = $state(false);
  let showDeleteAllModal = $state(false);
  let showResetModal = $state(false);
  let pendingImportData = $state<ImportData | null>(null);
  let importMode = $state<ImportMode>('merge');

  // Subscribe to store changes
  effectiveTheme.subscribe((value) => (currentTheme = value));
  currentLanguage.subscribe((value) => (currentLangCode = value));
  currentCurrency.subscribe((value) => (currentCurrencyCode = value));

  // Computed
  const isDark = $derived(currentTheme === 'dark');
  const availableLanguages = $derived(Language.getAvailable());
  const currentLang = $derived(Language.fromCode(currentLangCode));

  // ============================================================================
  // Theme Operations
  // ============================================================================

  async function toggleTheme(): Promise<void> {
    const newTheme = isDark ? 'light' : 'dark';
    setTheme(newTheme);
    await userPreferences.updateTheme(newTheme);
    settings = settings.setTheme(Theme.fromString(newTheme));
  }

  // ============================================================================
  // Language Operations
  // ============================================================================

  async function changeLanguage(code: string): Promise<void> {
    setLanguage(code);
    await userPreferences.updateLanguage(code);
    settings = settings.setLanguage(Language.fromCode(code));
  }

  // ============================================================================
  // Currency Operations
  // ============================================================================

  async function changeCurrency(code: string): Promise<void> {
    setCurrency(code);
    await userPreferences.updateCurrency(code);
    currentCurrencyCode = code;
    settings = settings.setCurrency(code);
  }

  // ============================================================================
  // Frontend Settings
  // ============================================================================

  function getFrontendSettings(): FrontendSettings | null {
    if (!browser) return null;

    return {
      dashboardConfig: JSON.parse(localStorage.getItem('dashboard-config') || 'null'),
      sidebarConfig: JSON.parse(localStorage.getItem('sidebar-config') || 'null'),
      userPreferences: JSON.parse(localStorage.getItem('user-preferences') || 'null'),
    };
  }

  function applyFrontendSettings(frontendSettings: FrontendSettings | undefined): void {
    if (!browser || !frontendSettings) return;

    if (frontendSettings.dashboardConfig) {
      localStorage.setItem('dashboard-config', JSON.stringify(frontendSettings.dashboardConfig));
    }
    if (frontendSettings.sidebarConfig) {
      localStorage.setItem('sidebar-config', JSON.stringify(frontendSettings.sidebarConfig));
    }
    if (frontendSettings.userPreferences) {
      localStorage.setItem('user-preferences', JSON.stringify(frontendSettings.userPreferences));
      const prefs = frontendSettings.userPreferences;
      if (prefs.theme) setTheme(prefs.theme);
      if (prefs.language) setLanguage(prefs.language);
      if (prefs.currency) setCurrency(prefs.currency);
    }
  }

  // ============================================================================
  // Export Operations
  // ============================================================================

  const exportEndpoints: Record<ExportType, string> = {
    all: '/export/all',
    transactions: '/export/transactions',
    investments: '/export/investments',
    categories: '/export/categories',
  };

  async function exportData(type: ExportType = 'all'): Promise<void> {
    importing = true;
    importError = '';

    try {
      const endpoint = exportEndpoints[type];
      const response = await authFetch(endpoint);

      if (!response.ok) {
        throw new Error('Failed to export data from server');
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Export failed');
      }

      // For 'all' export, include frontend settings
      const exportContent =
        type === 'all'
          ? {
              ...result.data,
              frontendSettings: getFrontendSettings() || {
                dashboardConfig: null,
                sidebarConfig: null,
                userPreferences: null,
              },
            }
          : result.data;

      // Download as JSON file
      const blob = new Blob([JSON.stringify(exportContent, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `happy-balance-${type}-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      showSuccessMessage(get(t)('settings.export_success'));
    } catch (error) {
      console.error('Export error:', error);
      importError =
        error instanceof Error ? error.message : get(t)('settings.export_error') || 'Export failed';
    } finally {
      importing = false;
    }
  }

  // ============================================================================
  // Import Operations
  // ============================================================================

  function prepareImport(data: ImportData): void {
    pendingImportData = data;
    showImportModal = true;
  }

  async function confirmImport(): Promise<void> {
    if (!pendingImportData) return;

    const dataToImport = pendingImportData;
    const isNewFormat = !!dataToImport.data;
    const hasFrontendSettings = !!dataToImport.frontendSettings;

    importing = true;
    try {
      if (importMode === 'replace') {
        await deleteAllDataSilent();
      }

      await importDataToBackend(dataToImport);

      const count = isNewFormat
        ? (dataToImport.data?.transactions?.length || 0) +
          (dataToImport.data?.categories?.length || 0) +
          (dataToImport.data?.investments?.length || 0)
        : dataToImport.transactions?.length || 0;

      importStatus =
        get(t)('settings.import_success', { count }) || `Imported ${count} items successfully`;
      importSuccess = true;

      setTimeout(() => {
        importStatus = '';
        importSuccess = false;
        if (isNewFormat && hasFrontendSettings) {
          window.location.reload();
        }
      }, 2000);
    } catch (error) {
      console.error('Import error:', error);
      importError =
        error instanceof Error ? error.message : get(t)('settings.import_error') || 'Import failed';
    } finally {
      importing = false;
      pendingImportData = null;
      showImportModal = false;
    }
  }

  async function importDataToBackend(data: ImportData): Promise<void> {
    const isNewFormat = !!data.data;

    if (isNewFormat) {
      const response = await authFetch('/export/import-all', {
        method: 'POST',
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Import failed');
      }

      if (data.frontendSettings) {
        applyFrontendSettings(data.frontendSettings);
      }
    } else {
      // Legacy format - local storage based import
      await importLegacyData(data);
    }
  }

  async function importLegacyData(data: ImportData): Promise<void> {
    if (data.transactions && Array.isArray(data.transactions)) {
      const existingTransactions = JSON.parse(localStorage.getItem('transactions') || '[]');
      const existingHashes = JSON.parse(localStorage.getItem('transaction-hashes') || '[]');

      const newTransactions = data.transactions.filter((t) => {
        const hash = t.hash || `${t.date}_${t.amount}_${t.merchant}`;
        return !existingHashes.includes(hash);
      });

      const mergedTransactions = [...existingTransactions, ...newTransactions];
      const mergedHashes = [
        ...existingHashes,
        ...newTransactions.map((t) => t.hash || `${t.date}_${t.amount}_${t.merchant}`),
      ];

      localStorage.setItem('transactions', JSON.stringify(mergedTransactions));
      localStorage.setItem('transaction-hashes', JSON.stringify(mergedHashes));
    }

    if (data.categories && Array.isArray(data.categories)) {
      const existingCategories = JSON.parse(localStorage.getItem('categories') || '[]');
      const mergedCategories = [...existingCategories, ...data.categories];
      localStorage.setItem('categories', JSON.stringify(mergedCategories));
    }

    if (data.settings) {
      if (data.settings.currency) await changeCurrency(data.settings.currency);
      if (data.settings.language) await changeLanguage(data.settings.language);
      if (data.settings.theme) {
        setTheme(data.settings.theme as ThemeType);
        await userPreferences.updateTheme(data.settings.theme as ThemeType);
      }
    }
  }

  // ============================================================================
  // Delete Operations
  // ============================================================================

  function deleteAllData(): void {
    showDeleteAllModal = true;
  }

  async function deleteAllDataSilent(): Promise<void> {
    try {
      await authFetch('/transactions', { method: 'DELETE' });
      await authFetch('/investments', { method: 'DELETE' });

      ['transactions', 'transaction-hashes', 'categories'].forEach((key) => {
        localStorage.removeItem(key);
      });
    } catch (error) {
      console.warn('Silent delete failed:', error);
    }
  }

  async function confirmDeleteAll(): Promise<void> {
    try {
      const transactionsResponse = await authFetch('/transactions', { method: 'DELETE' });
      if (!transactionsResponse.ok) {
        console.warn('Failed to delete transactions from database');
      }

      const investmentsResponse = await authFetch('/investments', { method: 'DELETE' });
      if (!investmentsResponse.ok) {
        console.warn('Failed to delete investments from database');
      }

      const keysToDelete = ['transactions', 'transaction-hashes', 'categories', 'user-preferences'];
      keysToDelete.forEach((key) => localStorage.removeItem(key));

      settings = Settings.default();

      showSuccessMessage(get(t)('settings.delete_success'), true);
    } catch (error) {
      console.error('Error deleting data:', error);
      importError = 'Failed to delete all data';
    } finally {
      showDeleteAllModal = false;
    }
  }

  // ============================================================================
  // Reset Operations
  // ============================================================================

  function resetData(): void {
    showResetModal = true;
  }

  async function confirmReset(): Promise<void> {
    try {
      const seedResponse = await authFetch('/seed', { method: 'POST' });

      if (!seedResponse.ok) {
        const errorData = await seedResponse.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || 'Failed to reset data');
      }

      ['categories', 'user-preferences', 'transactions', 'transaction-hashes'].forEach((key) => {
        localStorage.removeItem(key);
      });

      showSuccessMessage(
        get(t)('settings.reset_success') || 'Data reset to defaults successfully',
        true
      );
    } catch (error) {
      console.error('Error resetting data:', error);
      importError = error instanceof Error ? error.message : 'Failed to reset data';
      importSuccess = false;
    } finally {
      showResetModal = false;
    }
  }

  // ============================================================================
  // File Handling
  // ============================================================================

  function handleFileImport(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) return;

    importError = '';
    importStatus = '';
    importSuccess = false;
    importing = true;

    if (!file.name.toLowerCase().endsWith('.json')) {
      importError = get(t)('settings.file_type_error');
      importing = false;
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const raw = JSON.parse(e.target?.result as string);

        // Validate structure: must be an object with recognized import fields
        if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
          importError = get(t)('settings.parse_error');
          return;
        }

        const hasNewFormat = raw.data && typeof raw.data === 'object';
        const hasLegacyFormat = Array.isArray(raw.transactions);

        if (!hasNewFormat && !hasLegacyFormat) {
          importError = get(t)('settings.parse_error');
          return;
        }

        const data = raw as ImportData;
        prepareImport(data);
      } catch (error) {
        console.error('Parse error:', error);
        importError = get(t)('settings.parse_error');
      } finally {
        importing = false;
        input.value = '';
      }
    };

    reader.onerror = () => {
      importError = get(t)('settings.read_error');
      importing = false;
    };

    reader.readAsText(file);
  }

  // ============================================================================
  // Helpers
  // ============================================================================

  function showSuccessMessage(message: string, reload = false): void {
    importStatus = message;
    importSuccess = true;

    setTimeout(
      () => {
        importStatus = '';
        importSuccess = false;
        if (reload) window.location.reload();
      },
      reload ? 2000 : TOAST_DURATION
    );
  }

  // ============================================================================
  // Public API
  // ============================================================================

  return {
    // State (read-only)
    get settings() {
      return settings;
    },
    get importStatus() {
      return importStatus;
    },
    get importError() {
      return importError;
    },
    get importSuccess() {
      return importSuccess;
    },
    get importing() {
      return importing;
    },
    get isDark() {
      return isDark;
    },
    get availableLanguages() {
      return availableLanguages;
    },
    get currentLanguage() {
      return currentLang;
    },

    // Modal states
    get showImportModal() {
      return showImportModal;
    },
    set showImportModal(value: boolean) {
      showImportModal = value;
    },
    get showDeleteAllModal() {
      return showDeleteAllModal;
    },
    set showDeleteAllModal(value: boolean) {
      showDeleteAllModal = value;
    },
    get showResetModal() {
      return showResetModal;
    },
    set showResetModal(value: boolean) {
      showResetModal = value;
    },
    get pendingImportData() {
      return pendingImportData;
    },
    get importMode() {
      return importMode;
    },
    set importMode(value: ImportMode) {
      importMode = value;
    },

    // Actions
    toggleTheme,
    changeLanguage,
    changeCurrency,
    exportData,
    handleFileImport,
    confirmImport,
    deleteAllData,
    confirmDeleteAll,
    resetData,
    confirmReset,
  };
}

export type SettingsStore = ReturnType<typeof createSettingsStore>;
