import { Logger } from '$lib/shared/utils/logger.js';
import { PrismaClient } from '@prisma/client';
import { PrismaTransactionRepository } from '$lib/infrastructure/repositories/PrismaTransactionRepository.js';
import { PrismaAccountRepository } from '$lib/infrastructure/repositories/PrismaAccountRepository.js';
import { PrismaCategoryRepository } from '$lib/infrastructure/repositories/PrismaCategoryRepository.js';
import { CSVParserFactory } from '$lib/infrastructure/parsers/CSVParserFactory.js';
import { ImportTransactionsUseCase } from '$lib/application/use-cases/ImportTransactionsUseCase.js';
import { DashboardQuery } from '$lib/application/queries/DashboardQuery.js';
import { DatabaseConfig } from './database.js';
import { dev } from '$app/environment';

export interface ApplicationServices {
	// Core services
	logger: Logger;
	database: PrismaClient;
	
	// Repositories
	transactionRepository: PrismaTransactionRepository;
	accountRepository: PrismaAccountRepository;
	categoryRepository: PrismaCategoryRepository;
	
	// Infrastructure services
	csvParserFactory: CSVParserFactory;
	
	// Use cases
	importTransactionsUseCase: ImportTransactionsUseCase;
	
	// Queries
	dashboardQuery: DashboardQuery;
}

class DependencyContainer {
	private static instance: DependencyContainer;
	private services: ApplicationServices | null = null;

	private constructor() {}

	static getInstance(): DependencyContainer {
		if (!DependencyContainer.instance) {
			DependencyContainer.instance = new DependencyContainer();
		}
		return DependencyContainer.instance;
	}

	getServices(): ApplicationServices {
		if (!this.services) {
			this.services = this.createServices();
		}
		return this.services;
	}

	private createServices(): ApplicationServices {
		// Core services
		const logger = new Logger({ level: dev ? 'debug' : 'info' });
		const database = DatabaseConfig.createClient();

		// Repositories
		const transactionRepository = new PrismaTransactionRepository(database, logger);
		const accountRepository = new PrismaAccountRepository(database, logger);
		const categoryRepository = new PrismaCategoryRepository(database, logger);

		// Infrastructure services
		const csvParserFactory = new CSVParserFactory();

		// Use cases
		const importTransactionsUseCase = new ImportTransactionsUseCase({
			transactionRepository,
			accountRepository,
			csvParserFactory,
			logger
		});

		// Queries
		const dashboardQuery = new DashboardQuery({
			transactionRepository,
			accountRepository,
			categoryRepository,
			logger
		});

		return {
			logger,
			database,
			transactionRepository,
			accountRepository,
			categoryRepository,
			csvParserFactory,
			importTransactionsUseCase,
			dashboardQuery
		};
	}

	// For testing - allow dependency injection
	setServices(services: Partial<ApplicationServices>): void {
		this.services = { ...this.getServices(), ...services };
	}

	// Reset for testing
	reset(): void {
		this.services = null;
	}
}

// Singleton instance
export const dependencies = DependencyContainer.getInstance();

// Helper functions for common patterns
export function getServices(): ApplicationServices {
	return dependencies.getServices();
}

export function getLogger(): Logger {
	return dependencies.getServices().logger;
}

export function getDatabase(): PrismaClient {
	return dependencies.getServices().database;
}

// For testing purposes
export function setTestServices(services: Partial<ApplicationServices>): void {
	dependencies.setServices(services);
}

export function resetDependencies(): void {
	dependencies.reset();
}