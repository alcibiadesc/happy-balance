import type { Transaction } from '$lib/types/transaction';

export interface GroupingState {
  collapsedGroups: Set<string>;
  allExpanded: boolean;
}

export interface TransactionGroup {
  date: string;
  items: Transaction[];
}

export const createInitialGroupingState = (): GroupingState => ({
  collapsedGroups: new Set(),
  allExpanded: true
});

export const groupingActions = {
  toggleGroup: (state: GroupingState, date: string): GroupingState => {
    const newCollapsed = new Set(state.collapsedGroups);

    if (newCollapsed.has(date)) {
      newCollapsed.delete(date);
    } else {
      newCollapsed.add(date);
    }

    return {
      collapsedGroups: newCollapsed,
      allExpanded: newCollapsed.size === 0
    };
  },

  collapseAll: (state: GroupingState, dates: string[]): GroupingState => ({
    collapsedGroups: new Set(dates),
    allExpanded: false
  }),

  expandAll: (): GroupingState => ({
    collapsedGroups: new Set(),
    allExpanded: true
  })
};

export const groupTransactionsByDate = (
  transactions: Transaction[]
): TransactionGroup[] => {
  const groups = new Map<string, Transaction[]>();

  transactions.forEach(transaction => {
    const date = transaction.date;
    if (!groups.has(date)) {
      groups.set(date, []);
    }
    groups.get(date)!.push(transaction);
  });

  return Array.from(groups.entries())
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([date, items]) => ({
      date,
      items: items.sort((a, b) => {
        const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return bTime - aTime;
      })
    }));
};

export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const isToday = date.toDateString() === today.toDateString();
  const isYesterday = date.toDateString() === yesterday.toDateString();

  if (isToday) {
    return 'Hoy';
  } else if (isYesterday) {
    return 'Ayer';
  } else {
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
    };
    return date.toLocaleDateString('es-ES', options);
  }
};