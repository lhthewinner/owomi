"use client";

import { formatAmount, formatSignedAmount } from "@/lib/utils/currency";
import { content } from "@/content/fr";

interface BalanceHeroCardProps {
  balance: number;
  isNegative: boolean;
  balanceLabel: string;
  balanceNote: string;
  totalSpent: number;
  totalGain: number;
  currency: string;
}

export function BalanceHeroCard({
  balance,
  isNegative,
  balanceLabel,
  balanceNote,
  totalSpent,
  totalGain,
  currency,
}: BalanceHeroCardProps) {
  return (
    <div className="flex flex-col space-y-3">
      {/* 1. Carte Héro principale (Verte en positif, Ambre en négatif sans blocage) */}
      <div
        className={`rounded-3xl p-5 border shadow-sm transition-all relative overflow-hidden ${
          isNegative
            ? "bg-gradient-to-br from-amber-600 via-amber-500 to-amber-600 text-white border-amber-500/40"
            : "bg-gradient-to-br from-primary-dark via-emerald-600 to-primary text-white border-primary/40"
        }`}
      >
        <div className="text-xs font-semibold uppercase tracking-wider opacity-90">
          {balanceLabel}
        </div>

        <div className="tabular-nums font-extrabold text-3xl sm:text-4xl my-2 tracking-tight">
          {formatSignedAmount(balance, currency)}
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-white/20 backdrop-blur-sm">
          <span>{balanceNote}</span>
        </div>
      </div>

      {/* 2. Deux mini cartes statistiques (Dépensé orange, Gagné vert) */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-card rounded-2xl p-4 border border-line shadow-sm">
          <div className="text-[11.5px] font-medium text-muted">
            {content.balance.totalSpent}
          </div>
          <div className="tabular-nums font-extrabold text-lg text-spend mt-1">
            {totalSpent > 0 ? `− ${formatAmount(totalSpent, currency)}` : formatAmount(0, currency)}
          </div>
        </div>

        <div className="bg-card rounded-2xl p-4 border border-line shadow-sm">
          <div className="text-[11.5px] font-medium text-muted">
            {content.balance.gainedHorsSalaire}
          </div>
          <div className="tabular-nums font-extrabold text-lg text-gain mt-1">
            {totalGain > 0 ? `+ ${formatAmount(totalGain, currency)}` : formatAmount(0, currency)}
          </div>
        </div>
      </div>
    </div>
  );
}
