import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { N26CSVParser } from '$lib/infrastructure/parsers/N26CSVParser.js';
import { PrismaTransactionRepository } from '$lib/infrastructure/repositories/PrismaTransactionRepository.js';
import { PrismaAccountRepository } from '$lib/infrastructure/repositories/PrismaAccountRepository.js';
import { Account } from '$lib/domain/entities/Account.js';
import { AccountId } from '$lib/domain/value-objects/AccountId.js';
import { Money } from '$lib/domain/value-objects/Money.js';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const data = await request.formData();
    const file = data.get('file') as File;
    
    if (!file) {
      return json({ 
        success: false, 
        error: 'No file provided' 
      }, { status: 400 });
    }

    // Validate file type
    if (!file.name.toLowerCase().endsWith('.csv')) {
      return json({
        success: false,
        error: 'Only CSV files are supported'
      }, { status: 400 });
    }

    // Validate file size (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return json({
        success: false,
        error: 'File size exceeds 5MB limit'
      }, { status: 400 });
    }

    // Read file content
    const csvContent = await file.text();

    // Validate CSV format
    const validation = N26CSVParser.validateCSVFormat(csvContent);
    if (!validation.isValid) {
      return json({
        success: false,
        error: `Invalid CSV format: ${validation.errors.join(', ')}`
      }, { status: 400 });
    }

    // Get or create default account
    const accountRepository = new PrismaAccountRepository();
    let defaultAccount: Account;
    
    try {
      // Try to get existing main account
      const accounts = await accountRepository.findByType('MAIN');
      if (accounts.length > 0) {
        defaultAccount = accounts[0];
      } else {
        // Create default account
        defaultAccount = new Account(
          AccountId.generate(),
          'Cuenta Principal',
          'MAIN' as any,
          new Money(0, 'EUR'),
          true
        );
        await accountRepository.save(defaultAccount);
      }
    } catch (error) {
      console.error('Error managing default account:', error);
      return json({
        success: false,
        error: 'Database error while setting up account'
      }, { status: 500 });
    }

    // Parse CSV
    const parser = new N26CSVParser(defaultAccount);
    const parseResult = await parser.parse(csvContent);

    // Save valid transactions
    const transactionRepository = new PrismaTransactionRepository();
    let savedCount = 0;
    let duplicateCount = 0;
    const saveErrors: string[] = [];

    for (const transaction of parseResult.transactions) {
      try {
        await transactionRepository.save(transaction);
        savedCount++;
      } catch (error: any) {
        if (error.code === 'P2002' && error.meta?.target?.includes('hash')) {
          // Duplicate transaction (unique constraint violation)
          duplicateCount++;
        } else {
          saveErrors.push(`Transaction ${transaction.id.value}: ${error.message}`);
          console.error('Error saving transaction:', error);
        }
      }
    }

    // Update account balance
    if (savedCount > 0) {
      try {
        const totalAmount = parseResult.transactions
          .slice(0, savedCount)
          .reduce((sum, t) => sum + t.amount.amount, 0);
        
        const newBalance = defaultAccount.balance.add(new Money(totalAmount, 'EUR'));
        defaultAccount.updateBalance(newBalance);
        
        await accountRepository.save(defaultAccount);
      } catch (error) {
        console.error('Error updating account balance:', error);
        // Don't fail the import for this
      }
    }

    return json({
      success: true,
      data: {
        fileName: file.name,
        fileSize: file.size,
        summary: {
          totalRows: parseResult.summary.totalRows,
          validRows: parseResult.summary.validRows,
          errorRows: parseResult.summary.errorRows,
          duplicateRows: duplicateCount, // Only DB duplicates (Prisma constraint violations)
          savedRows: savedCount,
          skippedRows: duplicateCount + saveErrors.length + parseResult.summary.duplicateRows // Include CSV internal duplicates
        },
        errors: [
          ...parseResult.errors.map(e => `Row ${e.row}: ${e.message}`),
          ...saveErrors,
          ...(parseResult.summary.duplicateRows > 0 ? [`${parseResult.summary.duplicateRows} duplicate transactions found within the CSV file`] : [])
        ]
      }
    });

  } catch (error) {
    console.error('Import error:', error);
    return json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 });
  }
};