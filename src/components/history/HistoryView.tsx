"use client";

import { useEffect, useState, useCallback } from "react";
import { Inbox, Loader2, AlertTriangle, AlertCircle } from "lucide-react";
import { content } from "@/content/fr";
import { formatAmount } from "@/lib/utils/currency";
import { groupOperationsByDay } from "@/lib/balance/calculator";
import {
  getHistoryOperationsAction,
  deleteExpenseAction,
  deleteIncomeAction,
  deleteLoanAction,
  type RecentOperation,
} from "@/lib/operations/actions";
import { HistoryItem } from "./HistoryItem";

type HistoryFilter = "all" | "expenses" | "incomes" | "loans";

interface HistoryViewProps {
  onShowToast: (message: string) => void;
  refreshTrigger?: number;
}

export function HistoryView({
  onShowToast,
  refreshTrigger = 0,
}: HistoryViewProps) {
  const [filter, setFilter] = useState<HistoryFilter>("all");
  const [operations, setOperations] = useState<RecentOperation[]>([]);
  const [currency, setCurrency] = useState<string>("FCFA");
  const [loading, setLoading] = useState<boolean>(true);
  const [deletingOp, setDeletingOp] = useState<RecentOperation | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const loadOperations = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getHistoryOperationsAction(filter);
      if (res.success && res.data) {
        setOperations(res.data.operations);
        setCurrency(res.data.currency);
      }
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    loadOperations();
  }, [loadOperations, refreshTrigger]);

  useEffect(() => {
    if (!deletingOp) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setDeletingOp(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [deletingOp]);

  const handleDeleteConfirm = async () => {
    if (!deletingOp) return;
    setIsDeleting(true);
    try {
      let res;
      if (deletingOp.kind === "expense") {
        res = await deleteExpenseAction(deletingOp.id);
      } else if (deletingOp.kind === "income") {
        res = await deleteIncomeAction(deletingOp.id);
      } else {
        res = await deleteLoanAction(deletingOp.id);
      }

      if (res.success) {
        onShowToast(content.history.deletedToast);
        setDeletingOp(null);
        await loadOperations();
      } else {
        onShowToast(res.message || content.common.errorTitle);
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const dailyGroups = groupOperationsByDay(operations);

  return (
    <div className="flex flex-col space-y-4 pb-8 animate-fadeIn">
      {/* 1. En-tête de l'historique */}
      <div className="pt-1">
        <h1 className="text-xl font-extrabold text-foreground tracking-tight">
          {content.history.title}
        </h1>
        <p className="text-xs text-muted mt-0.5">{content.history.subtitle}</p>
      </div>

      {/* 2. Filtres segmentés (Tout / Dépenses / Revenus / Prêts) */}
      <div className="flex bg-card2 p-1 rounded-2xl border border-line/60">
        <button
          onClick={() => setFilter("all")}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all touch-target ${
            filter === "all"
              ? "bg-card text-foreground shadow-sm"
              : "text-muted hover:text-foreground"
          }`}
        >
          {content.history.tabAll}
        </button>
        <button
          onClick={() => setFilter("expenses")}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all touch-target ${
            filter === "expenses"
              ? "bg-card text-foreground shadow-sm"
              : "text-muted hover:text-foreground"
          }`}
        >
          {content.history.tabExpenses}
        </button>
        <button
          onClick={() => setFilter("incomes")}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all touch-target ${
            filter === "incomes"
              ? "bg-card text-foreground shadow-sm"
              : "text-muted hover:text-foreground"
          }`}
        >
          {content.history.tabIncomes}
        </button>
        <button
          onClick={() => setFilter("loans")}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all touch-target ${
            filter === "loans"
              ? "bg-card text-foreground shadow-sm"
              : "text-muted hover:text-foreground"
          }`}
        >
          {content.history.tabLoans}
        </button>
      </div>

      {/* 3. Contenu de la liste groupée par jour */}
      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[300px] text-muted space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-xs font-semibold">{content.common.loading}</p>
        </div>
      ) : dailyGroups.length === 0 ? (
        <div className="bg-card rounded-3xl p-8 border border-line shadow-sm text-center space-y-2.5 my-4">
          <div className="w-12 h-12 rounded-2xl bg-card2 border border-line text-muted flex items-center justify-center mx-auto">
            <Inbox className="w-6 h-6" />
          </div>
          <h2 className="text-sm font-bold text-foreground">
            {content.history.emptyTitle}
          </h2>
          <p className="text-xs text-muted">{content.history.emptySubtitle}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {dailyGroups.map((group) => (
            <div key={group.date} className="space-y-1.5">
              {/* En-tête du jour avec totaux de la journée */}
              <div className="flex items-baseline justify-between px-1">
                <h2 className="text-xs font-extrabold text-foreground capitalize">
                  {group.formattedDate}
                </h2>
                <div className="text-[11px] font-bold tabular-nums space-x-1.5">
                  {group.totalExpenses > 0 && (
                    <span className="text-spend">
                      − {formatAmount(group.totalExpenses, currency)}
                    </span>
                  )}
                  {group.totalIncomes > 0 && (
                    <span className="text-gain">
                      + {formatAmount(group.totalIncomes, currency)}
                    </span>
                  )}
                </div>
              </div>

              {/* Carte des opérations du jour */}
              <div className="bg-card rounded-2xl px-4 py-1 border border-line shadow-sm divide-y divide-line/40">
                {group.operations.map((op) => (
                  <HistoryItem
                    key={`${op.kind}-${op.id}`}
                    operation={op}
                    currency={currency}
                    onDeleteClick={(item) => setDeletingOp(item)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de confirmation de suppression d'opération (Story H1) */}
      {deletingOp && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-card w-full max-w-sm rounded-3xl p-6 border border-line shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-danger/10 text-danger flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1.5">
              <h3 className="text-base font-extrabold text-foreground">
                {content.history.confirmDeleteTitle}
              </h3>
              <p className="text-xs text-muted leading-relaxed">
                {content.history.confirmDeleteMsg}
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingOp(null)}
                className="flex-1 py-3 rounded-xl border border-line bg-card-secondary text-foreground text-xs font-bold hover:bg-card touch-target transition-colors"
              >
                {content.history.cancelDeleteBtn}
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="flex-1 py-3 rounded-xl bg-danger text-white text-xs font-bold hover:bg-danger/90 disabled:opacity-50 touch-target flex items-center justify-center gap-1.5 transition-colors shadow-sm"
              >
                {isDeleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{content.history.confirmDeleteBtn}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
