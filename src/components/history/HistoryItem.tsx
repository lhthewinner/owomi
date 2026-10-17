"use client";

import { Trash2, Coins, Handshake } from "lucide-react";
import { formatAmount } from "@/lib/utils/currency";
import { getCategoryIcon } from "@/lib/constants/categories";
import { content } from "@/content/fr";
import type { RecentOperation } from "@/lib/operations/actions";

interface HistoryItemProps {
  operation: RecentOperation;
  currency: string;
  onDeleteClick: (op: RecentOperation) => void;
}

export function HistoryItem({
  operation,
  currency,
  onDeleteClick,
}: HistoryItemProps) {
  if (operation.kind === "expense") {
    const Icon = getCategoryIcon(operation.category);
    const isPlanned = Boolean(operation.plannedExpenseId);

    return (
      <div className="flex items-center justify-between py-3 border-b border-line/40 last:border-b-0 gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-2xl bg-card2 border border-line flex items-center justify-center shrink-0">
            <Icon className="w-4 h-4 text-foreground" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-bold text-xs text-foreground truncate">
                {operation.note || operation.category}
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  isPlanned
                    ? "bg-accent/15 text-accent"
                    : "bg-warn/20 text-warn"
                }`}
              >
                {isPlanned ? content.history.plannedTag : content.history.unplannedTag}
              </span>
            </div>
            <div className="text-[11px] text-muted truncate mt-0.5">
              {operation.category}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <div className="tabular-nums font-extrabold text-xs text-spend text-right">
            − {formatAmount(operation.amount, currency)}
          </div>
          <button
            type="button"
            onClick={() => onDeleteClick(operation)}
            aria-label="Supprimer cette dépense"
            className="p-1.5 rounded-lg text-muted hover:text-danger hover:bg-danger/10 touch-target transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  }

  if (operation.kind === "income") {
    return (
      <div className="flex items-center justify-between py-3 border-b border-line/40 last:border-b-0 gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-2xl bg-card2 border border-line flex items-center justify-center shrink-0">
            <Coins className="w-4 h-4 text-gain" />
          </div>
          <div className="min-w-0">
            <span className="font-bold text-xs text-foreground truncate block">
              {operation.source || content.history.horsSalaire}
            </span>
            <div className="text-[11px] text-muted truncate mt-0.5">
              {content.history.horsSalaire}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <div className="tabular-nums font-extrabold text-xs text-gain text-right">
            + {formatAmount(operation.amount, currency)}
          </div>
          <button
            type="button"
            onClick={() => onDeleteClick(operation)}
            aria-label="Supprimer ce revenu"
            className="p-1.5 rounded-lg text-muted hover:text-danger hover:bg-danger/10 touch-target transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  }

  // Prêt (Loan)
  const isBorrowed = operation.direction === "borrowed";
  return (
    <div className="flex items-center justify-between py-3 border-b border-line/40 last:border-b-0 gap-3">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-10 h-10 rounded-2xl bg-card2 border border-line flex items-center justify-center shrink-0">
          <Handshake className="w-4 h-4 text-foreground" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-bold text-xs text-foreground truncate">
              {operation.counterpart}
            </span>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                isBorrowed ? "bg-gain/15 text-gain" : "bg-warn/20 text-warn"
              }`}
            >
              {isBorrowed ? content.history.borrowedTag : content.history.givenTag}
            </span>
          </div>
          <div className="text-[11px] text-muted truncate mt-0.5">
            {content.history.loanLabel}
            {operation.note ? ` · ${operation.note}` : ""}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2.5 shrink-0">
        <div
          className={`tabular-nums font-extrabold text-xs text-right ${
            isBorrowed ? "text-gain" : "text-spend"
          }`}
        >
          {isBorrowed ? "+ " : "− "}
          {formatAmount(operation.amount, currency)}
        </div>
        <button
          type="button"
          onClick={() => onDeleteClick(operation)}
          aria-label="Supprimer ce prêt"
          className="p-1.5 rounded-lg text-muted hover:text-danger hover:bg-danger/10 touch-target transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
