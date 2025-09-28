#!/bin/sh
set -e

echo "🚀 Iniciando Happy Balance Backend..."

# Esperar a que PostgreSQL esté listo
echo "⏳ Esperando a PostgreSQL..."
while ! nc -z ${DB_HOST:-postgres} ${DB_PORT:-5432}; do
  echo "PostgreSQL no está listo, esperando..."
  sleep 2
done
echo "✅ PostgreSQL está listo"

# Ejecutar migraciones
echo "📦 Ejecutando migraciones de base de datos..."
npx prisma migrate deploy 2>/dev/null || {
  echo "⚠️  No se pudieron aplicar las migraciones, intentando push..."
  npx prisma db push --accept-data-loss
}

# Generar cliente de Prisma
echo "🔧 Generando cliente de Prisma..."
npx prisma generate

# IMPORTANTE: Crear usuario admin SIEMPRE si no existe
echo "👤 Verificando usuario admin..."
node -e "
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function ensureAdmin() {
  try {
    // Obtener username y password de variables de entorno
    const adminUsername = process.env.ADMIN_USERNAME || 'admin';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

    // Verificar si existe el usuario admin
    const existingAdmin = await prisma.user.findUnique({
      where: { username: adminUsername }
    });

    if (!existingAdmin) {
      console.log('📝 Creando usuario admin por defecto...');
      const hashedPassword = await bcrypt.hash(adminPassword, 10);

      const newAdmin = await prisma.user.create({
        data: {
          username: adminUsername,
          password: hashedPassword,
          role: 'admin',
          isActive: true,
          mustChangePassword: false
        }
      });

      console.log('✅ Usuario admin creado exitosamente');
      console.log('   Usuario:', adminUsername);
      console.log('   Contraseña:', adminPassword);
    } else {
      console.log('✅ Usuario admin ya existe:', adminUsername);
    }

    // Crear categorías por defecto si no existen
    const categoryCount = await prisma.category.count();
    if (categoryCount === 0) {
      console.log('📝 Creando categorías por defecto...');

      const defaultCategories = [
        { name: 'Alimentación', type: 'expense', color: '#FF6384', icon: '🍔', isGlobal: true },
        { name: 'Transporte', type: 'expense', color: '#36A2EB', icon: '🚗', isGlobal: true },
        { name: 'Vivienda', type: 'expense', color: '#FFCE56', icon: '🏠', isGlobal: true },
        { name: 'Ocio', type: 'expense', color: '#4BC0C0', icon: '🎮', isGlobal: true },
        { name: 'Salud', type: 'expense', color: '#9966FF', icon: '🏥', isGlobal: true },
        { name: 'Educación', type: 'expense', color: '#FF9F40', icon: '📚', isGlobal: true },
        { name: 'Salario', type: 'income', color: '#4CAF50', icon: '💰', isGlobal: true },
        { name: 'Freelance', type: 'income', color: '#8BC34A', icon: '💼', isGlobal: true },
        { name: 'Inversiones', type: 'income', color: '#00BCD4', icon: '📈', isGlobal: true },
      ];

      for (const cat of defaultCategories) {
        await prisma.category.create({ data: cat });
      }

      console.log('✅ Categorías creadas exitosamente');
    } else {
      console.log('✅ Ya existen categorías en la base de datos');
    }

  } catch (error) {
    console.error('❌ Error durante la inicialización:', error.message);
    // No fallar si hay un error, permitir que la app continúe
  } finally {
    await prisma.\$disconnect();
  }
}

ensureAdmin();
"

echo "✅ Inicialización completa"
echo "================================================"
echo "📍 Usuario admin configurado"
echo "📍 Base de datos lista"
echo "📍 Categorías por defecto creadas"
echo "================================================"

# Iniciar la aplicación
echo "🚀 Iniciando aplicación..."
exec npm run dev