import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { PrismaTransactionRepository } from '$lib/infrastructure/repositories/PrismaTransactionRepository.js';
import { prisma } from '$lib/infrastructure/database/prisma.js';

export const DELETE: RequestHandler = async () => {
  try {
    // Clear all transactions
    await prisma.transaction.deleteMany({});
    
    return json({
      success: true,
      message: 'All transactions cleared'
    });
  } catch (error) {
    console.error('Clear error:', error);
    return json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 });
  }
};