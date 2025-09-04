import { Transaction } from '$lib/domain/entities/Transaction.js';
import { Category } from '$lib/domain/entities/Category.js';
import { TransactionId } from '$lib/domain/value-objects/TransactionId.js';
import { CategoryId } from '$lib/domain/value-objects/CategoryId.js';
import { AccountId } from '$lib/domain/value-objects/AccountId.js';

// Sample Categories
export const demoCategories: Category[] = [
  new Category(
    new CategoryId('demo-cat-001'),
    'Alimentación',
    'ESSENTIAL_EXPENSE',
    '#DC2626',
    'ShoppingCart',
    true
  ),
  new Category(
    new CategoryId('demo-cat-002'),
    'Transporte',
    'ESSENTIAL_EXPENSE',
    '#DC2626',
    'Car',
    true
  ),
  new Category(
    new CategoryId('demo-cat-003'),
    'Entretenimiento',
    'DISCRETIONARY_EXPENSE',
    '#D97706',
    'Music',
    true
  ),
  new Category(
    new CategoryId('demo-cat-004'),
    'Salud',
    'ESSENTIAL_EXPENSE',
    '#DC2626',
    'Heart',
    true
  ),
  new Category(
    new CategoryId('demo-cat-005'),
    'Ingresos',
    'INCOME',
    '#059669',
    'Briefcase',
    true
  ),
  new Category(
    new CategoryId('demo-cat-006'),
    'Restaurantes',
    'DISCRETIONARY_EXPENSE',
    '#D97706',
    'Coffee',
    true
  ),
  new Category(
    new CategoryId('demo-cat-007'),
    'Viajes',
    'DISCRETIONARY_EXPENSE',
    '#D97706',
    'Plane',
    true
  ),
  new Category(
    new CategoryId('demo-cat-008'),
    'Ahorros',
    'SAVINGS',
    '#4F46E5',
    'Home',
    true
  ),
];

// Sample Transactions - Temporarily empty to avoid constructor issues
export const demoTransactions: Transaction[] = [
  // TODO: Fix Transaction constructor to match domain entity requirements
  // The current Transaction entity requires many more parameters than what's provided here
];