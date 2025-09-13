import type { ImportableTransaction } from '../../shared/types/transaction';

export interface DuplicateDetectionConfig {
  dateToleranceDays?: number;
  amountTolerancePercent?: number;
  checkPartnerName?: boolean;
  checkPaymentReference?: boolean;
  strictMode?: boolean;
}

export class DuplicateDetector {
  private config: Required<DuplicateDetectionConfig>;

  constructor(config: DuplicateDetectionConfig = {}) {
    this.config = {
      dateToleranceDays: 0,
      amountTolerancePercent: 0,
      checkPartnerName: true,
      checkPaymentReference: true,
      strictMode: false,
      ...config
    };
  }

  detectDuplicates(transactions: ImportableTransaction[]): ImportableTransaction[] {
    const result = [...transactions];
    const processed = new Set<string>();

    for (let i = 0; i < result.length; i++) {
      if (processed.has(result[i].id)) continue;

      const duplicates = this.findDuplicatesForTransaction(result[i], result.slice(i + 1));
      
      if (duplicates.length > 0) {
        // Mark current transaction as having duplicates
        result[i].isDuplicate = true;
        result[i].duplicateReason = `Found ${duplicates.length} potential duplicate(s)`;
        
        // Mark all duplicates
        duplicates.forEach(duplicate => {
          const index = result.findIndex(t => t.id === duplicate.id);
          if (index !== -1) {
            result[index].isDuplicate = true;
            result[index].duplicateReason = duplicate.reason;
            result[index].isSelected = false; // Auto-deselect duplicates
            processed.add(duplicate.id);
          }
        });
      }
      
      processed.add(result[i].id);
    }

    return result;
  }

  private findDuplicatesForTransaction(
    transaction: ImportableTransaction, 
    candidates: ImportableTransaction[]
  ): Array<{ id: string; reason: string }> {
    const duplicates: Array<{ id: string; reason: string }> = [];

    for (const candidate of candidates) {
      const similarityScore = this.calculateSimilarityScore(transaction, candidate);
      const reason = this.getDuplicateReason(transaction, candidate, similarityScore);
      
      if (this.isDuplicate(similarityScore)) {
        duplicates.push({
          id: candidate.id,
          reason
        });
      }
    }

    return duplicates;
  }

  private calculateSimilarityScore(
    t1: ImportableTransaction, 
    t2: ImportableTransaction
  ): DuplicateScore {
    return {
      dateMatch: this.isDateMatch(t1.bookingDate, t2.bookingDate),
      amountMatch: this.isAmountMatch(t1.amountEur, t2.amountEur),
      partnerNameMatch: this.isPartnerNameMatch(t1.partnerName, t2.partnerName),
      paymentReferenceMatch: this.isPaymentReferenceMatch(t1.paymentReference, t2.paymentReference),
      exactMatch: this.isExactMatch(t1, t2)
    };
  }

  private isDuplicate(score: DuplicateScore): boolean {
    if (score.exactMatch) return true;
    
    if (this.config.strictMode) {
      return score.dateMatch && score.amountMatch && 
             (score.partnerNameMatch || score.paymentReferenceMatch);
    } else {
      // More permissive matching
      return (score.dateMatch && score.amountMatch) ||
             (score.amountMatch && score.partnerNameMatch && score.paymentReferenceMatch);
    }
  }

  private getDuplicateReason(
    t1: ImportableTransaction, 
    t2: ImportableTransaction, 
    score: DuplicateScore
  ): string {
    if (score.exactMatch) {
      return 'Exact duplicate found';
    }

    const reasons = [];
    if (score.dateMatch) reasons.push('same date');
    if (score.amountMatch) reasons.push('same amount');
    if (score.partnerNameMatch) reasons.push('same partner');
    if (score.paymentReferenceMatch) reasons.push('same reference');

    return `Similar transaction: ${reasons.join(', ')}`;
  }

  private isDateMatch(date1: Date, date2: Date): boolean {
    const diffDays = Math.abs((date1.getTime() - date2.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays <= this.config.dateToleranceDays;
  }

  private isAmountMatch(amount1: number, amount2: number): boolean {
    if (this.config.amountTolerancePercent === 0) {
      return Math.abs(amount1 - amount2) < 0.01; // Cent precision
    }
    
    const tolerance = Math.abs(amount1) * (this.config.amountTolerancePercent / 100);
    return Math.abs(amount1 - amount2) <= tolerance;
  }

  private isPartnerNameMatch(partner1: string, partner2: string): boolean {
    if (!this.config.checkPartnerName) return false;
    
    const normalize = (str: string) => str.toLowerCase().trim().replace(/\s+/g, ' ');
    const n1 = normalize(partner1);
    const n2 = normalize(partner2);
    
    // Exact match
    if (n1 === n2) return true;
    
    // Partial match for common cases
    if (n1.includes(n2) || n2.includes(n1)) {
      return Math.min(n1.length, n2.length) > 5; // Avoid short false positives
    }
    
    return false;
  }

  private isPaymentReferenceMatch(ref1: string, ref2: string): boolean {
    if (!this.config.checkPaymentReference) return false;
    
    const normalize = (str: string) => str.toLowerCase().trim();
    const n1 = normalize(ref1);
    const n2 = normalize(ref2);
    
    return n1 === n2 && n1.length > 0;
  }

  private isExactMatch(t1: ImportableTransaction, t2: ImportableTransaction): boolean {
    return t1.bookingDate.getTime() === t2.bookingDate.getTime() &&
           t1.valueDate.getTime() === t2.valueDate.getTime() &&
           Math.abs(t1.amountEur - t2.amountEur) < 0.01 &&
           t1.partnerName.trim() === t2.partnerName.trim() &&
           t1.paymentReference.trim() === t2.paymentReference.trim();
  }
}

interface DuplicateScore {
  dateMatch: boolean;
  amountMatch: boolean;
  partnerNameMatch: boolean;
  paymentReferenceMatch: boolean;
  exactMatch: boolean;
}
