"use client";

import { PieChart, Sparkles } from "lucide-react";
import { formatAmount } from "@/lib/utils/currency";
import { getCategoryIcon } from "@/lib/constants/categories";
import { content } from "@/content/fr";
import type { CategoryBreakdown } from "@/lib/balance/calculator";

interface BalanceCategoryBreakdownProps {
  categories: CategoryBreakdown[];
  currency: string;
}

export function BalanceCategoryBreakdown({
  categories,
  currency,
}: BalanceCategoryBreakdownProps) {
  return (
    <div className="bg-card rounded-2xl p-4 border border-line shadow-sm space-y-3">
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
          <PieChart className="w-4 h-4" />
        </div>
        <h2 className="text-sm font-bold text-foreground">
          {content.balance.byCategory}
        </h2>
      </div>

      {categories.length === 0 ? (
        <div className="text-center py-6 px-4 space-y-2">
          <div className="w-10 h-10 mx-auto rounded-full bg-primary/10 text-primary flex items-center justify-center">
            <Sparkles className="w-5 h-5" />
          </div>
          <p className="text-xs font-semibold text-muted">
            {content.balance.emptyExpenses}
          </p>
        </div>
      ) : (
        <div className="divide-y divide-line/40">
          {categories.map((cat) => {
            const Icon = getCategoryIcon(cat.category);
            return (
              <div key={cat.category} className="py-3 first:pt-1 last:pb-1">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-card2 border border-line flex items-center justify-center text-muted shrink-0">
                    <Icon className="w-4 h-4 text-foreground" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-bold text-foreground truncate">
                        {cat.category}
                      </span>
                      <span className="font-extrabold text-foreground tabular-nums">
                        {formatAmount(cat.amount, currency)}
                      </span>
                    </div>

                    {/* Barre de progression par catégorie */}
                    <div className="h-1.5 rounded-full bg-card2 overflow-hidden">
                      <div
                        style={{ width: `${cat.percentage}%` }}
                        className="h-full bg-primary rounded-full transition-all duration-300"
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
