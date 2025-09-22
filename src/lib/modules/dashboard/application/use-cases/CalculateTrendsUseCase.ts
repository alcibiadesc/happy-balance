import { Trend } from '../../domain/entities/Trend';
import type { MonthlyTrendData } from '../../domain/repositories/DashboardRepository';

export class CalculateTrendsUseCase {
  execute(monthlyData: MonthlyTrendData[]): {
    income: Trend;
    expenses: Trend;
    investments: Trend;
  } {
    if (monthlyData.length < 2) {
      return {
        income: Trend.zero(),
        expenses: Trend.zero(),
        investments: Trend.zero()
      };
    }

    const current = monthlyData[monthlyData.length - 1];
    const previous = monthlyData[monthlyData.length - 2];

    return {
      income: Trend.calculate(current.income, previous.income),
      expenses: Trend.calculate(current.expenses, previous.expenses),
      investments: Trend.calculate(current.balance, previous.balance)
    };
  }
}