import { z } from "zod";

/**
 * DTOs y esquemas de validación para el Dashboard
 * Centraliza la validación y el formato de respuestas
 */

// Esquemas de validación de entrada
export const MonthYearSchema = z.object({
  year: z.coerce.number()
    .min(2020, "Year must be 2020 or later")
    .max(2030, "Year must be 2030 or earlier"),
  month: z.coerce.number()
    .min(1, "Month must be between 1 and 12")
    .max(12, "Month must be between 1 and 12"),
});

export const DateRangeSchema = z.object({
  startDate: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format")
    .refine((date) => {
      const d = new Date(date);
      return d instanceof Date && !isNaN(d.getTime());
    }, "Invalid date"),
  endDate: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format")
    .refine((date) => {
      const d = new Date(date);
      return d instanceof Date && !isNaN(d.getTime());
    }, "Invalid date"),
}).refine((data) => {
  return new Date(data.startDate) <= new Date(data.endDate);
}, "Start date must be before or equal to end date");

export const PeriodTypeSchema = z.enum(["week", "month", "quarter", "year", "custom"]);

export const DashboardQuerySchema = z.object({
  type: PeriodTypeSchema.optional().default("month"),
  months: z.coerce.number().min(1).max(24).optional().default(6),
  includeComparison: z.boolean().optional().default(false),
  includeCategories: z.boolean().optional().default(true),
  includeTrends: z.boolean().optional().default(true),
  currency: z.string().length(3).optional().default("EUR"),
});

// DTOs de respuesta
export class PeriodMetricsDTO {
  income: number;
  expenses: number;
  investments: number;
  debtPayments: number;
  balance: number;
  savingsRate: number;
  currency: string;

  constructor(data: any) {
    this.income = this.roundMoney(data.income);
    this.expenses = this.roundMoney(data.expenses);
    this.investments = this.roundMoney(data.investments);
    this.debtPayments = this.roundMoney(data.debtPayments);
    this.balance = this.roundMoney(data.balance);
    this.savingsRate = Number((data.savingsRate || 0).toFixed(1));
    this.currency = data.currency || "EUR";
  }

  private roundMoney(amount: number): number {
    return Math.round(amount * 100) / 100;
  }
}

export class CategoryDTO {
  id: string;
  name: string;
  amount: number;
  percentage: number;
  transactionCount: number;
  color?: string;

  constructor(data: any) {
    this.id = data.id || data.categoryId;
    this.name = data.name || data.categoryName;
    this.amount = Math.round(data.amount * 100) / 100;
    this.percentage = Number((data.percentage || 0).toFixed(1));
    this.transactionCount = data.transactionCount || 0;
    this.color = data.color;
  }
}

export class ComparisonDTO {
  value: number;
  previousValue: number;
  change: number;
  changePercentage: number;
  trend: "up" | "down" | "stable";

  constructor(current: number, previous: number) {
    this.value = Math.round(current * 100) / 100;
    this.previousValue = Math.round(previous * 100) / 100;
    this.change = Math.round((current - previous) * 100) / 100;

    if (previous === 0) {
      this.changePercentage = current > 0 ? 100 : 0;
    } else {
      this.changePercentage = Number(((this.change / previous) * 100).toFixed(1));
    }

    this.trend = this.change > 0 ? "up" : this.change < 0 ? "down" : "stable";
  }
}

export class DashboardResponseDTO {
  success: boolean;
  period: {
    type: string;
    year?: number;
    month?: number;
    startDate: string;
    endDate: string;
    label: string;
  };
  data: {
    summary: PeriodMetricsDTO;
    distribution?: any;
    categories?: CategoryDTO[];
    trends?: any[];
    comparison?: {
      income: ComparisonDTO;
      expenses: ComparisonDTO;
      savingsRate: ComparisonDTO;
    };
  };
  meta?: {
    cached: boolean;
    generatedAt: string;
    dataQuality?: {
      hasAllCategories: boolean;
      hasMissingData: boolean;
      completenessScore: number;
    };
  };

  constructor(
    period: any,
    data: any,
    options: { cached?: boolean; includeQuality?: boolean } = {}
  ) {
    this.success = true;
    this.period = {
      type: period.type,
      year: period.year,
      month: period.month,
      startDate: period.startDate,
      endDate: period.endDate,
      label: this.generateLabel(period),
    };

    this.data = {
      summary: new PeriodMetricsDTO(data.summary || data),
      distribution: data.distribution,
      categories: data.categories?.map((c: any) => new CategoryDTO(c)),
      trends: data.trends,
    };

    if (data.comparison) {
      this.data.comparison = data.comparison;
    }

    this.meta = {
      cached: options.cached || false,
      generatedAt: new Date().toISOString(),
    };

    if (options.includeQuality) {
      this.meta.dataQuality = this.calculateDataQuality(data);
    }
  }

  private generateLabel(period: any): string {
    if (period.type === "month" && period.year && period.month) {
      const date = new Date(period.year, period.month - 1);
      return date.toLocaleDateString("en-US", {
        month: "long",
        year: "numeric"
      });
    }
    if (period.type === "year" && period.year) {
      return `Year ${period.year}`;
    }
    if (period.type === "custom") {
      return `${period.startDate} to ${period.endDate}`;
    }
    return period.label || "Custom Period";
  }

  private calculateDataQuality(data: any): any {
    const hasCategories = data.categories && data.categories.length > 0;
    const hasTransactions = data.summary && (data.summary.income > 0 || data.summary.expenses > 0);
    const hasTrends = data.trends && data.trends.length > 0;

    const score = [hasCategories, hasTransactions, hasTrends]
      .filter(Boolean).length / 3 * 100;

    return {
      hasAllCategories: hasCategories,
      hasMissingData: !hasTransactions,
      completenessScore: Math.round(score),
    };
  }
}

// Error responses
export class ErrorResponseDTO {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp: string;

  constructor(code: string, message: string, details?: any) {
    this.success = false;
    this.error = {
      code,
      message,
      details,
    };
    this.timestamp = new Date().toISOString();
  }
}

// Tipos de error comunes
export const DashboardErrors = {
  INVALID_PERIOD: "INVALID_PERIOD",
  INVALID_DATE_RANGE: "INVALID_DATE_RANGE",
  NO_DATA_FOUND: "NO_DATA_FOUND",
  FUTURE_DATE: "FUTURE_DATE",
  SERVICE_ERROR: "SERVICE_ERROR",
} as const;