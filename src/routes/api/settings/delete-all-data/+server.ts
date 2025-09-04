import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const DELETE: RequestHandler = async ({ request }) => {
  try {
    const body = await request.json();
    const { confirmation } = body;

    // Security check: Must provide exact confirmation
    if (!confirmation || confirmation !== 'delete') {
      return json(
        {
          success: false,
          error: 'Confirmación de seguridad requerida'
        },
        { status: 400 }
      );
    }

    // Begin transaction to ensure all-or-nothing deletion
    await prisma.$transaction(async (tx) => {
      // Delete in reverse dependency order to avoid foreign key constraints
      
      // 1. Delete transaction tags (junction table)
      await tx.transactionTag.deleteMany();
      
      // 2. Delete transactions
      await tx.transaction.deleteMany();
      
      // 3. Delete import jobs
      await tx.importJob.deleteMany();
      
      // 4. Delete categorization rules
      await tx.categorizationRule.deleteMany();
      
      // 5. Delete budgets
      await tx.budget.deleteMany();
      
      // 6. Delete categories (includes parent-child relationships)
      await tx.category.deleteMany();
      
      // 7. Delete tags
      await tx.tag.deleteMany();
      
      // 8. Delete accounts
      await tx.account.deleteMany();
      
      // 9. Delete settings
      await tx.setting.deleteMany();
    });

    return json({
      success: true,
      message: 'Todos los datos han sido eliminados exitosamente',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error deleting all data:', error);
    
    return json(
      {
        success: false,
        error: 'Error interno del servidor al eliminar los datos',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
};