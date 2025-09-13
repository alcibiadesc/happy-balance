import { writable, derived } from 'svelte/store';
import { browser } from '$app/environment';

// Store para el idioma actual
export const currentLanguage = writable<string>('en');

// Traducciones completas
const translations = {
  en: {
    common: {
      confirm: "Confirm",
      cancel: "Cancel",
      delete: "Delete",
      edit: "Edit",
      save: "Save",
      close: "Close",
      loading: "Loading...",
      search: "Search",
      filter: "Filter",
      reset: "Reset",
      apply: "Apply",
      yes: "Yes",
      no: "No",
      back: "Back",
      done: "Done"
    },
    navigation: {
      transactions: "Transactions",
      dashboard: "Dashboard",
      settings: "Settings",
      import: "Import"
    },
    dashboard: {
      title: "Dashboard",
      spending_summary: "You spend {amount} out of every 10 euros you earn",
      periods: {
        week: "Week",
        month: "Month",
        quarter: "Quarter",
        year: "Year"
      },
      metrics: {
        income: "Income",
        expenses: "Expenses",
        investments: "Investments",
        balance: "Balance",
        essential_expenses: "Essential expenses",
        discretionary_expenses: "Discretionary expenses",
        saved_percentage: "{percentage}% saved"
      },
      charts: {
        temporal_evolution: "Temporal evolution",
        expense_distribution: "Expense and investment distribution",
        temporal_evolution_subtitle: "Income and expense trends over time",
        expense_distribution_subtitle: "Monthly comparison of essential, discretionary expenses and investments",
        income_evolution: "Income Evolution",
        expense_evolution: "Expense Evolution"
      },
      categories: {
        title: "Expense breakdown",
        food: "Food",
        transport: "Transport",
        utilities: "Utilities", 
        shopping: "Shopping",
        entertainment: "Entertainment",
        health: "Health"
      },
      status: {
        excellent_control: "Excellent control",
        moderate_control: "Moderate control",
        high_spending: "High spending"
      }
    },
    import: {
      title: "Import Transactions",
      subtitle: "Upload and process your bank CSV files with Japanese minimalist elegance",
      steps: {
        upload: "Upload",
        upload_desc: "Choose file",
        preview: "Preview",
        preview_desc: "Review & Edit",
        complete: "Complete",
        complete_desc: "Import Done"
      },
      settings: {
        title: "Import Settings",
        enable_preview: "Enable preview before import",
        enable_preview_desc: "Preview allows you to review and edit transactions before saving"
      },
      upload: {
        choose_file: "Choose a CSV file",
        drag_drop: "Or drag and drop your file here • Max 10MB",
        processing: "Processing...",
        ready: "Ready"
      },
      preview: {
        stats: {
          total: "Total",
          selected: "Selected", 
          duplicates: "Duplicates",
          skipped: "Skipped"
        },
        controls: {
          show_duplicates: "Show duplicates",
          show_all: "Show all transactions",
          select_all: "Select All",
          deselect_all: "Deselect All"
        },
        table: {
          select: "Select",
          date: "Date",
          partner: "Partner", 
          description: "Description",
          amount: "Amount",
          status: "Status"
        },
        status: {
          duplicate: "Duplicate",
          ready: "Ready",
          skipped: "Skipped"
        },
        pagination: {
          showing: "Showing first 10 of {total} transactions",
          show_all: "Show all"
        }
      },
      complete: {
        importing: "Importing Transactions",
        importing_desc: "Please wait while we save your data...",
        success: "Import Complete!",
        success_desc: "Successfully imported {count} transactions",
        redirecting: "Redirecting to dashboard...",
        import_another: "Import Another File"
      },
      actions: {
        import_count: "Import {count} Transaction",
        import_count_plural: "Import {count} Transactions"
      },
      errors: {
        invalid_file: "Please select a CSV file",
        file_too_large: "File size must be less than 10MB",
        no_transactions: "No valid transactions found in file",
        parse_failed: "Failed to parse CSV file",
        import_failed: "Failed to import transactions"
      },
      duplicate_reasons: {
        file: "Identical transaction found in file",
        database: "Transaction already exists in database"
      }
    },
    settings: {
      title: "Settings",
      language: "Language",
      currency: "Currency",
      theme: "Theme",
      themes: {
        light: "Light",
        dark: "Dark",
        system: "System"
      },
      data: "Data",
      export_data: "Export Data",
      import_data: "Import Data",
      clear_data: "Clear Data",
      clear_data_confirmation: "Are you sure you want to delete all data? This action cannot be undone."
    },
    errors: {
      generic: "An error occurred",
      network: "Connection error",
      validation: "Validation error",
      not_found: "Not found",
      unauthorized: "Unauthorized",
      forbidden: "Forbidden"
    },
    success: {
      saved: "Saved successfully",
      deleted: "Deleted successfully",
      imported: "Imported successfully",
      exported: "Exported successfully"
    }
  },
  es: {
    common: {
      confirm: "Confirmar",
      cancel: "Cancelar",
      delete: "Eliminar",
      edit: "Editar",
      save: "Guardar",
      close: "Cerrar",
      loading: "Cargando...",
      search: "Buscar",
      filter: "Filtrar",
      reset: "Restablecer",
      apply: "Aplicar",
      yes: "Sí",
      no: "No",
      back: "Atrás",
      done: "Hecho"
    },
    navigation: {
      transactions: "Transacciones",
      dashboard: "Panel",
      settings: "Configuración",
      import: "Importar"
    },
    dashboard: {
      title: "Panel de Control",
      spending_summary: "Gastas {amount} de cada 10 euros que ganas",
      periods: {
        week: "Semana",
        month: "Mes",
        quarter: "Trimestre",
        year: "Año"
      },
      metrics: {
        income: "Ingresos",
        expenses: "Gastos",
        investments: "Inversiones",
        balance: "Balance",
        essential_expenses: "Gastos esenciales",
        discretionary_expenses: "Gastos discrecionales",
        saved_percentage: "{percentage}% ahorrado"
      },
      charts: {
        temporal_evolution: "Evolución temporal",
        expense_distribution: "Distribución de gastos e inversiones",
        temporal_evolution_subtitle: "Tendencias de ingresos y gastos a lo largo del tiempo",
        expense_distribution_subtitle: "Comparación mensual de gastos esenciales, discrecionales e inversiones",
        income_evolution: "Evolución de Ingresos",
        expense_evolution: "Evolución de Gastos"
      },
      categories: {
        title: "Desglose de gastos",
        food: "Alimentación",
        transport: "Transporte",
        utilities: "Servicios", 
        shopping: "Compras",
        entertainment: "Entretenimiento",
        health: "Salud"
      },
      status: {
        excellent_control: "Control excelente",
        moderate_control: "Control moderado",
        high_spending: "Gasto elevado"
      }
    },
    import: {
      title: "Importar Transacciones",
      subtitle: "Carga y procesa tus archivos CSV bancarios con elegancia minimalista japonesa",
      steps: {
        upload: "Cargar",
        upload_desc: "Elegir archivo",
        preview: "Vista previa",
        preview_desc: "Revisar y Editar",
        complete: "Completar",
        complete_desc: "Importación Hecha"
      },
      settings: {
        title: "Configuración de Importación",
        enable_preview: "Habilitar vista previa antes de importar",
        enable_preview_desc: "La vista previa te permite revisar y editar transacciones antes de guardar"
      },
      upload: {
        choose_file: "Elige un archivo CSV",
        drag_drop: "O arrastra y suelta tu archivo aquí • Máx 10MB",
        processing: "Procesando...",
        ready: "Listo"
      },
      preview: {
        stats: {
          total: "Total",
          selected: "Seleccionadas", 
          duplicates: "Duplicados",
          skipped: "Omitidas"
        },
        controls: {
          show_duplicates: "Mostrar duplicados",
          show_all: "Mostrar todas las transacciones",
          select_all: "Seleccionar Todo",
          deselect_all: "Deseleccionar Todo"
        },
        table: {
          select: "Seleccionar",
          date: "Fecha",
          partner: "Comercio", 
          description: "Descripción",
          amount: "Cantidad",
          status: "Estado"
        },
        status: {
          duplicate: "Duplicado",
          ready: "Listo",
          skipped: "Omitido"
        },
        pagination: {
          showing: "Mostrando las primeras 10 de {total} transacciones",
          show_all: "Mostrar todas"
        }
      },
      complete: {
        importing: "Importando Transacciones",
        importing_desc: "Por favor espera mientras guardamos tus datos...",
        success: "¡Importación Completada!",
        success_desc: "Se importaron exitosamente {count} transacciones",
        redirecting: "Redirigiendo al panel...",
        import_another: "Importar Otro Archivo"
      },
      actions: {
        import_count: "Importar {count} Transacción",
        import_count_plural: "Importar {count} Transacciones"
      },
      errors: {
        invalid_file: "Por favor selecciona un archivo CSV",
        file_too_large: "El archivo debe ser menor a 10MB",
        no_transactions: "No se encontraron transacciones válidas en el archivo",
        parse_failed: "Error al procesar el archivo CSV",
        import_failed: "Error al importar transacciones"
      },
      duplicate_reasons: {
        file: "Transacción idéntica encontrada en el archivo",
        database: "La transacción ya existe en la base de datos"
      }
    },
    settings: {
      title: "Configuración",
      language: "Idioma",
      currency: "Moneda",
      theme: "Tema",
      themes: {
        light: "Claro",
        dark: "Oscuro",
        system: "Sistema"
      },
      data: "Datos",
      export_data: "Exportar Datos",
      import_data: "Importar Datos",
      clear_data: "Limpiar Datos",
      clear_data_confirmation: "¿Estás seguro de que quieres eliminar todos los datos? Esta acción no se puede deshacer."
    },
    errors: {
      generic: "Ocurrió un error",
      network: "Error de conexión",
      validation: "Error de validación",
      not_found: "No encontrado",
      unauthorized: "No autorizado",
      forbidden: "Prohibido"
    },
    success: {
      saved: "Guardado exitosamente",
      deleted: "Eliminado exitosamente",
      imported: "Importado exitosamente",
      exported: "Exportado exitosamente"
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
