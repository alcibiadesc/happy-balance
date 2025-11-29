import { IInvestmentRepository, PortfolioSummary } from "@domain/repositories/IInvestmentRepository";
import { Result } from "@domain/shared/Result";

export class GetPortfolioSummaryUseCase {
  constructor(private readonly investmentRepository: IInvestmentRepository) {}

  async execute(): Promise<Result<PortfolioSummary>> {
    try {
      return await this.investmentRepository.getPortfolioSummary();
    } catch (error) {
      return Result.failWithMessage(
        `Failed to get portfolio summary: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }
}
