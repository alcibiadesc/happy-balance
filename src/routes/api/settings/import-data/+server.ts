import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const POST: RequestHandler = async ({ request }) => {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return json(
        {
          success: false,
          error: 'No se proporcionó ningún archivo'
        },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.name.endsWith('.json')) {
      return json(
        {
          success: false,
          error: 'El archivo debe ser un archivo JSON válido'
        },
        { status: 400 }
      );
    }

    // Validate file size (max 50MB)
    if (file.size > 50 * 1024 * 1024) {
      return json(
        {
          success: false,
          error: 'El archivo es demasiado grande (máximo 50MB)'
        },
        { status: 400 }
      );
    }

    // Parse JSON content
    const content = await file.text();
    let importData;
    
    try {
      importData = JSON.parse(content);
    } catch (error) {
      return json(
        {
          success: false,
          error: 'El archivo JSON no es válido'
        },
        { status: 400 }
      );
    }

    // Validate data structure
    if (!importData.metadata || !importData.data) {
      return json(
        {
          success: false,
          error: 'La estructura del archivo de respaldo no es válida'
        },
        { status: 400 }
      );
    }

    // Verify it's a Happy Balance backup
    if (importData.metadata.application !== 'Happy Balance' && importData.metadata.application !== 'Expense Tracker') {
      return json(
        {
          success: false,
          error: 'Este archivo no es un respaldo válido de Happy Balance'
        },
        { status: 400 }
      );
    }

    const data = importData.data;
    const results = {
      imported: 0,
      skipped: 0,
      errors: [] as string[]
    };

    // Start transaction for data consistency
    await prisma.$transaction(async (tx) => {
      // Import accounts
      if (data.accounts && Array.isArray(data.accounts)) {
        for (const account of data.accounts) {
          try {
            await tx.account.upsert({
              where: { id: account.id },
              update: {
                name: account.name,
                type: account.type,
                balance: account.balance,
                currency: account.currency,
                isActive: account.isActive
              },
              create: {
                id: account.id,
                name: account.name,
                type: account.type,
                balance: account.balance,
                currency: account.currency || 'EUR',
                isActive: account.isActive ?? true
              }
            });
            results.imported++;
          } catch (error) {
            results.errors.push(`Error importing account ${account.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        }
      }

      // Import categories
      if (data.categories && Array.isArray(data.categories)) {
        for (const category of data.categories) {
          try {
            await tx.category.upsert({
              where: { id: category.id },
              update: {
                name: category.name,
                description: category.description,
                type: category.type,
                color: category.color,
                icon: category.icon,
                parentId: category.parentId
              },
              create: {
                id: category.id,
                name: category.name,
                description: category.description,
                type: category.type,
                color: category.color || '#6B7280',
                icon: category.icon || 'Tag',
                parentId: category.parentId
              }
            });
            results.imported++;
          } catch (error) {
            results.errors.push(`Error importing category ${category.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        }
      }

      // Import budgets
      if (data.budgets && Array.isArray(data.budgets)) {
        for (const budget of data.budgets) {
          try {
            await tx.budget.upsert({
              where: { id: budget.id },
              update: {
                name: budget.name,
                amount: budget.amount,
                period: budget.period,
                categoryId: budget.categoryId,
                startDate: budget.startDate ? new Date(budget.startDate) : undefined,
                endDate: budget.endDate ? new Date(budget.endDate) : undefined,
                isActive: budget.isActive
              },
              create: {
                id: budget.id,
                name: budget.name,
                amount: budget.amount,
                period: budget.period,
                categoryId: budget.categoryId,
                startDate: budget.startDate ? new Date(budget.startDate) : undefined,
                endDate: budget.endDate ? new Date(budget.endDate) : undefined,
                isActive: budget.isActive ?? true
              }
            });
            results.imported++;
          } catch (error) {
            results.errors.push(`Error importing budget ${budget.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        }
      }

      // Import categorization rules
      if (data.categorizationRules && Array.isArray(data.categorizationRules)) {
        for (const rule of data.categorizationRules) {
          try {
            await tx.categorizationRule.upsert({
              where: { id: rule.id },
              update: {
                name: rule.name,
                pattern: rule.pattern,
                ruleType: rule.ruleType,
                priority: rule.priority,
                categoryId: rule.categoryId,
                isActive: rule.isActive
              },
              create: {
                id: rule.id,
                name: rule.name,
                pattern: rule.pattern,
                ruleType: rule.ruleType,
                priority: rule.priority || 0,
                categoryId: rule.categoryId,
                isActive: rule.isActive ?? true
              }
            });
            results.imported++;
          } catch (error) {
            results.errors.push(`Error importing categorization rule ${rule.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        }
      }

      // Import savings accounts
      if (data.savingsAccounts && Array.isArray(data.savingsAccounts)) {
        for (const savingsAccount of data.savingsAccounts) {
          try {
            await tx.savingsAccount.upsert({
              where: { id: savingsAccount.id },
              update: {
                name: savingsAccount.name,
                balance: savingsAccount.balance,
                targetAmount: savingsAccount.targetAmount,
                interestRate: savingsAccount.interestRate,
                isActive: savingsAccount.isActive
              },
              create: {
                id: savingsAccount.id,
                name: savingsAccount.name,
                balance: savingsAccount.balance || 0,
                targetAmount: savingsAccount.targetAmount,
                interestRate: savingsAccount.interestRate || 0,
                isActive: savingsAccount.isActive ?? true
              }
            });
            results.imported++;
          } catch (error) {
            results.errors.push(`Error importing savings account ${savingsAccount.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        }
      }

      // Import transactions (last to ensure relationships exist)
      if (data.transactions && Array.isArray(data.transactions)) {
        for (const transaction of data.transactions) {
          try {
            await tx.transaction.upsert({
              where: { id: transaction.id },
              update: {
                transactionDate: new Date(transaction.transactionDate),
                valueDate: transaction.valueDate ? new Date(transaction.valueDate) : new Date(transaction.transactionDate),
                counterparty: transaction.counterparty || transaction.partnerName,
                partnerIban: transaction.partnerIban,
                type: transaction.type,
                paymentReference: transaction.paymentReference,
                amount: transaction.amount,
                originalAmount: transaction.originalAmount,
                originalCurrency: transaction.originalCurrency,
                exchangeRate: transaction.exchangeRate,
                categoryId: transaction.categoryId,
                accountId: transaction.accountId,
                isRecurring: transaction.isRecurring || false,
                isHidden: transaction.isHidden || false,
                confidence: transaction.confidence,
                hash: transaction.hash,
                importJobId: transaction.importJobId,
                notes: transaction.notes
              },
              create: {
                id: transaction.id,
                transactionDate: new Date(transaction.transactionDate),
                valueDate: transaction.valueDate ? new Date(transaction.valueDate) : new Date(transaction.transactionDate),
                counterparty: transaction.counterparty || transaction.partnerName || 'Unknown',
                partnerIban: transaction.partnerIban,
                type: transaction.type || (transaction.amount > 0 ? 'Credit Transfer' : 'Debit Transfer'),
                paymentReference: transaction.paymentReference,
                amount: transaction.amount,
                originalAmount: transaction.originalAmount,
                originalCurrency: transaction.originalCurrency,
                exchangeRate: transaction.exchangeRate,
                categoryId: transaction.categoryId,
                accountId: transaction.accountId,
                isRecurring: transaction.isRecurring || false,
                isHidden: transaction.isHidden || false,
                confidence: transaction.confidence,
                hash: transaction.hash || `imported_${Date.now()}_${Math.random()}`,
                importJobId: transaction.importJobId,
                notes: transaction.notes
              }
            });
            results.imported++;
          } catch (error) {
            results.errors.push(`Error importing transaction ${transaction.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        }
      }
    });

    return json({
      success: true,
      data: results,
      message: `Importación completada: ${results.imported} registros importados${results.errors.length > 0 ? `, ${results.errors.length} errores` : ''}`
    });

  } catch (error) {
    console.error('Error importing data:', error);
    
    return json(
      {
        success: false,
        error: 'Error interno del servidor al importar los datos',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
};