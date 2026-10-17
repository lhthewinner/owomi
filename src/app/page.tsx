"use client";

import { useEffect, useState } from "react";
import {
  Wallet,
  Sun,
  Moon,
  ArrowRight,
  WifiOff,
  LogOut,
  Trash2,
  CheckCircle2,
} from "lucide-react";
import { content } from "@/content/fr";
import { formatAmount } from "@/lib/utils/currency";
import { AuthCard } from "@/components/auth/AuthCard";
import { ForgotPasswordCard } from "@/components/auth/ForgotPasswordCard";
import { DeleteAccountModal } from "@/components/profile/DeleteAccountModal";
import { createClient } from "@/lib/supabase/client";
import { signOutAction } from "@/lib/auth/actions";
import type { User } from "@supabase/supabase-js";

type ActiveView = "welcome" | "auth" | "forgot" | "authenticated";

export default function HomePage() {
  const [isDark, setIsDark] = useState<boolean>(false);
  const [view, setView] = useState<ActiveView>("welcome");
  const [authTab, setAuthTab] = useState<"signup" | "login">("signup");
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  useEffect(() => {
    // Initialisation du thème (clair / sombre)
    const savedTheme = localStorage.getItem("asoro-theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const initialDark = savedTheme === "dark" || (!savedTheme && prefersDark);
    setIsDark(initialDark);
    document.documentElement.setAttribute("data-theme", initialDark ? "dark" : "light");

    // Vérification d'une session existante
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setCurrentUser(user);
        setView("authenticated");
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setCurrentUser(session.user);
        setView("authenticated");
      } else {
        setCurrentUser(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const toggleTheme = () => {
    const nextTheme = !isDark;
    setIsDark(nextTheme);
    document.documentElement.setAttribute("data-theme", nextTheme ? "dark" : "light");
    localStorage.setItem("asoro-theme", nextTheme ? "dark" : "light");
  };

  const handleLogout = async () => {
    await signOutAction();
    setCurrentUser(null);
    setView("welcome");
  };

  return (
    <main className="min-h-screen bg-slate-100 dark:bg-[#05080F] flex items-center justify-center p-0 sm:p-4">
      {/* Conteneur mobile centré (390px sur bureau, plein écran sur mobile) */}
      <div className="w-full sm:w-[390px] min-h-screen sm:min-h-[820px] sm:max-h-[96vh] bg-background sm:border-[10px] sm:border-slate-900 dark:sm:border-slate-950 sm:rounded-[38px] sm:shadow-2xl overflow-y-auto flex flex-col justify-between p-6 sm:p-7 relative transition-colors duration-200">

        {/* 1. ÉCRAN ACCUEIL VISITEUR */}
        {view === "welcome" && (
          <div className="flex flex-col h-full justify-between animate-fadeIn">
            {/* En-tête */}
            <div className="flex items-center justify-between pt-2">
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

            {/* Titre et Promesse */}
            <div className="my-auto py-6">
              <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight leading-[1.15] mb-4">
                {content.welcome.title}
                <br />
                ton <span className="text-primary">{content.welcome.titleHighlight}</span>
                {content.welcome.titleEnd}
              </h1>

              <p className="text-muted text-[14.5px] leading-relaxed mb-6">
                {content.app.description}
              </p>

              {/* Aperçu du bilan */}
              <div className="bg-card rounded-2xl p-4 shadow-sm border border-line -rotate-1 transform transition-transform hover:rotate-0">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-medium text-muted">
                    {content.welcome.previewLabel}
                  </span>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-gain/15 text-gain">
                    {content.welcome.previewTag}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="text-xs text-muted font-medium">
                      {content.welcome.previewSpentLabel}
                    </div>
                    <div className="tabular-nums font-extrabold text-lg text-spend mt-0.5">
                      {formatAmount(4500, content.app.currencyDefault)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted font-medium">
                      {content.welcome.previewGainedLabel}
                    </div>
                    <div className="tabular-nums font-extrabold text-lg text-gain mt-0.5">
                      + {formatAmount(10000, content.app.currencyDefault)}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Boutons d'action */}
            <div className="space-y-3 pb-2">
              <button
                type="button"
                onClick={() => {
                  setAuthTab("signup");
                  setView("auth");
                }}
                className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-primary to-primary-dark text-white font-bold text-[15px] shadow-lg shadow-primary/25 flex items-center justify-center gap-2 hover:opacity-95 touch-target transition-all"
              >
                <span>{content.welcome.btnSignup}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => {
                  setAuthTab("login");
                  setView("auth");
                }}
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
        )}

        {/* 2. ÉCRAN AUTHENTIFICATION (INSCRIPTION / CONNEXION) */}
        {view === "auth" && (
          <AuthCard
            initialTab={authTab}
            onBack={() => setView("welcome")}
            onGoForgot={() => setView("forgot")}
            onSuccessLogin={() => setView("authenticated")}
          />
        )}

        {/* 3. ÉCRAN MOT DE PASSE OUBLIÉ */}
        {view === "forgot" && (
          <ForgotPasswordCard
            onBack={() => {
              setAuthTab("login");
              setView("auth");
            }}
          />
        )}

        {/* 4. ÉCRAN CONNECTÉ (DASHBOARD INITIAL / PROFIL POUR SE DÉCONNECTER OU SUPPRIMER LE COMPTE) */}
        {view === "authenticated" && (
          <div className="flex flex-col h-full justify-between animate-fadeIn">
            <div>
              {/* En-tête connecté */}
              <div className="flex items-center justify-between pb-4 border-b border-line mb-6">
                <div>
                  <div className="text-xs font-semibold text-muted">
                    {content.dashboard.greeting(
                      currentUser?.user_metadata?.firstname ||
                        currentUser?.email?.split("@")[0] ||
                        "Utilisateur"
                    )}
                  </div>
                  <div className="text-sm font-bold text-foreground truncate max-w-[200px]">
                    {currentUser?.email}
                  </div>
                </div>
                <button
                  onClick={toggleTheme}
                  aria-label={isDark ? "Passer en mode clair" : "Passer en mode sombre"}
                  className="w-10 h-10 rounded-full bg-card shadow-sm border border-line flex items-center justify-center text-muted hover:text-foreground touch-target transition-colors"
                >
                  {isDark ? <Sun className="w-5 h-5 text-warn" /> : <Moon className="w-5 h-5" />}
                </button>
              </div>

              {/* Statut de session sécurisée */}
              <div className="bg-card rounded-2xl p-5 border border-line shadow-sm space-y-3 mb-6">
                <div className="flex items-center gap-2 text-gain text-xs font-bold">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Session sécurisée active</span>
                </div>
                <p className="text-xs text-muted leading-relaxed">
                  Votre compte est authentifié. Les dépenses, revenus et calculs du bilan seront activés dans les lots suivants.
                </p>
              </div>
            </div>

            {/* Actions de session : Déconnexion et Suppression du compte */}
            <div className="space-y-3 pt-4 border-t border-line">
              <button
                type="button"
                onClick={handleLogout}
                className="w-full py-3.5 px-4 rounded-2xl bg-card border border-line text-foreground font-bold text-sm flex items-center justify-center gap-2 hover:bg-card-secondary touch-target transition-colors"
              >
                <LogOut className="w-4 h-4 text-muted" />
                <span>Se déconnecter</span>
              </button>

              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(true)}
                className="w-full py-3 px-4 rounded-2xl text-danger hover:bg-danger/10 text-xs font-bold flex items-center justify-center gap-2 touch-target transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{content.auth.deleteAccount.button}</span>
              </button>
            </div>

            {/* Modal de confirmation de suppression */}
            <DeleteAccountModal
              isOpen={isDeleteModalOpen}
              onClose={() => setIsDeleteModalOpen(false)}
              onDeleted={() => {
                setIsDeleteModalOpen(false);
                setCurrentUser(null);
                setView("welcome");
              }}
            />
          </div>
        )}

      </div>
    </main>
  );
}
