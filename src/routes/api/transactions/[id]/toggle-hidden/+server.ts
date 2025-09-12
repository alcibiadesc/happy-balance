import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const PATCH: RequestHandler = async ({ params }) => {
  try {
    const { id } = params;

    if (!id) {
      return json({ success: false, error: 'ID de transacción requerido' }, { status: 400 });
    }

    // Get current transaction to toggle its hidden state
    const currentTransaction = await prisma.transaction.findUnique({
      where: { id }
    });

    if (!currentTransaction) {
      return json({ success: false, error: 'Transacción no encontrada' }, { status: 404 });
    }

    // Toggle the hidden state
    const updatedTransaction = await prisma.transaction.update({
      where: { id },
      data: {
        isHidden: !currentTransaction.isHidden
      },
      include: {
        category: true,
        account: true
      }
    });

    return json({ 
      success: true, 
      data: updatedTransaction 
    });

  } catch (error) {
    console.error('Error toggling transaction hidden state:', error);
    return json(
      { success: false, error: 'Error interno del servidor' }, 
      { status: 500 }
    );
  }
};