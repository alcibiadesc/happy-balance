import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

async function createSampleTransactions() {
  console.log('🚀 Creating sample transactions...');

  // Get categories for reference
  const foodCategory = await prisma.category.findFirst({ where: { name: 'Food & Groceries' } });
  const transportCategory = await prisma.category.findFirst({ where: { name: 'Transport' } });
  const entertainmentCategory = await prisma.category.findFirst({ where: { name: 'Entertainment' } });
  const incomeCategory = await prisma.category.findFirst({ where: { name: 'Income' } });
  const utilitiesCategory = await prisma.category.findFirst({ where: { name: 'Utilities' } });
  const investmentCategory = await prisma.category.findFirst({ where: { name: 'Investment' } });

  const sampleTransactions = [
    // Income transactions
    {
      amount: 3000,
      description: 'Monthly Salary',
      merchant: 'ACME Corp',
      date: new Date('2024-01-01'),
      categoryId: incomeCategory?.id,
      verified: true,
      confidence: 1.0
    },
    {
      amount: 2950,
      description: 'Salary Payment',
      merchant: 'ACME Corp',
      date: new Date('2024-02-01'),
      categoryId: incomeCategory?.id,
      verified: true,
      confidence: 1.0
    },
    {
      amount: 3100,
      description: 'Monthly Salary + Bonus',
      merchant: 'ACME Corp',
      date: new Date('2024-03-01'),
      categoryId: incomeCategory?.id,
      verified: true,
      confidence: 1.0
    },

    // Food expenses
    {
      amount: -85.50,
      description: 'Grocery Shopping',
      merchant: 'SuperMart',
      date: new Date('2024-01-05'),
      categoryId: foodCategory?.id,
      verified: true,
      confidence: 0.9
    },
    {
      amount: -42.30,
      description: 'Restaurant dinner',
      merchant: 'Italian Place',
      date: new Date('2024-01-10'),
      categoryId: foodCategory?.id,
      verified: true,
      confidence: 0.8
    },
    {
      amount: -67.20,
      description: 'Weekly groceries',
      merchant: 'Fresh Market',
      date: new Date('2024-01-12'),
      categoryId: foodCategory?.id,
      verified: false,
      confidence: 0.9
    },
    {
      amount: -35.80,
      description: 'Coffee and lunch',
      merchant: 'Cafe Central',
      date: new Date('2024-01-15'),
      categoryId: foodCategory?.id,
      verified: false,
      confidence: 0.7
    },

    // Transport expenses
    {
      amount: -45.00,
      description: 'Gas station',
      merchant: 'Shell',
      date: new Date('2024-01-06'),
      categoryId: transportCategory?.id,
      verified: true,
      confidence: 0.95
    },
    {
      amount: -12.50,
      description: 'Metro card refill',
      merchant: 'Metro Transit',
      date: new Date('2024-01-08'),
      categoryId: transportCategory?.id,
      verified: true,
      confidence: 0.95
    },
    {
      amount: -28.75,
      description: 'Uber ride',
      merchant: 'Uber',
      date: new Date('2024-01-14'),
      categoryId: transportCategory?.id,
      verified: false,
      confidence: 0.9
    },

    // Entertainment expenses
    {
      amount: -15.99,
      description: 'Netflix subscription',
      merchant: 'Netflix',
      date: new Date('2024-01-03'),
      categoryId: entertainmentCategory?.id,
      verified: true,
      confidence: 0.95
    },
    {
      amount: -25.00,
      description: 'Movie tickets',
      merchant: 'Cinema Plaza',
      date: new Date('2024-01-11'),
      categoryId: entertainmentCategory?.id,
      verified: false,
      confidence: 0.85
    },
    {
      amount: -12.99,
      description: 'Spotify Premium',
      merchant: 'Spotify',
      date: new Date('2024-01-13'),
      categoryId: entertainmentCategory?.id,
      verified: true,
      confidence: 0.95
    },

    // Utilities
    {
      amount: -89.50,
      description: 'Electricity bill',
      merchant: 'Power Company',
      date: new Date('2024-01-02'),
      categoryId: utilitiesCategory?.id,
      verified: true,
      confidence: 1.0
    },
    {
      amount: -65.30,
      description: 'Internet service',
      merchant: 'ISP Provider',
      date: new Date('2024-01-04'),
      categoryId: utilitiesCategory?.id,
      verified: true,
      confidence: 1.0
    },
    {
      amount: -45.20,
      description: 'Water bill',
      merchant: 'Water Utility',
      date: new Date('2024-01-07'),
      categoryId: utilitiesCategory?.id,
      verified: true,
      confidence: 1.0
    },

    // Investment
    {
      amount: -500.00,
      description: 'Monthly investment',
      merchant: 'Investment Fund',
      date: new Date('2024-01-01'),
      categoryId: investmentCategory?.id,
      verified: true,
      confidence: 1.0
    },
    {
      amount: -300.00,
      description: 'Stock purchase',
      merchant: 'Trading Platform',
      date: new Date('2024-01-16'),
      categoryId: investmentCategory?.id,
      verified: true,
      confidence: 1.0
    }
  ];

  for (const transaction of sampleTransactions) {
    await prisma.transaction.create({
      data: {
        id: uuidv4(),
        ...transaction
      }
    });
    console.log(`✅ Created transaction: ${transaction.description} - ${transaction.amount}`);
  }

  console.log('✨ Sample transactions created successfully!');
}

createSampleTransactions()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Error creating sample transactions:', e);
    await prisma.$disconnect();
    process.exit(1);
  });