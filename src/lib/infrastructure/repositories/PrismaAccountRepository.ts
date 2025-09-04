import type { IAccountRepository } from '$lib/domain/repositories/IAccountRepository.js';
import { Account } from '$lib/domain/entities/Account.js';
import { AccountId } from '$lib/domain/value-objects/AccountId.js';
import { Money } from '$lib/domain/value-objects/Money.js';
import { prisma } from '../database/prisma.js';

export class PrismaAccountRepository implements IAccountRepository {
  async findById(id: AccountId): Promise<Account | null> {
    const account = await prisma.account.findUnique({
      where: { id: id.value }
    });

    if (!account) return null;

    return new Account(
      new AccountId(account.id),
      account.name,
      account.type as any,
      new Money(account.balance, account.currency),
      account.isActive,
      account.createdAt,
      account.updatedAt
    );
  }

  async findByType(type: string): Promise<Account[]> {
    const accounts = await prisma.account.findMany({
      where: { 
        type,
        isActive: true 
      },
      orderBy: { createdAt: 'asc' }
    });

    return accounts.map(account => new Account(
      new AccountId(account.id),
      account.name,
      account.type as any,
      new Money(account.balance, account.currency),
      account.isActive,
      account.createdAt,
      account.updatedAt
    ));
  }

  async findAll(): Promise<Account[]> {
    const accounts = await prisma.account.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'asc' }
    });

    return accounts.map(account => new Account(
      new AccountId(account.id),
      account.name,
      account.type as any,
      new Money(account.balance, account.currency),
      account.isActive,
      account.createdAt,
      account.updatedAt
    ));
  }

  async save(account: Account): Promise<void> {
    await prisma.account.upsert({
      where: { id: account.id.value },
      update: {
        name: account.name,
        type: account.type,
        balance: account.balance.amount,
        currency: account.balance.currency,
        isActive: account.isActive,
        updatedAt: account.updatedAt || new Date()
      },
      create: {
        id: account.id.value,
        name: account.name,
        type: account.type,
        balance: account.balance.amount,
        currency: account.balance.currency,
        isActive: account.isActive,
        createdAt: account.createdAt || new Date(),
        updatedAt: account.updatedAt || new Date()
      }
    });
  }

  async delete(id: AccountId): Promise<void> {
    await prisma.account.update({
      where: { id: id.value },
      data: { isActive: false }
    });
  }
}