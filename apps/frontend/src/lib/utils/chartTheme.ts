import { browser } from '$app/environment';

// Chart theme colors that adapt to light/dark mode
export function getChartThemeColors() {
  if (!browser) {
    return {
      income: '#10b981',
      expenses: '#ef4444',
      balance: '#3b82f6',
      investments: '#8b5cf6',
      grid: 'rgba(0, 0, 0, 0.1)',
      text: '#1f2937' // Very dark gray, almost black
    };
  }

  const isDark = document.documentElement.classList.contains('dark') ||
                window.matchMedia('(prefers-color-scheme: dark)').matches;

  if (isDark) {
    return {
      income: '#34d399',
      expenses: '#f87171',
      balance: '#60a5fa',
      investments: '#a78bfa',
      grid: 'rgba(255, 255, 255, 0.1)',
      text: '#f9fafb' // Almost white for dark mode
    };
  }

  return {
    income: '#10b981',
    expenses: '#ef4444',
    balance: '#3b82f6',
    investments: '#8b5cf6',
    grid: 'rgba(0, 0, 0, 0.1)',
    text: '#1f2937' // Very dark gray (Tailwind gray-800) for maximum contrast
  };
}

// Update chart theme when system theme changes
export function updateChartTheme(chart: any) {
  if (!chart || !browser) return;

  const colors = getChartThemeColors();

  // Update grid colors
  if (chart.options.scales?.x?.grid) {
    chart.options.scales.x.grid.color = colors.grid;
  }
  if (chart.options.scales?.y?.grid) {
    chart.options.scales.y.grid.color = colors.grid;
  }

  // Update tick colors with strong contrast
  if (chart.options.scales?.x?.ticks) {
    chart.options.scales.x.ticks.color = colors.text;
    chart.options.scales.x.ticks.font = {
      ...chart.options.scales.x.ticks.font,
      weight: '600' // Make text bolder for better visibility
    };
  }
  if (chart.options.scales?.y?.ticks) {
    chart.options.scales.y.ticks.color = colors.text;
    chart.options.scales.y.ticks.font = {
      ...chart.options.scales.y.ticks.font,
      weight: '600' // Make text bolder for better visibility
    };
  }

  // Update legend label colors with strong contrast
  if (chart.options.plugins?.legend?.labels) {
    chart.options.plugins.legend.labels.color = colors.text;
    chart.options.plugins.legend.labels.font = {
      ...chart.options.plugins.legend.labels.font,
      weight: '600' // Make legend text bolder
    };
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