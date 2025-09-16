import { describe, it, expect, beforeEach, vi } from "vitest";
import { GetDashboardDataUseCase } from "@application/use-cases/GetDashboardDataUseCase";
import { DashboardQuery } from "@application/queries/DashboardQuery";
import { Result } from "@domain/shared/Result";
import { Transaction } from "@domain/entities/Transaction";
import { TransactionType } from "@domain/entities/TransactionType";
import { Money } from "@domain/value-objects/Money";
import { TransactionDate } from "@domain/value-objects/TransactionDate";
import { Merchant } from "@domain/value-objects/Merchant";

describe("GetDashboardDataUseCase", () => {
  let useCase: GetDashboardDataUseCase;
  let mockTransactionRepository: any;
  let mockCategoryRepository: any;
  let mockFinancialCalculationService: any;

  beforeEach(() => {
    // Mock repositories
    mockTransactionRepository = {
      findByDateRange: vi.fn(),
    };

    mockCategoryRepository = {
      findAll: vi.fn(),
    };

    // Mock financial calculation service
    mockFinancialCalculationService = {
      calculateSummary: vi.fn(),
      calculateCategoryBreakdown: vi.fn(),
      calculateSpendingRate: vi.fn(),
      calculateExpenseDistribution: vi.fn(),
      calculateTrends: vi.fn(),
    };

    useCase = new GetDashboardDataUseCase(
      mockTransactionRepository,
      mockCategoryRepository,
      mockFinancialCalculationService,
    );
  });

  describe("execute", () => {
    it("should return dashboard data for valid query", async () => {
      // Arrange
      const query = new DashboardQuery("EUR", "month");

      // Create mock transactions
      const mockTransactions = [
        createMockTransaction(1000, TransactionType.INCOME, "Salary"),
        createMockTransaction(500, TransactionType.EXPENSE, "Groceries"),
        createMockTransaction(200, TransactionType.EXPENSE, "Transport"),
      ];

      mockTransactionRepository.findByDateRange.mockResolvedValue(
        Result.ok(mockTransactions),
      );

      mockCategoryRepository.findAll.mockResolvedValue(Result.ok([]));

      const mockSummary = {
        totalIncome: Money.create(1000, "EUR").getValue(),
        totalExpenses: Money.create(700, "EUR").getValue(),
        totalInvestments: Money.create(0, "EUR").getValue(),
        balance: Money.create(300, "EUR").getValue(),
        savingsRate: 30,
        period: {
          startDate: TransactionDate.create(new Date()).getValue(),
          endDate: TransactionDate.create(new Date()).getValue(),
          label: "Test Period",
        },
      };

      mockFinancialCalculationService.calculateSummary.mockReturnValue(
        Result.ok(mockSummary),
      );
      mockFinancialCalculationService.calculateCategoryBreakdown.mockReturnValue(
        Result.ok([]),
      );
      mockFinancialCalculationService.calculateSpendingRate.mockReturnValue(
        Result.ok(70),
      );
      mockFinancialCalculationService.calculateExpenseDistribution.mockReturnValue(
        Result.ok({
          essential: Money.create(500, "EUR").getValue(),
          discretionary: Money.create(200, "EUR").getValue(),
          essentialPercentage: 71.43,
          discretionaryPercentage: 28.57,
        }),
      );
      mockFinancialCalculationService.calculateTrends.mockReturnValue(
        Result.ok([]),
      );

      // Act
      const result = await useCase.execute(query);

      // Assert
      expect(result.isSuccess()).toBe(true);
      expect(result.getValue()).toHaveProperty("summary");
      expect(result.getValue()).toHaveProperty("categoryBreakdown");
      expect(result.getValue()).toHaveProperty("trends");
      expect(result.getValue()).toHaveProperty("spendingRate");
      expect(result.getValue()).toHaveProperty("expenseDistribution");
    });

    it("should handle invalid query", async () => {
      // Arrange
      const query = new DashboardQuery("INVALID", "month");
      vi.spyOn(query, "isValid").mockReturnValue({
        valid: false,
        errors: ["Invalid currency"],
      });

      // Act
      const result = await useCase.execute(query);

      // Assert
      expect(result.isFailure()).toBe(true);
      expect(result.getError().message).toContain("Invalid query");
    });

    it("should handle repository errors", async () => {
      // Arrange
      const query = new DashboardQuery("EUR", "month");

      mockTransactionRepository.findByDateRange.mockResolvedValue(
        Result.failWithMessage("Database connection error"),
      );

      // Act
      const result = await useCase.execute(query);

      // Assert
      expect(result.isFailure()).toBe(true);
      expect(result.getError().message).toContain("Database connection error");
    });

    it("should calculate trends for different periods", async () => {
      // Arrange
      const periods = ["week", "month", "quarter", "year"];

      for (const period of periods) {
        const query = new DashboardQuery("EUR", period as any);

        mockTransactionRepository.findByDateRange.mockResolvedValue(
          Result.ok([]),
        );
        mockCategoryRepository.findAll.mockResolvedValue(Result.ok([]));

        // Setup all mocks to return valid results
        mockFinancialCalculationService.calculateSummary.mockReturnValue(
          Result.ok({
            totalIncome: Money.create(0, "EUR").getValue(),
            totalExpenses: Money.create(0, "EUR").getValue(),
            totalInvestments: Money.create(0, "EUR").getValue(),
            balance: Money.create(0, "EUR").getValue(),
            savingsRate: 0,
            period: {
              startDate: TransactionDate.create(new Date()).getValue(),
              endDate: TransactionDate.create(new Date()).getValue(),
              label: `${period} Period`,
            },
          }),
        );
        mockFinancialCalculationService.calculateCategoryBreakdown.mockReturnValue(
          Result.ok([]),
        );
        mockFinancialCalculationService.calculateSpendingRate.mockReturnValue(
          Result.ok(0),
        );
        mockFinancialCalculationService.calculateExpenseDistribution.mockReturnValue(
          Result.ok({
            essential: Money.create(0, "EUR").getValue(),
            discretionary: Money.create(0, "EUR").getValue(),
            essentialPercentage: 0,
            discretionaryPercentage: 0,
          }),
        );
        mockFinancialCalculationService.calculateTrends.mockReturnValue(
          Result.ok([]),
        );

        // Act
        const result = await useCase.execute(query);

        // Assert
        expect(result.isSuccess()).toBe(true);
        expect(
          mockFinancialCalculationService.calculateTrends,
        ).toHaveBeenCalled();
      }
    });
  });
});

// Helper function to create mock transactions
function createMockTransaction(
  amount: number,
  type: TransactionType,
  merchant: string,
): Transaction {
  const money = Money.create(amount, "EUR").getValue();
  const date = TransactionDate.create(new Date()).getValue();
  const merchantObj = Merchant.create(merchant).getValue();

  return Transaction.create(money, date, merchantObj, type, "").getValue();
}
