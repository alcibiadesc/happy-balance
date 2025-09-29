import { Result } from '../../../domain/shared/Result';
import { MetricsRepository } from '../../../domain/metrics/repositories/MetricsRepository';
import { MetricsPeriod } from '../../../domain/metrics/value-objects/MetricsPeriod';
import { MetricsType } from '../../../domain/metrics/value-objects/MetricsType';
import { Currency } from '../../../domain/value-objects/Currency';
import { MetricSnapshot } from '../../../domain/metrics/entities/MetricSnapshot';

export interface GetCurrentMetricsCommand {
  period: 'day' | 'week' | 'month' | 'quarter' | 'year' | 'custom';
  periodOffset?: number;
  startDate?: string;
  endDate?: string;
  currency: string;
}

export class GetCurrentMetricsUseCase {
  constructor(private readonly metricsRepository: MetricsRepository) {}

  public async execute(command: GetCurrentMetricsCommand): Promise<Result<MetricSnapshot>> {
    try {
      const currencyResult = Currency.create(command.currency);
      if (currencyResult.isFailure()) {
        return Result.fail(currencyResult.getError());
      }
      const currency = currencyResult.getValue();
      const period = this.createPeriod(command);

      const snapshot = await this.metricsRepository.getCurrentMetrics(period, currency);

      return Result.ok(snapshot);
    } catch (error) {
      console.error('Error in GetCurrentMetricsUseCase:', error);
      return Result.failWithMessage(`Failed to get current metrics: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private createPeriod(command: GetCurrentMetricsCommand): MetricsPeriod {
    const offset = command.periodOffset || 0;

    switch (command.period) {
      case 'day':
        // For simplicity, treating day as current day
        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() - offset);
        const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() - offset, 23, 59, 59, 999);
        return new MetricsPeriod(startOfDay, endOfDay, 'day', offset);

      case 'week':
        return MetricsPeriod.createWeek(offset);

      case 'month':
        return MetricsPeriod.createMonth(offset);

      case 'quarter':
        return MetricsPeriod.createQuarter(offset);

      case 'year':
        return MetricsPeriod.createYear(offset);

      case 'custom':
        if (!command.startDate || !command.endDate) {
          throw new Error('Start date and end date are required for custom period');
        }
        return MetricsPeriod.createCustom(
          new Date(command.startDate),
          new Date(command.endDate)
        );

      default:
        throw new Error(`Unsupported period type: ${command.period}`);
    }
  }
}