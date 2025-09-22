import type { DashboardRepository, DashboardData } from '../../domain/repositories/DashboardRepository';
import { Period } from '../../domain/value-objects/Period';

export class LoadDashboardDataUseCase {
  constructor(private readonly repository: DashboardRepository) {}

  async execute(period: Period, currency: string): Promise<DashboardData> {
    return await this.repository.getDashboardData(period, currency);
  }
}