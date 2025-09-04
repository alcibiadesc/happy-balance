#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const isDev = process.env.NODE_ENV !== 'production';

if (isDev) {
  console.log('🚀 Configurando base de datos de desarrollo...');
  
  try {
    // Generar cliente de Prisma para desarrollo
    console.log('📦 Generando cliente Prisma para desarrollo...');
    execSync('npx prisma generate --schema=prisma/schema.dev.prisma', { stdio: 'inherit' });
    
    // Aplicar migraciones a SQLite
    console.log('📊 Aplicando migraciones...');
    execSync('npx prisma db push --schema=prisma/schema.dev.prisma', { stdio: 'inherit' });
    
    // Seed data básico para desarrollo
    console.log('🌱 Creando datos de prueba...');
    await seedDevData();
    
    console.log('✅ Base de datos de desarrollo configurada correctamente!');
    console.log('📁 Base de datos SQLite en: prisma/dev.db');
    
  } catch (error) {
    console.error('❌ Error configurando base de datos de desarrollo:', error);
    process.exit(1);
  }
}

async function seedDevData() {
  // Usar el cliente generado para desarrollo
  const { PrismaClient } = await import('../prisma/generated/dev/index.js');
  
  const prisma = new PrismaClient();

  try {
    // Crear categorías básicas
    const categories = [
      { name: 'Salario', type: 'INCOME', color: '#10B981', icon: 'TrendingUp' },
      { name: 'Alimentación', type: 'ESSENTIAL_EXPENSE', color: '#F59E0B', icon: 'ShoppingCart' },
      { name: 'Transporte', type: 'ESSENTIAL_EXPENSE', color: '#3B82F6', icon: 'Car' },
      { name: 'Entretenimiento', type: 'DISCRETIONARY_EXPENSE', color: '#8B5CF6', icon: 'GameController2' },
      { name: 'Ahorro', type: 'SAVINGS', color: '#06B6D4', icon: 'PiggyBank' },
      { name: 'Omitir', type: 'OMIT', color: '#6B7280', icon: 'X' }
    ];

    for (const category of categories) {
      await prisma.category.upsert({
        where: { name: category.name },
        update: {},
        create: category
      });
    }

    // Crear cuenta por defecto
    await prisma.account.upsert({
      where: { id: 'dev-account-1' },
      update: {},
      create: {
        id: 'dev-account-1',
        name: 'Cuenta Desarrollo',
        type: 'CHECKING',
        balance: 5000,
        currency: 'EUR'
      }
    });

    // Crear algunas transacciones de ejemplo
    const salarioCategory = await prisma.category.findFirst({ where: { name: 'Salario' } });
    const alimentacionCategory = await prisma.category.findFirst({ where: { name: 'Alimentación' } });
    
    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    await prisma.transaction.createMany({
      data: [
        {
          amount: 3000,
          description: 'Salario mensual',
          accountId: 'dev-account-1',
          categoryId: salarioCategory?.id,
          transactionDate: new Date(thisMonth.getTime() + 1 * 24 * 60 * 60 * 1000)
        },
        {
          amount: -85.50,
          description: 'Supermercado Mercadona',
          accountId: 'dev-account-1',
          categoryId: alimentacionCategory?.id,
          transactionDate: new Date(thisMonth.getTime() + 5 * 24 * 60 * 60 * 1000)
        },
        {
          amount: -12.30,
          description: 'Metro Madrid',
          accountId: 'dev-account-1',
          transactionDate: new Date(thisMonth.getTime() + 7 * 24 * 60 * 60 * 1000)
        }
      ]
    });

    // Crear cuenta de ahorros de ejemplo
    await prisma.savingsAccount.create({
      data: {
        name: 'Fondo de Emergencia Dev',
        type: 'EMERGENCY_FUND',
        balance: 15000,
        goalAmount: 20000,
        currency: 'EUR',
        description: 'Fondo de emergencia para pruebas de desarrollo'
      }
    });

    console.log('✅ Datos de prueba creados');

  } catch (error) {
    console.error('❌ Error creando datos de prueba:', error);
  } finally {
    await prisma.$disconnect();
  }
}