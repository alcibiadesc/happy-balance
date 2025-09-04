import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

// GET /api/budgets - List all budgets
export const GET: RequestHandler = async ({ url }) => {
  try {
    const searchParams = url.searchParams;
    const categoryId = searchParams.get('categoryId');
    const isActive = searchParams.get('isActive') !== 'false';
    
    let whereClause: any = { isActive };
    
    if (categoryId) {
      whereClause.categoryId = categoryId;
    }
    
    const budgets = await prisma.budget.findMany({
      where: whereClause,
      include: {
        category: true
      },
      orderBy: { createdAt: 'desc' }
    });
    
    return json({
      success: true,
      data: budgets,
      count: budgets.length
    });
  } catch (error) {
    console.error('Error fetching budgets:', error);
    return json(
      { 
        success: false, 
        error: 'Failed to fetch budgets',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
};

// POST /api/budgets - Create new budget
export const POST: RequestHandler = async ({ request }) => {
  try {
    const body = await request.json();
    
    // Validate required fields
    const requiredFields = ['name', 'amount', 'period', 'startDate'];
    for (const field of requiredFields) {
      if (body[field] === undefined || body[field] === null || body[field] === '') {
        return json(
          { 
            success: false, 
            error: `Missing required field: ${field}` 
          },
          { status: 400 }
        );
      }
    }

    // Validate amount
    if (typeof body.amount !== 'number' || body.amount <= 0) {
      return json(
        { 
          success: false, 
          error: 'Amount must be a positive number' 
        },
        { status: 400 }
      );
    }

    // Validate period
    const validPeriods = ['DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY'];
    if (!validPeriods.includes(body.period)) {
      return json(
        { 
          success: false, 
          error: `Invalid period. Must be one of: ${validPeriods.join(', ')}` 
        },
        { status: 400 }
      );
    }

    // Create budget
    const budget = await prisma.budget.create({
      data: {
        id: uuidv4(),
        name: body.name.trim(),
        categoryId: body.categoryId || null,
        amount: body.amount,
        period: body.period,
        startDate: new Date(body.startDate),
        endDate: body.endDate ? new Date(body.endDate) : null,
        isActive: body.isActive !== undefined ? body.isActive : true
      },
      include: {
        category: true
      }
    });
    
    return json({
      success: true,
      data: budget,
      message: 'Budget created successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating budget:', error);
    return json(
      { 
        success: false, 
        error: 'Failed to create budget',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
};