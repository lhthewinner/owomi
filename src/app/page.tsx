"use client";

import { useEffect, useState } from "react";
import { Wallet, Sun, Moon, ArrowRight, WifiOff } from "lucide-react";
import { content } from "@/content/fr";
import { formatAmount } from "@/lib/utils/currency";

export default function HomePage() {
  const [isDark, setIsDark] = useState<boolean>(false);

  useEffect(() => {
    // Vérifier les préférences enregistrées ou système
    const savedTheme = localStorage.getItem("asoro-theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const initialDark = savedTheme === "dark" || (!savedTheme && prefersDark);
    setIsDark(initialDark);
    document.documentElement.setAttribute("data-theme", initialDark ? "dark" : "light");
  }, []);

  const toggleTheme = () => {
    const nextTheme = !isDark;
    setIsDark(nextTheme);
    document.documentElement.setAttribute("data-theme", nextTheme ? "dark" : "light");
    localStorage.setItem("asoro-theme", nextTheme ? "dark" : "light");
  };

  return (
    <main className="min-h-screen bg-slate-100 dark:bg-[#05080F] flex items-center justify-center p-0 sm:p-4">
      {/* Conteneur mobile centré (conforme à la maquette de 390px sur grand écran et 100% sur mobile) */}
      <div className="w-full sm:w-[390px] min-h-screen sm:min-h-[820px] sm:max-h-[96vh] bg-background sm:border-[10px] sm:border-slate-900 dark:sm:border-slate-950 sm:rounded-[38px] sm:shadow-2xl overflow-hidden flex flex-col p-5 sm:p-6 relative transition-colors duration-200">
        
        {/* En-tête avec Logo et Bouton de thème */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 font-extrabold text-xl tracking-tight text-foreground">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-dark to-primary flex items-center justify-center text-white shadow-sm">
              <Wallet className="w-5 h-5 text-white" aria-hidden="true" />
            </div>
            <span>{content.app.name}</span>
          </div>
          <button
            onClick={toggleTheme}
            aria-label={isDark ? "Passer en mode clair" : "Passer en mode sombre"}
            className="w-10 h-10 rounded-full bg-card shadow-sm border border-line flex items-center justify-center text-muted hover:text-foreground touch-target transition-colors"
          >
            {isDark ? <Sun className="w-5 h-5 text-warn" /> : <Moon className="w-5 h-5" />}
          </button>
        </div>

        {/* Corps principal : Titre et Promesse */}
        <div className="mt-6 mb-4">
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight leading-[1.15] mb-3">
            {content.welcome.title}
            <br />
            ton <span className="text-primary">{content.welcome.titleHighlight}</span>
            {content.welcome.titleEnd}
          </h1>

          <p className="text-muted text-[14px] leading-relaxed mb-5">
            {content.app.description}
          </p>

          {/* Carte d'aperçu du bilan (fidèle à la maquette) */}
          <div className="bg-card rounded-2xl p-4 shadow-sm border border-line -rotate-1 transform transition-transform hover:rotate-0">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-muted">{content.welcome.previewLabel}</span>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-gain/15 text-gain">
                {content.welcome.previewTag}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="text-xs text-muted font-medium">{content.welcome.previewSpentLabel}</div>
                <div className="tabular-nums font-extrabold text-lg text-spend mt-0.5">
                  {formatAmount(4500, content.app.currencyDefault)}
                </div>
              </div>
              <div>
                <div className="text-xs text-muted font-medium">{content.welcome.previewGainedLabel}</div>
                <div className="tabular-nums font-extrabold text-lg text-gain mt-0.5">
                  + {formatAmount(10000, content.app.currencyDefault)}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Espaceur flexible pour caler les boutons en bas */}
        <div className="flex-1 min-h-[20px]" />

        {/* Boutons d'action et notice hors ligne */}
        <div className="space-y-3 pb-2">
          <button
            type="button"
            className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-primary to-primary-dark text-white font-bold text-[15px] shadow-lg shadow-primary/25 flex items-center justify-center gap-2 hover:opacity-95 touch-target transition-all"
          >
            <span>{content.welcome.btnSignup}</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            type="button"
            className="w-full py-3.5 px-6 rounded-2xl bg-card border border-line text-foreground font-bold text-[15px] hover:bg-card-secondary touch-target transition-colors"
          >
            {content.welcome.btnLogin}
          </button>

          <div className="flex items-center justify-center gap-1.5 text-xs text-muted pt-2">
            <WifiOff className="w-3.5 h-3.5" aria-hidden="true" />
            <span>{content.welcome.offlineNotice}</span>
          </div>
        </div>

      </div>
    </main>
  );
}
