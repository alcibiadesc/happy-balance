import { SavingsAccount } from '../entities/SavingsAccount.js';
import { SavingsAccountId } from '../value-objects/SavingsAccountId.js';

export interface SavingsAccountRepository {
  findAll(): Promise<SavingsAccount[]>;
  findById(id: SavingsAccountId): Promise<SavingsAccount | null>;
  findActive(): Promise<SavingsAccount[]>;
  save(savingsAccount: SavingsAccount): Promise<SavingsAccount>;
  update(savingsAccount: SavingsAccount): Promise<SavingsAccount>;
  delete(id: SavingsAccountId): Promise<void>;
  getTotalSavingsBalance(currency?: string): Promise<number>;
}