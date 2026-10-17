"use client";

import { ChevronLeft, ChevronRight, RotateCcw } from "lucide-react";
import { content } from "@/content/fr";
import type { PeriodType } from "@/lib/balance/calculator";

interface BalanceHeaderProps {
  period: PeriodType;
  formattedRange: string;
  isCurrentPeriod: boolean;
  onPeriodChange: (p: PeriodType) => void;
  onPrev: () => void;
  onNext: () => void;
  onResetToday: () => void;
}

export function BalanceHeader({
  period,
  formattedRange,
  isCurrentPeriod,
  onPeriodChange,
  onPrev,
  onNext,
  onResetToday,
}: BalanceHeaderProps) {
  return (
    <div className="flex flex-col space-y-3 pt-1">
      {/* 1. Titre et navigation temporelle */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-foreground tracking-tight">
            {content.balance.title}
          </h1>
          <div className="text-xs font-semibold text-muted capitalize mt-0.5">
            {formattedRange}
          </div>
        </div>

        {/* Boutons de navigation (Stories B1 & B3) */}
        <div className="flex items-center gap-1.5">
          {!isCurrentPeriod && (
            <button
              onClick={onResetToday}
              title="Revenir à aujourd'hui"
              aria-label="Revenir à aujourd'hui"
              className="p-1.5 rounded-full bg-card border border-line text-muted hover:text-foreground touch-target flex items-center justify-center transition-colors"
            >
              <RotateCcw className="w-4 h-4 text-primary" />
            </button>
          )}
          <button
            onClick={onPrev}
            title="Période précédente"
            aria-label="Période précédente"
            className="w-9 h-9 rounded-full bg-card border border-line text-muted hover:text-foreground touch-target flex items-center justify-center transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={onNext}
            title="Période suivante"
            aria-label="Période suivante"
            className="w-9 h-9 rounded-full bg-card border border-line text-muted hover:text-foreground touch-target flex items-center justify-center transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 2. Sélecteur de période (Jour / Semaine / Mois) */}
      <div className="flex bg-card2 p-1 rounded-2xl border border-line/60">
        <button
          onClick={() => onPeriodChange("day")}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all touch-target ${
            period === "day"
              ? "bg-card text-foreground shadow-sm"
              : "text-muted hover:text-foreground"
          }`}
        >
          {content.balance.dayTab}
        </button>
        <button
          onClick={() => onPeriodChange("week")}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all touch-target ${
            period === "week"
              ? "bg-card text-foreground shadow-sm"
              : "text-muted hover:text-foreground"
          }`}
        >
          {content.balance.weekTab}
        </button>
        <button
          onClick={() => onPeriodChange("month")}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all touch-target ${
            period === "month"
              ? "bg-card text-foreground shadow-sm"
              : "text-muted hover:text-foreground"
          }`}
        >
          {content.balance.monthTab}
        </button>
      </div>
    </div>
  );
}
