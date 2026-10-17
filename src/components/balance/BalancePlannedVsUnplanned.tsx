"use client";

import { Target } from "lucide-react";
import { formatAmount } from "@/lib/utils/currency";
import { content } from "@/content/fr";

interface BalancePlannedVsUnplannedProps {
  plannedSpent: number;
  unplannedSpent: number;
  plannedPercent: number;
  unplannedPercent: number;
  currency: string;
}

export function BalancePlannedVsUnplanned({
  plannedSpent,
  unplannedSpent,
  plannedPercent,
  unplannedPercent,
  currency,
}: BalancePlannedVsUnplannedProps) {
  const total = plannedSpent + unplannedSpent;

  return (
    <div className="bg-card rounded-2xl p-4 border border-line shadow-sm space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-accent/10 text-accent flex items-center justify-center">
            <Target className="w-4 h-4" />
          </div>
          <h2 className="text-sm font-bold text-foreground">
            {content.balance.plannedVsUnplanned}
          </h2>
        </div>
      </div>

      {/* Jauge bicolore horizontale */}
      <div className="h-2.5 rounded-full bg-card2 overflow-hidden flex border border-line/40">
        {total > 0 ? (
          <>
            <div
              style={{ width: `${plannedPercent}%` }}
              className="bg-accent transition-all duration-500"
              title={`Prévu : ${plannedPercent}%`}
            />
            <div
              style={{ width: `${unplannedPercent}%` }}
              className="bg-warn transition-all duration-500"
              title={`Imprévu : ${unplannedPercent}%`}
            />
          </>
        ) : (
          <div className="w-full bg-card2" />
        )}
      </div>

      {/* Légende avec montants */}
      <div className="flex items-center justify-between text-xs font-semibold text-muted pt-0.5">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-accent inline-block" />
          <span>
            {content.balance.planned} :{" "}
            <strong className="text-foreground tabular-nums">
              {formatAmount(plannedSpent, currency)}
            </strong>
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-warn inline-block" />
          <span>
            {content.balance.unplanned} :{" "}
            <strong className="text-foreground tabular-nums">
              {formatAmount(unplannedSpent, currency)}
            </strong>
          </span>
        </div>
      </div>
    </div>
  );
}
