import { browser } from '$app/environment';

// Chart theme colors that adapt to light/dark mode
export function getChartThemeColors() {
  if (!browser) {
    return {
      income: '#7aba9e',
      expenses: '#ef4444',
      balance: '#06b6d4',
      investments: '#023c46',
      grid: '#e5e7eb',
      text: '#374151'
    };
  }

  const isDark = document.documentElement.classList.contains('dark') ||
                window.matchMedia('(prefers-color-scheme: dark)').matches;

  if (isDark) {
    return {
      income: '#7aba9e',
      expenses: '#f87171',
      balance: '#22d3ee',
      investments: '#06b6d4',
      grid: '#374151',
      text: '#f3f4f6'
    };
  }

  return {
    income: '#7aba9e',
    expenses: '#ef4444',
    balance: '#06b6d4',
    investments: '#023c46',
    grid: '#e5e7eb',
    text: '#374151'
  };
}

// Update chart theme when system theme changes
export function updateChartTheme(chart: any) {
  if (!chart || !browser) return;

  const colors = getChartThemeColors();

  // Update chart options
  chart.options.scales.x.grid.color = colors.grid;
  chart.options.scales.y.grid.color = colors.grid;
  chart.options.scales.x.ticks.color = colors.text;
  chart.options.scales.y.ticks.color = colors.text;

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