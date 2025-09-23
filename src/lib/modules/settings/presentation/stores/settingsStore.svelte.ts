import { Settings } from '../../domain/entities/Settings';
import { Theme } from '../../domain/value-objects/Theme';
import { Language } from '../../domain/value-objects/Language';
import { ExportDataUseCase } from '../../application/use-cases/ExportData';
import { t } from '$lib/stores/i18n';
import { currentLanguage, setLanguage } from '$lib/stores/i18n';
import { currentCurrency, currencies, setCurrency } from '$lib/stores/currency';
import { theme as themeStore, setTheme, effectiveTheme } from '$lib/stores/theme';
import { userPreferences } from '$lib/stores/user-preferences';
import { get } from 'svelte/store';

export interface ImportData {
  transactions?: any[];
  transactionHashes?: any[];
  categories?: any[];
  settings?: {
    currency?: string;
    language?: string;
    theme?: string;
  };
}

export function createSettingsStore(apiBase: string) {
  // Store values
  let currentTheme = $state(get(effectiveTheme));
  let currentLangCode = $state(get(currentLanguage));
  let currentCurrencyCode = $state(get(currentCurrency));

  // State
  let settings = $state<Settings>(Settings.create({
    theme: Theme.fromString(currentTheme),
    language: Language.fromCode(currentLangCode),
    currency: currentCurrencyCode
  }));
  let importStatus = $state('');
  let importError = $state('');
  let importSuccess = $state(false);
  let importing = $state(false);

  // Modal states
  let showImportModal = $state(false);
  let showDeleteAllModal = $state(false);
  let showResetModal = $state(false);
  let pendingImportData = $state<ImportData | null>(null);

  // Subscribe to store changes
  effectiveTheme.subscribe(value => currentTheme = value);
  currentLanguage.subscribe(value => currentLangCode = value);
  currentCurrency.subscribe(value => currentCurrencyCode = value);

  // Computed
  const isDark = $derived(currentTheme === 'dark');
  const availableLanguages = $derived(Language.getAvailable());
  const currentLang = $derived(Language.fromCode(currentLangCode));

  // Theme operations
  async function toggleTheme() {
    const newTheme = isDark ? 'light' : 'dark';
    setTheme(newTheme);
    await userPreferences.updateTheme(newTheme);
    settings = settings.setTheme(Theme.fromString(newTheme));
  }

  // Language operations
  async function changeLanguage(code: string) {
    setLanguage(code);
    await userPreferences.updateLanguage(code);
    settings = settings.setLanguage(Language.fromCode(code));
  }

  // Currency operations
  async function changeCurrency(code: string) {
    setCurrency(code);
    await userPreferences.updateCurrency(code);
    currentCurrencyCode = code;
    settings = settings.setCurrency(code);
  }

  // Export operations
  function exportData() {
    const exportUseCase = new ExportDataUseCase();
    const data = exportUseCase.execute(settings);
    exportUseCase.downloadAsJSON(data);

    // Show success feedback
    importStatus = t.get()('settings.export_success');
    importSuccess = true;
    setTimeout(() => {
      importStatus = '';
      importSuccess = false;
    }, 3000);
  }

  // Import operations
  async function prepareImport(data: ImportData) {
    pendingImportData = data;
    showImportModal = true;
  }

  async function confirmImport() {
    if (!pendingImportData) return;

    importing = true;
    try {
      await importData(pendingImportData);

      importStatus = t.get()('settings.import_success', {
        count: pendingImportData.transactions?.length || 0
      });
      importSuccess = true;

      setTimeout(() => {
        importStatus = '';
        importSuccess = false;
      }, 5000);
    } catch (error) {
      console.error('Import error:', error);
      importError = t.get()('settings.import_error');
    } finally {
      importing = false;
      pendingImportData = null;
      showImportModal = false;
    }
  }

  async function importData(data: ImportData) {
    // Import transactions
    if (data.transactions && Array.isArray(data.transactions)) {
      const existingTransactions = JSON.parse(localStorage.getItem('transactions') || '[]');
      const existingHashes = JSON.parse(localStorage.getItem('transaction-hashes') || '[]');

      const newTransactions = data.transactions.filter((t: any) => {
        const hash = t.hash || `${t.date}_${t.amount}_${t.merchant}`;
        return !existingHashes.includes(hash);
      });

      const mergedTransactions = [...existingTransactions, ...newTransactions];
      const mergedHashes = [...existingHashes, ...newTransactions.map((t: any) =>
        t.hash || `${t.date}_${t.amount}_${t.merchant}`
      )];

      localStorage.setItem('transactions', JSON.stringify(mergedTransactions));
      localStorage.setItem('transaction-hashes', JSON.stringify(mergedHashes));
    }

    // Import categories
    if (data.categories && Array.isArray(data.categories)) {
      const existingCategories = JSON.parse(localStorage.getItem('categories') || '[]');
      const mergedCategories = [...existingCategories, ...data.categories];
      localStorage.setItem('categories', JSON.stringify(mergedCategories));
    }

    // Import settings
    if (data.settings) {
      if (data.settings.currency) {
        await changeCurrency(data.settings.currency);
      }
      if (data.settings.language) {
        await changeLanguage(data.settings.language);
      }
      if (data.settings.theme) {
        setTheme(data.settings.theme);
        await userPreferences.updateTheme(data.settings.theme);
      }
    }
  }

  // Delete operations
  async function deleteAllData() {
    showDeleteAllModal = true;
  }

  async function confirmDeleteAll() {
    try {
      // Clear localStorage
      const keysToDelete = [
        'transactions',
        'transaction-hashes',
        'categories',
        'user-preferences'
      ];

      keysToDelete.forEach(key => {
        localStorage.removeItem(key);
      });

      // Reset to defaults
      settings = Settings.default();

      importStatus = t.get()('settings.delete_success');
      importSuccess = true;

      setTimeout(() => {
        importStatus = '';
        importSuccess = false;
        window.location.reload();
      }, 2000);
    } catch (error) {
      console.error('Error deleting data:', error);
      importError = 'Failed to delete all data';
    } finally {
      showDeleteAllModal = false;
    }
  }

  // Reset operations
  async function resetData() {
    showResetModal = true;
  }

  async function confirmReset() {
    try {
      // Try to reset via API
      try {
        const response = await fetch(`${apiBase}/seed`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          console.warn('Failed to reset data from database');
        }
      } catch (apiError) {
        console.warn('API not available');
      }

      // Reset localStorage categories
      localStorage.removeItem('categories');
      localStorage.removeItem('user-preferences');

      importStatus = t.get()('settings.reset_success');
      importSuccess = true;

      setTimeout(() => {
        importStatus = '';
        importSuccess = false;
        window.location.reload();
      }, 2000);
    } catch (error) {
      console.error('Error resetting data:', error);
      importError = 'Failed to reset data';
    } finally {
      showResetModal = false;
    }
  }

  // File handling
  function handleFileImport(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) return;

    // Reset states
    importError = '';
    importStatus = '';
    importSuccess = false;
    importing = true;

    // Validate file type
    if (!file.name.toLowerCase().endsWith('.json')) {
      importError = t.get()('settings.file_type_error');
      importing = false;
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        prepareImport(data);
      } catch (error) {
        console.error('Parse error:', error);
        importError = t.get()('settings.parse_error');
      } finally {
        importing = false;
        input.value = '';
      }
    };

    reader.onerror = () => {
      importError = t.get()('settings.read_error');
      importing = false;
    };

    reader.readAsText(file);
  }

  return {
    // State
    get settings() { return settings; },
    get importStatus() { return importStatus; },
    get importError() { return importError; },
    get importSuccess() { return importSuccess; },
    get importing() { return importing; },
    get isDark() { return isDark; },
    get availableLanguages() { return availableLanguages; },
    get currentLanguage() { return currentLang; },

    // Modal states
    get showImportModal() { return showImportModal; },
    set showImportModal(value: boolean) { showImportModal = value; },
    get showDeleteAllModal() { return showDeleteAllModal; },
    set showDeleteAllModal(value: boolean) { showDeleteAllModal = value; },
    get showResetModal() { return showResetModal; },
    set showResetModal(value: boolean) { showResetModal = value; },
    get pendingImportData() { return pendingImportData; },

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
    confirmReset
  };
}

export type SettingsStore = ReturnType<typeof createSettingsStore>;