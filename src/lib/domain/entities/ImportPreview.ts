import { Result, success, failure } from '$lib/shared/utils/result';
import { DomainError } from '$lib/shared/errors/DomainError.js';
import { Money } from '../value-objects/Money.js';
import { TransactionDate } from '../value-objects/TransactionDate.js';

export interface ImportPreviewTransaction {
  id: string;
  date: TransactionDate;
  description: string;
  amount: Money;
  paymentReference?: string;
  counterparty?: string;
  categoryId?: string;
  status: ImportTransactionStatus;
  isDuplicate: boolean;
  duplicateOf?: string;
  error?: string;
  originalData: any;
  selected: boolean;
  willBeHidden: boolean;
  isEdited: boolean;
}

export enum ImportTransactionStatus {
  NEW = 'new',
  DUPLICATE = 'duplicate',
  ERROR = 'error',
  EDITED = 'edited',
  DISCARDED = 'discarded'
}

export interface ImportPreviewSummary {
  totalTransactions: number;
  newTransactions: number;
  duplicates: number;
  errors: number;
  totalAmount: Money;
  dateRange: {
    from: TransactionDate;
    to: TransactionDate;
  };
}

export class ImportPreview {
  private constructor(
    public readonly id: string,
    public readonly fileName: string,
    public readonly accountId: string,
    private _transactions: ImportPreviewTransaction[],
    public readonly summary: ImportPreviewSummary,
    public readonly createdAt: Date = new Date()
  ) {}

  static create(data: {
    fileName: string;
    accountId: string;
    transactions: ImportPreviewTransaction[];
  }): Result<ImportPreview, DomainError> {
    try {
      // Validate input
      if (!data.fileName || data.fileName.trim() === '') {
        return failure(new DomainError('File name is required'));
      }

      if (!data.accountId || data.accountId.trim() === '') {
        return failure(new DomainError('Account ID is required'));
      }

      if (!Array.isArray(data.transactions)) {
        return failure(new DomainError('Transactions must be an array'));
      }

      // Generate ID
      const id = `import-preview-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // Calculate summary
      const summary = ImportPreview.calculateSummary(data.transactions);

      const preview = new ImportPreview(
        id,
        data.fileName,
        data.accountId,
        data.transactions,
        summary
      );

      return success(preview);
    } catch (error) {
      return failure(new DomainError(
        `Failed to create import preview: ${error instanceof Error ? error.message : 'Unknown error'}`
      ));
    }
  }

  private static calculateSummary(transactions: ImportPreviewTransaction[]): ImportPreviewSummary {
    let totalAmount = 0;
    let newCount = 0;
    let duplicateCount = 0;
    let errorCount = 0;
    let minDate: Date | null = null;
    let maxDate: Date | null = null;

    for (const tx of transactions) {
      // Count by status
      switch (tx.status) {
        case ImportTransactionStatus.NEW:
        case ImportTransactionStatus.EDITED:
          newCount++;
          break;
        case ImportTransactionStatus.DUPLICATE:
          duplicateCount++;
          break;
        case ImportTransactionStatus.ERROR:
          errorCount++;
          break;
      }

      // Calculate totals (only for non-error transactions)
      if (tx.status !== ImportTransactionStatus.ERROR) {
        totalAmount += tx.amount.amount;

        const txDate = tx.date.value;
        if (!minDate || txDate < minDate) minDate = txDate;
        if (!maxDate || txDate > maxDate) maxDate = txDate;
      }
    }

    return {
      totalTransactions: transactions.length,
      newTransactions: newCount,
      duplicates: duplicateCount,
      errors: errorCount,
      totalAmount: new Money(totalAmount, 'EUR'),
      dateRange: {
        from: new TransactionDate(minDate || new Date()),
        to: new TransactionDate(maxDate || new Date())
      }
    };
  }

  // Domain methods
  get transactions(): readonly ImportPreviewTransaction[] {
    return [...this._transactions];
  }

  get selectedTransactions(): readonly ImportPreviewTransaction[] {
    return this._transactions.filter(tx => tx.selected);
  }

  get importableTransactions(): readonly ImportPreviewTransaction[] {
    return this._transactions.filter(tx => 
      tx.selected && 
      tx.status !== ImportTransactionStatus.ERROR && 
      tx.status !== ImportTransactionStatus.DISCARDED
    );
  }

  selectTransaction(transactionId: string): Result<void, DomainError> {
    const transaction = this._transactions.find(tx => tx.id === transactionId);
    if (!transaction) {
      return failure(new DomainError('Transaction not found'));
    }

    if (transaction.status === ImportTransactionStatus.ERROR) {
      return failure(new DomainError('Cannot select transactions with errors'));
    }

    transaction.selected = true;
    return success(undefined);
  }

  deselectTransaction(transactionId: string): Result<void, DomainError> {
    const transaction = this._transactions.find(tx => tx.id === transactionId);
    if (!transaction) {
      return failure(new DomainError('Transaction not found'));
    }

    transaction.selected = false;
    return success(undefined);
  }

  selectAllTransactions(): void {
    this._transactions.forEach(tx => {
      if (tx.status !== ImportTransactionStatus.ERROR) {
        tx.selected = true;
      }
    });
  }

  deselectAllTransactions(): void {
    this._transactions.forEach(tx => {
      tx.selected = false;
    });
  }

  discardTransaction(transactionId: string): Result<void, DomainError> {
    const transaction = this._transactions.find(tx => tx.id === transactionId);
    if (!transaction) {
      return failure(new DomainError('Transaction not found'));
    }

    transaction.status = ImportTransactionStatus.DISCARDED;
    transaction.selected = false;
    return success(undefined);
  }

  discardDuplicates(): void {
    this._transactions.forEach(tx => {
      if (tx.isDuplicate) {
        tx.status = ImportTransactionStatus.DISCARDED;
        tx.selected = false;
      }
    });
  }

  toggleTransactionVisibility(transactionId: string): Result<void, DomainError> {
    const transaction = this._transactions.find(tx => tx.id === transactionId);
    if (!transaction) {
      return failure(new DomainError('Transaction not found'));
    }

    transaction.willBeHidden = !transaction.willBeHidden;
    return success(undefined);
  }

  updateTransactionDescription(transactionId: string, description: string): Result<void, DomainError> {
    const transaction = this._transactions.find(tx => tx.id === transactionId);
    if (!transaction) {
      return failure(new DomainError('Transaction not found'));
    }

    if (!description || description.trim() === '') {
      return failure(new DomainError('Description cannot be empty'));
    }

    transaction.description = description.trim();
    transaction.isEdited = true;
    
    if (transaction.status === ImportTransactionStatus.NEW) {
      transaction.status = ImportTransactionStatus.EDITED;
    }

    return success(undefined);
  }

  assignCategoryToSelected(categoryId: string): Result<number, DomainError> {
    if (!categoryId || categoryId.trim() === '') {
      return failure(new DomainError('Category ID cannot be empty'));
    }

    let updatedCount = 0;
    this.selectedTransactions.forEach(tx => {
      const transaction = this._transactions.find(t => t.id === tx.id);
      if (transaction && transaction.status !== ImportTransactionStatus.ERROR) {
        transaction.categoryId = categoryId;
        transaction.isEdited = true;
        
        if (transaction.status === ImportTransactionStatus.NEW) {
          transaction.status = ImportTransactionStatus.EDITED;
        }
        
        updatedCount++;
      }
    });

    return success(updatedCount);
  }

  hideSelectedTransactions(): Result<number, DomainError> {
    let hiddenCount = 0;
    this.selectedTransactions.forEach(tx => {
      const transaction = this._transactions.find(t => t.id === tx.id);
      if (transaction) {
        transaction.willBeHidden = true;
        hiddenCount++;
      }
    });

    return success(hiddenCount);
  }

  // Validation
  validate(): Result<void, DomainError> {
    const importableCount = this.importableTransactions.length;
    
    if (importableCount === 0) {
      return failure(new DomainError('No transactions selected for import'));
    }

    // Validate each importable transaction
    for (const tx of this.importableTransactions) {
      if (!tx.description || tx.description.trim() === '') {
        return failure(new DomainError(`Transaction ${tx.id} has empty description`));
      }

      if (tx.amount.amount === 0) {
        return failure(new DomainError(`Transaction ${tx.id} has zero amount`));
      }
    }

    return success(undefined);
  }

  // Export for persistence or API
  toDTO() {
    return {
      id: this.id,
      fileName: this.fileName,
      accountId: this.accountId,
      transactions: this._transactions.map(tx => ({
        id: tx.id,
        date: tx.date.value.toISOString(),
        description: tx.description,
        amount: tx.amount.amount,
        paymentReference: tx.paymentReference,
        counterparty: tx.counterparty,
        categoryId: tx.categoryId,
        status: tx.status,
        isDuplicate: tx.isDuplicate,
        duplicateOf: tx.duplicateOf,
        error: tx.error,
        selected: tx.selected,
        willBeHidden: tx.willBeHidden,
        isEdited: tx.isEdited,
        originalData: tx.originalData
      })),
      summary: {
        totalTransactions: this.summary.totalTransactions,
        newTransactions: this.summary.newTransactions,
        duplicates: this.summary.duplicates,
        errors: this.summary.errors,
        totalAmount: this.summary.totalAmount.amount,
        dateRange: {
          from: this.summary.dateRange.from.value.toISOString(),
          to: this.summary.dateRange.to.value.toISOString()
        }
      },
      createdAt: this.createdAt.toISOString()
    };
  }
}