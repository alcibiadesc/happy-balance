import { json, type RequestHandler } from '@sveltejs/kit';
import { prisma } from '$lib/server/db';
import { generatePatternHash } from '$lib/stores/transactions';
import { v4 as uuidv4 } from 'uuid';

// GET all transactions
export const GET: RequestHandler = async ({ url }) => {
  const limit = parseInt(url.searchParams.get('limit') ?? '100');
  const offset = parseInt(url.searchParams.get('offset') ?? '0');
  const period = url.searchParams.get('period');
  const categoryId = url.searchParams.get('categoryId');
  
  try {
    const where: any = {};
    
    if (period) {
      const [year, month] = period.split('-');
      const startDate = new Date(`${year}-${month}-01`);
      const endDate = new Date(year, parseInt(month) - 1 + 1, 1); // Next month
      
      where.date = {
        gte: startDate,
        lt: endDate
      };
    }
    
    if (categoryId) {
      where.categoryId = categoryId;
    }
    
    const transactions = await prisma.transaction.findMany({
      where,
      include: {
        category: true
      },
      orderBy: [
        { date: 'desc' },
        { createdAt: 'desc' }
      ],
      take: limit,
      skip: offset
    });
    
    return json(transactions);
  } catch (error) {
    console.error('Failed to fetch transactions:', error);
    return json({ error: 'Failed to fetch transactions' }, { status: 500 });
  }
};

// POST new transaction
export const POST: RequestHandler = async ({ request }) => {
  const body = await request.json();
  const { amount, description, merchant, date, categoryId, importHash } = body;
  
  try {
    // Validate required fields
    if (!amount || !description || !merchant || !date) {
      return json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Generate pattern hash for auto-categorization
    const transactionData = { amount, description, merchant, date };
    const patternHash = generatePatternHash(transactionData);
    
    // Check for existing category rule
    const rule = await prisma.categoryRule.findFirst({
      where: {
        OR: [
          { merchantPattern: { contains: merchant.toLowerCase() } },
          { descriptionPattern: { contains: description.toLowerCase() } }
        ],
        isActive: true
      },
      orderBy: { priority: 'desc' }
    });
    
    // Auto-categorize if rule exists
    let finalCategoryId = categoryId;
    let confidence = categoryId ? 1.0 : 0.0;
    
    if (rule && !categoryId) {
      finalCategoryId = rule.categoryId;
      confidence = 0.8; // AI confidence
    }
    
    const transaction = await prisma.transaction.create({
      data: {
        id: uuidv4(),
        amount: parseFloat(amount),
        description,
        merchant,
        date: new Date(date),
        categoryId: finalCategoryId,
        patternHash,
        importHash,
        confidence,
        verified: categoryId ? true : false
      },
      include: {
        category: true
      }
    });
    
    return json(transaction, { status: 201 });
  } catch (error) {
    console.error('Failed to create transaction:', error);
    return json({ error: 'Failed to create transaction' }, { status: 500 });
  }
};

// PATCH bulk update transactions
export const PATCH: RequestHandler = async ({ request }) => {
  try {
    const { ids, updates } = await request.json();

    if (!ids || !Array.isArray(ids) || !updates) {
      return json({ error: 'Invalid request body' }, { status: 400 });
    }

    await prisma.transaction.updateMany({
      where: {
        id: {
          in: ids
        }
      },
      data: {
        ...updates,
        updatedAt: new Date()
      }
    });

    // Return updated transactions
    const updatedTransactions = await prisma.transaction.findMany({
      where: {
        id: {
          in: ids
        }
      },
      include: {
        category: true
      }
    });

    return json(updatedTransactions);
  } catch (error) {
    console.error('Error bulk updating transactions:', error);
    return json({ error: 'Failed to update transactions' }, { status: 500 });
  }
};
