import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedMortgageCategory() {
  try {
    console.log('Creating mortgage/debt payment categories...');

    // Create main debt category
    const debtCategory = await prisma.category.upsert({
      where: {
        name_type: {
          name: 'Debt Payments',
          type: 'EXPENSE'
        }
      },
      update: {},
      create: {
        id: 'cat-debt-payments',
        name: 'Debt Payments',
        type: 'EXPENSE',
        color: '#ef4444',
        icon: '💳',
        isActive: true
      }
    });

    console.log('Created debt payments category:', debtCategory);

    // Create mortgage subcategory
    const mortgageCategory = await prisma.category.upsert({
      where: {
        name_type: {
          name: 'Mortgage',
          type: 'EXPENSE'
        }
      },
      update: {},
      create: {
        id: 'cat-mortgage',
        name: 'Mortgage',
        type: 'EXPENSE',
        color: '#dc2626',
        icon: '🏠',
        isActive: true,
        parentId: debtCategory.id
      }
    });

    console.log('Created mortgage category:', mortgageCategory);

    // Create smart patterns for common mortgage providers
    const mortgagePatterns = [
      { pattern: 'santander hipoteca', priority: 10 },
      { pattern: 'bbva hipoteca', priority: 10 },
      { pattern: 'caixabank hipoteca', priority: 10 },
      { pattern: 'sabadell hipoteca', priority: 10 },
      { pattern: 'ing hipoteca', priority: 10 },
      { pattern: 'mortgage', priority: 9 },
      { pattern: 'hipoteca', priority: 9 },
      { pattern: 'home loan', priority: 8 }
    ];

    for (const patternData of mortgagePatterns) {
      const pattern = await prisma.$executeRaw`
        INSERT INTO category_patterns (
          id, category_id, pattern, pattern_type, is_active, apply_to_future, priority, match_count
        ) VALUES (
          ${`pat-mortgage-${patternData.pattern.replace(/\s+/g, '-')}`},
          ${mortgageCategory.id},
          ${patternData.pattern},
          'merchant',
          true,
          true,
          ${patternData.priority},
          0
        ) ON CONFLICT (id) DO NOTHING`;

      console.log(`Created pattern: "${patternData.pattern}" for mortgage category`);
    }

    // Create other debt categories
    const creditCardCategory = await prisma.category.upsert({
      where: {
        name_type: {
          name: 'Credit Card',
          type: 'EXPENSE'
        }
      },
      update: {},
      create: {
        id: 'cat-credit-card',
        name: 'Credit Card',
        type: 'EXPENSE',
        color: '#f59e0b',
        icon: '💳',
        isActive: true,
        parentId: debtCategory.id
      }
    });

    console.log('Created credit card category:', creditCardCategory);

    const personalLoanCategory = await prisma.category.upsert({
      where: {
        name_type: {
          name: 'Personal Loan',
          type: 'EXPENSE'
        }
      },
      update: {},
      create: {
        id: 'cat-personal-loan',
        name: 'Personal Loan',
        type: 'EXPENSE',
        color: '#f97316',
        icon: '💰',
        isActive: true,
        parentId: debtCategory.id
      }
    });

    console.log('Created personal loan category:', personalLoanCategory);

    console.log('✅ Successfully seeded mortgage and debt payment categories');
  } catch (error) {
    console.error('Error seeding categories:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedMortgageCategory();