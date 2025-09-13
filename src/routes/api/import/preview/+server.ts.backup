import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { GenerateImportPreviewUseCase } from '$lib/application/use-cases/GenerateImportPreviewUseCase.js';
import { PrismaTransactionRepository } from '$lib/infrastructure/repositories/PrismaTransactionRepository.js';
import { PrismaAccountRepository } from '$lib/infrastructure/repositories/PrismaAccountRepository.js';
import { CSVParserFactory } from '$lib/infrastructure/parsers/CSVParserFactory.js';
import { logger } from '$lib/shared/utils/AppLogger.js';
import { AccountId } from '$lib/domain/value-objects/AccountId.js';

export interface PreviewTransaction {
  id: string; // Temporary ID for preview
  date: string;
  description: string;
  amount: number;
  paymentReference?: string;
  counterparty?: string;
  category?: any;
  status: 'new' | 'duplicate' | 'error' | 'edited' | 'discarded';
  isDuplicate: boolean;
  duplicateOf?: string;
  error?: string;
  originalData: any;
  selected: boolean;
  willBeHidden: boolean;
}

export interface PreviewSummary {
  totalTransactions: number;
  newTransactions: number;
  duplicates: number;
  errors: number;
  totalAmount: number;
  dateRange: {
    from: string;
    to: string;
  };
}

export const POST: RequestHandler = async ({ request }) => {
  const requestId = `import-preview-${Date.now()}`;
  const requestLogger = logger.createChildLogger({ 
    component: 'ImportPreviewAPI', 
    requestId 
  });

  try {
    requestLogger.info('Starting import preview generation');
    
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const accountId = formData.get('accountId') as string;

    if (!file) {
      return json({
        success: false,
        error: 'No file provided',
        code: 'MISSING_FILE'
      }, { status: 400 });
    }

    if (!accountId) {
      return json({
        success: false,
        error: 'Account ID is required',
        code: 'MISSING_ACCOUNT_ID'
      }, { status: 400 });
    }

    // Validate file
    if (!file.name.toLowerCase().endsWith('.csv')) {
      return json({
        success: false,
        error: 'Only CSV files are supported',
        code: 'INVALID_FILE_TYPE'
      }, { status: 400 });
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return json({
        success: false,
        error: 'File size exceeds 5MB limit',
        code: 'FILE_TOO_LARGE'
      }, { status: 400 });
    }

    // Parse CSV
    const csvContent = await file.text();
    const parser = new UniversalCSVParser();
    const parseResult = await parser.parseWithDetails(csvContent);

    // Initialize repositories for duplicate detection
    const transactionRepository = new PrismaTransactionRepository();
    const accountRepository = new PrismaAccountRepository();

    // Verify account exists
    const account = await accountRepository.findById(new AccountId(accountId));
    if (!account) {
      return json({
        success: false,
        error: 'Account not found',
        code: 'ACCOUNT_NOT_FOUND'
      }, { status: 404 });
    }

    // Process transactions and detect duplicates
    const previewTransactions: PreviewTransaction[] = [];
    let duplicateCount = 0;
    let errorCount = 0;
    let totalAmount = 0;
    let minDate: Date | null = null;
    let maxDate: Date | null = null;

    for (let i = 0; i < parseResult.transactions.length; i++) {
      const parsedTx = parseResult.transactions[i];
      const tempId = `preview-${i}-${Date.now()}`;
      
      try {
        // Create preview transaction
        const previewTx: PreviewTransaction = {
          id: tempId,
          date: parsedTx.transactionDate.value.toISOString().split('T')[0],
          description: parsedTx.description,
          amount: parsedTx.amount.amount, // Use .amount getter instead of .value
          paymentReference: parsedTx.paymentReference,
          counterparty: parsedTx.counterparty,
          category: null,
          status: 'new',
          isDuplicate: false,
          selected: true,
          willBeHidden: false,
          originalData: parsedTx.rawData
        };

        // Check for duplicates
        try {
          const hash = await generateTransactionHash(parsedTx);
          const existing = await transactionRepository.findByHash(hash);
          
          if (existing) {
            previewTx.status = 'duplicate';
            previewTx.isDuplicate = true;
            previewTx.duplicateOf = existing.id;
            previewTx.selected = false; // Don't select duplicates by default
            duplicateCount++;
          }
        } catch (duplicateError) {
          console.warn('Error checking for duplicates:', duplicateError);
        }

        // Update statistics
        totalAmount += parsedTx.amount.value;
        
        const txDate = parsedTx.transactionDate.value;
        if (!minDate || txDate < minDate) minDate = txDate;
        if (!maxDate || txDate > maxDate) maxDate = txDate;

        previewTransactions.push(previewTx);

      } catch (error) {
        // Handle transaction processing errors
        const previewTx: PreviewTransaction = {
          id: tempId,
          date: '',
          description: 'Error processing transaction',
          amount: 0,
          status: 'error',
          isDuplicate: false,
          selected: false,
          willBeHidden: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          originalData: parsedTx.rawData || {}
        };

        previewTransactions.push(previewTx);
        errorCount++;
      }
    }

    // Add parsing errors as transactions with error status
    for (const parseError of parseResult.errors) {
      const tempId = `error-${parseError.row}-${Date.now()}`;
      
      const errorTx: PreviewTransaction = {
        id: tempId,
        date: '',
        description: `Row ${parseError.row}: Parse error`,
        amount: 0,
        status: 'error',
        isDuplicate: false,
        selected: false,
        willBeHidden: false,
        error: parseError.message,
        originalData: parseError.data || {}
      };

      previewTransactions.push(errorTx);
      errorCount++;
    }

    // Create summary
    const summary: PreviewSummary = {
      totalTransactions: previewTransactions.length,
      newTransactions: previewTransactions.filter(tx => tx.status === 'new').length,
      duplicates: duplicateCount,
      errors: errorCount,
      totalAmount: totalAmount,
      dateRange: {
        from: minDate?.toISOString().split('T')[0] || '',
        to: maxDate?.toISOString().split('T')[0] || ''
      }
    };

    return json({
      success: true,
      data: {
        transactions: previewTransactions,
        summary: summary,
        fileName: file.name,
        accountId: accountId
      }
    });

  } catch (error) {
    console.error('Preview API error:', error);
    
    return json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
      code: 'INTERNAL_ERROR'
    }, { status: 500 });
  }
};

// Helper function to generate transaction hash
async function generateTransactionHash(transaction: any): Promise<string> {
  const crypto = await import('crypto');
  const hashData = `${transaction.transactionDate.value.getTime()}-${transaction.description}-${transaction.amount.amount}`;
  return crypto.createHash('sha256').update(hashData).digest('hex').substring(0, 8);
}