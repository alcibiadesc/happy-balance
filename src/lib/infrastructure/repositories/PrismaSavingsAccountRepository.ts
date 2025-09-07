import { SavingsAccount, SavingsAccountType, type SavingsAccountData } from '../../domain/entities/SavingsAccount.js';
import { SavingsAccountId } from '../../domain/value-objects/SavingsAccountId.js';
import { Money } from '../../domain/value-objects/Money.js';
import type { SavingsAccountRepository } from '../../domain/repositories/SavingsAccountRepository.js';
import { prisma } from '../database/prisma.js';

export class PrismaSavingsAccountRepository implements SavingsAccountRepository {
  
  async findAll(): Promise<SavingsAccount[]> {
    const savingsAccounts = await prisma.savingsAccount.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    });

    return savingsAccounts.map(this.toDomain);
  }

  async findById(id: SavingsAccountId): Promise<SavingsAccount | null> {
    const savingsAccount = await prisma.savingsAccount.findUnique({
      where: {
        id: id.value
      }
    });

    return savingsAccount ? this.toDomain(savingsAccount) : null;
  }

  async findActive(): Promise<SavingsAccount[]> {
    const savingsAccounts = await prisma.savingsAccount.findMany({
      where: {
        isActive: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return savingsAccounts.map(this.toDomain);
  }

  async save(savingsAccount: SavingsAccount): Promise<SavingsAccount> {
    const data = this.toPersistence(savingsAccount);
    
    const created = await prisma.savingsAccount.create({
      data
    });

    return this.toDomain(created);
  }

  async update(savingsAccount: SavingsAccount): Promise<SavingsAccount> {
    const data = this.toPersistence(savingsAccount);
    const { id, ...updateData } = data;
    
    const updated = await prisma.savingsAccount.update({
      where: {
        id: savingsAccount.id.value
      },
      data: updateData
    });

    return this.toDomain(updated);
  }

  async delete(id: SavingsAccountId): Promise<void> {
    await prisma.savingsAccount.delete({
      where: {
        id: id.value
      }
    });
  }

  async getTotalSavingsBalance(currency: string = 'EUR'): Promise<number> {
    const result = await prisma.savingsAccount.aggregate({
      where: {
        isActive: true,
        currency: currency
      },
      _sum: {
        balance: true
      }
    });

    return result._sum.balance || 0;
  }

  private toDomain(prismaEntity: any): SavingsAccount {
    const data: SavingsAccountData = {
      id: new SavingsAccountId(prismaEntity.id),
      name: prismaEntity.name,
      type: prismaEntity.type as SavingsAccountType,
      balance: new Money(prismaEntity.balance, prismaEntity.currency),
      goalAmount: prismaEntity.goalAmount ? new Money(prismaEntity.goalAmount, prismaEntity.currency) : undefined,
      currency: prismaEntity.currency,
      isActive: prismaEntity.isActive,
      description: prismaEntity.description || undefined,
      createdAt: prismaEntity.createdAt,
      updatedAt: prismaEntity.updatedAt
    };

    return new SavingsAccount(data);
  }

  private toPersistence(domainEntity: SavingsAccount): any {
    return {
      id: domainEntity.id.value,
      name: domainEntity.name,
      type: domainEntity.type,
      balance: domainEntity.balance.amount,
      goalAmount: domainEntity.goalAmount?.amount || null,
      currency: domainEntity.currency,
      isActive: domainEntity.isActive,
      description: domainEntity.description || null,
      createdAt: domainEntity.createdAt,
      updatedAt: domainEntity.updatedAt
    };
  }
}