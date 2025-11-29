import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

/**
 * Sample investment data for development/demo purposes
 */
const sampleInvestments = [
  {
    name: 'Indexa Capital',
    symbol: 'INDEXA',
    currentValue: 15420.50,
    color: '#10B981',
    icon: '📊',
    highlight: true,
    notes: 'Cartera de fondos indexados - Perfil agresivo',
    contributions: [
      { amount: 5000, date: new Date('2024-01-15'), notes: 'Aportación inicial' },
      { amount: 500, date: new Date('2024-02-01'), notes: 'Aportación mensual' },
      { amount: 500, date: new Date('2024-03-01'), notes: 'Aportación mensual' },
      { amount: 500, date: new Date('2024-04-01'), notes: 'Aportación mensual' },
      { amount: 500, date: new Date('2024-05-01'), notes: 'Aportación mensual' },
      { amount: 500, date: new Date('2024-06-01'), notes: 'Aportación mensual' },
      { amount: 500, date: new Date('2024-07-01'), notes: 'Aportación mensual' },
      { amount: 500, date: new Date('2024-08-01'), notes: 'Aportación mensual' },
      { amount: 1000, date: new Date('2024-09-01'), notes: 'Aportación extra' },
      { amount: 500, date: new Date('2024-10-01'), notes: 'Aportación mensual' },
      { amount: 500, date: new Date('2024-11-01'), notes: 'Aportación mensual' },
    ],
  },
  {
    name: 'Bitcoin',
    symbol: 'BTC',
    currentValue: 8750.00,
    color: '#F59E0B',
    icon: '₿',
    highlight: true,
    notes: 'Holding a largo plazo - DCA semanal',
    contributions: [
      { amount: 2000, date: new Date('2024-03-10'), notes: 'Primera compra' },
      { amount: 1000, date: new Date('2024-05-15'), notes: 'Aprovechando bajada' },
      { amount: 500, date: new Date('2024-07-20'), notes: 'DCA' },
      { amount: 500, date: new Date('2024-08-20'), notes: 'DCA' },
      { amount: 500, date: new Date('2024-09-20'), notes: 'DCA' },
      { amount: 500, date: new Date('2024-10-20'), notes: 'DCA' },
    ],
  },
  {
    name: 'Ethereum',
    symbol: 'ETH',
    currentValue: 3200.00,
    color: '#6366F1',
    icon: '💎',
    highlight: false,
    notes: 'Staking en Lido',
    contributions: [
      { amount: 1500, date: new Date('2024-04-01'), notes: 'Compra inicial' },
      { amount: 800, date: new Date('2024-06-15'), notes: 'Segunda compra' },
      { amount: 400, date: new Date('2024-09-01'), notes: 'Tercera compra' },
    ],
  },
  {
    name: 'MyInvestor Cartera Permanente',
    symbol: 'MYINV',
    currentValue: 6800.00,
    color: '#3B82F6',
    icon: '🏦',
    highlight: false,
    notes: 'Cartera permanente - Bajo riesgo',
    contributions: [
      { amount: 3000, date: new Date('2024-02-01'), notes: 'Aportación inicial' },
      { amount: 250, date: new Date('2024-03-01'), notes: 'Mensual' },
      { amount: 250, date: new Date('2024-04-01'), notes: 'Mensual' },
      { amount: 250, date: new Date('2024-05-01'), notes: 'Mensual' },
      { amount: 250, date: new Date('2024-06-01'), notes: 'Mensual' },
      { amount: 250, date: new Date('2024-07-01'), notes: 'Mensual' },
      { amount: 250, date: new Date('2024-08-01'), notes: 'Mensual' },
      { amount: 250, date: new Date('2024-09-01'), notes: 'Mensual' },
      { amount: 250, date: new Date('2024-10-01'), notes: 'Mensual' },
      { amount: 250, date: new Date('2024-11-01'), notes: 'Mensual' },
    ],
  },
  {
    name: 'Plan de Pensiones ING',
    symbol: 'PP-ING',
    currentValue: 12500.00,
    color: '#EC4899',
    icon: '👴',
    highlight: false,
    notes: 'Aportaciones máximas anuales',
    contributions: [
      { amount: 8000, date: new Date('2023-12-15'), notes: 'Aportación 2023' },
      { amount: 1500, date: new Date('2024-06-01'), notes: 'Aportación parcial 2024' },
      { amount: 1500, date: new Date('2024-11-15'), notes: 'Aportación final 2024' },
    ],
  },
  {
    name: 'Acciones Apple',
    symbol: 'AAPL',
    currentValue: 4200.00,
    color: '#8B5CF6',
    icon: '🍎',
    highlight: false,
    notes: 'Compradas en Interactive Brokers',
    contributions: [
      { amount: 2000, date: new Date('2024-01-20'), notes: 'Primera compra - 10 acciones' },
      { amount: 1500, date: new Date('2024-08-10'), notes: 'Segunda compra - 8 acciones' },
    ],
  },
  {
    name: 'Fondo de Emergencia',
    symbol: 'CASH',
    currentValue: 9000.00,
    color: '#14B8A6',
    icon: '🛡️',
    highlight: true,
    notes: 'Cuenta remunerada Trade Republic - 3 meses de gastos',
    contributions: [
      { amount: 5000, date: new Date('2024-01-01'), notes: 'Fondo inicial' },
      { amount: 1000, date: new Date('2024-04-01'), notes: 'Incremento' },
      { amount: 1000, date: new Date('2024-07-01'), notes: 'Incremento' },
      { amount: 1000, date: new Date('2024-10-01'), notes: 'Incremento' },
      { amount: 1000, date: new Date('2024-11-01'), notes: 'Objetivo alcanzado' },
    ],
  },
  {
    name: 'Crowdlending Mintos',
    symbol: 'MINTOS',
    currentValue: 1850.00,
    color: '#EF4444',
    icon: '💸',
    highlight: false,
    notes: 'Préstamos P2P - Alto riesgo',
    contributions: [
      { amount: 1000, date: new Date('2024-02-15'), notes: 'Inversión inicial' },
      { amount: 500, date: new Date('2024-05-01'), notes: 'Segunda inversión' },
      { amount: 200, date: new Date('2024-08-01'), notes: 'Reinversión intereses' },
    ],
  },
];

/**
 * Seed investments for a specific user
 */
async function seedInvestments(userId: string): Promise<void> {
  console.log(`🌱 Seeding investments for user: ${userId}`);

  for (const inv of sampleInvestments) {
    const investmentId = `inv-${randomUUID().slice(0, 8)}`;

    // Calculate total contributions
    const totalContributions = inv.contributions.reduce((sum, c) => sum + c.amount, 0);

    console.log(`  📈 Creating: ${inv.name} (${inv.symbol})`);

    // Create investment
    await prisma.investment.create({
      data: {
        id: investmentId,
        name: inv.name,
        symbol: inv.symbol,
        currentValue: inv.currentValue,
        currency: 'EUR',
        highlight: inv.highlight,
        color: inv.color,
        icon: inv.icon,
        notes: inv.notes,
        isActive: true,
        sortOrder: sampleInvestments.indexOf(inv),
        userId: userId,
      },
    });

    // Create history entries
    for (const contribution of inv.contributions) {
      await prisma.investmentHistory.create({
        data: {
          id: `invh-${randomUUID().slice(0, 8)}`,
          investmentId: investmentId,
          amount: contribution.amount,
          type: 'CONTRIBUTION',
          date: contribution.date,
          notes: contribution.notes,
        },
      });
    }

    console.log(`     ✅ Created with ${inv.contributions.length} contributions (Total: €${totalContributions})`);
  }
}

/**
 * Main seed function
 */
async function main(): Promise<void> {
  console.log('🚀 Starting investment seed...\n');

  try {
    // Get admin user (or first user)
    const user = await prisma.user.findFirst({
      where: { role: 'admin' },
    });

    if (!user) {
      console.log('❌ No admin user found. Please run seed-admin first.');
      process.exit(1);
    }

    console.log(`👤 Found user: ${user.username} (${user.id})\n`);

    // Clear existing investments for this user
    const deleted = await prisma.investmentHistory.deleteMany({
      where: { investment: { userId: user.id } },
    });
    console.log(`🗑️  Cleared ${deleted.count} existing history entries`);

    const deletedInv = await prisma.investment.deleteMany({
      where: { userId: user.id },
    });
    console.log(`🗑️  Cleared ${deletedInv.count} existing investments\n`);

    // Seed new investments
    await seedInvestments(user.id);

    // Summary
    const totalInvestments = await prisma.investment.count({
      where: { userId: user.id },
    });
    const totalHistory = await prisma.investmentHistory.count({
      where: { investment: { userId: user.id } },
    });

    const summary = await prisma.investment.aggregate({
      where: { userId: user.id, isActive: true },
      _sum: { currentValue: true },
    });

    console.log('\n📊 Seed Summary:');
    console.log(`   Investments created: ${totalInvestments}`);
    console.log(`   History entries: ${totalHistory}`);
    console.log(`   Total portfolio value: €${Number(summary._sum.currentValue || 0).toLocaleString('es-ES')}`);

    console.log('\n🎉 Investment seed completed successfully!');

  } catch (error) {
    console.error('💥 Seed failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run
main();
