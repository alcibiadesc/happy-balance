/**
 * Chart theme utilities for consistent color handling across charts
 */

export interface ChartThemeColors {
  income: {
    border: string;
    background: string;
    point: string;
  };
  investments: {
    background: string;
    border: string;
  };
}

/**
 * Get theme-aware colors for charts
 */
export function getChartThemeColors(): ChartThemeColors {
  const isDark = document.documentElement.classList.contains('dark');
  
  return {
    income: {
      border: isDark ? '#7ABAA5' : '#7abaa5',
      background: isDark ? 'rgba(122, 186, 165, 0.1)' : 'rgba(122, 186, 165, 0.1)',
      point: isDark ? '#7ABAA5' : '#7abaa5'
    },
    investments: {
      background: isDark ? 'rgba(122, 186, 165, 0.8)' : 'rgba(2, 60, 70, 0.8)',
      border: isDark ? '#7ABAA5' : '#023c46'
    }
  };
}

/**
 * Update chart colors and text properties when theme changes
 */
export function updateChartTheme(chart: any): void {
  if (!chart) return;
  
  const isDark = document.documentElement.classList.contains('dark');
  
  // Update grid color
  if (chart.options.scales?.y?.grid) {
    chart.options.scales.y.grid.color = isDark 
      ? 'rgba(255, 255, 255, 0.05)' 
      : 'rgba(0, 0, 0, 0.05)';
  }
  
  // Update text colors
  const textColor = getComputedStyle(document.documentElement)
    .getPropertyValue('--text-muted').trim();
  const legendColor = getComputedStyle(document.documentElement)
    .getPropertyValue('--text-secondary').trim();
  
  if (chart.options.scales?.x?.ticks) {
    chart.options.scales.x.ticks.color = textColor;
  }
  if (chart.options.scales?.y?.ticks) {
    chart.options.scales.y.ticks.color = textColor;
  }
  if (chart.options.plugins?.legend?.labels) {
    chart.options.plugins.legend.labels.color = legendColor;
  }
}

/**
 * Update chart dataset colors based on current theme
 */
export function updateChartDatasetColors(chart: any, datasetIndex: number, type: 'income' | 'investments'): void {
  if (!chart?.data?.datasets?.[datasetIndex]) return;
  
  const colors = getChartThemeColors();
  const dataset = chart.data.datasets[datasetIndex];
  
  if (type === 'income') {
    dataset.borderColor = colors.income.border;
    dataset.backgroundColor = colors.income.background;
    dataset.pointBackgroundColor = colors.income.point;
  } else if (type === 'investments') {
    dataset.backgroundColor = colors.investments.background;
    dataset.borderColor = colors.investments.border;
  }
}

/**
 * Setup theme change observer for a chart
 */
export function setupChartThemeObserver(
  chart: any, 
  updateCallback?: () => void
): () => void {
  const handleThemeChange = () => {
    updateChartTheme(chart);
    updateCallback?.();
    chart.update();
  };
  
  const observer = new MutationObserver(handleThemeChange);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['class']
  });
  
  return () => observer.disconnect();
}