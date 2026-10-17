"use client";

import { useState, useEffect } from "react";
import { X, Loader2, Calendar } from "lucide-react";
import { DEFAULT_CATEGORIES } from "@/lib/constants/categories";
import { getTodayDateString, generateLocalId } from "@/lib/utils/date";
import {
  createPlannedExpenseAction,
  updatePlannedExpenseAction,
  type PlannedExpenseWithProgress,
} from "@/lib/operations/actions";
import { useMobileBackHandler } from "@/lib/utils/useMobileBackHandler";

interface PlannedExpenseModalProps {
  isOpen: boolean;
  currency?: string;
  userTimezone?: string;
  editingItem?: PlannedExpenseWithProgress | null;
  onClose: () => void;
  onSuccess: (message: string) => void;
}

export function PlannedExpenseModal({
  isOpen,
  currency = "FCFA",
  userTimezone = "Africa/Porto-Novo",
  editingItem = null,
  onClose,
  onSuccess,
}: PlannedExpenseModalProps) {
  const [name, setName] = useState<string>("");
  const [amountStr, setAmountStr] = useState<string>("");
  const [category, setCategory] = useState<string>("Logement");
  const [period, setPeriod] = useState<"day" | "week" | "month">("month");
  const [startDate, setStartDate] = useState<string>(() => getTodayDateString(userTimezone));
  const [isRecurring, setIsRecurring] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Fermeture automatique lors de l'appui sur le bouton/geste Retour du smartphone
  useMobileBackHandler(isOpen, onClose);

  useEffect(() => {
    if (editingItem) {
      setName(editingItem.name);
      setAmountStr(String(editingItem.amount));
      setCategory(editingItem.category);
      setPeriod(editingItem.period);
      setStartDate(editingItem.startDate);
      setIsRecurring(editingItem.isRecurring ?? false);
    } else {
      setName("");
      setAmountStr("");
      setCategory("Logement");
      setPeriod("month");
      setStartDate(getTodayDateString(userTimezone));
      setIsRecurring(false);
    }
    setError(null);
  }, [editingItem, isOpen, userTimezone]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim();
    if (!cleanName) {
      setError("Le nom de la dépense prévue est obligatoire");
      return;
    }

    const amount = Number(amountStr.replace(/\s/g, ""));
    if (isNaN(amount) || amount <= 0) {
      setError("Saisissez un montant valide supérieur à 0");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (editingItem) {
        const res = await updatePlannedExpenseAction(editingItem.id, {
          name: cleanName,
          amount,
          category,
          period,
          startDate,
          isRecurring,
        });

        if (!res.success) {
          setError(res.message || "Erreur lors de la modification.");
          return;
        }

        onSuccess("Dépense prévue modifiée");
      } else {
        const localId = generateLocalId();
        const res = await createPlannedExpenseAction({
          name: cleanName,
          amount,
          category,
          period,
          startDate,
          isRecurring,
          localId,
        });

        if (!res.success) {
          setError(res.message || "Erreur lors de la création.");
          return;
        }

        onSuccess("Dépense prévue créée");
      }

      onClose();
    } catch {
      setError("Une erreur inattendue est survenue.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="w-full max-w-sm bg-background border border-line rounded-3xl p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto animate-slideUp">
        {/* En-tête */}
        <div className="flex items-center justify-between pb-2 border-b border-line">
          <h2 className="text-sm font-extrabold text-foreground">
            {editingItem ? "Modifier la dépense prévue" : "Nouvelle dépense prévue"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="w-8 h-8 rounded-full bg-card border border-line flex items-center justify-center text-muted hover:text-foreground touch-target"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div role="alert" className="p-2.5 rounded-xl bg-danger/10 text-danger text-xs font-semibold text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4">
          {/* Nom */}
          <div>
            <label htmlFor="pName" className="block text-xs font-semibold text-muted mb-1">
              Nom de la dépense *
            </label>
            <input
              id="pName"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="ex : Loyer, Courses de la semaine, Forfait"
              className="w-full px-3.5 py-2.5 rounded-xl border border-line bg-card text-foreground text-xs outline-none focus:border-primary transition-colors touch-target"
            />
          </div>

          {/* Montant prévu */}
          <div>
            <label htmlFor="pAmount" className="block text-xs font-semibold text-muted mb-1">
              Montant prévu ({currency}) *
            </label>
            <input
              id="pAmount"
              type="number"
              inputMode="numeric"
              required
              min="1"
              value={amountStr}
              onChange={(e) => setAmountStr(e.target.value)}
              placeholder="ex : 60000"
              className="w-full px-3.5 py-2.5 rounded-xl border border-line bg-card text-foreground text-xs outline-none focus:border-primary transition-colors touch-target tabular-nums font-bold"
            />
          </div>

          {/* Période (Mois, Semaine, Jour) */}
          <div>
            <label className="block text-xs font-semibold text-muted mb-1.5">
              Périodicité *
            </label>
            <div className="flex bg-card-secondary p-1 rounded-xl gap-1">
              <button
                type="button"
                onClick={() => setPeriod("month")}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all touch-target ${
                  period === "month"
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted hover:text-foreground"
                }`}
              >
                Mois
              </button>
              <button
                type="button"
                onClick={() => setPeriod("week")}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all touch-target ${
                  period === "week"
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted hover:text-foreground"
                }`}
              >
                Semaine
              </button>
              <button
                type="button"
                onClick={() => setPeriod("day")}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all touch-target ${
                  period === "day"
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted hover:text-foreground"
                }`}
              >
                Jour
              </button>
            </div>
          </div>

          {/* Catégorie */}
          <div>
            <label className="block text-xs font-semibold text-muted mb-1.5">
              Catégorie *
            </label>
            <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {DEFAULT_CATEGORIES.map((cat) => {
                const IconComponent = cat.icon;
                const isSelected = category === cat.name;
                return (
                  <button
                    key={cat.name}
                    type="button"
                    onClick={() => setCategory(cat.name)}
                    className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[11px] font-bold whitespace-nowrap border transition-all touch-target ${
                      isSelected
                        ? "bg-primary/15 border-primary text-primary"
                        : "bg-card border-line text-muted hover:text-foreground"
                    }`}
                  >
                    <IconComponent className="w-3 h-3" />
                    <span>{cat.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Date de début */}
          <div>
            <label htmlFor="pDate" className="block text-xs font-semibold text-muted mb-1">
              Date de début *
            </label>
            <div className="relative">
              <input
                id="pDate"
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-line bg-card text-foreground text-xs outline-none focus:border-primary transition-colors touch-target"
              />
            </div>
          </div>

          {/* Option Récurrente (Story D5) */}
          <div className="p-3 bg-card border border-line rounded-2xl flex items-center justify-between gap-3">
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-foreground block">
                Dépense récurrente
              </span>
              <p className="text-[11px] text-muted leading-tight">
                Reconduction automatique chaque mois (ex : loyer, forfait).
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsRecurring((v) => !v)}
              aria-label="Activer ou désactiver la récurrence"
              className={`w-11 h-6 rounded-full p-0.5 transition-colors duration-200 relative shrink-0 ${
                isRecurring ? "bg-primary" : "bg-card-secondary border border-line"
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200 transform ${
                  isRecurring ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* Boutons d'action */}
          <div className="space-y-2 pt-2 border-t border-line">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-primary to-primary-dark text-white text-xs font-bold shadow-md shadow-primary/20 flex items-center justify-center gap-2 hover:opacity-95 touch-target transition-all disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : editingItem ? (
                "Enregistrer les modifications"
              ) : (
                "Créer la dépense prévue"
              )}
            </button>

            <button
              type="button"
              disabled={loading}
              onClick={onClose}
              className="w-full py-2.5 px-4 rounded-xl bg-card border border-line text-foreground text-xs font-bold hover:bg-card-secondary touch-target transition-colors"
            >
              Annuler
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
