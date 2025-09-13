import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create default categories
  const categories = [
    {
      name: 'Food & Groceries',
      type: 'ESSENTIAL',
      color: '#f5796c',
      icon: '🍽️'
    },
    {
      name: 'Transport',
      type: 'ESSENTIAL',
      color: '#7abaa5',
      icon: '🚇'
    },
    {
      name: 'Utilities',
      type: 'ESSENTIAL',
      color: '#023c46',
      icon: '⚡'
    },
    {
      name: 'Housing & Rent',
      type: 'ESSENTIAL',
      color: '#023c46',
      icon: '🏠'
    },
    {
      name: 'Healthcare',
      type: 'ESSENTIAL',
      color: '#f5796c',
      icon: '🏥'
    },
    {
      name: 'Entertainment',
      type: 'DISCRETIONARY',
      color: '#fecd2c',
      icon: '🎬'
    },
    {
      name: 'Shopping',
      type: 'DISCRETIONARY',
      color: '#fecd2c',
      icon: '🛍️'
    },
    {
      name: 'Dining Out',
      type: 'DISCRETIONARY',
      color: '#f5796c',
      icon: '🍴'
    },
    {
      name: 'Travel',
      type: 'DISCRETIONARY',
      color: '#7abaa5',
      icon: '✈️'
    },
    {
      name: 'Income',
      type: 'INCOME',
      color: '#7abaa5',
      icon: '💰'
    },
    {
      name: 'Investment',
      type: 'INVESTMENT',
      color: '#023c46',
      icon: '📈'
    },
    {
      name: 'Savings',
      type: 'INVESTMENT',
      color: '#7abaa5',
      icon: '🏦'
    }
  ];

  for (const category of categories) {
    await prisma.category.upsert({
      where: { name: category.name },
      update: category,
      create: category,
    });
    console.log(`✅ Created/Updated category: ${category.name}`);
  }

  // Create some sample category rules
  const foodCategory = await prisma.category.findFirst({
    where: { name: 'Food & Groceries' }
  });

  const transportCategory = await prisma.category.findFirst({
    where: { name: 'Transport' }
  });

  const entertainmentCategory = await prisma.category.findFirst({
    where: { name: 'Entertainment' }
  });

  if (foodCategory && transportCategory && entertainmentCategory) {
    const rules = [
      {
        categoryId: foodCategory.id,
        merchantPattern: '.*(supermarket|grocery|food|restaurant).*',
        priority: 10
      },
      {
        categoryId: transportCategory.id,
        merchantPattern: '.*(uber|taxi|metro|bus|gas|fuel).*',
        priority: 10
      },
      {
        categoryId: entertainmentCategory.id,
        merchantPattern: '.*(cinema|netflix|spotify|gaming|entertainment).*',
        priority: 10
      }
    ];

    for (const rule of rules) {
      await prisma.categoryRule.create({
        data: rule
      });
      console.log(`✅ Created category rule for ${rule.merchantPattern}`);
    }
  }

  console.log('✨ Database seeded successfully!');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Error seeding database:', e);
    await prisma.$disconnect();
    process.exit(1);
  });