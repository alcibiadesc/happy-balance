import type { Transaction, Category } from '$lib/types/transaction';

export interface PeriodStatsData {
  income: number;
  expenses: number;
  essentialExpenses: number;
  discretionaryExpenses: number;
  investmentExpenses: number;
  uncategorizedExpenses: number;
  expensesWithoutInvestments: number;
  uncategorizedExpensesOnly: number;
  balance: number;
}

const isComputableTransaction = (transaction: Transaction, categories: Category[]): boolean => {
  const category = categories.find(c => c.id === transaction.categoryId);
  return !category || category.type !== 'no_compute';
};

const isNotHidden = (transaction: Transaction): boolean => !transaction.hidden;

const isIncome = (transaction: Transaction): boolean => transaction.amount > 0;

const isExpense = (transaction: Transaction): boolean => transaction.amount < 0;

const hasCategory = (transaction: Transaction): boolean => !!transaction.categoryId;

const getCategoryType = (transaction: Transaction, categories: Category[]): string | undefined => {
  const category = categories.find(c => c.id === transaction.categoryId);
  return category?.type;
};

const sumAmount = (transactions: Transaction[]): number =>
  transactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);

const filterByType = (transactions: Transaction[], type: string, categories: Category[]): Transaction[] =>
  transactions.filter(t => getCategoryType(t, categories) === type);

const filterUncategorized = (transactions: Transaction[]): Transaction[] =>
  transactions.filter(t => !hasCategory(t));

const filterNotInvestment = (transactions: Transaction[], categories: Category[]): Transaction[] =>
  transactions.filter(t => {
    const categoryType = getCategoryType(t, categories);
    return !categoryType || categoryType !== 'investment';
  });

const safeguardNumber = (value: number): number =>
  isNaN(value) ? 0 : value;

export const calculatePeriodStats = (
  transactions: Transaction[],
  categories: Category[]
): PeriodStatsData => {
  // Pipeline: filter visible and computable transactions
  const visibleTransactions = transactions.filter(isNotHidden);
  const computedTransactions = visibleTransactions.filter(t => isComputableTransaction(t, categories));

  // Separate income and expenses
  const incomeTransactions = computedTransactions.filter(isIncome);
  const expenseTransactions = computedTransactions.filter(isExpense);

  // Calculate totals
  const income = incomeTransactions.reduce((sum, t) => sum + t.amount, 0);
  const totalExpenses = sumAmount(expenseTransactions);

  // Calculate expense categories
  const essentialExpenses = sumAmount(filterByType(expenseTransactions, 'essential', categories));
  const discretionaryExpenses = sumAmount(filterByType(expenseTransactions, 'discretionary', categories));
  const investmentExpenses = sumAmount(filterByType(expenseTransactions, 'investment', categories));
  const uncategorizedExpenses = sumAmount(filterUncategorized(expenseTransactions));

  // Calculate expenses without investments for breakdown
  const expensesWithoutInvestments = sumAmount(filterNotInvestment(expenseTransactions, categories));
  const uncategorizedExpensesOnly = sumAmount(
    filterUncategorized(filterNotInvestment(expenseTransactions, categories))
  );

  // Calculate balance
  const balance = income - totalExpenses;

  return {
    income: safeguardNumber(income),
    expenses: safeguardNumber(totalExpenses),
    essentialExpenses: safeguardNumber(essentialExpenses),
    discretionaryExpenses: safeguardNumber(discretionaryExpenses),
    investmentExpenses: safeguardNumber(investmentExpenses),
    uncategorizedExpenses: safeguardNumber(uncategorizedExpenses),
    expensesWithoutInvestments: safeguardNumber(expensesWithoutInvestments),
    uncategorizedExpensesOnly: safeguardNumber(uncategorizedExpensesOnly),
    balance: safeguardNumber(balance)
  };
};