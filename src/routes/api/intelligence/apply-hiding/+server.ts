import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// POST /api/intelligence/apply-hiding - Apply hiding rules to transactions
export const POST: RequestHandler = async ({ request }) => {
  try {
    const body = await request.json();
    const { transactionIds, applyToAll = false } = body;

    // Get all active hiding rules
    const rules = await prisma.hidingRule.findMany({
      where: { isActive: true },
      orderBy: { priority: 'desc' }
    });

    if (rules.length === 0) {
      return json({
        success: true,
        applied: 0,
        message: 'No active hiding rules found'
      });
    }

    let transactions;
    
    if (applyToAll) {
      // Apply to all visible transactions
      transactions = await prisma.transaction.findMany({
        where: { 
          isHidden: false
        }
      });
    } else if (transactionIds && transactionIds.length > 0) {
      // Apply to specific transactions
      transactions = await prisma.transaction.findMany({
        where: { 
          id: { in: transactionIds },
          isHidden: false
        }
      });
    } else {
      return json(
        { success: false, error: 'No transactions specified' },
        { status: 400 }
      );
    }

    let appliedCount = 0;
    const results = [];

    // Apply rules to each transaction
    for (const transaction of transactions) {
      let bestMatch = null;
      let bestConfidence = 0;

      // Check each rule against the transaction
      for (const rule of rules) {
        try {
          const pattern = JSON.parse(rule.pattern);
          let matches = false;
          let confidence = 0.7; // Base confidence

          // Apply rule based on type
          switch (rule.ruleType) {
            case 'counterparty':
              if (pattern.value && transaction.counterparty) {
                matches = transaction.counterparty.toLowerCase().includes(pattern.value.toLowerCase());
                confidence = 0.8;
              }
              break;

            case 'paymentReference':
              if (pattern.value && transaction.paymentReference) {
                matches = transaction.paymentReference.toLowerCase().includes(pattern.value.toLowerCase());
                confidence = 0.75;
              }
              break;

            case 'amount':
              if (pattern.minAmount !== undefined || pattern.maxAmount !== undefined) {
                const amount = Math.abs(transaction.amount);
                matches = true;
                if (pattern.minAmount !== undefined && amount < pattern.minAmount) matches = false;
                if (pattern.maxAmount !== undefined && amount > pattern.maxAmount) matches = false;
                confidence = 0.6;
              }
              break;

            case 'description':
              if (pattern.value && transaction.counterparty) {
                // Check both counterparty and paymentReference for description patterns
                const searchText = `${transaction.counterparty} ${transaction.paymentReference || ''}`.toLowerCase();
                matches = searchText.includes(pattern.value.toLowerCase());
                confidence = 0.7;
              }
              break;

            case 'keyword':
              if (pattern.keywords && Array.isArray(pattern.keywords)) {
                const searchText = `${transaction.counterparty} ${transaction.paymentReference || ''}`.toLowerCase();
                matches = pattern.keywords.some(keyword => 
                  searchText.includes(keyword.toLowerCase())
                );
                confidence = 0.65;
              }
              break;
          }

          // Apply priority and rule confidence
          if (matches) {
            const finalConfidence = confidence * (rule.priority / 10);
            if (finalConfidence > bestConfidence) {
              bestMatch = rule;
              bestConfidence = finalConfidence;
            }
          }
        } catch (error) {
          console.warn(`Error processing hiding rule ${rule.id}:`, error);
        }
      }

      // Apply the best matching rule
      if (bestMatch && bestConfidence > 0.5) {
        try {
          await prisma.transaction.update({
            where: { id: transaction.id },
            data: { 
              isHidden: true
            }
          });

          appliedCount++;
          results.push({
            transactionId: transaction.id,
            ruleId: bestMatch.id,
            ruleName: bestMatch.name,
            confidence: Math.round(bestConfidence * 100)
          });
        } catch (error) {
          console.error(`Error hiding transaction ${transaction.id}:`, error);
        }
      }
    }

    return json({
      success: true,
      applied: appliedCount,
      total: transactions.length,
      results,
      message: `Applied hiding rules to ${appliedCount} of ${transactions.length} transactions`
    });

  } catch (error) {
    console.error('Error applying hiding rules:', error);
    return json(
      {
        success: false,
        error: 'Failed to apply hiding rules',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
};

// GET /api/intelligence/apply-hiding - Get statistics about hiding rule application
export const GET: RequestHandler = async () => {
  try {
    const [
      totalTransactions,
      visibleTransactions,
      hiddenTransactions,
      activeRules
    ] = await Promise.all([
      prisma.transaction.count(),
      prisma.transaction.count({ where: { isHidden: false } }),
      prisma.transaction.count({ where: { isHidden: true } }),
      prisma.hidingRule.count({ where: { isActive: true } })
    ]);

    return json({
      success: true,
      statistics: {
        totalTransactions,
        visibleTransactions,
        hiddenTransactions,
        activeRules,
        hidingRate: totalTransactions > 0 
          ? Math.round((hiddenTransactions / totalTransactions) * 100) 
          : 0
      }
    });

  } catch (error) {
    console.error('Error fetching hiding statistics:', error);
    return json(
      {
        success: false,
        error: 'Failed to fetch hiding statistics',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
};