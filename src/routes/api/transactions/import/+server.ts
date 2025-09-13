import { json, type RequestHandler } from '@sveltejs/kit';
import { prisma } from '$lib/server/db';
import { generatePatternHash } from '$lib/stores/transactions';
import { v4 as uuidv4 } from 'uuid';

interface ImportTransaction {
  amount: number;
  description: string;
  merchant: string;
  date: string;
}

// POST import transactions from CSV/JSON
export const POST: RequestHandler = async ({ request }) => {
  try {
    const body = await request.json();
    const { transactions: importData } = body;

    if (!importData || !Array.isArray(importData)) {
      return json({ error: 'Invalid import data' }, { status: 400 });
    }

    const results = {
      imported: 0,
      skipped: 0,
      errors: 0,
      transactions: [] as any[]
    };

    // Get all category rules for auto-categorization
    const rules = await prisma.categoryRule.findMany({
      where: { isActive: true },
      orderBy: { priority: 'desc' }
    });

    for (const item of importData) {
      try {
        const { amount, description, merchant, date } = item as ImportTransaction;

        // Validate required fields
        if (!amount || !description || !merchant || !date) {
          results.errors++;
          continue;
        }

        // Generate import hash to prevent duplicates
        const importHash = generateImportHash(item);

        // Check if already imported
        const existing = await prisma.transaction.findFirst({
          where: { importHash }
        });

        if (existing) {
          results.skipped++;
          continue;
        }

        // Generate pattern hash for categorization
        const patternHash = generatePatternHash(item);

        // Auto-categorize based on rules
        let categoryId = null;
        let confidence = 0.0;

        for (const rule of rules) {
          let matches = false;

          if (rule.merchantPattern) {
            const regex = new RegExp(rule.merchantPattern, 'i');
            if (regex.test(merchant)) {
              matches = true;
            }
          }

          if (rule.descriptionPattern && !matches) {
            const regex = new RegExp(rule.descriptionPattern, 'i');
            if (regex.test(description)) {
              matches = true;
            }
          }

          if (rule.amountMin !== null && amount < rule.amountMin) {
            matches = false;
          }

          if (rule.amountMax !== null && amount > rule.amountMax) {
            matches = false;
          }

          if (matches) {
            categoryId = rule.categoryId;
            confidence = 0.7; // Auto-categorization confidence
            break;
          }
        }

        // Create transaction
        const transaction = await prisma.transaction.create({
          data: {
            id: uuidv4(),
            amount: parseFloat(amount.toString()),
            description,
            merchant,
            date: new Date(date),
            categoryId,
            patternHash,
            importHash,
            confidence,
            verified: false
          },
          include: {
            category: true
          }
        });

        results.imported++;
        results.transactions.push(transaction);

      } catch (error) {
        console.error('Error importing transaction:', error);
        results.errors++;
      }
    }

    return json(results);
  } catch (error) {
    console.error('Error importing transactions:', error);
    return json({ error: 'Failed to import transactions' }, { status: 500 });
  }
};

// Helper function to generate import hash
function generateImportHash(transaction: ImportTransaction): string {
  const normalized = `${transaction.amount}_${transaction.description}_${transaction.merchant}_${transaction.date}`;
  
  let hash = 0;
  for (let i = 0; i < normalized.length; i++) {
    const char = normalized.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  
  return hash.toString(36);
}