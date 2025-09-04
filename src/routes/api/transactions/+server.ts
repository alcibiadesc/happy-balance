import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { RepositoryFactory } from '$lib/infrastructure/factories/RepositoryFactory.js';
import { TransactionId } from '$lib/domain/value-objects/TransactionId.js';
import { v4 as uuidv4 } from 'uuid';
import { createHash } from 'crypto';

const transactionRepository = RepositoryFactory.createTransactionRepository();

// GET /api/transactions - List transactions with optional filters
export const GET: RequestHandler = async ({ url }) => {
  try {
    const searchParams = url.searchParams;
    
    // Parse query parameters for filtering
    const filters: any = {};
    
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    if (startDate) filters.startDate = new Date(startDate);
    if (endDate) filters.endDate = new Date(endDate);
    
    const categoryIds = searchParams.get('categoryIds');
    if (categoryIds) filters.categoryIds = categoryIds.split(',');
    
    const accountIds = searchParams.get('accountIds');
    if (accountIds) filters.accountIds = accountIds.split(',');
    
    const minAmount = searchParams.get('minAmount');
    if (minAmount) filters.minAmount = parseFloat(minAmount);
    
    const maxAmount = searchParams.get('maxAmount');
    if (maxAmount) filters.maxAmount = parseFloat(maxAmount);
    
    const partnerName = searchParams.get('partnerName');
    if (partnerName) filters.partnerName = partnerName;
    
    const type = searchParams.get('type');
    if (type) filters.type = type;
    
    const isRecurring = searchParams.get('isRecurring');
    if (isRecurring !== null) filters.isRecurring = isRecurring === 'true';

    const categoryType = searchParams.get('categoryType');
    if (categoryType) filters.categoryType = categoryType;

    const transactions = await transactionRepository.findAll(filters);
    
    return json({
      success: true,
      data: transactions,
      count: transactions.length
    });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return json(
      { 
        success: false, 
        error: 'Failed to fetch transactions',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
};

// POST /api/transactions - Create new transaction
export const POST: RequestHandler = async ({ request }) => {
  try {
    const body = await request.json();
    
    // Validate required fields
    const requiredFields = ['partnerName', 'amount', 'accountId'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return json(
          { 
            success: false, 
            error: `Missing required field: ${field}` 
          },
          { status: 400 }
        );
      }
    }

    // Create transaction hash for duplicate detection
    const hashData = `${body.partnerName}_${body.amount}_${body.bookingDate || new Date().toISOString()}`;
    const hash = createHash('sha256').update(hashData).digest('hex');

    // Check for duplicates
    const existingTransaction = await transactionRepository.findByHash(hash);
    if (existingTransaction) {
      return json(
        { 
          success: false, 
          error: 'Duplicate transaction detected' 
        },
        { status: 409 }
      );
    }

    // Create transaction object
    const now = new Date();
    const bookingDate = body.bookingDate ? new Date(body.bookingDate) : now;
    
    const transaction = {
      id: { value: uuidv4() },
      bookingDate,
      valueDate: body.valueDate ? new Date(body.valueDate) : bookingDate,
      partnerName: body.partnerName,
      partnerIban: body.partnerIban || null,
      type: body.type || (body.amount < 0 ? 'EXPENSE' : 'INCOME'),
      paymentReference: body.paymentReference || body.description || null,
      amount: parseFloat(body.amount),
      originalAmount: body.originalAmount ? parseFloat(body.originalAmount) : null,
      originalCurrency: body.originalCurrency || null,
      exchangeRate: body.exchangeRate ? parseFloat(body.exchangeRate) : null,
      categoryId: body.categoryId || null,
      accountId: body.accountId,
      isRecurring: body.isRecurring || false,
      confidence: body.confidence || null,
      hash,
      importJobId: body.importJobId || null,
      notes: body.notes || body.description || null,
      createdAt: now,
      updatedAt: now
    };

    await transactionRepository.save(transaction);
    
    return json({
      success: true,
      data: transaction,
      message: 'Transaction created successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating transaction:', error);
    return json(
      { 
        success: false, 
        error: 'Failed to create transaction',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
};