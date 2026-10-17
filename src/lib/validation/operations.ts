import { z } from "zod";

/**
 * Schémas de validation Zod pour les opérations financières (Lot 3).
 * Invariants métier d'AGENTS.md :
 * - Montants stockés sous forme de nombres entiers (jamais de flottants).
 * - Montants supérieurs à 0 pour chaque dépense, gain ou prêt.
 * - Le salaire mensuel peut être 0 ou plus.
 */

export const dateStringSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Format de date invalide (YYYY-MM-DD attendu)");

export const localIdSchema = z.string().uuid("Identifiant local UUID invalide");

export const expenseInputSchema = z.object({
  amount: z
    .number({ invalid_type_error: "Le montant doit être un nombre entier" })
    .int("Le montant doit être un nombre entier sans décimales")
    .positive("Le montant doit être supérieur à 0"),
  category: z.string().trim().min(1, "La catégorie est obligatoire"),
  date: dateStringSchema,
  note: z.string().trim().optional().default(""),
  plannedExpenseId: z.string().uuid().nullable().optional().default(null),
  localId: localIdSchema,
});

export const incomeInputSchema = z.object({
  amount: z
    .number({ invalid_type_error: "Le montant doit être un nombre entier" })
    .int("Le montant doit être un nombre entier sans décimales")
    .positive("Le montant doit être supérieur à 0"),
  source: z.string().trim().optional().default(""),
  date: dateStringSchema,
  localId: localIdSchema,
});

export const loanInputSchema = z.object({
  direction: z.enum(["borrowed", "given"], {
    errorMap: () => ({ message: "Sens du prêt invalide (emprunté ou prêté requis)" }),
  }),
  amount: z
    .number({ invalid_type_error: "Le montant doit être un nombre entier" })
    .int("Le montant doit être un nombre entier sans décimales")
    .positive("Le montant doit être supérieur à 0"),
  counterpart: z
    .string()
    .trim()
    .min(1, "Le nom de la personne ou de l'organisme est obligatoire"),
  date: dateStringSchema,
  note: z.string().trim().optional().default(""),
  localId: localIdSchema,
});

export const salaryInputSchema = z.object({
  salary: z
    .number({ invalid_type_error: "Le salaire doit être un nombre entier" })
    .int("Le salaire doit être un nombre entier sans décimales")
    .nonnegative("Le salaire ne peut pas être négatif"),
});

export const plannedExpenseInputSchema = z.object({
  name: z.string().trim().min(1, "Le nom de la dépense prévue est obligatoire").max(100, "Le nom ne doit pas dépasser 100 caractères"),
  amount: z
    .number({ invalid_type_error: "Le montant prévu doit être un nombre entier" })
    .int("Le montant prévu doit être un nombre entier sans décimales")
    .positive("Le montant prévu doit être supérieur à 0"),
  category: z.string().trim().min(1, "La catégorie est obligatoire"),
  period: z.enum(["day", "week", "month"], {
    errorMap: () => ({ message: "Période invalide (jour, semaine ou mois requis)" }),
  }),
  startDate: dateStringSchema,
  isRecurring: z.boolean().optional().default(false),
  localId: localIdSchema,
});

export type ExpenseInput = z.infer<typeof expenseInputSchema>;
export type IncomeInput = z.infer<typeof incomeInputSchema>;
export type LoanInput = z.infer<typeof loanInputSchema>;
export type SalaryInput = z.infer<typeof salaryInputSchema>;
export type PlannedExpenseInput = z.infer<typeof plannedExpenseInputSchema>;
