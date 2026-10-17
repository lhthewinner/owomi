"use client";

import { useState } from "react";
import { PlannedExpensesView } from "./PlannedExpensesView";
import { IncomeAndLoansView } from "./IncomeAndLoansView";

interface BudgetViewProps {
  currency?: string;
  userTimezone?: string;
  onOpenPayPlanned: (plannedExpenseId: string) => void;
  onOpenAddIncome: () => void;
  onOpenAddLoan: () => void;
  onShowToast: (message: string) => void;
  refreshTrigger?: number;
}

export function BudgetView({
  currency = "FCFA",
  userTimezone = "Africa/Porto-Novo",
  onOpenPayPlanned,
  onOpenAddIncome,
  onOpenAddLoan,
  onShowToast,
  refreshTrigger = 0,
}: BudgetViewProps) {
  const [activeTab, setActiveTab] = useState<"planned" | "income">("planned");

  return (
    <div className="space-y-5 pb-6 animate-fadeIn">
      {/* En-tête de l'écran Budget */}
      <div className="pt-1">
        <h1 className="text-xl font-extrabold text-foreground tracking-tight">
          Mon budget
        </h1>
        <p className="text-xs text-muted mt-0.5">
          Dépenses prévues, revenus et prêts
        </p>
      </div>

      {/* Sélecteur de sous-onglet (Dépenses prévues / Revenus et prêts) */}
      <div className="flex bg-card-secondary p-1 rounded-2xl">
        <button
          type="button"
          onClick={() => setActiveTab("planned")}
          className={`flex-1 py-2 rounded-xl font-bold text-xs transition-all touch-target ${
            activeTab === "planned"
              ? "bg-card text-foreground shadow-sm"
              : "text-muted hover:text-foreground"
          }`}
        >
          Dépenses prévues
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("income")}
          className={`flex-1 py-2 rounded-xl font-bold text-xs transition-all touch-target ${
            activeTab === "income"
              ? "bg-card text-foreground shadow-sm"
              : "text-muted hover:text-foreground"
          }`}
        >
          Revenus et prêts
        </button>
      </div>

      {/* Contenu selon le sous-onglet actif */}
      {activeTab === "planned" ? (
        <PlannedExpensesView
          currency={currency}
          userTimezone={userTimezone}
          onOpenPayPlanned={onOpenPayPlanned}
          onShowToast={onShowToast}
          refreshTrigger={refreshTrigger}
        />
      ) : (
        <IncomeAndLoansView
          currency={currency}
          onOpenAddIncome={onOpenAddIncome}
          onOpenAddLoan={onOpenAddLoan}
          onShowToast={onShowToast}
        />
      )}
    </div>
  );
}
