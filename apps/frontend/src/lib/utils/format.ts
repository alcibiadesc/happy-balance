/**
 * Formatting utilities for dashboard and financial data
 */

/**
 * Format a trend percentage value with sign
 */
export function formatTrendValue(value: number): string {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(1)}%`;
}

/**
 * Get color for trend based on value and metric type
 * For expenses, negative (decreasing) is good
 * For income/investments, positive (increasing) is good
 */
export function getTrendColor(
  value: number,
  type: 'income' | 'expenses' | 'investments' | string
): string {
  if (type === 'expenses') {
    return value <= 0 ? 'var(--success)' : 'var(--accent)';
  }
  return value >= 0 ? 'var(--success)' : 'var(--accent)';
}

/**
 * Get status color based on percentage thresholds
 */
export function getStatusColor(
  value: number,
  thresholds: { good: number; warning: number }
): 'success' | 'warning' | 'danger' {
  if (value >= thresholds.good) return 'success';
  if (value >= thresholds.warning) return 'warning';
  return 'danger';
}

/**
 * Calculate percentage safely (avoid division by zero)
 */
export function safePercentage(value: number, total: number, decimals = 1): number {
  if (total === 0) return 0;
  return Math.round((value / total) * 100 * Math.pow(10, decimals)) / Math.pow(10, decimals);
}

/**
 * Clamp a value between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Format a number with compact notation (K, M, B)
 */
export function formatCompact(value: number, locale = 'es-ES'): string {
  return new Intl.NumberFormat(locale, {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value);
}
