/**
 * Types TypeScript stricts pour le domaine et la base de données.
 * Conforme aux règles d'AGENTS.md :
 * - Noms en anglais, commentaires en français
 * - Pas de type `any`
 * - Montants stockés sous forme de nombres entiers (en plus petite unité monétaire)
 * - Champs de synchronisation hors ligne : localId, lastModifiedAt, syncStatus
 */

export type SyncStatus = "pending" | "synced";

export type PeriodType = "day" | "week" | "month";

export type LoanDirection = "borrowed" | "given";

export interface UserProfile {
  id: string;
  name: string;
  firstname: string;
  email: string;
  currency: string;
  timezone: string;
  theme: "light" | "dark" | "system";
  monthlySalary: number; // Montant entier
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string; // Nom d'icône Lucide
  userId?: string | null; // null si catégorie globale par défaut
}

export interface PlannedExpense {
  id: string;
  userId: string;
  name: string;
  plannedAmount: number; // Montant entier
  category: string;
  period: PeriodType;
  startDate: string; // Format YYYY-MM-DD
  localId: string; // UUID généré sur l'appareil
  lastModifiedAt: string; // ISO 8601
  syncStatus: SyncStatus;
}

export interface Expense {
  id: string;
  userId: string;
  amount: number; // Montant entier
  category: string;
  date: string; // Format YYYY-MM-DD
  note?: string;
  plannedExpenseId?: string | null; // null = dépense imprévue (invariant métier)
  localId: string; // UUID généré sur l'appareil
  lastModifiedAt: string; // ISO 8601
  syncStatus: SyncStatus;
}

export interface Income {
  id: string;
  userId: string;
  amount: number; // Montant entier
  source?: string;
  date: string; // Format YYYY-MM-DD
  localId: string; // UUID généré sur l'appareil
  lastModifiedAt: string; // ISO 8601
  syncStatus: SyncStatus;
}

export interface Loan {
  id: string;
  userId: string;
  direction: LoanDirection; // "borrowed" (emprunté, rentrée) | "given" (prêté, sortie)
  amount: number; // Montant entier
  counterpart: string; // Personne ou organisme
  date: string; // Format YYYY-MM-DD
  note?: string;
  localId: string; // UUID généré sur l'appareil
  lastModifiedAt: string; // ISO 8601
  syncStatus: SyncStatus;
}
