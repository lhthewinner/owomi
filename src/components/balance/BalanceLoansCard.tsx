"use client";

import { Handshake } from "lucide-react";
import { formatAmount } from "@/lib/utils/currency";
import { content } from "@/content/fr";

interface BalanceLoansCardProps {
  loansBorrowed: number;
  loansGiven: number;
  currency: string;
}

export function BalanceLoansCard({
  loansBorrowed,
  loansGiven,
  currency,
}: BalanceLoansCardProps) {
  // Masqué si aucun prêt n'a été enregistré sur la période
  if (loansBorrowed === 0 && loansGiven === 0) {
    return null;
  }

  return (
    <div className="bg-card rounded-2xl p-4 border border-line shadow-sm space-y-3">
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
          <Handshake className="w-4 h-4" />
        </div>
        <h2 className="text-sm font-bold text-foreground">
          {content.balance.loansCardTitle}
        </h2>
      </div>

      <div className="grid grid-cols-2 gap-3 pt-1">
        <div>
          <div className="text-[11.5px] font-medium text-muted">
            {content.balance.borrowed}
          </div>
          <div className="tabular-nums font-extrabold text-base text-gain mt-0.5">
            + {formatAmount(loansBorrowed, currency)}
          </div>
        </div>

        <div>
          <div className="text-[11.5px] font-medium text-muted">
            {content.balance.given}
          </div>
          <div className="tabular-nums font-extrabold text-base text-spend mt-0.5">
            − {formatAmount(loansGiven, currency)}
          </div>
        </div>
      </div>
    </div>
  );
}
