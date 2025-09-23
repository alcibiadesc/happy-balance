import type { Transaction, Category } from '$lib/types/transaction';

export const findMatchingTransactions = (
  transaction: Transaction,
  allTransactions: Transaction[],
  threshold: number = 0.8
): Transaction[] => {
  const cleanDescription = (desc: string): string => {
    return desc
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  };

  const calculateSimilarity = (str1: string, str2: string): number => {
    const clean1 = cleanDescription(str1);
    const clean2 = cleanDescription(str2);

    if (clean1 === clean2) return 1;

    const words1 = new Set(clean1.split(' '));
    const words2 = new Set(clean2.split(' '));

    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);

    return intersection.size / union.size;
  };

  const targetDesc = transaction.description;
  const targetMerchant = transaction.merchant;

  return allTransactions.filter(t => {
    if (t.id === transaction.id) return false;
    if (t.categoryId) return false;

    const descSimilarity = calculateSimilarity(targetDesc, t.description);
    const merchantSimilarity = calculateSimilarity(targetMerchant, t.merchant);

    const overallSimilarity = Math.max(descSimilarity, merchantSimilarity);
    return overallSimilarity >= threshold;
  });
};

export const getCategoryById = (
  categories: Category[],
  id?: string
): Category | undefined => {
  if (!id) return undefined;
  return categories.find(c => c.id === id);
};

export const formatAmount = (amount: number): string => {
  if (isNaN(amount)) return '€0.00';
  const abs = Math.abs(amount);
  const formatted = abs.toLocaleString('es-ES', {
    style: 'currency',
    currency: 'EUR'
  });
  return amount < 0 && abs !== 0 ? `-${formatted}` : formatted;
};