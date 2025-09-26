import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function seedUsers() {
  console.log('🌱 Seeding users...');

  try {
    // Check if admin user already exists
    const existingAdmin = await prisma.user.findUnique({
      where: { username: 'admin' }
    });

    if (existingAdmin) {
      console.log('✅ Admin user already exists');
      return;
    }

    // Create admin user with temporary password
    const tempPassword = 'admin123'; // This should be changed on first login
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    const adminUser = await prisma.user.create({
      data: {
        username: 'admin',
        displayName: 'Administrator',
        password: hashedPassword,
        role: 'admin',
        isActive: true
      }
    });

    console.log('✅ Created admin user:');
    console.log('   Username: admin');
    console.log('   Password: admin123 (CHANGE THIS!)');
    console.log('   Role: admin');

    // Create admin's user preferences
    await prisma.userPreferences.create({
      data: {
        userId: adminUser.id,
        currency: 'EUR',
        language: 'en',
        theme: 'light'
      }
    });

    console.log('✅ Created user preferences for admin');

    // Create some demo users (optional)
    const demoPassword = await bcrypt.hash('demo123', 10);

    // Demo user with edit privileges
    const demoUser = await prisma.user.create({
      data: {
        username: 'demo',
        displayName: 'Demo User',
        password: demoPassword,
        role: 'user',
        isActive: true,
        createdBy: adminUser.id
      }
    });

    await prisma.userPreferences.create({
      data: {
        userId: demoUser.id,
        currency: 'EUR',
        language: 'en',
        theme: 'light'
      }
    });

    console.log('✅ Created demo user:');
    console.log('   Username: demo');
    console.log('   Password: demo123');
    console.log('   Role: user');

    // Viewer user (read-only)
    const viewerUser = await prisma.user.create({
      data: {
        username: 'viewer',
        displayName: 'Viewer',
        password: demoPassword,
        role: 'viewer',
        isActive: true,
        createdBy: adminUser.id
      }
    });

    await prisma.userPreferences.create({
      data: {
        userId: viewerUser.id,
        currency: 'EUR',
        language: 'en',
        theme: 'light'
      }
    });

    console.log('✅ Created viewer user:');
    console.log('   Username: viewer');
    console.log('   Password: demo123');
    console.log('   Role: viewer');

    console.log('✨ User seeding completed successfully!');
  } catch (error) {
    console.error('❌ Error seeding users:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Execute seeding
seedUsers()
  .catch((error) => {
    console.error('Failed to seed users:', error);
    process.exit(1);
  });