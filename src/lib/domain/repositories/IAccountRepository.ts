import type { Account } from '../entities/Account.js';
import type { AccountId } from '../value-objects/AccountId.js';

export interface IAccountRepository {
  findById(id: AccountId): Promise<Account | null>;
  findByType(type: string): Promise<Account[]>;
  findAll(): Promise<Account[]>;
  save(account: Account): Promise<void>;
  delete(id: AccountId): Promise<void>;
}