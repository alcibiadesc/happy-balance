import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Create default categories
  const categories = [
    // Expense categories
    { id: '1', name: 'Food & Dining', type: 'EXPENSE', color: '#FF6B6B', icon: '🍽️' },
    { id: '2', name: 'Transportation', type: 'EXPENSE', color: '#4ECDC4', icon: '🚗' },
    { id: '3', name: 'Shopping', type: 'EXPENSE', color: '#45B7D1', icon: '🛍️' },
    { id: '4', name: 'Entertainment', type: 'EXPENSE', color: '#F7931E', icon: '🎬' },
    { id: '5', name: 'Bills & Utilities', type: 'EXPENSE', color: '#FF9F43', icon: '💡' },
    { id: '6', name: 'Healthcare', type: 'EXPENSE', color: '#26DE81', icon: '🏥' },
    { id: '7', name: 'Education', type: 'EXPENSE', color: '#A55EEA', icon: '📚' },
    { id: '8', name: 'Travel', type: 'EXPENSE', color: '#FD79A8', icon: '✈️' },

    // Income categories
    { id: '9', name: 'Salary', type: 'INCOME', color: '#00B894', icon: '💼' },
    { id: '10', name: 'Freelance', type: 'INCOME', color: '#0984E3', icon: '💻' },
    { id: '11', name: 'Investment Returns', type: 'INCOME', color: '#6C5CE7', icon: '📈' },
    { id: '12', name: 'Other Income', type: 'INCOME', color: '#A29BFE', icon: '💰' },

    // Investment categories
    { id: '13', name: 'Stocks', type: 'INVESTMENT', color: '#00B894', icon: '📊' },
    { id: '14', name: 'Bonds', type: 'INVESTMENT', color: '#0984E3', icon: '🏦' },
    { id: '15', name: 'Crypto', type: 'INVESTMENT', color: '#FDCB6E', icon: '₿' },
    { id: '16', name: 'Real Estate', type: 'INVESTMENT', color: '#E17055', icon: '🏠' },
  ];

  console.log('📂 Creating categories...');
  for (const category of categories) {
    await prisma.category.upsert({
      where: { id: category.id },
      update: {},
      create: category,
    });
  }
  console.log(`✅ Created ${categories.length} categories`);

  // Create default app settings
  const settings = [
    {
      id: '1',
      key: 'default_currency',
      value: 'EUR',
      description: 'Default currency for transactions'
    },
    {
      id: '2',
      key: 'dashboard_date_range',
      value: 'last_30_days',
      description: 'Default date range for dashboard'
    },
    {
      id: '3',
      key: 'auto_categorization_enabled',
      value: true,
      description: 'Enable automatic transaction categorization'
    },
    {
      id: '4',
      key: 'duplicate_detection_enabled',
      value: true,
      description: 'Enable duplicate transaction detection'
    }
  ];

  console.log('⚙️ Creating app settings...');
  for (const setting of settings) {
    await prisma.appSettings.upsert({
      where: { key: setting.key },
      update: {},
      create: setting,
    });
  }
  console.log(`✅ Created ${settings.length} app settings`);

  console.log('🎉 Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:');
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });