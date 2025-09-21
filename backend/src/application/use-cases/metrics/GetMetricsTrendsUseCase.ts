import { Result } from '../../../domain/shared/Result';
import { MetricsRepository } from '../../../domain/metrics/repositories/MetricsRepository';
import { MetricsPeriod } from '../../../domain/metrics/value-objects/MetricsPeriod';
import { Currency } from '../../../domain/value-objects/Currency';
import { MetricSnapshot } from '../../../domain/metrics/entities/MetricSnapshot';

export interface GetMetricsTrendsCommand {
  period: 'week' | 'month' | 'quarter' | 'year';
  numberOfPeriods?: number;
  currency: string;
}

export class GetMetricsTrendsUseCase {
  constructor(private readonly metricsRepository: MetricsRepository) {}

  public async execute(command: GetMetricsTrendsCommand): Promise<Result<MetricSnapshot[]>> {
    try {
      const currency = Currency.create(command.currency);
      const numberOfPeriods = command.numberOfPeriods || this.getDefaultPeriodCount(command.period);

      const periods = this.generatePeriods(command.period, numberOfPeriods);
      const trends = await this.metricsRepository.getHistoricalMetrics(periods, currency);

      return Result.ok(trends);
    } catch (error) {
      console.error('Error in GetMetricsTrendsUseCase:', error);
      return Result.fail(`Failed to get metrics trends: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private getDefaultPeriodCount(period: string): number {
    switch (period) {
      case 'week':
        return 12; // Last 12 weeks
      case 'month':
        return 6;  // Last 6 months
      case 'quarter':
        return 8;  // Last 8 quarters
      case 'year':
        return 5;  // Last 5 years
      default:
        return 6;
    }
  }

  private generatePeriods(periodType: string, count: number): MetricsPeriod[] {
    const periods: MetricsPeriod[] = [];

    for (let i = count - 1; i >= 0; i--) {
      let period: MetricsPeriod;

      switch (periodType) {
        case 'week':
          period = MetricsPeriod.createWeek(i);
          break;
        case 'month':
          period = MetricsPeriod.createMonth(i);
          break;
        case 'quarter':
          period = MetricsPeriod.createQuarter(i);
          break;
        case 'year':
          period = MetricsPeriod.createYear(i);
          break;
        default:
          throw new Error(`Unsupported period type: ${periodType}`);
      }

      periods.push(period);
    }

    return periods;
  }
}