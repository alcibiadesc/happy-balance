import { Request, Response } from 'express';
import { GetCurrentMetricsUseCase } from '../../application/use-cases/metrics/GetCurrentMetricsUseCase';
import { GetMetricsTrendsUseCase } from '../../application/use-cases/metrics/GetMetricsTrendsUseCase';
import { MetricsRepository } from '../../domain/metrics/repositories/MetricsRepository';

export class CleanMetricsController {
  constructor(
    private readonly getCurrentMetricsUseCase: GetCurrentMetricsUseCase,
    private readonly getMetricsTrendsUseCase: GetMetricsTrendsUseCase,
    private readonly metricsRepository: MetricsRepository
  ) {}

  public async getCurrentMetrics(req: Request, res: Response): Promise<void> {
    try {
      const {
        period = 'month',
        periodOffset = '0',
        startDate,
        endDate,
        currency = 'EUR'
      } = req.query;

      const command = {
        period: period as 'day' | 'week' | 'month' | 'quarter' | 'year' | 'custom',
        periodOffset: parseInt(periodOffset as string, 10),
        startDate: startDate as string | undefined,
        endDate: endDate as string | undefined,
        currency: currency as string,
      };

      const result = await this.getCurrentMetricsUseCase.execute(command);

      if (result.isFailure) {
        res.status(400).json({
          success: false,
          error: result.error,
        });
        return;
      }

      const snapshot = result.getValue();

      res.json({
        success: true,
        data: {
          summary: snapshot.toPeriodSummary(),
          period: {
            startDate: snapshot.period.startDate,
            endDate: snapshot.period.endDate,
            label: snapshot.period.toLabel(),
          },
        },
      });
    } catch (error) {
      console.error('Error in CleanMetricsController.getCurrentMetrics:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }

  public async getTrends(req: Request, res: Response): Promise<void> {
    try {
      const {
        period = 'month',
        numberOfPeriods = '6',
        currency = 'EUR'
      } = req.query;

      const command = {
        period: period as 'week' | 'month' | 'quarter' | 'year',
        numberOfPeriods: parseInt(numberOfPeriods as string, 10),
        currency: currency as string,
      };

      const result = await this.getMetricsTrendsUseCase.execute(command);

      if (result.isFailure) {
        res.status(400).json({
          success: false,
          error: result.error,
        });
        return;
      }

      const trends = result.getValue();

      res.json({
        success: true,
        data: {
          trends: trends.map(snapshot => snapshot.toTrendData()),
        },
      });
    } catch (error) {
      console.error('Error in CleanMetricsController.getTrends:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }

  public async getCategoryBreakdown(req: Request, res: Response): Promise<void> {
    try {
      const {
        period = 'month',
        periodOffset = '0',
        startDate,
        endDate,
        currency = 'EUR'
      } = req.query;

      // Create the period same way as getCurrentMetrics
      const command = {
        period: period as 'day' | 'week' | 'month' | 'quarter' | 'year' | 'custom',
        periodOffset: parseInt(periodOffset as string, 10),
        startDate: startDate as string | undefined,
        endDate: endDate as string | undefined,
        currency: currency as string,
      };

      // Get the current metrics to extract the period
      const metricsResult = await this.getCurrentMetricsUseCase.execute(command);

      if (metricsResult.isFailure) {
        res.status(400).json({
          success: false,
          error: metricsResult.error,
        });
        return;
      }

      const snapshot = metricsResult.getValue();
      const categoryBreakdown = await this.metricsRepository.getCategoryBreakdown(
        snapshot.period,
        { value: currency } as any // Quick fix for Currency type
      );

      res.json({
        success: true,
        data: {
          categoryBreakdown,
        },
      });
    } catch (error) {
      console.error('Error in CleanMetricsController.getCategoryBreakdown:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }

  public async getDashboard(req: Request, res: Response): Promise<void> {
    try {
      const {
        period = 'month',
        periodOffset = '0',
        startDate,
        endDate,
        currency = 'EUR'
      } = req.query;

      const command = {
        period: period as 'day' | 'week' | 'month' | 'quarter' | 'year' | 'custom',
        periodOffset: parseInt(periodOffset as string, 10),
        startDate: startDate as string | undefined,
        endDate: endDate as string | undefined,
        currency: currency as string,
      };

      // Get current metrics
      const currentResult = await this.getCurrentMetricsUseCase.execute(command);
      if (currentResult.isFailure) {
        res.status(400).json({
          success: false,
          error: currentResult.error,
        });
        return;
      }

      // Get trends
      const trendsCommand = {
        period: period as 'week' | 'month' | 'quarter' | 'year',
        numberOfPeriods: 6,
        currency: currency as string,
      };
      const trendsResult = await this.getMetricsTrendsUseCase.execute(trendsCommand);

      // Get category breakdown
      const snapshot = currentResult.getValue();
      const categoryBreakdown = await this.metricsRepository.getCategoryBreakdown(
        snapshot.period,
        { value: currency } as any
      );

      const trends = trendsResult.isSuccess ? trendsResult.getValue() : [];

      res.json({
        success: true,
        data: {
          summary: snapshot.toPeriodSummary(),
          trends: trends.map(t => t.toTrendData()),
          categoryBreakdown,
          spendingRate: snapshot.spendingRate,
          expenseDistribution: {
            essential: snapshot.totalExpenses, // Simplified for now
            discretionary: snapshot.totalExpenses,
            debtPayments: snapshot.totalDebtPayments,
            essentialPercentage: 70,
            discretionaryPercentage: 30,
            debtPaymentPercentage: 0,
          },
        },
      });
    } catch (error) {
      console.error('Error in CleanMetricsController.getDashboard:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }
}