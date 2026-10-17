"use client";

import { useEffect, useState } from "react";
import {
  Coins,
  Handshake,
  Trash2,
  Plus,
  Loader2,
  AlertCircle,
  ArrowDownLeft,
  ArrowUpRight,
} from "lucide-react";
import { formatAmount } from "@/lib/utils/currency";
import { formatDateFrench } from "@/lib/utils/date";
import {
  getIncomesAndLoansDataAction,
  updateSalaryAction,
  deleteIncomeAction,
  deleteLoanAction,
} from "@/lib/operations/actions";
import type { Database } from "@/types/database";

type IncomeRow = Database["public"]["Tables"]["incomes"]["Row"];
type LoanRow = Database["public"]["Tables"]["loans"]["Row"];

interface IncomeAndLoansViewProps {
  currency?: string;
  onOpenAddIncome: () => void;
  onOpenAddLoan: () => void;
  onShowToast: (message: string) => void;
}

export function IncomeAndLoansView({
  currency = "FCFA",
  onOpenAddIncome,
  onOpenAddLoan,
  onShowToast,
}: IncomeAndLoansViewProps) {
  const [salary, setSalary] = useState<number>(0);
  const [incomes, setIncomes] = useState<IncomeRow[]>([]);
  const [loans, setLoans] = useState<LoanRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Édition du salaire
  const [isEditingSalary, setIsEditingSalary] = useState<boolean>(false);
  const [salaryInput, setSalaryInput] = useState<string>("");
  const [salaryLoading, setSalaryLoading] = useState<boolean>(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await getIncomesAndLoansDataAction();
      if (res.success && res.data) {
        setSalary(res.data.salary);
        setSalaryInput(String(res.data.salary));
        setIncomes(res.data.incomes);
        setLoans(res.data.loans);
      }
    } catch {
      // Ignoré
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveSalary = async () => {
    const newSalary = Number(salaryInput.replace(/\s/g, ""));
    if (isNaN(newSalary) || newSalary < 0) {
      onShowToast("Saisissez un montant de salaire valide");
      return;
    }

    setSalaryLoading(true);
    try {
      const res = await updateSalaryAction(newSalary);
      if (res.success) {
        setSalary(newSalary);
        setIsEditingSalary(false);
        onShowToast("Salaire mensuel mis à jour");
      }
    } finally {
      setSalaryLoading(false);
    }
  };

  const [deletingItem, setDeletingItem] = useState<{
    type: "income" | "loan";
    id: string;
    label: string;
    amount: number;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && deletingItem) {
        setDeletingItem(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [deletingItem]);

  const handleDeleteConfirm = async () => {
    if (!deletingItem) return;
    setIsDeleting(true);
    try {
      if (deletingItem.type === "income") {
        const res = await deleteIncomeAction(deletingItem.id);
        if (res.success) {
          setIncomes((prev) => prev.filter((i) => i.id !== deletingItem.id));
          onShowToast("Revenu supprimé");
          setDeletingItem(null);
        } else {
          onShowToast(res.message || "Erreur lors de la suppression");
        }
      } else {
        const res = await deleteLoanAction(deletingItem.id);
        if (res.success) {
          setLoans((prev) => prev.filter((l) => l.id !== deletingItem.id));
          onShowToast("Prêt supprimé");
          setDeletingItem(null);
        } else {
          onShowToast(res.message || "Erreur lors de la suppression");
        }
      }
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-10 text-muted space-y-3">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
        <span className="text-xs font-medium">Chargement de vos finances...</span>
      </div>
    );
  }

  // Calculs simples
  const totalIncomes = incomes.reduce((acc, cur) => acc + cur.amount, 0);
  const totalBorrowed = loans
    .filter((l) => l.direction === "borrowed")
    .reduce((acc, cur) => acc + cur.amount, 0);
  const totalGiven = loans
    .filter((l) => l.direction === "given")
    .reduce((acc, cur) => acc + cur.amount, 0);
  const netLoans = totalBorrowed - totalGiven;

  return (
    <div className="space-y-4 pb-12 animate-fadeIn">
      {/* 1. Carte Salaire Mensuel */}
      <div className="bg-card rounded-2xl p-4 shadow-sm border border-line">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-muted">Salaire mensuel</div>
            <div className="tabular-nums font-extrabold text-2xl text-foreground mt-0.5">
              {formatAmount(salary, currency)}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsEditingSalary(!isEditingSalary)}
            className="px-3 py-1.5 rounded-xl bg-card-secondary border border-line text-xs font-bold text-foreground hover:bg-line touch-target transition-colors"
          >
            {isEditingSalary ? "Annuler" : "Modifier"}
          </button>
        </div>
        <p className="text-[11.5px] text-muted mt-1.5">
          Revient chaque mois, modifiable à tout moment.
        </p>

        {isEditingSalary && (
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-line animate-fadeIn">
            <input
              type="number"
              value={salaryInput}
              onChange={(e) => setSalaryInput(e.target.value)}
              placeholder="Nouveau salaire"
              className="flex-1 px-3 py-2 rounded-xl border border-line bg-background text-sm text-foreground outline-none focus:border-primary"
            />
            <button
              type="button"
              disabled={salaryLoading}
              onClick={handleSaveSalary}
              className="px-4 py-2 rounded-xl bg-primary text-white font-bold text-xs shadow-sm hover:opacity-95 touch-target disabled:opacity-50"
            >
              {salaryLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "OK"}
            </button>
          </div>
        )}
      </div>

      {/* 2. Section Autres Revenus */}
      <div>
        <div className="flex items-center justify-between px-1 mb-2">
          <h2 className="text-sm font-bold text-foreground">Autres revenus</h2>
          <span className="text-xs font-semibold text-gain tabular-nums">
            Total : + {formatAmount(totalIncomes, currency)}
          </span>
        </div>

        <div className="bg-card rounded-2xl shadow-sm border border-line overflow-hidden divide-y divide-line">
          {incomes.length === 0 ? (
            <div className="p-6 text-center text-muted text-xs">
              Aucun revenu ponctuel pour l&apos;instant.
            </div>
          ) : (
            incomes.map((inc) => (
              <div key={inc.id} className="p-3.5 flex items-center justify-between gap-3">
                <div className="w-9 h-9 rounded-xl bg-gain/15 text-gain flex items-center justify-center shrink-0">
                  <Coins className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-foreground truncate">
                    {inc.source || "Revenu hors salaire"}
                  </div>
                  <div className="text-[11px] text-muted">
                    {formatDateFrench(inc.date)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="tabular-nums font-extrabold text-xs text-gain">
                    + {formatAmount(inc.amount, currency)}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setDeletingItem({
                      type: "income",
                      id: inc.id,
                      label: inc.source || "Revenu hors salaire",
                      amount: inc.amount,
                    })
                  }
                  aria-label="Supprimer le revenu"
                  className="w-8 h-8 rounded-lg text-muted hover:text-danger flex items-center justify-center touch-target transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>

        <button
          type="button"
          onClick={onOpenAddIncome}
          className="w-full mt-2 py-3 rounded-2xl bg-card border border-line text-foreground text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-card-secondary touch-target transition-colors"
        >
          <Plus className="w-3.5 h-3.5 text-primary" />
          <span>Ajouter un revenu hors salaire</span>
        </button>
      </div>

      {/* 3. Section Prêts */}
      <div>
        <div className="flex items-center justify-between px-1 mb-2">
          <h2 className="text-sm font-bold text-foreground">Prêts</h2>
          <span
            className={`text-xs font-semibold tabular-nums ${
              netLoans < 0 ? "text-warn" : "text-gain"
            }`}
          >
            Net : {netLoans < 0 ? "− " : "+ "}
            {formatAmount(Math.abs(netLoans), currency)}
          </span>
        </div>

        <div className="bg-card rounded-2xl shadow-sm border border-line overflow-hidden divide-y divide-line">
          {loans.length === 0 ? (
            <div className="p-6 text-center text-muted text-xs">
              Aucun prêt enregistré.
            </div>
          ) : (
            loans.map((loan) => {
              const isBorrowed = loan.direction === "borrowed";
              return (
                <div key={loan.id} className="p-3.5 flex items-center justify-between gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      isBorrowed ? "bg-gain/15 text-gain" : "bg-spend/15 text-spend"
                    }`}
                  >
                    <Handshake className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-foreground truncate">
                        {loan.counterpart}
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
                    <div className="text-[11px] text-muted">
                      {formatDateFrench(loan.date)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div
                      className={`tabular-nums font-extrabold text-xs ${
                        isBorrowed ? "text-gain" : "text-spend"
                      }`}
                    >
                      {isBorrowed ? "+ " : "− "}
                      {formatAmount(loan.amount, currency)}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setDeletingItem({
                        type: "loan",
                        id: loan.id,
                        label: isBorrowed
                          ? `Emprunt auprès de ${loan.counterpart}`
                          : `Prêt accordé à ${loan.counterpart}`,
                        amount: loan.amount,
                      })
                    }
                    aria-label="Supprimer le prêt"
                    className="w-8 h-8 rounded-lg text-muted hover:text-danger flex items-center justify-center touch-target transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })
          )}
        </div>

        <button
          type="button"
          onClick={onOpenAddLoan}
          className="w-full mt-2 py-3 rounded-2xl bg-card border border-line text-foreground text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-card-secondary touch-target transition-colors"
        >
          <Plus className="w-3.5 h-3.5 text-primary" />
          <span>Enregistrer un prêt</span>
        </button>
      </div>

      {/* Modal de confirmation de suppression */}
      {deletingItem && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-income-loan-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn"
        >
          <div className="w-full max-w-xs bg-background border border-line rounded-3xl p-5 shadow-2xl space-y-4 animate-slideUp">
            <div className="w-10 h-10 rounded-2xl bg-danger/10 text-danger flex items-center justify-center mx-auto">
              <Trash2 className="w-5 h-5" />
            </div>

            <div className="text-center">
              <h3 id="delete-income-loan-title" className="text-sm font-extrabold text-foreground">
                Supprimer « {deletingItem.label} » ?
              </h3>
              <p className="text-xs text-muted mt-1 leading-relaxed">
                Le montant de{" "}
                <strong className="text-foreground font-semibold">
                  {formatAmount(deletingItem.amount, currency)}
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
                onClick={() => setDeletingItem(null)}
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
