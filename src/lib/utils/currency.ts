/**
 * Utilitaires de formatage monétaire français.
 * - Séparateur de milliers français (espace insécable fine ou espace)
 * - Gestion propre des montants négatifs (avec le signe moins typographique '−')
 * - Traitement strict des montants entiers
 */

export function formatAmount(amount: number, currency: string = "FCFA"): string {
  const rounded = Math.round(amount);
  const formattedNumber = rounded.toLocaleString("fr-FR");
  return `${formattedNumber} ${currency}`;
}

export function formatSignedAmount(amount: number, currency: string = "FCFA"): string {
  const rounded = Math.round(amount);
  const prefix = rounded < 0 ? "− " : "";
  const formattedNumber = Math.abs(rounded).toLocaleString("fr-FR");
  return `${prefix}${formattedNumber} ${currency}`;
}
