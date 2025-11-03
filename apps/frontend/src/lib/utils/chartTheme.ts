import { browser } from '$app/environment';

// Chart theme colors that adapt to light/dark mode
export function getChartThemeColors() {
  if (!browser) {
    return {
      income: '#7abaa5', // Acapulco from palette
      expenses: '#f5796c', // Froly from palette
      balance: '#023c46', // Evening Sea from palette
      investments: '#023c46', // Evening Sea from palette
      grid: 'rgba(0, 0, 0, 0.1)',
      text: '#023c46' // Evening Sea - primary dark color from palette
    };
  }

  const isDark = document.documentElement.classList.contains('dark') ||
                window.matchMedia('(prefers-color-scheme: dark)').matches;

  if (isDark) {
    return {
      income: '#7abaa5', // Acapulco
      expenses: '#f5796c', // Froly
      balance: '#7abaa5', // Acapulco for dark mode
      investments: '#7abaa5', // Acapulco for dark mode
      grid: 'rgba(255, 255, 255, 0.1)',
      text: '#fef7ee' // Bridesmaid for dark mode
    };
  }

  return {
    income: '#7abaa5', // Acapulco from palette
    expenses: '#f5796c', // Froly from palette
    balance: '#023c46', // Evening Sea from palette
    investments: '#023c46', // Evening Sea from palette
    grid: 'rgba(0, 0, 0, 0.1)',
    text: '#023c46' // Evening Sea - primary dark color from palette
  };
}

// Update chart theme when system theme changes
export function updateChartTheme(chart: any) {
  if (!chart || !browser) return;

  // Force detection of dark/light mode
  const isDark = document.documentElement.classList.contains('dark');
  const textColor = isDark ? '#fef7ee' : '#023c46';
  const gridColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';

  if (chart.options.scales?.x?.ticks) {
    chart.options.scales.x.ticks.color = textColor;
    chart.options.scales.x.ticks.font = {
      ...chart.options.scales.x.ticks.font,
      weight: '600'
    };
  }
  if (chart.options.scales?.y?.ticks) {
    chart.options.scales.y.ticks.color = textColor;
    chart.options.scales.y.ticks.font = {
      ...chart.options.scales.y.ticks.font,
      weight: '600'
    };
  }

  // Update legend label colors
  if (chart.options.plugins?.legend?.labels) {
    chart.options.plugins.legend.labels.color = textColor;
    chart.options.plugins.legend.labels.font = {
      ...chart.options.plugins.legend.labels.font,
      weight: '600'
    };
  }

  // Update grid colors
  if (chart.options.scales?.x?.grid) {
    chart.options.scales.x.grid.color = gridColor;
  }
  if (chart.options.scales?.y?.grid) {
    chart.options.scales.y.grid.color = gridColor;
  }

  chart.update('none');
}

// Update dataset colors for specific chart types
export function updateChartDatasetColors(chart: any, datasetIndex: number, type: string) {
  if (!chart || !browser) return;

  const colors = getChartThemeColors();
  const dataset = chart.data.datasets[datasetIndex];

  if (dataset) {
    switch (type) {
      case 'income':
        dataset.borderColor = colors.income;
        dataset.backgroundColor = colors.income + '20';
        break;
      case 'expenses':
        dataset.borderColor = colors.expenses;
        dataset.backgroundColor = colors.expenses + '20';
        break;
      case 'balance':
        dataset.borderColor = colors.balance;
        dataset.backgroundColor = colors.balance + '20';
        break;
      case 'investments':
        dataset.borderColor = colors.investments;
        dataset.backgroundColor = colors.investments + '20';
        break;
    }
    chart.update('none');
  }
}

// Setup theme observer for automatic updates
export function setupChartThemeObserver(chart: any, callback?: () => void) {
  if (!browser) return () => {};

  const observer = new MutationObserver(() => {
    updateChartTheme(chart);
    callback?.();
  });

  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['class']
  });

  // Also listen for system theme changes
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  const handleChange = () => {
    updateChartTheme(chart);
    callback?.();
  };

  mediaQuery.addEventListener('change', handleChange);

  return () => {
    observer.disconnect();
    mediaQuery.removeEventListener('change', handleChange);
  };
}