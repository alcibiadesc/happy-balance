import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const GET: RequestHandler = async () => {
  try {
    // Fetch all data from all tables
    const [
      accounts,
      categories,
      transactions,
      budgets,
      tags,
      transactionTags,
      categorizationRules,
      importJobs,
      settings
    ] = await Promise.all([
      prisma.account.findMany(),
      prisma.category.findMany(),
      prisma.transaction.findMany({
        include: {
          category: true,
          account: true,
          tags: {
            include: {
              tag: true
            }
          }
        }
      }),
      prisma.budget.findMany({
        include: {
          category: true
        }
      }),
      prisma.tag.findMany(),
      prisma.transactionTag.findMany(),
      prisma.categorizationRule.findMany({
        include: {
          category: true
        }
      }),
      prisma.importJob.findMany(),
      prisma.setting.findMany()
    ]);

    // Create export data structure
    const exportData = {
      metadata: {
        exportDate: new Date().toISOString(),
        version: '1.0',
        application: 'Expense Tracker',
        totalRecords: {
          accounts: accounts.length,
          categories: categories.length,
          transactions: transactions.length,
          budgets: budgets.length,
          tags: tags.length,
          transactionTags: transactionTags.length,
          categorizationRules: categorizationRules.length,
          importJobs: importJobs.length,
          settings: settings.length
        }
      },
      data: {
        accounts,
        categories,
        transactions,
        budgets,
        tags,
        transactionTags,
        categorizationRules,
        importJobs,
        settings
      }
    };

    // Convert to JSON and create response
    const jsonString = JSON.stringify(exportData, null, 2);
    const buffer = Buffer.from(jsonString, 'utf-8');

    return new Response(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="expense-tracker-backup-${new Date().toISOString().split('T')[0]}.json"`,
        'Content-Length': buffer.length.toString()
      }
    });

  } catch (error) {
    console.error('Error exporting data:', error);
    
    return json(
      {
        success: false,
        error: 'Error interno del servidor al exportar los datos',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
};