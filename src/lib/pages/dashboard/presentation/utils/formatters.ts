// Pure functions for formatting

import type { Money } from '../../domain/value-objects/Money';
import type { Trend } from '../../domain/entities/Trend';

// Currency formatter factory
export const createCurrencyFormatter = (currency: string) => (amount: number): string => {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
};

// Money formatter
export const formatMoney = (money: Money, currencyCode: string): string => {
  const formatter = createCurrencyFormatter(currencyCode);
  return money.format(formatter);
};

// Trend formatter
export const formatTrend = (trend: Trend): string => trend.format();

// Percentage formatter
export const formatPercentage = (value: number, decimals: number = 1): string => {
  return `${value.toFixed(decimals)}%`;
};

// Date range formatter
export const formatDateRange = (startDate: Date, endDate: Date): string => {
  const formatter = new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });

  return `${formatter.format(startDate)} - ${formatter.format(endDate)}`;
};

// Number abbreviator
export const abbreviateNumber = (value: number): string => {
  const abbreviations = [
    { value: 1e9, suffix: 'B' },
    { value: 1e6, suffix: 'M' },
    { value: 1e3, suffix: 'K' }
  ];

  for (const { value: threshold, suffix } of abbreviations) {
    if (Math.abs(value) >= threshold) {
      return `${(value / threshold).toFixed(1)}${suffix}`;
    }
  }

  return value.toFixed(0);
};