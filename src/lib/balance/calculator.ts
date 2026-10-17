/**
 * Module unique de calcul du bilan et des soldes financiers d'Asoro.
 * Conforme à la règle 4 d'AGENTS.md :
 * « Les calculs du bilan vivent dans un seul module, testé.
 *   Aucun calcul de solde ou de total ailleurs dans l'interface. »
 *
 * Invariants respectés :
 * - Montants en nombres entiers (AGENTS.md règle 5).
 * - Solde négatif autorisé sans blocage (AGENTS.md règle 5).
 * - Semaine du lundi au dimanche (AGENTS.md règle 5).
 * - Dépense imprévue = absence de planned_expense_id (AGENTS.md règle 5).
 */

import { getDateRange, formatDateRangeFrench } from "@/lib/utils/date";

export type PeriodType = "day" | "week" | "month";

export interface ExpenseItem {
  id: string;
  amount: number;
  category: string;
  date: string; // YYYY-MM-DD
  note?: string;
  planned_expense_id?: string | null;
}

export interface IncomeItem {
  id: string;
  amount: number;
  source?: string;
  date: string; // YYYY-MM-DD
}

export interface LoanItem {
  id: string;
  amount: number;
  direction: "borrowed" | "given";
  counterpart?: string;
  date: string; // YYYY-MM-DD
  note?: string;
}

export interface CategoryBreakdown {
  category: string;
  amount: number;
  percentage: number; // 0 à 100
}

export interface EvolutionPoint {
  date: string; // YYYY-MM-DD
  label: string; // Ex: 'L', 'M', '1', '6', etc.
  spent: number;
  gained: number;
  spentHeightPercent: number; // 0 à 100
  gainedHeightPercent: number; // 0 à 100
}

export interface BalanceCalculationInput {
  period: PeriodType;
  referenceDate: string; // YYYY-MM-DD
  salary: number; // Salaire mensuel
  expenses: ExpenseItem[];
  incomes: IncomeItem[];
  loans: LoanItem[];
}

export interface BalanceResult {
  period: PeriodType;
  referenceDate: string;
  range: {
    start: string;
    end: string;
    formattedLabel: string;
  };
  salary: number;
  totalSpent: number;
  plannedSpent: number;
  unplannedSpent: number;
  totalGain: number; // Hors salaire
  loansBorrowed: number;
  loansGiven: number;
  netLoans: number; // loansBorrowed - loansGiven
  balance: number; // Solde ou économies (peut être négatif)
  isNegative: boolean;
  balanceLabel: string;
  balanceNote: string;
  plannedPercent: number;
  unplannedPercent: number;
  byCategory: CategoryBreakdown[];
  chartTitle: string;
  evolution: EvolutionPoint[];
}

const DAY_INITIALS = ["D", "L", "M", "M", "J", "V", "S"];

/**
 * Calcul complet du bilan pour une période donnée (jour, semaine, mois).
 */
export function calculateBalance(input: BalanceCalculationInput): BalanceResult {
  const { period, referenceDate, salary, expenses, incomes, loans } = input;

  const range = getDateRange(period, referenceDate);
  const formattedLabel = formatDateRangeFrench(period, range.start, range.end);

  // Filtrer les opérations dans la plage de dates
  const periodExpenses = expenses.filter(
    (e) => e.date >= range.start && e.date <= range.end
  );
  const periodIncomes = incomes.filter(
    (i) => i.date >= range.start && i.date <= range.end
  );
  const periodLoans = loans.filter(
    (l) => l.date >= range.start && l.date <= range.end
  );

  // Totaux des dépenses
  const plannedSpent = periodExpenses
    .filter((e) => Boolean(e.planned_expense_id))
    .reduce((sum, e) => sum + e.amount, 0);

  const unplannedSpent = periodExpenses
    .filter((e) => !e.planned_expense_id)
    .reduce((sum, e) => sum + e.amount, 0);

  const totalSpent = plannedSpent + unplannedSpent;

  // Totaux des revenus (hors salaire)
  const totalGain = periodIncomes.reduce((sum, i) => sum + i.amount, 0);

  // Totaux des prêts
  const loansBorrowed = periodLoans
    .filter((l) => l.direction === "borrowed")
    .reduce((sum, l) => sum + l.amount, 0);

  const loansGiven = periodLoans
    .filter((l) => l.direction === "given")
    .reduce((sum, l) => sum + l.amount, 0);

  const netLoans = loansBorrowed - loansGiven;

  // Calcul du solde selon la période
  let balance: number;
  let balanceLabel: string;
  let balanceNote: string;

  if (period === "month") {
    // Formule mensuelle : Salaire + autres revenus + prêts nets - total dépensé
    balance = salary + totalGain + netLoans - totalSpent;
    balanceLabel = "Économisé ce mois";
    balanceNote =
      balance < 0 ? "Solde négatif, aucun blocage" : "Salaire et prêts inclus";
  } else if (period === "week") {
    // Formule hebdomadaire : Autres revenus + prêts nets - total dépensé
    balance = totalGain + netLoans - totalSpent;
    balanceLabel = "Solde de la semaine";
    balanceNote =
      balance < 0 ? "Solde négatif, aucun blocage" : "Gains + prêts − dépenses";
  } else {
    // Formule journalière : Autres revenus + prêts nets - total dépensé
    balance = totalGain + netLoans - totalSpent;
    balanceLabel = "Solde du jour";
    balanceNote =
      balance < 0 ? "Solde négatif, aucun blocage" : "Gains + prêts − dépenses";
  }

  const isNegative = balance < 0;

  // Pourcentages Prévu vs Imprévu
  let plannedPercent = 0;
  let unplannedPercent = 0;
  if (totalSpent > 0) {
    plannedPercent = Math.round((plannedSpent / totalSpent) * 100);
    unplannedPercent = 100 - plannedPercent;
  }

  // Répartition par catégorie (triée par montant décroissant)
  const categoryMap: Record<string, number> = {};
  periodExpenses.forEach((e) => {
    categoryMap[e.category] = (categoryMap[e.category] || 0) + e.amount;
  });

  const byCategory: CategoryBreakdown[] = Object.entries(categoryMap)
    .map(([category, amount]) => ({
      category,
      amount,
      percentage: totalSpent > 0 ? Math.round((amount / totalSpent) * 100) : 0,
    }))
    .sort((a, b) => b.amount - a.amount);

  // Construction des points d'évolution pour le graphique
  const evolution: EvolutionPoint[] = [];
  const chartTitle = period === "day" ? "7 derniers jours" : "Évolution";

  const pad = (n: number) => String(n).padStart(2, "0");
  const fmtDate = (d: Date) =>
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

  if (period === "day") {
    // Pour la vue Jour : les 7 derniers jours se terminant par la date de référence
    const [y, m, d] = referenceDate.split("-").map(Number);
    const ref = new Date(y, m - 1, d);

    for (let i = 6; i >= 0; i--) {
      const dt = new Date(ref);
      dt.setDate(ref.getDate() - i);
      const dayStr = fmtDate(dt);
      const spent = expenses
        .filter((e) => e.date === dayStr)
        .reduce((sum, e) => sum + e.amount, 0);
      const gained = incomes
        .filter((i) => i.date === dayStr)
        .reduce((sum, i) => sum + i.amount, 0);

      evolution.push({
        date: dayStr,
        label: DAY_INITIALS[dt.getDay()],
        spent,
        gained,
        spentHeightPercent: 0,
        gainedHeightPercent: 0,
      });
    }
  } else if (period === "week") {
    // Pour la vue Semaine : les 7 jours de la semaine (lundi au dimanche)
    const [y, m, d] = range.start.split("-").map(Number);
    const start = new Date(y, m - 1, d);

    for (let i = 0; i < 7; i++) {
      const dt = new Date(start);
      dt.setDate(start.getDate() + i);
      const dayStr = fmtDate(dt);
      const spent = expenses
        .filter((e) => e.date === dayStr)
        .reduce((sum, e) => sum + e.amount, 0);
      const gained = incomes
        .filter((i) => i.date === dayStr)
        .reduce((sum, i) => sum + i.amount, 0);

      evolution.push({
        date: dayStr,
        label: DAY_INITIALS[dt.getDay()],
        spent,
        gained,
        spentHeightPercent: 0,
        gainedHeightPercent: 0,
      });
    }
  } else {
    // Pour la vue Mois : tous les jours du mois
    const [y, m] = range.start.split("-").map(Number);
    const lastDayNum = new Date(y, m, 0).getDate();

    for (let dayNum = 1; dayNum <= lastDayNum; dayNum++) {
      const dayStr = `${y}-${pad(m)}-${pad(dayNum)}`;
      const dt = new Date(y, m - 1, dayNum);
      const spent = expenses
        .filter((e) => e.date === dayStr)
        .reduce((sum, e) => sum + e.amount, 0);
      const gained = incomes
        .filter((i) => i.date === dayStr)
        .reduce((sum, i) => sum + i.amount, 0);

      // Label affiché tous les 5 jours (1, 6, 11, 16, 21, 26, 31) comme dans la maquette
      const label = dayNum % 5 === 1 ? String(dayNum) : "";

      evolution.push({
        date: dayStr,
        label,
        spent,
        gained,
        spentHeightPercent: 0,
        gainedHeightPercent: 0,
      });
    }
  }

  // Calcul des hauteurs relatives des barres (0 à 100%)
  const maxChartAmount = Math.max(
    1,
    ...evolution.map((pt) => Math.max(pt.spent, pt.gained))
  );

  evolution.forEach((pt) => {
    if (pt.spent > 0) {
      pt.spentHeightPercent = Math.max(
        4,
        Math.min(100, Math.round((pt.spent / maxChartAmount) * 100))
      );
    }
    if (pt.gained > 0) {
      pt.gainedHeightPercent = Math.max(
        4,
        Math.min(100, Math.round((pt.gained / maxChartAmount) * 100))
      );
    }
  });

  return {
    period,
    referenceDate,
    range: {
      start: range.start,
      end: range.end,
      formattedLabel,
    },
    salary,
    totalSpent,
    plannedSpent,
    unplannedSpent,
    totalGain,
    loansBorrowed,
    loansGiven,
    netLoans,
    balance,
    isNegative,
    balanceLabel,
    balanceNote,
    plannedPercent,
    unplannedPercent,
    byCategory,
    chartTitle,
    evolution,
  };
}

/**
 * Calcul du statut, du reste et de la progression d'une dépense prévue.
 */
export function calculatePlannedExpenseProgress(
  plannedAmount: number,
  spent: number
): {
  status: "venir" | "cours" | "solde" | "depasse";
  left: number;
  progressPercent: number;
} {
  let status: "venir" | "cours" | "solde" | "depasse" = "venir";
  if (spent === 0) {
    status = "venir";
  } else if (spent > plannedAmount) {
    status = "depasse";
  } else if (spent === plannedAmount) {
    status = "solde";
  } else {
    status = "cours";
  }

  const left = Math.max(0, plannedAmount - spent);
  const progressPercent =
    plannedAmount > 0
      ? Math.min(100, Math.round((spent / plannedAmount) * 100))
      : 0;

  return { status, left, progressPercent };
}
