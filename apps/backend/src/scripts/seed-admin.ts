import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';
import { AuthenticationService } from '../domain/services/AuthenticationService';
import { User } from '../domain/entities/User';

const prisma = new PrismaClient();
const authService = new AuthenticationService();

interface AdminConfig {
  username: string;
  password: string;
}

/**
 * Get admin configuration from environment variables with defaults
 */
function getAdminConfig(): AdminConfig {
  return {
    username: process.env.ADMIN_USERNAME || 'admin',
    password: process.env.ADMIN_PASSWORD || 'admin123'
  };
}

/**
 * Create or update admin user based on environment variables
 */
async function seedAdminUser(): Promise<void> {
  try {
    const config = getAdminConfig();

    console.log(`🔧 Checking admin user configuration...`);
    console.log(`   Username: ${config.username}`);
    console.log(`   Password: [HIDDEN]`);

    // Check if admin user already exists
    const existingUser = await prisma.user.findUnique({
      where: { username: config.username }
    });

    // Hash the password
    const hashResult = await authService.hashPassword(config.password);
    if (hashResult.isFailure()) {
      throw new Error(`Failed to hash password: ${hashResult.getError()}`);
    }
    const hashedPassword = hashResult.getValue();

    if (existingUser) {
      // Update existing admin user
      await prisma.user.update({
        where: { username: config.username },
        data: {
          password: hashedPassword,
          role: 'admin',
          isActive: true,
          updatedAt: new Date()
        }
      });
      console.log(`✅ Admin user '${config.username}' updated successfully`);
    } else {
      // Create new admin user
      const adminUser = User.create({
        id: randomUUID(),
        username: config.username,
        password: hashedPassword,
        role: 'admin',
        isActive: true,
        createdBy: null // Self-created
      });

      await prisma.user.create({
        data: {
          id: adminUser.id,
          username: adminUser.username,
          password: adminUser.password,
          role: adminUser.role,
          isActive: adminUser.isActive,
          createdBy: adminUser.createdBy,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
      console.log(`✅ Admin user '${config.username}' created successfully`);
    }

    console.log(`✅ Admin user setup completed successfully`);

  } catch (error) {
    console.error('❌ Error seeding admin user:', error);
    throw error;
  }
}

/**
 * Main seed function
 */
async function main(): Promise<void> {
  console.log('🌱 Starting admin user seed...');

  try {
    await seedAdminUser();
    console.log('🎉 Admin user seed completed successfully');
  } catch (error) {
    console.error('💥 Admin user seed failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
// @ts-ignore - CommonJS compatibility
if (require.main === module) {
  main();
}

export { seedAdminUser, getAdminConfig };