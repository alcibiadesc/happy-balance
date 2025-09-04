import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const PATCH: RequestHandler = async ({ params, request }) => {
  try {
    const { id } = params;
    const body = await request.json();

    if (!id) {
      return json(
        { success: false, error: 'Budget ID is required' },
        { status: 400 }
      );
    }

    // Validate fields if provided
    if (body.amount !== undefined && (typeof body.amount !== 'number' || body.amount <= 0)) {
      return json(
        { success: false, error: 'Amount must be a positive number' },
        { status: 400 }
      );
    }

    if (body.period !== undefined) {
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
    }

    // Build update data
    const updateData: any = {
      updatedAt: new Date()
    };

    if (body.name !== undefined) updateData.name = body.name.trim();
    if (body.categoryId !== undefined) updateData.categoryId = body.categoryId || null;
    if (body.amount !== undefined) updateData.amount = body.amount;
    if (body.period !== undefined) updateData.period = body.period;
    if (body.startDate !== undefined) updateData.startDate = new Date(body.startDate);
    if (body.endDate !== undefined) updateData.endDate = body.endDate ? new Date(body.endDate) : null;
    if (body.isActive !== undefined) updateData.isActive = body.isActive;

    const updatedBudget = await prisma.budget.update({
      where: { id },
      data: updateData,
      include: {
        category: true
      }
    });

    return json({
      success: true,
      data: updatedBudget,
      message: 'Budget updated successfully'
    });

  } catch (error) {
    console.error('Error updating budget:', error);
    
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
      return json(
        { success: false, error: 'Budget not found' },
        { status: 404 }
      );
    }
    
    return json(
      {
        success: false,
        error: 'Failed to update budget',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
};

export const DELETE: RequestHandler = async ({ params }) => {
  try {
    const { id } = params;

    if (!id) {
      return json(
        { success: false, error: 'Budget ID is required' },
        { status: 400 }
      );
    }

    await prisma.budget.delete({
      where: { id }
    });

    return json({
      success: true,
      message: 'Budget deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting budget:', error);
    
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
      return json(
        { success: false, error: 'Budget not found' },
        { status: 404 }
      );
    }
    
    return json(
      {
        success: false,
        error: 'Failed to delete budget',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
};