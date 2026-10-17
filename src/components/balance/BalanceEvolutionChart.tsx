"use client";

import { BarChart3 } from "lucide-react";
import { content } from "@/content/fr";
import type { EvolutionPoint } from "@/lib/balance/calculator";

interface BalanceEvolutionChartProps {
  chartTitle: string;
  evolution: EvolutionPoint[];
}

export function BalanceEvolutionChart({
  chartTitle,
  evolution,
}: BalanceEvolutionChartProps) {
  return (
    <div className="bg-card rounded-2xl p-4 border border-line shadow-sm space-y-3">
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
          <BarChart3 className="w-4 h-4" />
        </div>
        <h2 className="text-sm font-bold text-foreground">{chartTitle}</h2>
      </div>

      {/* Graphique à barres verticales */}
      <div className="h-[120px] flex items-end gap-1 sm:gap-1.5 pt-2 border-b border-line/40 pb-1">
        {evolution.map((pt) => (
          <div
            key={pt.date}
            className="flex-1 flex items-end justify-center gap-0.5 h-full group relative"
            title={`${pt.date} — Dépensé: ${pt.spent.toLocaleString()} | Gagné: ${pt.gained.toLocaleString()}`}
          >
            {/* Barre des dépenses (Orange) */}
            <div
              style={{ height: `${pt.spentHeightPercent}%` }}
              className="w-full max-w-[10px] bg-spend rounded-t-[3px] transition-all duration-300 min-h-[2px]"
            />
            {/* Barre des gains (Vert) */}
            <div
              style={{ height: `${pt.gainedHeightPercent}%` }}
              className="w-full max-w-[10px] bg-gain rounded-t-[3px] transition-all duration-300 min-h-[2px]"
            />
          </div>
        ))}
      </div>

      {/* Axe X (labels des jours) */}
      <div className="flex gap-1 sm:gap-1.5">
        {evolution.map((pt, idx) => (
          <div
            key={`x-${pt.date}-${idx}`}
            className="flex-1 text-center text-[10px] font-semibold text-muted"
          >
            {pt.label}
          </div>
        ))}
      </div>

      {/* Légende du graphique */}
      <div className="flex items-center justify-center gap-5 text-xs font-semibold text-muted pt-1">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-spend inline-block" />
          <span>{content.balance.expensesLegend}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-gain inline-block" />
          <span>{content.balance.gainsLegend}</span>
        </div>
      </div>
    </div>
  );
}
