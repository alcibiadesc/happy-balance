import { PrismaClient } from '@prisma/client';
import { Transaction } from '../src/domain/entities/Transaction';

async function regenerateHashes() {
  const prisma = new PrismaClient();

  try {
    console.log('🔄 Fetching all transactions without hashes...');

    // Get all transactions that don't have a hash
    const transactionsWithoutHash = await prisma.transaction.findMany({
      where: {
        hash: null
      }
    });

    console.log(`📊 Found ${transactionsWithoutHash.length} transactions without hash`);

    let updated = 0;

    for (const tx of transactionsWithoutHash) {
      try {
        // Create Transaction domain entity from Prisma data
        const transactionResult = Transaction.fromSnapshot({
          id: tx.id,
          amount: Number(tx.amount),
          currency: tx.currency,
          date: tx.date.toISOString().split('T')[0],
          merchant: tx.merchant,
          type: tx.type as any,
          description: tx.description,
          categoryId: tx.categoryId || undefined,
          isSelected: tx.isSelected,
          createdAt: tx.createdAt.toISOString()
        });

        if (transactionResult.isSuccess()) {
          const transaction = transactionResult.getValue();
          const hash = transaction.getHash();

          // Update the transaction with its hash
          await prisma.transaction.update({
            where: { id: tx.id },
            data: { hash }
          });

          updated++;

          if (updated % 10 === 0) {
            console.log(`📝 Updated ${updated}/${transactionsWithoutHash.length} transactions...`);
          }
        } else {
          console.error(`❌ Failed to create transaction entity for ${tx.id}:`, transactionResult.getError());
        }
      } catch (error) {
        console.error(`❌ Failed to update transaction ${tx.id}:`, error);
      }
    }

    console.log(`✅ Successfully updated ${updated} transactions with hashes`);

  } catch (error) {
    console.error('❌ Error regenerating hashes:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
regenerateHashes().catch(console.error);