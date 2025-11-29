/**
 * Investment History Entry Types
 * Defines the different types of portfolio movements
 */
export enum InvestmentHistoryType {
  CONTRIBUTION = "CONTRIBUTION", // Money added to investment
  WITHDRAWAL = "WITHDRAWAL", // Money withdrawn from investment
  VALUE_UPDATE = "VALUE_UPDATE", // Update current value (market change)
}

export class InvestmentHistoryTypeHelper {
  static fromString(value: string): InvestmentHistoryType | null {
    const normalized = value.toUpperCase();
    if (Object.values(InvestmentHistoryType).includes(normalized as InvestmentHistoryType)) {
      return normalized as InvestmentHistoryType;
    }
    return null;
  }

  static isContribution(type: InvestmentHistoryType): boolean {
    return type === InvestmentHistoryType.CONTRIBUTION;
  }

  static isWithdrawal(type: InvestmentHistoryType): boolean {
    return type === InvestmentHistoryType.WITHDRAWAL;
  }

  static isValueUpdate(type: InvestmentHistoryType): boolean {
    return type === InvestmentHistoryType.VALUE_UPDATE;
  }

  static getDisplayName(type: InvestmentHistoryType): string {
    const displayNames: Record<InvestmentHistoryType, string> = {
      [InvestmentHistoryType.CONTRIBUTION]: "Contribution",
      [InvestmentHistoryType.WITHDRAWAL]: "Withdrawal",
      [InvestmentHistoryType.VALUE_UPDATE]: "Value Update",
    };
    return displayNames[type];
  }
}
