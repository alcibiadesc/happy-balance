#!/usr/bin/env node

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seed() {
  console.log('🌱 Seeding database...');

  // Create categories
  const categories = [
    { name: 'Salario', type: 'INCOME', color: '#10B981', icon: 'TrendingUp' },
    { name: 'Alimentación', type: 'ESSENTIAL_EXPENSE', color: '#F59E0B', icon: 'ShoppingCart' },
    { name: 'Transporte', type: 'ESSENTIAL_EXPENSE', color: '#3B82F6', icon: 'Car' },
    { name: 'Entretenimiento', type: 'DISCRETIONARY_EXPENSE', color: '#8B5CF6', icon: 'GameController2' },
    { name: 'Ahorro', type: 'SAVINGS', color: '#06B6D4', icon: 'PiggyBank' }
  ];

  for (const category of categories) {
    await prisma.category.upsert({
      where: { name: category.name },
      update: {},
      create: category
    });
  }

  // Create account
  await prisma.account.upsert({
    where: { id: 'dev-account-1' },
    update: {},
    create: {
      id: 'dev-account-1',
      name: 'Cuenta Principal',
      type: 'CHECKING',
      balance: 5000,
      currency: 'EUR'
    }
  });

  console.log('✅ Database seeded!');
}

seed()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });