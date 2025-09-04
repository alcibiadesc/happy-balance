import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { ruleType, pattern } = await request.json();
    
    if (!ruleType || !pattern) {
      return json(
        { success: false, error: 'Missing required parameters' },
        { status: 400 }
      );
    }
    
    // Create an omit rule (special rule without categoryId)
    const rule = await prisma.categorizationRule.create({
      data: {
        categoryId: null, // Special case for omit rules
        ruleType: `omit_${ruleType}`,
        pattern: JSON.stringify(pattern),
        isActive: true,
        priority: 10, // Higher priority for omit rules
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
    
    return json({
      success: true,
      rule,
      message: `Successfully created omit rule for ${ruleType} matching`
    });

  } catch (error) {
    console.error('Error creating omit rule:', error);
    return json(
      {
        success: false,
        error: 'Failed to create omit rule',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
};