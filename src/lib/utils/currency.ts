/**
 * Utilitaires de formatage monétaire français.
 * - Séparateur de milliers français (espace insécable fine ou espace)
 * - Gestion propre des montants négatifs (avec le signe moins typographique '−')
 * - Traitement strict des montants entiers
 * - Support étendu multi-devises (FCFA, EUR, USD, CAD, GBP, GNF, MAD)
 */

export type SupportedCurrency =
  | "FCFA"
  | "EUR"
  | "USD"
  | "CAD"
  | "GBP"
  | "GNF"
  | "MAD";

export interface CurrencyConfig {
  code: SupportedCurrency;
  symbol: string;
  label: string;
}

export const SUPPORTED_CURRENCIES: CurrencyConfig[] = [
  { code: "FCFA", symbol: "FCFA", label: "FCFA — Franc CFA" },
  { code: "EUR", symbol: "€", label: "EUR (€) — Euro" },
  { code: "USD", symbol: "$", label: "USD ($) — Dollar américain" },
  { code: "CAD", symbol: "CA$", label: "CAD ($) — Dollar canadien" },
  { code: "GBP", symbol: "£", label: "GBP (£) — Livre sterling" },
  { code: "GNF", symbol: "FG", label: "GNF (FG) — Franc guinéen" },
  { code: "MAD", symbol: "DH", label: "MAD (DH) — Dirham marocain" },
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
    case "CAD":
    case "CA$":
      return "CA$";
    case "GBP":
    case "£":
      return "£";
    case "GNF":
    case "FG":
      return "FG";
    case "MAD":
    case "DH":
      return "DH";
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
