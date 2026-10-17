import type {
  DashboardData,
  PlannedExpensesSummary,
  BalanceDataResponse,
  HistoryData,
} from "./actions";
import type { Database } from "@/types/database";

type IncomeRow = Database["public"]["Tables"]["incomes"]["Row"];
type LoanRow = Database["public"]["Tables"]["loans"]["Row"];

export function getDemoDashboardData(todayStr: string): DashboardData {
  return {
    currency: "FCFA",
    salary: 250000,
    restOfMonth: 142500,
    todaySpent: 4500,
    todayGain: 0,
    weekSpent: 32000,
    weekGain: 15000,
    todayStr,
    recentOperations: [
      {
        id: "demo-op-1",
        kind: "expense",
        amount: 4500,
        category: "alimentation",
        date: todayStr,
        note: "Supermarché du coin",
        isPlanned: true,
      },
      {
        id: "demo-op-2",
        kind: "expense",
        amount: 2500,
        category: "transport",
        date: todayStr,
        note: "Essence moto",
        isPlanned: false,
      },
      {
        id: "demo-op-3",
        kind: "income",
        amount: 15000,
        category: "other",
        date: todayStr,
        note: "Vente vieux meuble",
        isPlanned: false,
      },
      {
        id: "demo-op-4",
        kind: "loan",
        amount: 20000,
        category: "loan",
        date: todayStr,
        note: "Prêt à Kofi",
        isPlanned: false,
        direction: "given",
        counterpart: "Kofi",
      },
      {
        id: "demo-op-5",
        kind: "loan",
        amount: 50000,
        category: "loan",
        date: todayStr,
        note: "Emprunt auprès de Maman",
        isPlanned: false,
        direction: "borrowed",
        counterpart: "Maman",
      },
    ],
  };
}

export function getDemoPlannedExpenses(todayStr: string): PlannedExpensesSummary {
  return {
    totalPlanned: 155000,
    totalSpent: 125000,
    totalLeft: 30000,
    items: [
      {
        id: "pe-1",
        name: "Loyer mensuel",
        amount: 80000,
        category: "logement",
        period: "month",
        startDate: todayStr,
        spent: 80000,
        left: 0,
        status: "solde",
        progressPercent: 100,
      },
      {
        id: "pe-2",
        name: "Courses & Marché",
        amount: 60000,
        category: "alimentation",
        period: "month",
        startDate: todayStr,
        spent: 45000,
        left: 15000,
        status: "cours",
        progressPercent: 75,
      },
      {
        id: "pe-3",
        name: "Facture électricité",
        amount: 15000,
        category: "factures",
        period: "month",
        startDate: todayStr,
        spent: 0,
        left: 15000,
        status: "venir",
        progressPercent: 0,
      },
    ],
  };
}

export function getDemoIncomesAndLoans(todayStr: string): {
  salary: number;
  incomes: IncomeRow[];
  loans: LoanRow[];
} {
  return {
    salary: 250000,
    incomes: [
      {
        id: "demo-inc-1",
        user_id: "demo-user-id",
        amount: 15000,
        source: "Vente meuble",
        date: todayStr,
        local_id: "demo-inc-1",
        last_modified_at: todayStr,
        sync_status: "synced",
        created_at: todayStr,
      },
    ],
    loans: [
      {
        id: "demo-loan-1",
        user_id: "demo-user-id",
        amount: 20000,
        direction: "given",
        counterpart: "Kofi",
        date: todayStr,
        note: "",
        local_id: "demo-loan-1",
        last_modified_at: todayStr,
        sync_status: "synced",
        created_at: todayStr,
      },
      {
        id: "demo-loan-2",
        user_id: "demo-user-id",
        amount: 50000,
        direction: "borrowed",
        counterpart: "Maman",
        date: todayStr,
        note: "",
        local_id: "demo-loan-2",
        last_modified_at: todayStr,
        sync_status: "synced",
        created_at: todayStr,
      },
    ],
  };
}

import { calculateBalance } from "@/lib/balance/calculator";

export function getDemoBalanceData(
  period: "day" | "week" | "month",
  targetDate: string
): BalanceDataResponse {
  const result = calculateBalance({
    period,
    referenceDate: targetDate,
    salary: 250000,
    expenses: [
      {
        id: "e1",
        amount: 4500,
        category: "alimentation",
        date: targetDate,
        planned_expense_id: "pe-2",
      },
      {
        id: "e2",
        amount: 2500,
        category: "transport",
        date: targetDate,
      },
      {
        id: "e3",
        amount: 80000,
        category: "logement",
        date: targetDate,
        planned_expense_id: "pe-1",
      },
      {
        id: "e4",
        amount: 12000,
        category: "factures",
        date: targetDate,
      },
      {
        id: "e5",
        amount: 8000,
        category: "sante",
        date: targetDate,
      },
    ],
    incomes: [
      {
        id: "i1",
        amount: 15000,
        source: "Vente meuble",
        date: targetDate,
      },
    ],
    loans: [
      {
        id: "l1",
        amount: 20000,
        direction: "given",
        counterpart: "Kofi",
        date: targetDate,
      },
      {
        id: "l2",
        amount: 50000,
        direction: "borrowed",
        counterpart: "Maman",
        date: targetDate,
      },
    ],
  });

  return {
    ...result,
    currency: "FCFA",
  };
}

export function getDemoHistoryOperations(
  filter: string,
  todayStr: string
): { operations: RecentOperation[]; currency: string } {
  const allOps: RecentOperation[] = [
    {
      id: "hist-1",
      kind: "expense",
      amount: 4500,
      category: "alimentation",
      date: todayStr,
      note: "Supermarché du coin",
      isPlanned: true,
      createdAt: todayStr + "T10:00:00Z",
    },
    {
      id: "hist-2",
      kind: "expense",
      amount: 2500,
      category: "transport",
      date: todayStr,
      note: "Essence moto",
      isPlanned: false,
      createdAt: todayStr + "T08:30:00Z",
    },
    {
      id: "hist-3",
      kind: "income",
      amount: 15000,
      source: "Vente meuble",
      date: todayStr,
      createdAt: todayStr + "T12:00:00Z",
    },
    {
      id: "hist-4",
      kind: "loan",
      amount: 20000,
      counterpart: "Kofi",
      direction: "given",
      date: "2026-10-16",
      note: "",
      createdAt: "2026-10-16T14:00:00Z",
    },
    {
      id: "hist-5",
      kind: "expense",
      amount: 5000,
      category: "sante",
      date: "2026-10-16",
      note: "Pharmacie",
      isPlanned: false,
      createdAt: "2026-10-16T09:15:00Z",
    },
    {
      id: "hist-6",
      kind: "loan",
      amount: 50000,
      counterpart: "Maman",
      direction: "borrowed",
      date: "2026-10-15",
      note: "",
      createdAt: "2026-10-15T16:00:00Z",
    },
  ];

  const filtered = allOps.filter((op) => {
    if (filter === "all") return true;
    if (filter === "expenses") return op.kind === "expense";
    if (filter === "incomes") return op.kind === "income";
    if (filter === "loans") return op.kind === "loan";
    return true;
  });

  return {
    operations: filtered,
    currency: "FCFA",
  };
}
