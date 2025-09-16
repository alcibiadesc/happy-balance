import { writable } from "svelte/store";

export interface Currency {
  code: string;
  symbol: string;
  name: string;
  position: "before" | "after";
  locale: string;
}

export const currencies: Record<string, Currency> = {
  EUR: {
    code: "EUR",
    symbol: "€",
    name: "Euro",
    position: "after",
    locale: "es-ES",
  },
  USD: {
    code: "USD",
    symbol: "$",
    name: "US Dollar",
    position: "before",
    locale: "en-US",
  },
  GBP: {
    code: "GBP",
    symbol: "£",
    name: "British Pound",
    position: "before",
    locale: "en-GB",
  },
  JPY: {
    code: "JPY",
    symbol: "¥",
    name: "Japanese Yen",
    position: "before",
    locale: "ja-JP",
  },
};

// Store para la moneda actual
export const currentCurrency = writable<string>("EUR");

// Función para formatear cantidades con la moneda actual
export function formatCurrency(amount: number, currencyCode?: string): string {
  const code = currencyCode || "EUR";
  const currency = currencies[code];

  if (!currency) {
    return `${Math.abs(amount).toFixed(0)}`;
  }

  const formattedAmount = new Intl.NumberFormat(currency.locale, {
    style: "currency",
    currency: currency.code,
    minimumFractionDigits: currency.code === "JPY" ? 0 : 0,
    maximumFractionDigits: currency.code === "JPY" ? 0 : 0,
  }).format(Math.abs(amount));

  return formattedAmount;
}

// Función para cambiar moneda
export function setCurrency(currencyCode: string) {
  currentCurrency.set(currencyCode);
}
