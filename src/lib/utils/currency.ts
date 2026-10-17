/**
 * Utilitaires de formatage monétaire français.
 * - Séparateur de milliers français (espace insécable fine ou espace)
 * - Gestion propre des montants négatifs (avec le signe moins typographique '−')
 * - Traitement strict des montants entiers
 * - Support étendu multi-devises (FCFA, EUR, USD, CAD, GBP, GNF, MAD)
 */

export type SupportedCurrency = "FCFA" | "EUR" | "USD" | "NGN";

export interface CurrencyConfig {
  code: SupportedCurrency;
  symbol: string;
  label: string;
}

export const SUPPORTED_CURRENCIES: CurrencyConfig[] = [
  { code: "FCFA", symbol: "FCFA", label: "FCFA — Franc CFA" },
  { code: "EUR", symbol: "€", label: "EUR (€) — Euro" },
  { code: "USD", symbol: "$", label: "USD ($) — Dollar américain" },
  { code: "NGN", symbol: "₦", label: "Naira (₦) — Naira nigérian" },
];

/**
 * Renvoie le symbole d'affichage approprié pour une devise donnée.
 */
export function getCurrencySymbol(currency: string = "FCFA"): string {
  const normalized = currency.trim().toUpperCase();
  switch (normalized) {
    case "EUR":
    case "€":
      return "€";
    case "USD":
    case "$":
      return "$";
    case "NGN":
    case "NAIRA":
    case "₦":
      return "₦";
    case "FCFA":
    case "XOF":
    case "XAF":
      return "FCFA";
    default:
      return currency;
  }
}

export function formatAmount(amount: number, currency: string = "FCFA"): string {
  const rounded = Math.round(amount);
  const formattedNumber = rounded.toLocaleString("fr-FR");
  const symbol = getCurrencySymbol(currency);
  return `${formattedNumber} ${symbol}`;
}

export function formatSignedAmount(amount: number, currency: string = "FCFA"): string {
  const rounded = Math.round(amount);
  const prefix = rounded < 0 ? "− " : "";
  const formattedNumber = Math.abs(rounded).toLocaleString("fr-FR");
  const symbol = getCurrencySymbol(currency);
  return `${prefix}${formattedNumber} ${symbol}`;
}
