"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Wallet,
  Sun,
  Moon,
  Coins,
  Handshake,
  Trash2,
  Plus,
  Loader2,
  AlertTriangle,
  BarChart3,
  User as UserIcon,
} from "lucide-react";
import { content } from "@/content/fr";
import { formatAmount } from "@/lib/utils/currency";
import { formatDateFrench } from "@/lib/utils/date";
import { getCategoryIcon } from "@/lib/constants/categories";
import {
  getDashboardDataAction,
  deleteExpenseAction,
  deleteIncomeAction,
  deleteLoanAction,
  type DashboardData,
  type RecentOperation,
} from "@/lib/operations/actions";
import type { User } from "@supabase/supabase-js";

interface DashboardViewProps {
  currentUser: User;
  isDark: boolean;
  onToggleTheme: () => void;
  onOpenAdd: () => void;
  onGoToBilan: () => void;
  onGoToProfile: () => void;
  onShowToast: (message: string) => void;
  refreshTrigger?: number;
}

export function DashboardView({
  currentUser,
  isDark,
  onToggleTheme,
  onOpenAdd,
  onGoToBilan,
  onGoToProfile,
  onShowToast,
  refreshTrigger = 0,
}: DashboardViewProps) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [deletingOp, setDeletingOp] = useState<RecentOperation | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getDashboardDataAction();
      if (res.success && res.data) {
        setData(res.data);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData, refreshTrigger]);

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
        onShowToast("✓ Opération supprimée");
        setDeletingOp(null);
        await loadData();
      } else {
        onShowToast(res.message || "Erreur lors de la suppression");
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const userName =
    currentUser.user_metadata?.firstname ||
    currentUser.email?.split("@")[0] ||
    "Ami";

  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] text-muted space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-xs font-semibold">{content.common.loading}</p>
      </div>
    );
  }

  const currency = data?.currency || "FCFA";
  const restOfMonth = data?.restOfMonth || 0;
  const isNegative = restOfMonth < 0;

  return (
    <div className="flex flex-col space-y-5 pb-6 animate-fadeIn">
      {/* 1. En-tête : Date, Salutation & Profil */}
      <div className="flex items-center justify-between pt-1">
        <div>
          <div className="text-[11px] font-semibold text-muted uppercase tracking-wider">
            {data?.todayStr ? formatDateFrench(data.todayStr) : "Aujourd'hui"}
          </div>
          <h1 className="text-xl font-extrabold text-foreground tracking-tight">
            {content.dashboard.greeting(userName)}
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onToggleTheme}
            aria-label={isDark ? "Passer en mode clair" : "Passer en mode sombre"}
            className="w-9 h-9 rounded-full bg-card shadow-sm border border-line flex items-center justify-center text-muted hover:text-foreground touch-target transition-colors"
          >
            {isDark ? <Sun className="w-4 h-4 text-warn" /> : <Moon className="w-4 h-4" />}
          </button>
          <button
            onClick={onGoToProfile}
            aria-label="Mon profil et session"
            className="w-9 h-9 rounded-full bg-card shadow-sm border border-line flex items-center justify-center text-muted hover:text-foreground touch-target transition-colors"
          >
            <UserIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. Hero Card : Reste ce mois-ci (négatif possible sans blocage) */}
      <div
        className={`rounded-3xl p-5 border shadow-sm transition-all ${
          isNegative
            ? "bg-warn/10 border-warn/30"
            : "bg-gradient-to-br from-card to-card-secondary border-line"
        }`}
      >
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-semibold text-muted">
            {content.dashboard.restLabel}
          </span>
          {isNegative && (
            <div className="flex items-center gap-1 text-[11px] font-bold text-warn">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Alerte</span>
            </div>
          )}
        </div>

        <div
          className={`tabular-nums font-extrabold text-3xl tracking-tight my-1 ${
            isNegative ? "text-warn" : "text-foreground"
          }`}
        >
          {isNegative ? "− " : ""}
          {formatAmount(Math.abs(restOfMonth), currency)}
        </div>

        <div
          className={`inline-block mt-2 px-3 py-1 rounded-full text-[11px] font-bold ${
            isNegative
              ? "bg-warn/20 text-warn"
              : "bg-gain/15 text-gain"
          }`}
        >
          {isNegative
            ? content.dashboard.negativeAlert
            : content.dashboard.positiveFormula}
        </div>
      </div>

      {/* 3. Grille des compteurs : Dépensé et Gagné (Jour & Semaine) */}
      <div className="grid grid-cols-2 gap-3">
        {/* Jour */}
        <div className="bg-card rounded-2xl p-3.5 border border-line shadow-sm space-y-1">
          <div className="text-[11px] font-medium text-muted">
            {content.dashboard.spentToday}
          </div>
          <div className="tabular-nums font-extrabold text-base text-spend">
            {formatAmount(data?.todaySpent || 0, currency)}
          </div>
          <div className="text-[11px] font-bold text-gain tabular-nums pt-0.5">
            + {formatAmount(data?.todayGain || 0, currency)}
          </div>
        </div>

        {/* Semaine */}
        <div className="bg-card rounded-2xl p-3.5 border border-line shadow-sm space-y-1">
          <div className="text-[11px] font-medium text-muted">
            {content.dashboard.spentWeek}
          </div>
          <div className="tabular-nums font-extrabold text-base text-spend">
            {formatAmount(data?.weekSpent || 0, currency)}
          </div>
          <div className="text-[11px] font-bold text-gain tabular-nums pt-0.5">
            + {formatAmount(data?.weekGain || 0, currency)}
          </div>
        </div>
      </div>

      {/* 4. Bouton Bilan du jour */}
      <button
        type="button"
        onClick={onGoToBilan}
        className="w-full py-3 px-4 rounded-2xl bg-card border border-line text-foreground font-bold text-xs flex items-center justify-center gap-2 hover:bg-card-secondary touch-target transition-colors shadow-sm"
      >
        <BarChart3 className="w-4 h-4 text-primary" />
        <span>{content.dashboard.viewDayBalance}</span>
      </button>

      {/* 5. Section : Dernières opérations (Stories T1 & D4) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-extrabold text-foreground tracking-tight">
            {content.dashboard.recentOps}
          </h2>
        </div>

        {(!data?.recentOperations || data.recentOperations.length === 0) ? (
          <div className="bg-card rounded-2xl p-6 border border-line text-center space-y-3 shadow-sm">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-foreground">
                {content.dashboard.emptyOpsTitle}
              </p>
              <p className="text-[11px] text-muted mt-0.5">
                {content.dashboard.emptyOpsSubtitle}
              </p>
            </div>
            <button
              type="button"
              onClick={onOpenAdd}
              className="inline-flex items-center gap-1.5 py-2 px-4 rounded-xl bg-primary text-white text-xs font-bold shadow-sm hover:opacity-95 touch-target"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>{content.nav.add}</span>
            </button>
          </div>
        ) : (
          <div className="bg-card rounded-2xl border border-line divide-y divide-line overflow-hidden shadow-sm">
            {data.recentOperations.map((op) => {
              if (op.kind === "expense") {
                const Icon = getCategoryIcon(op.category);
                const isPlanned = Boolean(op.plannedExpenseId);
                return (
                  <div
                    key={op.id}
                    className="p-3.5 flex items-center justify-between gap-3 hover:bg-card-secondary transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-spend/10 text-spend flex items-center justify-center shrink-0">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-bold text-foreground truncate">
                            {op.note || op.category}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                              isPlanned
                                ? "bg-primary/15 text-primary"
                                : "bg-spend/15 text-spend"
                            }`}
                          >
                            {isPlanned ? "Prévu" : "Imprévu"}
                          </span>
                        </div>
                        <div className="text-[11px] text-muted truncate">
                          {op.category} · {formatDateFrench(op.date)}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="tabular-nums font-extrabold text-xs text-spend">
                        − {formatAmount(op.amount, currency)}
                      </span>
                      <button
                        type="button"
                        onClick={() => setDeletingOp(op)}
                        aria-label="Supprimer la dépense"
                        className="w-7 h-7 rounded-lg text-muted hover:text-danger hover:bg-danger/10 flex items-center justify-center touch-target transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              }

              if (op.kind === "income") {
                return (
                  <div
                    key={op.id}
                    className="p-3.5 flex items-center justify-between gap-3 hover:bg-card-secondary transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-gain/10 text-gain flex items-center justify-center shrink-0">
                        <Coins className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-bold text-foreground truncate">
                            {op.source}
                          </span>
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-gain/15 text-gain">
                            Hors salaire
                          </span>
                        </div>
                        <div className="text-[11px] text-muted truncate">
                          Revenu · {formatDateFrench(op.date)}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="tabular-nums font-extrabold text-xs text-gain">
                        + {formatAmount(op.amount, currency)}
                      </span>
                      <button
                        type="button"
                        onClick={() => setDeletingOp(op)}
                        aria-label="Supprimer le revenu"
                        className="w-7 h-7 rounded-lg text-muted hover:text-danger hover:bg-danger/10 flex items-center justify-center touch-target transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              }

              // Prêt (Emprunté vs Prêté)
              const isBorrowed = op.direction === "borrowed";
              return (
                <div
                  key={op.id}
                  className="p-3.5 flex items-center justify-between gap-3 hover:bg-card-secondary transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <Handshake className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-bold text-foreground truncate">
                          {op.counterpart}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                            isBorrowed
                              ? "bg-gain/15 text-gain"
                              : "bg-spend/15 text-spend"
                          }`}
                        >
                          {isBorrowed ? "Emprunté" : "Prêté"}
                        </span>
                      </div>
                      <div className="text-[11px] text-muted truncate">
                        Prêt · {formatDateFrench(op.date)}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`tabular-nums font-extrabold text-xs ${
                        isBorrowed ? "text-gain" : "text-spend"
                      }`}
                    >
                      {isBorrowed ? "+ " : "− "}
                      {formatAmount(op.amount, currency)}
                    </span>
                    <button
                      type="button"
                      onClick={() => setDeletingOp(op)}
                      aria-label="Supprimer le prêt"
                      className="w-7 h-7 rounded-lg text-muted hover:text-danger hover:bg-danger/10 flex items-center justify-center touch-target transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 6. Modal de confirmation de suppression d'opération (Story D4 & R3) */}
      {deletingOp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="w-full max-w-xs bg-background border border-line rounded-3xl p-5 shadow-2xl space-y-4 animate-slideUp">
            <div className="w-10 h-10 rounded-2xl bg-danger/10 text-danger flex items-center justify-center mx-auto">
              <Trash2 className="w-5 h-5" />
            </div>

            <div className="text-center">
              <h3 className="text-sm font-extrabold text-foreground">
                Supprimer cette opération ?
              </h3>
              <p className="text-xs text-muted mt-1 leading-relaxed">
                Le montant de{" "}
                <strong className="text-foreground font-semibold">
                  {formatAmount(deletingOp.amount, currency)}
                </strong>{" "}
                sera retiré de vos calculs et du bilan.
              </p>
            </div>

            <div className="space-y-2 pt-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDeleteConfirm}
                className="w-full py-3 px-4 rounded-xl bg-danger text-white text-xs font-bold hover:opacity-90 touch-target transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isDeleting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Confirmer la suppression"
                )}
              </button>

              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDeletingOp(null)}
                className="w-full py-2.5 px-4 rounded-xl bg-card border border-line text-foreground text-xs font-bold hover:bg-card-secondary touch-target transition-colors"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
