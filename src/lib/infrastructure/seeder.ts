import { prisma } from './database/prisma.js';

export async function seedDefaultData() {
  try {
    console.log('🌱 Starting database seeding...');

    // Create default account if it doesn't exist
    let defaultAccount = await prisma.account.findFirst({
      where: { name: 'Cuenta Principal' }
    });

    if (!defaultAccount) {
      defaultAccount = await prisma.account.create({
        data: {
          id: 'default-account-id',
          name: 'Cuenta Principal',
          type: 'MAIN',
          balance: 0,
          currency: 'EUR',
          isActive: true
        }
      });
      console.log('✅ Default account created');
    }

    // Create default categories
    const categories = [
      // Income categories
      { name: 'Salario', type: 'INCOME', color: '#10B981', icon: '💼' },
      { name: 'Freelance', type: 'INCOME', color: '#059669', icon: '💻' },
      { name: 'Inversiones', type: 'INCOME', color: '#047857', icon: '📈' },
      { name: 'Alquiler', type: 'INCOME', color: '#065F46', icon: '🏠' },
      { name: 'Negocio', type: 'INCOME', color: '#064E3B', icon: '🏢' },
      { name: 'Otros ingresos', type: 'INCOME', color: '#6B7280', icon: '💰' },
      
      // Essential expenses
      { name: 'Vivienda', type: 'ESSENTIAL_EXPENSE', color: '#DC2626', icon: '🏠' },
      { name: 'Alimentación', type: 'ESSENTIAL_EXPENSE', color: '#B91C1C', icon: '🍽️' },
      { name: 'Transporte', type: 'ESSENTIAL_EXPENSE', color: '#991B1B', icon: '🚗' },
      { name: 'Salud', type: 'ESSENTIAL_EXPENSE', color: '#7F1D1D', icon: '🏥' },
      { name: 'Servicios', type: 'ESSENTIAL_EXPENSE', color: '#EF4444', icon: '⚡' },
      
      // Discretionary expenses
      { name: 'Entretenimiento', type: 'DISCRETIONARY_EXPENSE', color: '#F59E0B', icon: '🎬' },
      { name: 'Compras', type: 'DISCRETIONARY_EXPENSE', color: '#D97706', icon: '🛍️' },
      { name: 'Educación', type: 'DISCRETIONARY_EXPENSE', color: '#B45309', icon: '📚' },
      { name: 'Viajes', type: 'DISCRETIONARY_EXPENSE', color: '#92400E', icon: '✈️' },
      { name: 'Otros gastos', type: 'DISCRETIONARY_EXPENSE', color: '#6B7280', icon: '💸' }
    ];

    for (const categoryData of categories) {
      const existingCategory = await prisma.category.findFirst({
        where: { name: categoryData.name }
      });

      if (!existingCategory) {
        await prisma.category.create({
          data: {
            ...categoryData,
            type: categoryData.type as any
          }
        });
      }
    }

    console.log('✅ Default categories seeded');
    console.log('🎉 Database seeding completed successfully');

    return { defaultAccount, categoriesCount: categories.length };
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  }
}