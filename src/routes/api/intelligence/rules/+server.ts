import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { PrismaClient } from '@prisma/client';
import { CategoryId } from '$lib/domain/value-objects/CategoryId.js';

const prisma = new PrismaClient();

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { categoryId, ruleType, pattern } = await request.json();
    
    if (!categoryId || !ruleType || !pattern) {
      return json(
        { success: false, error: 'Missing required parameters' },
        { status: 400 }
      );
    }
    
    // Create a categorization rule
    const rule = await prisma.categorizationRule.create({
      data: {
        categoryId: categoryId,
        ruleType,
        pattern: JSON.stringify(pattern),
        isActive: true,
        priority: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
    
    return json({
      success: true,
      rule,
      message: `Successfully created categorization rule for ${ruleType} matching`
    });

  } catch (error) {
    console.error('Error creating categorization rule:', error);
    return json(
      {
        success: false,
        error: 'Failed to create categorization rule',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
};