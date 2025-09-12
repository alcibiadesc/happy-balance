import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { prisma } from '$lib/infrastructure/database/prisma';

export const PATCH: RequestHandler = async ({ params, request }) => {
  try {
    const { id } = params;
    const { isHidden } = await request.json();

    if (typeof isHidden !== 'boolean') {
      return json({ 
        success: false, 
        error: 'isHidden debe ser un valor booleano' 
      }, { status: 400 });
    }

    // Update transaction visibility
    const updatedTransaction = await prisma.transaction.update({
      where: { id },
      data: { isHidden },
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
    console.error('Error updating transaction visibility:', error);
    return json({ 
      success: false, 
      error: 'Error interno del servidor' 
    }, { status: 500 });
  }
};