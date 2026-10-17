"use client";

import { useState, useEffect } from "react";
import {
  Calendar,
  X,
  Loader2,
  Handshake,
  Coins,
  ArrowDownLeft,
  ArrowUpRight,
} from "lucide-react";
import { formatAmount } from "@/lib/utils/currency";
import { DEFAULT_CATEGORIES } from "@/lib/constants/categories";
import { getTodayDateString, generateLocalId } from "@/lib/utils/date";
import {
  createExpenseAction,
  createIncomeAction,
  createLoanAction,
  getActivePlannedExpensesAction,
} from "@/lib/operations/actions";

export type OperationMode = "exp" | "inc" | "loan";

interface QuickAddSheetProps {
  isOpen: boolean;
  initialMode?: OperationMode;
  initialPlannedExpenseId?: string | null;
  currency?: string;
  userTimezone?: string;
  onClose: () => void;
  onSuccess: (message: string) => void;
}

export function QuickAddSheet({
  isOpen,
  initialMode = "exp",
  initialPlannedExpenseId = null,
  currency = "FCFA",
  userTimezone = "Africa/Porto-Novo",
  onClose,
  onSuccess,
}: QuickAddSheetProps) {
  const [mode, setMode] = useState<OperationMode>(initialMode);
  const [amountStr, setAmountStr] = useState<string>("");
  const [selectedCat, setSelectedCat] = useState<string>("Alimentation");
  const [selectedPlannedId, setSelectedPlannedId] = useState<string | null>(initialPlannedExpenseId);
  const [plannedList, setPlannedList] = useState<Array<{ id: string; name: string; category: string; left: number }>>([]);
  const [loanDir, setLoanDir] = useState<"borrowed" | "given">("borrowed");
  const [counterpartOrSource, setCounterpartOrSource] = useState<string>("");
  const [date, setDate] = useState<string>(() => getTodayDateString(userTimezone));
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Synchronise le mode initial et charge les dépenses prévues actives
  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setSelectedPlannedId(initialPlannedExpenseId);
      setError(null);

      // Chargement des dépenses prévues actives
      getActivePlannedExpensesAction().then((res) => {
        if (res.success && res.data) {
          setPlannedList(res.data);
          if (initialPlannedExpenseId) {
            const found = res.data.find((p) => p.id === initialPlannedExpenseId);
            if (found) {
              setSelectedCat(found.category);
              setMode("exp");
            }
          }
        }
      });
    }
  }, [isOpen, initialMode, initialPlannedExpenseId]);

  if (!isOpen) return null;

  const handleKeypadPress = (k: string) => {
    setError(null);
    if (k === "⌫") {
      setAmountStr((prev) => prev.slice(0, -1));
    } else if (amountStr.length < 9) {
      if (amountStr === "" && (k === "0" || k === "000")) return;
      setAmountStr((prev) => prev + k);
    }
  };

  const handleSave = async () => {
    const amount = Number(amountStr);
    if (!amount || amount <= 0) {
      setError("Saisissez un montant valide supérieur à 0");
      return;
    }

    setLoading(true);
    setError(null);

    const localId = generateLocalId();

    try {
      if (mode === "exp") {
        const res = await createExpenseAction({
          amount,
          category: selectedCat,
          date,
          note: counterpartOrSource.trim(),
          plannedExpenseId: selectedPlannedId,
          localId,
        });

        if (!res.success) {
          setError(res.message || "Erreur lors de l'enregistrement de la dépense.");
          return;
        }

        onSuccess(
          selectedPlannedId
            ? "✓ Règlement enregistré sur la dépense prévue"
            : "✓ Dépense enregistrée (imprévue)"
        );
      } else if (mode === "inc") {
        const res = await createIncomeAction({
          amount,
          source: counterpartOrSource.trim() || "Revenu hors salaire",
          date,
          localId,
        });

        if (!res.success) {
          setError(res.message || "Erreur lors de l'enregistrement du revenu.");
          return;
        }

        onSuccess("✓ Revenu enregistré");
      } else {
        if (!counterpartOrSource.trim()) {
          setError("Indiquez la personne ou l'organisme pour ce prêt.");
          setLoading(false);
          return;
        }

        const res = await createLoanAction({
          direction: loanDir,
          amount,
          counterpart: counterpartOrSource.trim(),
          date,
          note: "",
          localId,
        });

        if (!res.success) {
          setError(res.message || "Erreur lors de l'enregistrement du prêt.");
          return;
        }

        onSuccess(
          loanDir === "borrowed"
            ? "✓ Prêt emprunté enregistré (+ solde)"
            : "✓ Prêt accordé enregistré (− solde)"
        );
      }

      // Réinitialisation et fermeture
      setAmountStr("");
      setCounterpartOrSource("");
      onClose();
    } catch {
      setError("Une erreur inattendue est survenue.");
    } finally {
      setLoading(false);
    }
  };

  const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "000", "0", "⌫"];

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm animate-fadeIn">
      {/* Clic en dehors pour fermer */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Volet bas (Bottom sheet) */}
      <div className="relative w-full sm:w-[390px] bg-background border-t border-line rounded-t-[32px] p-5 shadow-2xl flex flex-col max-h-[92vh] overflow-y-auto z-10 animate-slideUp">
        {/* Barre de préhension */}
        <div className="w-10 h-1 bg-line rounded-full mx-auto mb-3" />

        {/* En-tête : sélecteur de mode et bouton fermer */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex bg-card-secondary p-1 rounded-2xl flex-1 mr-2">
            <button
              type="button"
              onClick={() => {
                setMode("exp");
                setError(null);
              }}
              className={`flex-1 py-1.5 rounded-xl font-bold text-xs transition-all touch-target ${
                mode === "exp"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted hover:text-foreground"
              }`}
            >
              Dépense
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("inc");
                setError(null);
              }}
              className={`flex-1 py-1.5 rounded-xl font-bold text-xs transition-all touch-target ${
                mode === "inc"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted hover:text-foreground"
              }`}
            >
              Revenu
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("loan");
                setError(null);
              }}
              className={`flex-1 py-1.5 rounded-xl font-bold text-xs transition-all touch-target ${
                mode === "loan"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted hover:text-foreground"
              }`}
            >
              Prêt
            </button>
          </div>

          <button
            onClick={onClose}
            aria-label="Fermer"
            className="w-8 h-8 rounded-full bg-card border border-line flex items-center justify-center text-muted hover:text-foreground touch-target"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Affichage du montant en grands chiffres tabulaires */}
        <div className="text-center py-2">
          <div className="tabular-nums font-extrabold text-4xl text-foreground">
            {amountStr ? Number(amountStr).toLocaleString("fr-FR") : "0"}
          </div>
          <div className="text-xs font-semibold text-muted tracking-wide mt-0.5">
            {currency}
          </div>
        </div>

        {/* Message d'erreur */}
        {error && (
          <div
            role="alert"
            className="p-2.5 mb-2 rounded-xl bg-danger/10 text-danger text-xs font-semibold text-center animate-fadeIn"
          >
            {error}
          </div>
        )}

        {/* OPTIONS SELON LE MODE */}
        <div className="space-y-2.5 my-2">
          {/* Mode Dépense : Chips Catégories et Sélection Dépense Prévue */}
          {mode === "exp" && (
            <div className="space-y-2">
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                {DEFAULT_CATEGORIES.map((cat) => {
                  const IconComponent = cat.icon;
                  const isSelected = selectedCat === cat.name;
                  return (
                    <button
                      key={cat.name}
                      type="button"
                      onClick={() => setSelectedCat(cat.name)}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all border touch-target ${
                        isSelected
                          ? "bg-primary/15 border-primary text-primary"
                          : "bg-card border-line text-muted hover:text-foreground"
                      }`}
                    >
                      <IconComponent className="w-3.5 h-3.5" />
                      <span>{cat.name}</span>
                    </button>
                  );
                })}
              </div>

              {/* Sélection Dépense Prévue (Story D2) */}
              <div>
                <select
                  aria-label="Rattacher à une dépense prévue"
                  value={selectedPlannedId || ""}
                  onChange={(e) => {
                    const id = e.target.value || null;
                    setSelectedPlannedId(id);
                    if (id) {
                      const found = plannedList.find((p) => p.id === id);
                      if (found) setSelectedCat(found.category);
                    }
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-line bg-card text-foreground text-xs outline-none focus:border-primary transition-colors touch-target"
                >
                  <option value="">Dépense imprévue (aucun rattachement)</option>
                  {plannedList.map((p) => (
                    <option key={p.id} value={p.id}>
                      Rattacher : {p.name} ({p.category} · Reste : {formatAmount(p.left, currency)})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Mode Prêt : Direction (Emprunté vs Prêté) */}
          {mode === "loan" && (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setLoanDir("borrowed")}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold border transition-all touch-target ${
                  loanDir === "borrowed"
                    ? "bg-gain/15 border-gain text-gain"
                    : "bg-card border-line text-muted"
                }`}
              >
                <ArrowDownLeft className="w-4 h-4" />
                <span>J&apos;ai emprunté (+)</span>
              </button>
              <button
                type="button"
                onClick={() => setLoanDir("given")}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold border transition-all touch-target ${
                  loanDir === "given"
                    ? "bg-spend/15 border-spend text-spend"
                    : "bg-card border-line text-muted"
                }`}
              >
                <ArrowUpRight className="w-4 h-4" />
                <span>J&apos;ai prêté (−)</span>
              </button>
            </div>
          )}

          {/* Champ texte optionnel (Source, Personne, Note) */}
          <input
            type="text"
            value={counterpartOrSource}
            onChange={(e) => setCounterpartOrSource(e.target.value)}
            placeholder={
              mode === "exp"
                ? "Note ou détail (facultatif)"
                : mode === "inc"
                ? "Source (ex : mission freelance)"
                : "Personne ou organisme *"
            }
            className="w-full px-3.5 py-2.5 rounded-xl border border-line bg-card text-foreground text-xs outline-none focus:border-primary transition-colors touch-target"
          />

          {/* Sélecteur de date (date du jour par défaut mais modifiable) */}
          <div className="flex items-center justify-between px-1">
            <button
              type="button"
              onClick={() => setShowDatePicker(!showDatePicker)}
              className="flex items-center gap-1.5 text-xs font-medium text-muted hover:text-foreground touch-target"
            >
              <Calendar className="w-3.5 h-3.5 text-primary" />
              <span>Date : {date === getTodayDateString(userTimezone) ? "Aujourd'hui" : date}</span>
            </button>
            {showDatePicker && (
              <input
                type="date"
                value={date}
                onChange={(e) => {
                  setDate(e.target.value);
                  setShowDatePicker(false);
                }}
                className="px-2 py-1 rounded-lg border border-line bg-card text-xs text-foreground outline-none"
              />
            )}
          </div>
        </div>

        {/* Pavé numérique tactile (Keypad) */}
        <div className="grid grid-cols-3 gap-2 my-2">
          {keys.map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => handleKeypadPress(k)}
              className="py-3 rounded-xl bg-card border border-line text-foreground text-lg font-bold shadow-sm active:bg-card-secondary touch-target transition-colors"
            >
              {k}
            </button>
          ))}
        </div>

        {/* Bouton d'enregistrement principal */}
        <button
          type="button"
          disabled={loading}
          onClick={handleSave}
          className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-primary to-primary-dark text-white font-bold text-sm shadow-md shadow-primary/20 flex items-center justify-center gap-2 hover:opacity-95 touch-target transition-all disabled:opacity-50 mt-1"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : mode === "exp" ? (
            "Enregistrer la dépense"
          ) : mode === "inc" ? (
            "Enregistrer le revenu"
          ) : (
            "Enregistrer le prêt"
          )}
        </button>
      </div>
    </div>
  );
}
