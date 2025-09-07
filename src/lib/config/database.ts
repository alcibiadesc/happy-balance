import { PrismaClient } from '@prisma/client';
import { dev } from '$app/environment';
import { DATABASE_URL } from '$env/static/private';

export interface DatabaseOptions {
	url?: string;
	logging?: boolean;
	connectionPooling?: {
		maxConnections?: number;
		timeout?: number;
	};
}

export class DatabaseConfig {
	private static client: PrismaClient | null = null;

	static createClient(options: DatabaseOptions = {}): PrismaClient {
		if (DatabaseConfig.client) {
			return DatabaseConfig.client;
		}

		const databaseUrl = options.url || DATABASE_URL || 'postgresql://user:password@localhost:5432/expense_tracker';
		
		DatabaseConfig.client = new PrismaClient({
			datasources: {
				db: {
					url: databaseUrl
				}
			},
			log: options.logging || dev ? ['query', 'error', 'warn'] : ['error'],
			errorFormat: 'pretty'
		});

		// Add connection event handlers
		DatabaseConfig.client.$on('query', (event) => {
			if (dev) {
				console.log(`Query: ${event.query}`);
				console.log(`Params: ${event.params}`);
				console.log(`Duration: ${event.duration}ms`);
			}
		});

		// Graceful shutdown handling
		process.on('beforeExit', async () => {
			await DatabaseConfig.disconnect();
		});

		process.on('SIGINT', async () => {
			await DatabaseConfig.disconnect();
			process.exit(0);
		});

		process.on('SIGTERM', async () => {
			await DatabaseConfig.disconnect();
			process.exit(0);
		});

		return DatabaseConfig.client;
	}

	static getClient(): PrismaClient {
		if (!DatabaseConfig.client) {
			throw new Error('Database client not initialized. Call createClient() first.');
		}
		return DatabaseConfig.client;
	}

	static async connect(): Promise<void> {
		const client = DatabaseConfig.getClient();
		
		try {
			await client.$connect();
			console.log('📊 Database connected successfully');
		} catch (error) {
			console.error('❌ Database connection failed:', error);
			throw error;
		}
	}

	static async disconnect(): Promise<void> {
		if (DatabaseConfig.client) {
			try {
				await DatabaseConfig.client.$disconnect();
				DatabaseConfig.client = null;
				console.log('📊 Database disconnected successfully');
			} catch (error) {
				console.error('❌ Database disconnection failed:', error);
				throw error;
			}
		}
	}

	static async healthCheck(): Promise<{ status: 'healthy' | 'unhealthy'; latency?: number; error?: string }> {
		try {
			const client = DatabaseConfig.getClient();
			const start = Date.now();
			
			await client.$queryRaw`SELECT 1`;
			
			const latency = Date.now() - start;
			
			return {
				status: 'healthy',
				latency
			};
		} catch (error) {
			return {
				status: 'unhealthy',
				error: error instanceof Error ? error.message : 'Unknown error'
			};
		}
	}

	static async migrate(): Promise<void> {
		const client = DatabaseConfig.getClient();
		
		try {
			// Run Prisma migrations
			const { execSync } = await import('child_process');
			execSync('npx prisma db push', { stdio: 'inherit' });
			console.log('📊 Database migrations completed');
		} catch (error) {
			console.error('❌ Database migration failed:', error);
			throw error;
		}
	}

	static async seed(): Promise<void> {
		const client = DatabaseConfig.getClient();
		
		try {
			// Check if data already exists
			const accountCount = await client.account.count();
			
			if (accountCount > 0) {
				console.log('📊 Database already seeded, skipping...');
				return;
			}

			// Create default account
			await client.account.create({
				data: {
					id: crypto.randomUUID(),
					name: 'N26 - Main Account',
					type: 'CHECKING',
					balance: 0,
					currency: 'EUR',
					isActive: true
				}
			});

			// Create default categories
			const categories = [
				{ name: 'Groceries', type: 'ESSENTIAL_EXPENSE', color: '#10B981', icon: 'ShoppingCart' },
				{ name: 'Transportation', type: 'ESSENTIAL_EXPENSE', color: '#3B82F6', icon: 'Car' },
				{ name: 'Entertainment', type: 'DISCRETIONARY_EXPENSE', color: '#8B5CF6', icon: 'Film' },
				{ name: 'Salary', type: 'INCOME', color: '#059669', icon: 'DollarSign' },
				{ name: 'Savings', type: 'SAVINGS', color: '#DC2626', icon: 'PiggyBank' }
			];

			for (const category of categories) {
				await client.category.create({
					data: {
						id: crypto.randomUUID(),
						...category
					}
				});
			}

			console.log('📊 Database seeded successfully');
		} catch (error) {
			console.error('❌ Database seeding failed:', error);
			throw error;
		}
	}
}