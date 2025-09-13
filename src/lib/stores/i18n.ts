import { writable, derived } from 'svelte/store';
import { browser } from '$app/environment';

// Store para el idioma actual
export const currentLanguage = writable<string>('en');

// Traducciones
const translations = {
  en: {
    nav: {
      dashboard: 'Dashboard',
      import: 'Import Data',
      settings: 'Settings'
    },
    buttons: {
      import: 'Import',
      export: 'Export Data',
      darkMode: 'Dark Mode',
      lightMode: 'Light Mode'
    },
    settings: {
      title: 'Settings',
      theme: 'Theme',
      language: 'Language',
      export: 'Export Data'
    },
    dashboard: {
      title: 'Dashboard',
      welcome: 'Welcome to your expense tracker',
      spending_summary: 'For every €10 I earn, I spend {amount}',
      periods: {
        week: 'Week',
        month: 'Month',
        quarter: 'Quarter',
        year: 'Year'
      },
      metrics: {
        income: 'Income',
        expenses: 'Expenses',
        investments: 'Investments',
        balance: 'Balance',
        saved_percentage: 'Saved <strong>{percentage}%</strong>',
        spendingRate: 'Spending Rate',
        totalExpenses: 'Total Expenses',
        essentialExpenses: 'Essential',
        discretionaryExpenses: 'Discretionary',
        essential_expenses: 'Essential',
        discretionary_expenses: 'Discretionary',
        monthlyIncome: 'Monthly Income',
        savingsRate: 'Savings Rate',
        remainingBudget: 'Remaining Budget',
        daysLeft: 'Days Left',
        financialFreedom: 'Financial Freedom'
      },
      categories: {
        title: 'Spending by Category',
        food: 'Food',
        transport: 'Transport',
        utilities: 'Utilities',
        shopping: 'Shopping',
        entertainment: 'Entertainment',
        health: 'Health',
        empty: 'No spending data available'
      },
      charts: {
        temporal_evolution: 'Financial Evolution',
        temporal_evolution_subtitle: 'Track your income and expenses over time',
        detailed_breakdown: 'Detailed Financial Breakdown',
        detailed_breakdown_subtitle: 'Comprehensive view of income, expenses, and investments'
      },
      trends: {
        vsLastMonth: 'vs last month',
        income: 'Income',
        expenses: 'Expenses', 
        savings: 'Savings'
      }
    }
  },
  es: {
    nav: {
      dashboard: 'Panel',
      import: 'Importar Datos',
      settings: 'Configuración'
    },
    buttons: {
      import: 'Importar',
      export: 'Exportar Datos',
      darkMode: 'Modo Oscuro',
      lightMode: 'Modo Claro'
    },
    settings: {
      title: 'Configuración',
      theme: 'Tema',
      language: 'Idioma',
      export: 'Exportar Datos'
    },
    dashboard: {
      title: 'Panel de Control',
      welcome: 'Bienvenido a tu gestor de gastos',
      spending_summary: 'Por cada 10€ que ingreso, gasto {amount}',
      periods: {
        week: 'Semana',
        month: 'Mes',
        quarter: 'Trimestre',
        year: 'Año'
      },
      metrics: {
        income: 'Ingresos',
        expenses: 'Gastos',
        investments: 'Inversiones',
        balance: 'Balance',
        saved_percentage: 'Ahorrado <strong>{percentage}%</strong>',
        spendingRate: 'Ratio de Gasto',
        totalExpenses: 'Gastos Totales',
        essentialExpenses: 'Esenciales',
        discretionaryExpenses: 'Discrecionales',
        essential_expenses: 'Esenciales',
        discretionary_expenses: 'Discrecionales',
        monthlyIncome: 'Ingresos Mensuales',
        savingsRate: 'Tasa de Ahorro',
        remainingBudget: 'Presupuesto Restante',
        daysLeft: 'Días Restantes',
        financialFreedom: 'Libertad Financiera'
      },
      categories: {
        title: 'Gastos por Categoría',
        food: 'Comida',
        transport: 'Transporte',
        utilities: 'Servicios',
        shopping: 'Compras',
        entertainment: 'Entretenimiento',
        health: 'Salud',
        empty: 'No hay datos de gastos disponibles'
      },
      charts: {
        temporal_evolution: 'Evolución Financiera',
        temporal_evolution_subtitle: 'Seguimiento de ingresos y gastos a lo largo del tiempo',
        detailed_breakdown: 'Desglose Financiero Detallado',
        detailed_breakdown_subtitle: 'Vista completa de ingresos, gastos e inversiones'
      },
      trends: {
        vsLastMonth: 'vs mes anterior',
        income: 'Ingresos',
        expenses: 'Gastos',
        savings: 'Ahorros'
      }
    }
  }
};

// Store derivado para las traducciones actuales
export const t = derived(
  currentLanguage,
  ($currentLanguage) => {
    return (key: string, params?: Record<string, string | number>): string => {
      const keys = key.split('.');
      let value: any = translations[$currentLanguage as keyof typeof translations];
      
      for (const k of keys) {
        value = value?.[k];
      }
      
      let result = value || key;
      
      // Interpolate parameters if provided
      if (params && typeof result === 'string') {
        Object.entries(params).forEach(([paramKey, paramValue]) => {
          result = result.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), String(paramValue));
        });
      }
      
      return result;
    };
  }
);

// Función para cambiar idioma
export function setLanguage(lang: string) {
  currentLanguage.set(lang);
  
  if (browser) {
    localStorage.setItem('expense-tracker-language', lang);
  }
}

// Función para inicializar el idioma desde localStorage
export function initLanguage() {
  if (browser) {
    const savedLang = localStorage.getItem('expense-tracker-language');
    if (savedLang && (savedLang === 'en' || savedLang === 'es')) {
      currentLanguage.set(savedLang);
    }
  }
}
