import { w as writable } from "./index.js";
const currencies = {
  EUR: {
    code: "EUR",
    symbol: "€",
    name: "Euro",
    position: "after",
    locale: "es-ES"
  },
  USD: {
    code: "USD",
    symbol: "$",
    name: "US Dollar",
    position: "before",
    locale: "en-US"
  },
  GBP: {
    code: "GBP",
    symbol: "£",
    name: "British Pound",
    position: "before",
    locale: "en-GB"
  },
  JPY: {
    code: "JPY",
    symbol: "¥",
    name: "Japanese Yen",
    position: "before",
    locale: "ja-JP"
  }
};
const currentCurrency = writable("EUR");
function formatCurrency(amount, currencyCode) {
  const code = currencyCode || "EUR";
  const currency = currencies[code];
  if (!currency) {
    return `${Math.abs(amount).toFixed(0)}`;
  }
  const formattedAmount = new Intl.NumberFormat(currency.locale, {
    style: "currency",
    currency: currency.code,
    minimumFractionDigits: currency.code === "JPY" ? 0 : 0,
    maximumFractionDigits: currency.code === "JPY" ? 0 : 0
  }).format(Math.abs(amount));
  return formattedAmount;
}
function setCurrency(currencyCode) {
  currentCurrency.set(currencyCode);
}
export {
  currencies as a,
  currentCurrency as c,
  formatCurrency as f,
  setCurrency as s
};
