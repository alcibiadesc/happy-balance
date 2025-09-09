#!/usr/bin/env node

import { PrismaClient } from '@prisma/client'
import { randomUUID } from 'crypto'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seeding...')

  // Clear existing data
  await prisma.transaction.deleteMany()
  await prisma.category.deleteMany()
  await prisma.account.deleteMany()

  // Create sample account
  const account = await prisma.account.create({
    data: {
      id: randomUUID(),
      name: 'Main Account',
      type: 'CHECKING',
      balance: 2462.20,
      currency: 'EUR'
    }
  })

  console.log(`✅ Created account: ${account.name}`)

  // Create categories
  const categories = await Promise.all([
    prisma.category.create({
      data: {
        id: randomUUID(),
        name: 'Groceries',
        type: 'ESSENTIAL_EXPENSE',
        color: '#059669',
        description: 'Food and household items',
        icon: 'ShoppingCart'
      }
    }),
    prisma.category.create({
      data: {
        id: randomUUID(),
        name: 'Transportation', 
        type: 'ESSENTIAL_EXPENSE',
        color: '#DC2626',
        description: 'Travel and commuting',
        icon: 'Car'
      }
    }),
    prisma.category.create({
      data: {
        id: randomUUID(),
        name: 'Entertainment',
        type: 'DISCRETIONARY_EXPENSE',
        color: '#7C3AED',
        description: 'Movies, games, subscriptions',
        icon: 'GameController2'
      }
    }),
    prisma.category.create({
      data: {
        id: randomUUID(),
        name: 'Salary',
        type: 'INCOME',
        color: '#10B981',
        description: 'Monthly income',
        icon: 'TrendingUp'
      }
    })
  ])

  console.log(`✅ Created ${categories.length} categories`)

  // Create sample transactions for current month
  const currentDate = new Date()
  const transactions = [
    // Income
    {
      amount: 2800.00,
      description: 'Monthly Salary',
      categoryId: categories[3].id, // Salary
      accountId: account.id,
      transactionDate: new Date(currentDate.getFullYear(), currentDate.getMonth(), 1),
      paymentReference: 'SAL-' + currentDate.getMonth(),
      counterparty: 'Demo Company Ltd',
      hash: randomUUID()
    },
    // Expenses
    {
      amount: -89.45,
      description: 'Weekly groceries',
      categoryId: categories[0].id, // Groceries
      accountId: account.id,
      transactionDate: new Date(currentDate.getFullYear(), currentDate.getMonth(), 5),
      paymentReference: 'GRC-001',
      counterparty: 'SuperMarket Chain',
      hash: randomUUID()
    },
    {
      amount: -45.20,
      description: 'Bus pass monthly',
      categoryId: categories[1].id, // Transportation
      accountId: account.id,
      transactionDate: new Date(currentDate.getFullYear(), currentDate.getMonth(), 7),
      paymentReference: 'BUS-PASS',
      counterparty: 'City Transport',
      hash: randomUUID()
    },
    {
      amount: -12.99,
      description: 'Netflix subscription',
      categoryId: categories[2].id, // Entertainment
      accountId: account.id,
      transactionDate: new Date(currentDate.getFullYear(), currentDate.getMonth(), 10),
      paymentReference: 'NETFLIX',
      counterparty: 'Netflix Inc',
      hash: randomUUID()
    },
    {
      amount: -67.80,
      description: 'Grocery shopping',
      categoryId: categories[0].id, // Groceries
      accountId: account.id,
      transactionDate: new Date(currentDate.getFullYear(), currentDate.getMonth(), 12),
      paymentReference: 'GRC-002',
      counterparty: 'Local Store',
      hash: randomUUID()
    },
    {
      amount: -23.50,
      description: 'Movie tickets',
      categoryId: categories[2].id, // Entertainment
      accountId: account.id,
      transactionDate: new Date(currentDate.getFullYear(), currentDate.getMonth(), 15),
      paymentReference: 'CINEMA',
      counterparty: 'Cinema Complex',
      hash: randomUUID()
    },
    {
      amount: -78.32,
      description: 'Weekly groceries',
      categoryId: categories[0].id, // Groceries
      accountId: account.id,
      transactionDate: new Date(currentDate.getFullYear(), currentDate.getMonth(), 19),
      paymentReference: 'GRC-003',
      counterparty: 'SuperMarket Chain',
      hash: randomUUID()
    },
    {
      amount: -15.75,
      description: 'Coffee and snacks',
      categoryId: categories[2].id, // Entertainment
      accountId: account.id,
      transactionDate: new Date(currentDate.getFullYear(), currentDate.getMonth(), 22),
      paymentReference: 'CAFE',
      counterparty: 'Coffee House',
      hash: randomUUID()
    },
    {
      amount: -34.65,
      description: 'Taxi to airport',
      categoryId: categories[1].id, // Transportation
      accountId: account.id,
      transactionDate: new Date(currentDate.getFullYear(), currentDate.getMonth(), 25),
      paymentReference: 'TAXI',
      counterparty: 'Taxi Service',
      hash: randomUUID()
    },
    {
      amount: -69.54,
      description: 'Grocery shopping',
      categoryId: categories[0].id, // Groceries
      accountId: account.id,
      transactionDate: new Date(currentDate.getFullYear(), currentDate.getMonth(), 28),
      paymentReference: 'GRC-004',
      counterparty: 'SuperMarket Chain',
      hash: randomUUID()
    }
  ]

  // Insert transactions
  for (const transactionData of transactions) {
    await prisma.transaction.create({ data: transactionData })
  }

  console.log(`✅ Created ${transactions.length} sample transactions`)
  console.log('💰 Financial Summary:')
  console.log('  • Income: €2,800.00')
  console.log('  • Expenses: €337.80')
  console.log('  • Net: €2,462.20')
  console.log('  • Savings Rate: 87.93%')
  console.log('🌱 Database seeding completed successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })