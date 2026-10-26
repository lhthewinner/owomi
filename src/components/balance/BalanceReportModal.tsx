"use client";

import { useEffect, useState } from "react";
import { X, Printer, Download, FileText } from "lucide-react";
import { content } from "@/content/fr";
import { formatAmount } from "@/lib/utils/currency";
import type { BalanceDataResponse } from "@/lib/operations/actions";
import { generateReportHtml } from "@/lib/balance/report";
import { downloadBalancePdf } from "@/lib/balance/pdf";

interface BalanceReportModalProps {
  isOpen: boolean;
  data: BalanceDataResponse;
  userName?: string;
  onClose: () => void;
  onShowToast: (message: string) => void;
}

export function BalanceReportModal({
  isOpen,
  data,
  userName = "Utilisateur",
  onClose,
  onShowToast,
}: BalanceReportModalProps) {
  const [isExporting, setIsExporting] = useState<boolean>(false);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const currency = data.currency || "FCFA";

  const handleDownloadPdf = () => {
    setIsExporting(true);
    try {
      downloadBalancePdf(data, { userName });
      onShowToast("Rapport PDF téléchargé avec succès");
    } catch {
      onShowToast("Impossible de télécharger le PDF");
    } finally {
      setIsExporting(false);
    }
  };

  const handlePrint = () => {
    try {
      const htmlContent = generateReportHtml(data, { userName });
      const blob = new Blob([htmlContent], { type: "text/html;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const printWindow = window.open(url, "_blank");
      if (printWindow) {
        printWindow.onload = () => {
          printWindow.print();
        };
      } else {
        handleDownloadPdf();
      }
    } catch {
      handleDownloadPdf();
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="report-modal-title"
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-fadeIn"
    >
      {/* Conteneur de l'aperçu du rapport */}
      <div className="bg-card w-full max-w-lg rounded-3xl border border-line shadow-2xl flex flex-col max-h-[92vh] overflow-hidden animate-slideUp">
        {/* En-tête */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-line bg-card shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary/15 text-primary flex items-center justify-center font-bold">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 id="report-modal-title" className="text-sm sm:text-base font-extrabold text-foreground">
                Rapport de Bilan
              </h2>
              <p className="text-[11px] text-muted">
                {data.range.formattedLabel}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label={content.common.close}
            className="w-8 h-8 rounded-full bg-card border border-line flex items-center justify-center text-muted hover:text-foreground touch-target"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Aperçu défilable du document */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1 text-xs">
          {/* Carte Héro résumé */}
          <div className="p-4 rounded-2xl bg-card-secondary border border-line space-y-3">
            <div className="text-center pb-3 border-b border-line">
              <span className="text-[11px] font-semibold text-muted uppercase tracking-wider">
                {data.balanceLabel}
              </span>
              <div
                className={`text-2xl sm:text-3xl font-extrabold tabular-nums my-0.5 ${
                  data.isNegative ? "text-danger" : "text-gain"
                }`}
              >
                {formatAmount(data.balance, currency)}
              </div>
              <p className="text-[11px] text-muted">{data.balanceNote}</p>
            </div>

            <div className="grid grid-cols-2 gap-3 text-center pt-1">
              <div>
                <span className="text-[11px] text-muted">Total Dépensé</span>
                <div className="font-extrabold text-sm text-spend tabular-nums mt-0.5">
                  {formatAmount(data.totalSpent, currency)}
                </div>
              </div>
              <div>
                <span className="text-[11px] text-muted">Total Gagné</span>
                <div className="font-extrabold text-sm text-gain tabular-nums mt-0.5">
                  + {formatAmount(data.totalGain, currency)}
                </div>
              </div>
            </div>
          </div>

          {/* Prévu vs Imprévu */}
          <div className="grid grid-cols-2 gap-2 p-3 rounded-2xl border border-line bg-card">
            <div>
              <span className="text-[11px] text-muted">Dépenses prévues</span>
              <div className="font-bold text-foreground text-xs mt-0.5">
                {formatAmount(data.plannedSpent, currency)}{" "}
                <span className="text-primary font-semibold text-[10px]">({data.plannedPercent}%)</span>
              </div>
            </div>
            <div>
              <span className="text-[11px] text-muted">Dépenses imprévues</span>
              <div className="font-bold text-foreground text-xs mt-0.5">
                {formatAmount(data.unplannedSpent, currency)}{" "}
                <span className="text-warn font-semibold text-[10px]">({data.unplannedPercent}%)</span>
              </div>
            </div>
          </div>

          {/* Répartition des catégories */}
          <div className="space-y-1.5">
            <span className="font-bold text-foreground text-xs block">
              Dépenses par catégorie
            </span>
            {data.byCategory.length === 0 ? (
              <p className="text-muted text-[11px] italic">Aucune dépense sur cette période.</p>
            ) : (
              <div className="rounded-xl border border-line overflow-hidden divide-y divide-line">
                {data.byCategory.map((cat) => (
                  <div key={cat.category} className="flex items-center justify-between p-2.5 bg-card">
                    <span className="font-semibold text-foreground text-xs">{cat.category}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-muted font-medium">{cat.percentage}%</span>
                      <span className="font-bold text-foreground tabular-nums text-xs">
                        {formatAmount(cat.amount, currency)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Barre d'action basse */}
        <div className="p-4 border-t border-line bg-card flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="py-3 px-3.5 rounded-xl border border-line bg-card text-foreground font-bold text-xs hover:bg-card-secondary transition-colors touch-target"
          >
            Fermer
          </button>
          <button
            type="button"
            onClick={handlePrint}
            aria-label="Imprimer le rapport"
            className="py-3 px-3.5 rounded-xl border border-line bg-card text-muted hover:text-foreground font-bold text-xs hover:bg-card-secondary transition-colors touch-target flex items-center justify-center gap-1.5"
          >
            <Printer className="w-4 h-4" />
            <span className="hidden sm:inline">Imprimer</span>
          </button>
          <button
            type="button"
            disabled={isExporting}
            onClick={handleDownloadPdf}
            className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-primary to-primary-dark text-white font-bold text-xs shadow-md shadow-primary/20 flex items-center justify-center gap-2 hover:opacity-95 touch-target transition-all disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>Télécharger le PDF</span>
          </button>
        </div>
      </div>
    </div>
  );
}
