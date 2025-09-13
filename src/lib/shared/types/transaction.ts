export interface TransactionData {
  bookingDate: Date;
  valueDate: Date;
  partnerName: string;
  partnerIban?: string;
  type: string;
  paymentReference: string;
  accountName: string;
  amountEur: number;
  originalAmount?: number;
  originalCurrency?: string;
  exchangeRate?: number;
}

export interface ImportableTransaction extends TransactionData {
  id: string;
  isSelected: boolean;
  isDuplicate: boolean;
  category?: string;
  notes?: string;
  duplicateReason?: string;
}

export interface ImportResult {
  imported: number;
  skipped: number;
  duplicates: number;
  errors: ImportError[];
}

export interface ImportError {
  row: number;
  field?: string;
  message: string;
  data?: any;
}

export interface ImportPreview {
  transactions: ImportableTransaction[];
  totalCount: number;
  duplicatesCount: number;
  validCount: number;
  errors: ImportError[];
}
