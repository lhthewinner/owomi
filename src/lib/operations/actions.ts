"use server";

import { createServerSideClient } from "@/lib/supabase/server";
import {
  expenseInputSchema,
  incomeInputSchema,
  loanInputSchema,
  salaryInputSchema,
  type ExpenseInput,
  type IncomeInput,
  type LoanInput,
} from "@/lib/validation/operations";
import { content } from "@/content/fr";
import {
  getTodayDateString,
  getCurrentWeekRange,
  getCurrentMonthRange,
} from "@/lib/utils/date";
import type { Database } from "@/types/database";

type OperationResult<T = unknown> = {
  success: boolean;
  message?: string;
  data?: T;
};

/**
 * Enregistrement d'une dépense (Story D1).
 * Sans rattachement à une prévue, elle est enregistrée avec planned_expense_id = null (imprévue).
 */
export async function createExpenseAction(
  input: ExpenseInput
): Promise<OperationResult<Database["public"]["Tables"]["expenses"]["Row"]>> {
  const parsed = expenseInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      message: parsed.error.issues[0]?.message || "Données de dépense invalides",
    };
  }

  const supabase = await createServerSideClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, message: content.auth.errors.invalidCredentials };
  }

  const { data, error } = await supabase
    .from("expenses")
    .insert({
      user_id: user.id,
      amount: parsed.data.amount,
      category: parsed.data.category,
      date: parsed.data.date,
      note: parsed.data.note || "",
      planned_expense_id: parsed.data.plannedExpenseId || null,
      local_id: parsed.data.localId,
      sync_status: "synced",
    })
    .select()
    .single();

  if (error) {
    return { success: false, message: "Impossible d'enregistrer la dépense." };
  }

  return { success: true, data };
}

/**
 * Suppression d'une dépense (Story D4).
 */
export async function deleteExpenseAction(id: string): Promise<OperationResult> {
  const supabase = await createServerSideClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, message: content.auth.errors.invalidCredentials };
  }

  const { error } = await supabase
    .from("expenses")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return { success: false, message: "Impossible de supprimer la dépense." };
  }

  return { success: true };
}

/**
 * Enregistrement d'un revenu hors salaire (Story R2).
 */
export async function createIncomeAction(
  input: IncomeInput
): Promise<OperationResult<Database["public"]["Tables"]["incomes"]["Row"]>> {
  const parsed = incomeInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      message: parsed.error.issues[0]?.message || "Données de revenu invalides",
    };
  }

  const supabase = await createServerSideClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, message: content.auth.errors.invalidCredentials };
  }

  const { data, error } = await supabase
    .from("incomes")
    .insert({
      user_id: user.id,
      amount: parsed.data.amount,
      source: parsed.data.source || "Revenu hors salaire",
      date: parsed.data.date,
      local_id: parsed.data.localId,
      sync_status: "synced",
    })
    .select()
    .single();

  if (error) {
    return { success: false, message: "Impossible d'enregistrer le revenu." };
  }

  return { success: true, data };
}

/**
 * Suppression d'un revenu hors salaire (Story R3).
 */
export async function deleteIncomeAction(id: string): Promise<OperationResult> {
  const supabase = await createServerSideClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, message: content.auth.errors.invalidCredentials };
  }

  const { error } = await supabase
    .from("incomes")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return { success: false, message: "Impossible de supprimer le revenu." };
  }

  return { success: true };
}

/**
 * Enregistrement d'un prêt (Story L1).
 */
export async function createLoanAction(
  input: LoanInput
): Promise<OperationResult<Database["public"]["Tables"]["loans"]["Row"]>> {
  const parsed = loanInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      message: parsed.error.issues[0]?.message || "Données de prêt invalides",
    };
  }

  const supabase = await createServerSideClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, message: content.auth.errors.invalidCredentials };
  }

  const { data, error } = await supabase
    .from("loans")
    .insert({
      user_id: user.id,
      direction: parsed.data.direction,
      amount: parsed.data.amount,
      counterpart: parsed.data.counterpart,
      date: parsed.data.date,
      note: parsed.data.note || "",
      local_id: parsed.data.localId,
      sync_status: "synced",
    })
    .select()
    .single();

  if (error) {
    return { success: false, message: "Impossible d'enregistrer le prêt." };
  }

  return { success: true, data };
}

/**
 * Suppression d'un prêt.
 */
export async function deleteLoanAction(id: string): Promise<OperationResult> {
  const supabase = await createServerSideClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, message: content.auth.errors.invalidCredentials };
  }

  const { error } = await supabase
    .from("loans")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return { success: false, message: "Impossible de supprimer le prêt." };
  }

  return { success: true };
}

/**
 * Mise à jour du salaire mensuel dans le profil utilisateur (Story R1).
 */
export async function updateSalaryAction(salary: number): Promise<OperationResult> {
  const parsed = salaryInputSchema.safeParse({ salary });
  if (!parsed.success) {
    return { success: false, message: "Montant de salaire invalide" };
  }

  const supabase = await createServerSideClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, message: content.auth.errors.invalidCredentials };
  }

  const { error } = await supabase
    .from("profiles")
    .update({ monthly_salary: parsed.data.salary, updated_at: new Date().toISOString() })
    .eq("id", user.id);

  if (error) {
    return { success: false, message: "Impossible de mettre à jour le salaire." };
  }

  return { success: true };
}

/**
 * Récupération des revenus, prêts et profil pour l'écran Budget / Revenus (Story R1, R2, L1).
 */
export async function getIncomesAndLoansDataAction(): Promise<
  OperationResult<{
    salary: number;
    incomes: Database["public"]["Tables"]["incomes"]["Row"][];
    loans: Database["public"]["Tables"]["loans"]["Row"][];
  }>
> {
  const supabase = await createServerSideClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, message: content.auth.errors.invalidCredentials };
  }

  const [profileRes, incomesRes, loansRes] = await Promise.all([
    supabase.from("profiles").select("monthly_salary").eq("id", user.id).single(),
    supabase.from("incomes").select("*").eq("user_id", user.id).order("date", { ascending: false }),
    supabase.from("loans").select("*").eq("user_id", user.id).order("date", { ascending: false }),
  ]);

  return {
    success: true,
    data: {
      salary: profileRes.data?.monthly_salary || 0,
      incomes: incomesRes.data || [],
      loans: loansRes.data || [],
    },
  };
}

export type RecentOperation =
  | {
      kind: "expense";
      id: string;
      amount: number;
      category: string;
      date: string;
      note: string;
      plannedExpenseId: string | null;
      createdAt: string;
    }
  | {
      kind: "income";
      id: string;
      amount: number;
      source: string;
      date: string;
      createdAt: string;
    }
  | {
      kind: "loan";
      id: string;
      amount: number;
      direction: "borrowed" | "given";
      counterpart: string;
      date: string;
      note: string;
      createdAt: string;
    };

/**
 * Récupération des dernières opérations combinées (dépenses, revenus, prêts) pour le tableau de bord.
 */
export async function getRecentOperationsAction(
  limitCount = 10
): Promise<OperationResult<RecentOperation[]>> {
  const supabase = await createServerSideClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, message: content.auth.errors.invalidCredentials };
  }

  const [expRes, incRes, loanRes] = await Promise.all([
    supabase
      .from("expenses")
      .select("*")
      .eq("user_id", user.id)
      .order("date", { ascending: false })
      .limit(limitCount),
    supabase
      .from("incomes")
      .select("*")
      .eq("user_id", user.id)
      .order("date", { ascending: false })
      .limit(limitCount),
    supabase
      .from("loans")
      .select("*")
      .eq("user_id", user.id)
      .order("date", { ascending: false })
      .limit(limitCount),
  ]);

  const ops: RecentOperation[] = [];

  (expRes.data || []).forEach((e) => {
    ops.push({
      kind: "expense",
      id: e.id,
      amount: e.amount,
      category: e.category,
      date: e.date,
      note: e.note,
      plannedExpenseId: e.planned_expense_id,
      createdAt: e.created_at,
    });
  });

  (incRes.data || []).forEach((i) => {
    ops.push({
      kind: "income",
      id: i.id,
      amount: i.amount,
      source: i.source,
      date: i.date,
      createdAt: i.created_at,
    });
  });

  (loanRes.data || []).forEach((l) => {
    ops.push({
      kind: "loan",
      id: l.id,
      amount: l.amount,
      direction: l.direction,
      counterpart: l.counterpart,
      date: l.date,
      note: l.note,
      createdAt: l.created_at,
    });
  });

  ops.sort((a, b) => {
    const cmp = b.date.localeCompare(a.date);
    if (cmp !== 0) return cmp;
    return b.createdAt.localeCompare(a.createdAt);
  });

  return {
    success: true,
    data: ops.slice(0, limitCount),
  };
}

export type DashboardData = {
  currency: string;
  salary: number;
  restOfMonth: number;
  todaySpent: number;
  todayGain: number;
  weekSpent: number;
  weekGain: number;
  todayStr: string;
  recentOperations: RecentOperation[];
};

/**
 * Récupère les données agrégées pour l'écran Tableau de bord (Story T1).
 */
export async function getDashboardDataAction(): Promise<OperationResult<DashboardData>> {
  const supabase = await createServerSideClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, message: content.auth.errors.invalidCredentials };
  }

  // Profil (devise, salaire, fuseau)
  const { data: profile } = await supabase
    .from("profiles")
    .select("currency, monthly_salary, timezone")
    .eq("id", user.id)
    .single();

  const timezone = profile?.timezone || "Africa/Porto-Novo";
  const currency = profile?.currency || "FCFA";
  const salary = profile?.monthly_salary || 0;

  const todayStr = getTodayDateString(timezone);
  const weekRange = getCurrentWeekRange(todayStr);
  const monthRange = getCurrentMonthRange(todayStr);

  // Opérations du mois pour les totaux
  const [expRes, incRes, loanRes] = await Promise.all([
    supabase
      .from("expenses")
      .select("*")
      .eq("user_id", user.id)
      .gte("date", monthRange.start)
      .lte("date", monthRange.end),
    supabase
      .from("incomes")
      .select("*")
      .eq("user_id", user.id)
      .gte("date", monthRange.start)
      .lte("date", monthRange.end),
    supabase
      .from("loans")
      .select("*")
      .eq("user_id", user.id)
      .gte("date", monthRange.start)
      .lte("date", monthRange.end),
  ]);

  const expenses = expRes.data || [];
  const incomes = incRes.data || [];
  const loans = loanRes.data || [];

  // 1. Reste ce mois-ci (formule : salaire + gains + prêts empruntés − prêts accordés − dépenses)
  const monthSpent = expenses.reduce((sum, e) => sum + e.amount, 0);
  const monthGain = incomes.reduce((sum, i) => sum + i.amount, 0);
  const monthLoansIn = loans
    .filter((l) => l.direction === "borrowed")
    .reduce((sum, l) => sum + l.amount, 0);
  const monthLoansOut = loans
    .filter((l) => l.direction === "given")
    .reduce((sum, l) => sum + l.amount, 0);
  const restOfMonth = salary + monthGain + monthLoansIn - monthLoansOut - monthSpent;

  // 2. Jour
  const todaySpent = expenses
    .filter((e) => e.date === todayStr)
    .reduce((sum, e) => sum + e.amount, 0);
  const todayGain = incomes
    .filter((i) => i.date === todayStr)
    .reduce((sum, i) => sum + i.amount, 0);

  // 3. Semaine
  const weekSpent = expenses
    .filter((e) => e.date >= weekRange.start && e.date <= weekRange.end)
    .reduce((sum, e) => sum + e.amount, 0);
  const weekGain = incomes
    .filter((i) => i.date >= weekRange.start && i.date <= weekRange.end)
    .reduce((sum, i) => sum + i.amount, 0);

  // 4. Dernières opérations (jusqu'à 5)
  const recentOpsRes = await getRecentOperationsAction(5);
  const recentOperations = recentOpsRes.data || [];

  return {
    success: true,
    data: {
      currency,
      salary,
      restOfMonth,
      todaySpent,
      todayGain,
      weekSpent,
      weekGain,
      todayStr,
      recentOperations,
    },
  };
}
