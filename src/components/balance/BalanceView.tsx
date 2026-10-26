"use client";

import { useEffect, useState, useCallback } from "react";
import { Download, Loader2, AlertCircle } from "lucide-react";
import { content } from "@/content/fr";
import { shiftDate, getTodayDateString } from "@/lib/utils/date";
import { getUserDisplayName } from "@/lib/utils/user";
import {
  getBalanceDataAction,
  type BalanceDataResponse,
} from "@/lib/operations/actions";
import type { PeriodType } from "@/lib/balance/calculator";
import type { User } from "@supabase/supabase-js";
import { BalanceHeader } from "./BalanceHeader";
import { BalanceHeroCard } from "./BalanceHeroCard";
import { BalanceLoansCard } from "./BalanceLoansCard";
import { BalancePlannedVsUnplanned } from "./BalancePlannedVsUnplanned";
import { BalanceEvolutionChart } from "./BalanceEvolutionChart";
import { BalanceCategoryBreakdown } from "./BalanceCategoryBreakdown";
import { BalanceReportModal } from "./BalanceReportModal";

interface BalanceViewProps {
  currentUser?: User | null;
  onShowToast: (message: string) => void;
  refreshTrigger?: number;
  initialPeriod?: PeriodType;
}

export function BalanceView({
  currentUser,
  onShowToast,
  refreshTrigger = 0,
  initialPeriod = "day",
}: BalanceViewProps) {
  const cachedUser =
    typeof window !== "undefined"
      ? (() => {
          try {
            const raw = localStorage.getItem("owomi_cached_user");
            return raw ? JSON.parse(raw) : null;
          } catch {
            return null;
          }
        })()
      : null;

  const targetUser = currentUser || cachedUser;
  const { fullName: userName } = getUserDisplayName(targetUser);

  const [period, setPeriod] = useState<PeriodType>(initialPeriod);
  const [referenceDate, setReferenceDate] = useState<string>("");
  const [data, setData] = useState<BalanceDataResponse | null>(() => {
    if (typeof window !== "undefined") {
      try {
        const today = getTodayDateString();
        const cached = sessionStorage.getItem(`owomi_cache_bal_${initialPeriod}_${today}`);
        if (cached) return JSON.parse(cached);
      } catch {}
    }
    return null;
  });
  const [loading, setLoading] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      const today = getTodayDateString();
      return !sessionStorage.getItem(`owomi_cache_bal_${initialPeriod}_${today}`);
    }
    return true;
  });
  const [error, setError] = useState<string | null>(null);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState<boolean>(false);

  // Initialisation de la date de référence si vide
  useEffect(() => {
    if (!referenceDate) {
      setReferenceDate(getTodayDateString());
    }
  }, [referenceDate]);

  const loadData = useCallback(async () => {
    if (!referenceDate) return;
    const currentKey = `owomi_cache_bal_${period}_${referenceDate}`;
    if (typeof window !== "undefined") {
      try {
        const cached = sessionStorage.getItem(currentKey);
        if (cached) {
          setData(JSON.parse(cached));
          setLoading(false);
        } else {
          setLoading(true);
        }
      } catch {}
    }
    setError(null);
    try {
      const res = await getBalanceDataAction(period, referenceDate);
      if (res.success && res.data) {
        setData(res.data);
        if (typeof window !== "undefined") {
          try {
            sessionStorage.setItem(currentKey, JSON.stringify(res.data));
          } catch {}
        }
      } else {
        setError(res.message || content.common.errorTitle);
      }
    } catch {
      setError(content.common.errorTitle);
    } finally {
      setLoading(false);
    }
  }, [period, referenceDate]);

  useEffect(() => {
    loadData();
  }, [loadData, refreshTrigger]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isPdfModalOpen) {
        setIsPdfModalOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isPdfModalOpen]);

  const handlePeriodChange = (p: PeriodType) => {
    setPeriod(p);
  };

  const handlePrev = () => {
    setReferenceDate((prev) => shiftDate(prev, period, -1));
  };

  const handleNext = () => {
    setReferenceDate((prev) => shiftDate(prev, period, 1));
  };

  const handleResetToday = () => {
    setReferenceDate(getTodayDateString());
  };

  const todayStr = getTodayDateString();
  const isCurrentPeriod = referenceDate === todayStr;

  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[460px] text-muted space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-xs font-semibold">{content.common.loading}</p>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[460px] text-center p-6 space-y-3">
        <AlertCircle className="w-9 h-9 text-danger" />
        <p className="text-sm font-semibold text-foreground">{error}</p>
        <button
          onClick={loadData}
          className="btn sm ghost font-bold text-xs mt-2"
        >
          {content.common.errorRetry}
        </button>
      </div>
    );
  }

  const currency = data?.currency || "FCFA";

  return (
    <div className="flex flex-col space-y-4 pb-8 animate-fadeIn">
      {/* 1. En-tête avec sélection de période et navigation temporelle (Stories B1 & B3) */}
      <BalanceHeader
        period={period}
        formattedRange={data?.range.formattedLabel || ""}
        isCurrentPeriod={isCurrentPeriod}
        onPeriodChange={handlePeriodChange}
        onPrev={handlePrev}
        onNext={handleNext}
        onResetToday={handleResetToday}
      />

      {data && (
        <>
          {/* 2. Carte Héro et chiffres clés (Story B1) */}
          <BalanceHeroCard
            balance={data.balance}
            isNegative={data.isNegative}
            balanceLabel={data.balanceLabel}
            balanceNote={data.balanceNote}
            totalSpent={data.totalSpent}
            totalGain={data.totalGain}
            currency={currency}
          />

          {/* 3. Prêts de la période (si présents) */}
          <BalanceLoansCard
            loansBorrowed={data.loansBorrowed}
            loansGiven={data.loansGiven}
            currency={currency}
          />

          {/* 4. Prévu vs Imprévu */}
          <BalancePlannedVsUnplanned
            plannedSpent={data.plannedSpent}
            unplannedSpent={data.unplannedSpent}
            plannedPercent={data.plannedPercent}
            unplannedPercent={data.unplannedPercent}
            currency={currency}
          />

          {/* 5. Graphique d'évolution */}
          <BalanceEvolutionChart
            chartTitle={data.chartTitle}
            evolution={data.evolution}
          />

          {/* 6. Répartition par catégorie */}
          <BalanceCategoryBreakdown
            categories={data.byCategory}
            currency={currency}
          />

          {/* 7. Bouton Rapport PDF (avec mention V1.1) */}
          <button
            type="button"
            onClick={() => setIsPdfModalOpen(true)}
            className="w-full py-3.5 px-4 rounded-2xl bg-card border border-line shadow-sm text-foreground font-bold text-xs flex items-center justify-center gap-2 hover:bg-card2 transition-colors touch-target"
          >
            <Download className="w-4 h-4 text-primary" />
            <span>{content.balance.generatePdfBtn}</span>
          </button>
        </>
      )}

      {/* Modal du rapport PDF */}
      {isPdfModalOpen && data && (
        <BalanceReportModal
          isOpen={isPdfModalOpen}
          data={data}
          userName={userName}
          onClose={() => setIsPdfModalOpen(false)}
          onShowToast={onShowToast}
        />
      )}
    </div>
  );
}
