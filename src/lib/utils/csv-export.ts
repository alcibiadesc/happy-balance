import type { Transaction, Category } from "$lib/types/transaction";
import { t, currentLanguage } from "$lib/stores/i18n";
import { get } from "svelte/store";

export interface ExportOptions {
  includeHidden?: boolean;
  dateRange?: {
    start: string;
    end: string;
  };
}

function escapeCSVField(field: string | number): string {
  const stringField = String(field);
  // If field contains comma, quotes, or newlines, wrap in quotes and escape quotes
  if (
    stringField.includes(",") ||
    stringField.includes('"') ||
    stringField.includes("\n")
  ) {
    return `"${stringField.replace(/"/g, '""')}"`;
  }
  return stringField;
}

function formatAmount(amount: number): string {
  return amount.toFixed(2);
}

export function exportTransactionsToCSV(
  transactions: Transaction[],
  categories: Category[],
  options: ExportOptions = {},
): string {
  // Filter transactions based on options
  let filteredTransactions = [...transactions];

  // Filter hidden transactions if requested
  if (!options.includeHidden) {
    filteredTransactions = filteredTransactions.filter((t) => !t.hidden);
  }

  // Filter by date range if provided
  if (options.dateRange) {
    const { start, end } = options.dateRange;
    filteredTransactions = filteredTransactions.filter((t) => {
      return t.date >= start && t.date <= end;
    });
  }

  // Sort transactions by date (newest first)
  filteredTransactions.sort((a, b) => b.date.localeCompare(a.date));

  // Create category lookup
  const categoryLookup = new Map(categories.map((c) => [c.id, c]));

  // CSV Headers - Get current translation function
  const $t = get(t);
  const headers = [
    $t('transactions.date'),
    $t('transactions.time'),
    $t('csv_export.headers.description'),
    $t('transactions.merchant'),
    $t('csv_export.headers.category'),
    $t('csv_export.headers.category_type'),
    $t('transactions.amount'),
    $t('common.status'),
  ];

  // Build CSV content
  const csvLines = [headers.map((h) => escapeCSVField(h)).join(",")];

  filteredTransactions.forEach((transaction) => {
    const category = transaction.categoryId
      ? categoryLookup.get(transaction.categoryId)
      : null;

    const row = [
      transaction.date,
      transaction.time || "",
      transaction.description,
      transaction.merchant,
      category?.name || "",
      category?.type || "",
      formatAmount(transaction.amount),
      transaction.hidden ? $t('common.hidden') : $t('common.visible'),
    ];

    csvLines.push(row.map((field) => escapeCSVField(field)).join(","));
  });

  return csvLines.join("\n");
}

export function downloadCSV(csvContent: string, filename: string): void {
  // Create blob with BOM for proper Excel encoding
  const BOM = "\uFEFF";
  const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8" });

  // Create download link
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;

  // Trigger download
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Clean up
  window.URL.revokeObjectURL(url);
}

export function generateFilename(dateRange?: {
  start: string;
  end: string;
}): string {
  const now = new Date();
  const timestamp = now.toISOString().split("T")[0];

  if (dateRange) {
    const startDate = dateRange.start.replace(/-/g, "");
    const endDate = dateRange.end.replace(/-/g, "");
    return `transacciones_${startDate}_${endDate}.csv`;
  }

  return `transacciones_${timestamp}.csv`;
}
