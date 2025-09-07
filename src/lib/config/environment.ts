import { dev } from '$app/environment';
import { env } from '$env/dynamic/private';
import { env as publicEnv } from '$env/dynamic/public';

export interface EnvironmentConfig {
	// App
	readonly NODE_ENV: string;
	readonly DEV: boolean;
	readonly PORT: number;
	readonly HOST: string;
	
	// Database
	readonly DATABASE_URL: string;
	
	// Security
	readonly SECRET_KEY: string;
	
	// Features
	readonly ENABLE_ANALYTICS: boolean;
	readonly ENABLE_LOGGING: boolean;
	
	// External APIs
	readonly CURRENCY_API_KEY?: string;
	
	// Public config
	readonly PUBLIC_APP_NAME: string;
	readonly PUBLIC_APP_VERSION: string;
}

class Environment {
	private static config: EnvironmentConfig | null = null;

	static getConfig(): EnvironmentConfig {
		if (!Environment.config) {
			Environment.config = Environment.loadConfig();
		}
		return Environment.config;
	}

	private static loadConfig(): EnvironmentConfig {
		const requiredVars = ['DATABASE_URL'];
		const missing = requiredVars.filter(varName => !env[varName]);

		if (missing.length > 0) {
			throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
		}

		return {
			// App
			NODE_ENV: env.NODE_ENV || 'development',
			DEV: dev,
			PORT: parseInt(env.PORT || '5173', 10),
			HOST: env.HOST || '0.0.0.0',
			
			// Database
			DATABASE_URL: env.DATABASE_URL || 'postgresql://user:password@localhost:5432/expense_tracker',
			
			// Security
			SECRET_KEY: env.SECRET_KEY || Environment.generateSecretKey(),
			
			// Features
			ENABLE_ANALYTICS: Environment.parseBoolean(env.ENABLE_ANALYTICS, true),
			ENABLE_LOGGING: Environment.parseBoolean(env.ENABLE_LOGGING, dev),
			
			// External APIs
			CURRENCY_API_KEY: env.CURRENCY_API_KEY,
			
			// Public config
			PUBLIC_APP_NAME: publicEnv.PUBLIC_APP_NAME || 'Expense Tracker',
			PUBLIC_APP_VERSION: publicEnv.PUBLIC_APP_VERSION || '1.0.0'
		};
	}

	private static parseBoolean(value: string | undefined, defaultValue: boolean): boolean {
		if (value === undefined) return defaultValue;
		return value.toLowerCase() === 'true';
	}

	private static generateSecretKey(): string {
		if (dev) {
			return 'dev-secret-key-not-for-production';
		}
		throw new Error('SECRET_KEY must be provided in production');
	}

	// Validation helpers
	static validateConfig(): void {
		const config = Environment.getConfig();
		
		if (!dev && config.SECRET_KEY === 'dev-secret-key-not-for-production') {
			throw new Error('SECRET_KEY must be set in production');
		}

		if (!config.DATABASE_URL.startsWith('postgresql://')) {
			console.warn('⚠️ DATABASE_URL should use postgresql:// protocol');
		}

		console.log('✅ Environment configuration validated');
	}

	// For testing
	static reset(): void {
		Environment.config = null;
	}
}

// Export singleton
export const environment = Environment.getConfig();

// Helper functions
export function isDevelopment(): boolean {
	return environment.DEV;
}

export function isProduction(): boolean {
	return environment.NODE_ENV === 'production';
}

export function isTest(): boolean {
	return environment.NODE_ENV === 'test';
}

export function validateEnvironment(): void {
	Environment.validateConfig();
}

// For testing
export function resetEnvironment(): void {
	Environment.reset();
}