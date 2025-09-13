import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/intelligence/hiding-rules - Get all hiding rules
export const GET: RequestHandler = async ({ url }) => {
  try {
    const isActive = url.searchParams.get('isActive');
    
    const where: any = {};
    if (isActive !== null) where.isActive = isActive === 'true';
    
    const rules = await prisma.hidingRule.findMany({
      where,
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' }
      ]
    });
    
    return json({
      success: true,
      rules: rules.map(rule => ({
        ...rule,
        pattern: JSON.parse(rule.pattern)
      }))
    });

  } catch (error) {
    console.error('Error fetching hiding rules:', error);
    return json(
      {
        success: false,
        error: 'Failed to fetch hiding rules',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
};

// POST /api/intelligence/hiding-rules - Create a new hiding rule
export const POST: RequestHandler = async ({ request }) => {
  try {
    const { name, ruleType, pattern, priority = 1, isActive = true } = await request.json();
    
    if (!name || !ruleType || !pattern) {
      return json(
        { success: false, error: 'Missing required parameters: name, ruleType, pattern' },
        { status: 400 }
      );
    }
    
    // Validate rule type
    const validRuleTypes = ['counterparty', 'paymentReference', 'amount', 'description', 'keyword'];
    if (!validRuleTypes.includes(ruleType)) {
      return json(
        { success: false, error: `Invalid rule type. Must be one of: ${validRuleTypes.join(', ')}` },
        { status: 400 }
      );
    }
    
    // Create a hiding rule
    const rule = await prisma.hidingRule.create({
      data: {
        name,
        ruleType,
        pattern: JSON.stringify(pattern),
        priority,
        isActive,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
    
    return json({
      success: true,
      rule: {
        ...rule,
        pattern: JSON.parse(rule.pattern)
      },
      message: `Successfully created hiding rule "${name}"`
    });

  } catch (error) {
    console.error('Error creating hiding rule:', error);
    return json(
      {
        success: false,
        error: 'Failed to create hiding rule',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
};

// PUT /api/intelligence/hiding-rules - Update a hiding rule
export const PUT: RequestHandler = async ({ request }) => {
  try {
    const { id, name, ruleType, pattern, priority, isActive } = await request.json();
    
    if (!id) {
      return json(
        { success: false, error: 'Rule ID is required' },
        { status: 400 }
      );
    }
    
    const updateData: any = { updatedAt: new Date() };
    if (name !== undefined) updateData.name = name;
    if (ruleType !== undefined) updateData.ruleType = ruleType;
    if (pattern !== undefined) updateData.pattern = JSON.stringify(pattern);
    if (priority !== undefined) updateData.priority = priority;
    if (isActive !== undefined) updateData.isActive = isActive;
    
    const rule = await prisma.hidingRule.update({
      where: { id },
      data: updateData
    });
    
    return json({
      success: true,
      rule: {
        ...rule,
        pattern: JSON.parse(rule.pattern)
      },
      message: `Successfully updated hiding rule "${rule.name}"`
    });

  } catch (error) {
    console.error('Error updating hiding rule:', error);
    return json(
      {
        success: false,
        error: 'Failed to update hiding rule',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
};

// DELETE /api/intelligence/hiding-rules - Delete a hiding rule
export const DELETE: RequestHandler = async ({ request }) => {
  try {
    const { id } = await request.json();
    
    if (!id) {
      return json(
        { success: false, error: 'Rule ID is required' },
        { status: 400 }
      );
    }
    
    const rule = await prisma.hidingRule.delete({
      where: { id }
    });
    
    return json({
      success: true,
      message: `Successfully deleted hiding rule "${rule.name}"`
    });

  } catch (error) {
    console.error('Error deleting hiding rule:', error);
    return json(
      {
        success: false,
        error: 'Failed to delete hiding rule',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
};