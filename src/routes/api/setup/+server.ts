import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { seedDefaultData } from '$lib/infrastructure/seeder.js';
import { prisma } from '$lib/infrastructure/database/prisma.js';

// GET /api/setup - Initialize app with default data
export const GET: RequestHandler = async () => {
  try {
    // Seed default data if needed
    const result = await seedDefaultData();
    
    // Get default account
    const defaultAccount = await prisma.account.findFirst({
      where: { name: 'Cuenta Principal' }
    });

    // Get all categories
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' }
    });

    return json({
      success: true,
      data: {
        defaultAccount,
        categories,
        message: 'App initialized successfully'
      }
    });

  } catch (error) {
    console.error('Error initializing app:', error);
    return json(
      { 
        success: false, 
        error: 'Failed to initialize app',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
};