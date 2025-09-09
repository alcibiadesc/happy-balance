import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';

// GET endpoint for testing
export const GET: RequestHandler = async () => {
	return json({ 
		message: 'Import API is working', 
		timestamp: new Date().toISOString(),
		status: 'ready'
	});
};
import { ImportTransactionsUseCase } from '$lib/application/use-cases/ImportTransactionsUseCase.js';
import { ImportTransactionsCommand } from '$lib/application/commands/ImportTransactionsCommand.js';
import { PrismaTransactionRepository } from '$lib/infrastructure/repositories/PrismaTransactionRepository.js';
import { PrismaAccountRepository } from '$lib/infrastructure/repositories/PrismaAccountRepository.js';
import { AccountId } from '$lib/domain/value-objects/AccountId.js';
import { CSVParserFactory } from '$lib/infrastructure/parsers/CSVParserFactory.js';
import { ConsoleLogger } from '$lib/shared/utils/logger.js';

export const POST: RequestHandler = async ({ request }) => {
  try {
    // Parse multipart form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const accountId = formData.get('accountId') as string;
    const overwriteExisting = formData.get('overwriteExisting') === 'true';

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

    // Validate file type
    if (!file.name.toLowerCase().endsWith('.csv')) {
      return json({
        success: false,
        error: 'Only CSV files are supported',
        code: 'INVALID_FILE_TYPE'
      }, { status: 400 });
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return json({
        success: false,
        error: 'File size exceeds 5MB limit',
        code: 'FILE_TOO_LARGE'
      }, { status: 400 });
    }

    // Read file content
    const csvContent = await file.text();

    // Create command
    const command: ImportTransactionsCommand = {
      csvContent,
      accountId,
      fileName: file.name,
      overwriteExisting: overwriteExisting || false
    };

    // Initialize dependencies
    const transactionRepository = new PrismaTransactionRepository();
    const accountRepository = new PrismaAccountRepository();
    const csvParserFactory = new CSVParserFactory();
    const logger = new ConsoleLogger();

    // Execute use case
    const useCase = new ImportTransactionsUseCase({
      transactionRepository,
      accountRepository,
      csvParserFactory,
      logger
    });

    const result = await useCase.execute(command);


    if (result.isFailure()) {
      return json({
        success: false,
        error: result.error.message,
        code: 'IMPORT_FAILED'
      }, { status: 400 });
    }

    const importResult = result.data;

    return json({
      success: true,
      data: {
        imported: importResult.imported,
        skipped: importResult.skipped,
        errors: importResult.errors,
        warnings: importResult.warnings,
        message: `Successfully imported ${importResult.imported} transactions${importResult.skipped > 0 ? ` (${importResult.skipped} skipped)` : ''}`
      }
    });

  } catch (error) {
    console.error('Import API error:', error);
    
    return json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
      code: 'INTERNAL_ERROR'
    }, { status: 500 });
  }
};