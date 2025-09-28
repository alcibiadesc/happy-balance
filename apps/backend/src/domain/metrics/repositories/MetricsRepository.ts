import { MetricSnapshot } from '../entities/MetricSnapshot';
import { MetricsPeriod } from '../value-objects/MetricsPeriod';
import { Currency } from '../../value-objects/Currency';

export interface MetricsRepository {
  /**
   * Get current metrics for a specific period
   */
  getCurrentMetrics(period: MetricsPeriod, currency: Currency): Promise<MetricSnapshot>;

  /**
   * Get historical metrics for multiple periods (trends)
   */
  getHistoricalMetrics(
    periods: MetricsPeriod[],
    currency: Currency
  ): Promise<MetricSnapshot[]>;

  /**
   * Get metrics for period comparison
   */
  getComparisonMetrics(
    currentPeriod: MetricsPeriod,
    previousPeriod: MetricsPeriod,
    currency: Currency
  ): Promise<{
    current: MetricSnapshot;
    previous: MetricSnapshot;
  }>;

  /**
   * Get category breakdown for a period
   */
  getCategoryBreakdown(
    period: MetricsPeriod,
    currency: Currency
  ): Promise<Array<{
    categoryName: string;
    amount: import('../../value-objects/Money').Money;
    percentage: number;
  }>>;
}