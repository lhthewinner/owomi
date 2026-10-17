"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Plus,
  Loader2,
  Trash2,
  Edit2,
  CheckCircle2,
  AlertTriangle,
  Receipt,
  Calendar,
} from "lucide-react";
import { formatAmount } from "@/lib/utils/currency";
import { getCategoryIcon } from "@/lib/constants/categories";
import {
  getPlannedExpensesWithProgressAction,
  deletePlannedExpenseAction,
  type PlannedExpenseWithProgress,
  type PlannedExpensesSummary,
} from "@/lib/operations/actions";
import { PlannedExpenseModal } from "./PlannedExpenseModal";

interface PlannedExpensesViewProps {
  currency?: string;
  userTimezone?: string;
  onOpenPayPlanned: (plannedExpenseId: string) => void;
  onShowToast: (message: string) => void;
  refreshTrigger?: number;
}

const STATUS_CONFIG = {
  venir: {
    label: "À venir",
    className: "bg-line text-muted",
  },
  cours: {
    label: "En cours",
    className: "bg-accent/15 text-accent",
  },
  solde: {
    label: "Soldée ✓",
    className: "bg-gain/15 text-gain",
  },
  depasse: {
    label: "Dépassée",
    className: "bg-warn/20 text-warn",
  },
} as const;

const PERIOD_LABELS = {
  day: "Jour",
  week: "Semaine",
  month: "Mois",
} as const;

export function PlannedExpensesView({
  currency = "FCFA",
  userTimezone = "Africa/Porto-Novo",
  onOpenPayPlanned,
  onShowToast,
  refreshTrigger = 0,
}: PlannedExpensesViewProps) {
  const [data, setData] = useState<PlannedExpensesSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [filterPeriod, setFilterPeriod] = useState<"all" | "day" | "week" | "month">("all");

  // Modal création / modification
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<PlannedExpenseWithProgress | null>(null);

  // Modal suppression
  const [deletingItem, setDeletingItem] = useState<PlannedExpenseWithProgress | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getPlannedExpensesWithProgressAction();
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
    if (!deletingItem) return;
    setIsDeleting(true);
    try {
      const res = await deletePlannedExpenseAction(deletingItem.id);
      if (res.success) {
        onShowToast("✓ Dépense prévue supprimée (ses règlements deviennent imprévus)");
        setDeletingItem(null);
        await loadData();
      } else {
        onShowToast(res.message || "Erreur lors de la suppression");
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredItems = (data?.items || []).filter((item) => {
    if (filterPeriod === "all") return true;
    return item.period === filterPeriod;
  });

  const totalPlanned = filteredItems.reduce((sum, i) => sum + i.amount, 0);
  const totalSpent = filteredItems.reduce((sum, i) => sum + i.spent, 0);
  const totalLeft = Math.max(0, totalPlanned - totalSpent);
  const overallPercent = totalPlanned > 0 ? Math.min(100, Math.round((totalSpent / totalPlanned) * 100)) : 0;

  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] text-muted space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-xs font-semibold">Chargement des dépenses prévues...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fadeIn">
      {/* 1. Filtres par période */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setFilterPeriod("all")}
          className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition-all border touch-target ${
            filterPeriod === "all"
              ? "bg-primary text-white border-primary shadow-sm"
              : "bg-card border-line text-muted hover:text-foreground"
          }`}
        >
          Toutes
        </button>
        <button
          type="button"
          onClick={() => setFilterPeriod("day")}
          className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition-all border touch-target ${
            filterPeriod === "day"
              ? "bg-primary text-white border-primary shadow-sm"
              : "bg-card border-line text-muted hover:text-foreground"
          }`}
        >
          Jour
        </button>
        <button
          type="button"
          onClick={() => setFilterPeriod("week")}
          className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition-all border touch-target ${
            filterPeriod === "week"
              ? "bg-primary text-white border-primary shadow-sm"
              : "bg-card border-line text-muted hover:text-foreground"
          }`}
        >
          Semaine
        </button>
        <button
          type="button"
          onClick={() => setFilterPeriod("month")}
          className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition-all border touch-target ${
            filterPeriod === "month"
              ? "bg-primary text-white border-primary shadow-sm"
              : "bg-card border-line text-muted hover:text-foreground"
          }`}
        >
          Mois
        </button>
      </div>

      {/* 2. Carte récapitulative du budget prévu */}
      <div className="bg-card rounded-2xl p-4 border border-line shadow-sm space-y-3">
        <div className="flex items-center justify-between text-xs font-semibold text-muted">
          <span>Prévu au budget</span>
          <span>
            {filteredItems.length} {filteredItems.length <= 1 ? "prévue" : "prévues"}
          </span>
        </div>

        <div className="tabular-nums font-extrabold text-2xl text-foreground tracking-tight">
          {formatAmount(totalPlanned, currency)}
        </div>

        {/* Barre de progression globale */}
        <div className="w-full h-2.5 bg-line rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-300 rounded-full"
            style={{ width: `${overallPercent}%` }}
          />
        </div>

        {/* Légende dépensé / reste */}
        <div className="flex items-center justify-between text-xs font-semibold pt-0.5">
          <span className="text-primary flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
            <span>Dépensé :</span>
            <strong className="tabular-nums font-extrabold">{formatAmount(totalSpent, currency)}</strong>
          </span>
          <span className="text-muted flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-line shrink-0" />
            <span>Reste :</span>
            <strong className="tabular-nums font-extrabold">{formatAmount(totalLeft, currency)}</strong>
          </span>
        </div>
      </div>

      {/* 3. Liste des dépenses prévues */}
      {filteredItems.length === 0 ? (
        <div className="bg-card rounded-2xl p-6 border border-line text-center space-y-3 shadow-sm">
          <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
            <Receipt className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-foreground">
              Aucune dépense prévue dans cette catégorie
            </p>
            <p className="text-[11px] text-muted mt-0.5">
              Créez une dépense prévue pour planifier vos règlements en plusieurs fois.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredItems.map((p) => {
            const Icon = getCategoryIcon(p.category);
            const statusCfg = STATUS_CONFIG[p.status];
            const isSettled = p.status === "solde";
            const isExceeded = p.status === "depasse";

            return (
              <div
                key={p.id}
                className="bg-card rounded-2xl p-4 border border-line shadow-sm space-y-3 hover:border-line-hover transition-colors"
              >
                {/* En-tête de la carte */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-xs font-extrabold text-foreground truncate">
                        {p.name}
                      </h3>
                      <div className="flex items-center gap-1.5 text-[11px] text-muted mt-0.5">
                        <span>{p.category}</span>
                        <span>·</span>
                        <span className="font-semibold">{PERIOD_LABELS[p.period]}</span>
                      </div>
                    </div>
                  </div>

                  {/* Badge de statut */}
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${statusCfg.className}`}
                  >
                    {statusCfg.label}
                  </span>
                </div>

                {/* Barre de progression individuelle */}
                <div className="w-full h-2 bg-line rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 rounded-full ${
                      isExceeded ? "bg-warn" : isSettled ? "bg-gain" : "bg-primary"
                    }`}
                    style={{ width: `${p.progressPercent}%` }}
                  />
                </div>

                {/* Chiffres clés : Prévu, Dépensé, Reste */}
                <div className="grid grid-cols-3 gap-1 pt-1 text-center border-t border-line/60">
                  <div>
                    <div className="text-[10px] text-muted font-medium">Prévu</div>
                    <div className="tabular-nums font-extrabold text-xs text-foreground mt-0.5">
                      {formatAmount(p.amount, currency)}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-muted font-medium">Dépensé</div>
                    <div className="tabular-nums font-extrabold text-xs text-spend mt-0.5">
                      {formatAmount(p.spent, currency)}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-muted font-medium">Reste</div>
                    <div
                      className={`tabular-nums font-extrabold text-xs mt-0.5 ${
                        isSettled ? "text-gain" : "text-foreground"
                      }`}
                    >
                      {formatAmount(p.left, currency)}
                    </div>
                  </div>
                </div>

                {/* Actions : Régler, Modifier, Supprimer */}
                <div className="flex items-center justify-between pt-1 border-t border-line/60">
                  {!isSettled ? (
                    <button
                      type="button"
                      onClick={() => onOpenPayPlanned(p.id)}
                      className="py-1.5 px-3 rounded-xl bg-primary text-white text-[11px] font-bold shadow-sm hover:opacity-95 touch-target transition-opacity"
                    >
                      Régler
                    </button>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-gain py-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Soldée</span>
                    </span>
                  )}

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingItem(p);
                        setIsModalOpen(true);
                      }}
                      aria-label="Modifier la dépense prévue"
                      className="w-8 h-8 rounded-lg text-muted hover:text-foreground hover:bg-card-secondary flex items-center justify-center touch-target transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setDeletingItem(p)}
                      aria-label="Supprimer la dépense prévue"
                      className="w-8 h-8 rounded-lg text-muted hover:text-danger hover:bg-danger/10 flex items-center justify-center touch-target transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 4. Bouton Créer une dépense prévue */}
      <button
        type="button"
        onClick={() => {
          setEditingItem(null);
          setIsModalOpen(true);
        }}
        className="w-full py-3.5 px-4 rounded-2xl bg-card border border-line text-foreground font-bold text-xs flex items-center justify-center gap-2 hover:bg-card-secondary touch-target transition-colors shadow-sm"
      >
        <Plus className="w-4 h-4 text-primary stroke-[2.5]" />
        <span>Créer une dépense prévue</span>
      </button>

      {/* 5. Note explicative de la maquette */}
      <p className="text-[11px] text-muted leading-relaxed px-1">
        Une dépense prévue se règle en plusieurs fois : chaque règlement se déduit du montant prévu. Tout achat non rattaché est « imprévu ».
      </p>

      {/* 6. Modal Création / Modification */}
      <PlannedExpenseModal
        isOpen={isModalOpen}
        currency={currency}
        userTimezone={userTimezone}
        editingItem={editingItem}
        onClose={() => {
          setIsModalOpen(false);
          setEditingItem(null);
        }}
        onSuccess={(msg) => {
          onShowToast(msg);
          loadData();
        }}
      />

      {/* 7. Modal Confirmation de Suppression (Invariant 5) */}
      {deletingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="w-full max-w-xs bg-background border border-line rounded-3xl p-5 shadow-2xl space-y-4 animate-slideUp">
            <div className="w-10 h-10 rounded-2xl bg-danger/10 text-danger flex items-center justify-center mx-auto">
              <Trash2 className="w-5 h-5" />
            </div>

            <div className="text-center">
              <h3 className="text-sm font-extrabold text-foreground">
                Supprimer « {deletingItem.name} » ?
              </h3>
              <p className="text-xs text-muted mt-1 leading-relaxed">
                Ses règlements déjà effectués ne seront pas supprimés : ils deviendront automatiquement des dépenses imprévues.
              </p>
            </div>

            <div className="space-y-2 pt-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDeleteConfirm}
                className="w-full py-3 px-4 rounded-xl bg-danger text-white text-xs font-bold hover:opacity-90 touch-target transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirmer la suppression"}
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
