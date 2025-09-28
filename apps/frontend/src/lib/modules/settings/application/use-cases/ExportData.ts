import type { Settings } from '../../domain/entities/Settings';

export interface ExportDataDTO {
  transactions: any[];
  transactionHashes: any[];
  categories: any[];
  settings: {
    currency: string;
    language: string;
    theme: string;
    exportDate: string;
    version: string;
  };
  metadata: {
    appName: string;
    exportedBy: string;
    totalTransactions: number;
  };
}

export class ExportDataUseCase {
  execute(settings: Settings): ExportDataDTO {
    const transactions = this.getTransactions();
    const categories = this.getCategories();
    const transactionHashes = this.getTransactionHashes();

    return {
      transactions,
      transactionHashes,
      categories,
      settings: {
        currency: settings.getCurrency(),
        language: settings.getLanguage().getCode(),
        theme: settings.getTheme().getValue(),
        exportDate: new Date().toISOString(),
        version: '1.0.0'
      },
      metadata: {
        appName: 'Happy Balance',
        exportedBy: 'Settings Export',
        totalTransactions: transactions.length
      }
    };
  }

  private getTransactions(): any[] {
    if (typeof window === 'undefined') return [];
    return JSON.parse(localStorage.getItem('transactions') || '[]');
  }

  private getCategories(): any[] {
    if (typeof window === 'undefined') return [];
    return JSON.parse(localStorage.getItem('categories') || '[]');
  }

  private getTransactionHashes(): any[] {
    if (typeof window === 'undefined') return [];
    return JSON.parse(localStorage.getItem('transaction-hashes') || '[]');
  }

  downloadAsJSON(data: ExportDataDTO): void {
    if (typeof window === 'undefined') return;

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `happy-balance-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}