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

    const existingDefault = await prisma.user.findUnique({
      where: { id: 'default' }
    });

    // Create admin user with temporary password
    const tempPassword = 'admin123'; // This should be changed on first login
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    let adminUser = existingAdmin;

    if (!existingAdmin) {
      adminUser = await prisma.user.create({
        data: {
          username: 'admin',
          password: hashedPassword,
          role: 'admin',
          isActive: true
        }
      });

      // Create admin's user preferences
      await prisma.userPreferences.create({
        data: {
          userId: adminUser.id,
          currency: 'EUR',
          language: 'en',
          theme: 'light'
        }
      });

      console.log('✅ Created admin user:');
      console.log('   Username: admin');
      console.log('   Password: admin123 (CHANGE THIS!)');
      console.log('   Role: admin');
      console.log('✅ Created user preferences for admin');
    } else {
      console.log('✅ Admin user already exists');
    }

    // Create default user for system fallbacks if it doesn't exist
    if (!existingDefault) {
      const defaultUser = await prisma.user.create({
        data: {
          id: 'default',
          username: 'system-default',
          password: hashedPassword,
          role: 'admin',
          isActive: false, // Not for login, just for foreign key references
          createdBy: adminUser!.id
        }
      });

      await prisma.userPreferences.create({
        data: {
          userId: defaultUser.id,
          currency: 'EUR',
          language: 'en',
          theme: 'light'
        }
      });

      console.log('✅ Created system default user for foreign key references');
    } else {
      console.log('✅ System default user already exists');
    }

    // Create some demo users (optional)
    const demoPassword = await bcrypt.hash('demo123', 10);

    const existingDemo = await prisma.user.findUnique({
      where: { username: 'demo' }
    });

    // Demo user with edit privileges
    if (!existingDemo) {
      const demoUser = await prisma.user.create({
        data: {
          username: 'demo',
          password: demoPassword,
          role: 'user',
          isActive: true,
          createdBy: adminUser!.id
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
    }

    const existingViewer = await prisma.user.findUnique({
      where: { username: 'viewer' }
    });

    // Viewer user (read-only)
    if (!existingViewer) {
      const viewerUser = await prisma.user.create({
        data: {
          username: 'viewer',
          password: demoPassword,
          role: 'viewer',
          isActive: true,
          createdBy: adminUser!.id
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
    }

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