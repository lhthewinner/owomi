"use client";

import { Home, BarChart3, Plus, ReceiptText, WalletCards } from "lucide-react";
import { content } from "@/content/fr";

export type NavTab = "dashboard" | "bilan" | "history" | "budget";

interface BottomNavProps {
  activeTab: NavTab;
  onChangeTab: (tab: NavTab) => void;
  onOpenAdd: () => void;
}

export function BottomNav({ activeTab, onChangeTab, onOpenAdd }: BottomNavProps) {
  return (
    <nav
      aria-label="Navigation principale"
      className="sticky bottom-0 left-0 right-0 w-full max-w-xl md:max-w-2xl lg:max-w-3xl mx-auto bg-background/95 backdrop-blur-md border-t sm:border-x border-line sm:rounded-t-2xl px-3 sm:px-6 py-2 flex items-center justify-around z-30 transition-all"
    >
      {/* 1. Accueil */}
      <button
        type="button"
        onClick={() => onChangeTab("dashboard")}
        className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors touch-target ${
          activeTab === "dashboard" ? "text-primary font-bold" : "text-muted hover:text-foreground"
        }`}
      >
        <Home className="w-5 h-5 mb-0.5" />
        <span className="text-[10px] tracking-tight">{content.nav.home}</span>
      </button>

      {/* 2. Bilan */}
      <button
        type="button"
        onClick={() => onChangeTab("bilan")}
        className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors touch-target ${
          activeTab === "bilan" ? "text-primary font-bold" : "text-muted hover:text-foreground"
        }`}
      >
        <BarChart3 className="w-5 h-5 mb-0.5" />
        <span className="text-[10px] tracking-tight">{content.nav.balance}</span>
      </button>

      {/* 3. Bouton central FAB (+) */}
      <div className="flex-1 flex justify-center">
        <button
          type="button"
          onClick={onOpenAdd}
          aria-label={content.nav.add}
          className="w-12 h-12 -mt-5 rounded-full bg-gradient-to-tr from-primary-dark to-primary text-white shadow-lg shadow-primary/30 flex items-center justify-center hover:scale-105 active:scale-95 transition-transform touch-target"
        >
          <Plus className="w-6 h-6 stroke-[2.5]" />
        </button>
      </div>

      {/* 4. Historique */}
      <button
        type="button"
        onClick={() => onChangeTab("history")}
        className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors touch-target ${
          activeTab === "history" ? "text-primary font-bold" : "text-muted hover:text-foreground"
        }`}
      >
        <ReceiptText className="w-5 h-5 mb-0.5" />
        <span className="text-[10px] tracking-tight">{content.nav.history}</span>
      </button>

      {/* 5. Budget (Revenus & Prêts en Lot 3, Prévues en Lot 4) */}
      <button
        type="button"
        onClick={() => onChangeTab("budget")}
        className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors touch-target ${
          activeTab === "budget" ? "text-primary font-bold" : "text-muted hover:text-foreground"
        }`}
      >
        <WalletCards className="w-5 h-5 mb-0.5" />
        <span className="text-[10px] tracking-tight">{content.nav.budget}</span>
      </button>
    </nav>
  );
}
