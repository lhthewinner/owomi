"use client";

import { useEffect, useState } from "react";
import { Wallet, Sun, Moon, ArrowRight, WifiOff } from "lucide-react";
import { content } from "@/content/fr";
import { formatAmount } from "@/lib/utils/currency";
import { AuthCard } from "@/components/auth/AuthCard";
import { ForgotPasswordCard } from "@/components/auth/ForgotPasswordCard";
import { DashboardView } from "@/components/dashboard/DashboardView";
import { BottomNav, type NavTab } from "@/components/navigation/BottomNav";
import {
  QuickAddSheet,
  type OperationMode,
} from "@/components/operations/QuickAddSheet";
import { BudgetView } from "@/components/operations/BudgetView";
import { BalanceView } from "@/components/balance/BalanceView";
import { HistoryView } from "@/components/history/HistoryView";
import { ProfileView } from "@/components/profile/ProfileView";
import { Toast } from "@/components/ui/Toast";
import { SyncStatusBanner } from "@/components/offline/SyncStatusBanner";
import { clearAllLocalData } from "@/lib/offline/sync";
import { createClient } from "@/lib/supabase/client";
import { signOutAction } from "@/lib/auth/actions";
import { PinUnlockScreen } from "@/components/auth/PinUnlockScreen";
import { hasPinConfigured, removePin, clearAllLocalPins } from "@/lib/auth/pin";
import type { User } from "@supabase/supabase-js";

type ActiveView = "welcome" | "auth" | "forgot" | "authenticated";

export default function HomePage() {
  const [isDark, setIsDark] = useState<boolean>(false);
  const [view, setView] = useState<ActiveView>("welcome");
  const [authTab, setAuthTab] = useState<"signup" | "login">("signup");
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Navigation dans l'espace connecté
  const [activeTab, setActiveTab] = useState<NavTab | "profile">("dashboard");
  const [budgetSubTab, setBudgetSubTab] = useState<"planned" | "income">("planned");
  const [isAddOpen, setIsAddOpen] = useState<boolean>(false);
  const [addMode, setAddMode] = useState<OperationMode>("exp");
  const [payPlannedId, setPayPlannedId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);
  const [isPinUnlocked, setIsPinUnlocked] = useState<boolean>(false);

  useEffect(() => {
    // Initialisation du thème (clair / sombre)
    const savedTheme = localStorage.getItem("asoro-theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const initialDark = savedTheme === "dark" || (!savedTheme && prefersDark);
    setIsDark(initialDark);
    document.documentElement.setAttribute("data-theme", initialDark ? "dark" : "light");

    // Support Démo / Mode de prévisualisation (actif uniquement en développement local)
    const isLocalEnv = process.env.NODE_ENV !== "production";
    const urlParams = new URLSearchParams(window.location.search);
    const viewParam = urlParams.get("view");

    if (isLocalEnv) {
      if (viewParam === "signup") {
        setCurrentUser(null);
        setAuthTab("signup");
        setView("auth");
        return;
      } else if (viewParam === "login") {
        setCurrentUser(null);
        setAuthTab("login");
        setView("auth");
        return;
      } else if (viewParam === "forgot") {
        setCurrentUser(null);
        setView("forgot");
        return;
      } else if (viewParam === "welcome") {
        setCurrentUser(null);
        setView("welcome");
        return;
      } else if (viewParam === "pin") {
        setCurrentUser({
          id: "demo-user-id",
          email: "alex@asoro.app",
          user_metadata: { name: "Alex" },
          app_metadata: {},
          aud: "authenticated",
          created_at: new Date().toISOString(),
        } as User);
        setView("authenticated");
        setIsPinUnlocked(false);
        return;
      }

      const isDemo =
        urlParams.get("demo") === "1" ||
        document.cookie.includes("asoro_demo=true");

      if (isDemo) {
        document.cookie = "asoro_demo=true; path=/";
        setCurrentUser({
          id: "demo-user-id",
          email: "alex@asoro.app",
          user_metadata: { name: "Alex" },
          app_metadata: {},
          aud: "authenticated",
          created_at: new Date().toISOString(),
        } as User);
        setView("authenticated");
        setIsPinUnlocked(urlParams.get("lockPin") !== "1");

        const tabParam = urlParams.get("tab") as NavTab | "profile";
        if (tabParam && ["dashboard", "budget", "bilan", "history", "profile"].includes(tabParam)) {
          setActiveTab(tabParam);
        }
        const subParam = urlParams.get("subtab") as "planned" | "income";
        if (subParam && ["planned", "income"].includes(subParam)) {
          setBudgetSubTab(subParam);
        }
        if (urlParams.get("openAdd") === "1") {
          setIsAddOpen(true);
        }
        if (urlParams.get("dark") === "1") {
          setIsDark(true);
          document.documentElement.setAttribute("data-theme", "dark");
        }
        return;
      }
    }

    // Vérification d'une session existante (persistance hors ligne via getSession)
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setCurrentUser(session.user);
        setView("authenticated");
        if (!hasPinConfigured(session.user.id)) {
          setIsPinUnlocked(true);
        }
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setCurrentUser(session.user);
        setView("authenticated");
        if (_event === "SIGNED_IN") {
          setIsPinUnlocked(true);
        }
      } else if (_event === "SIGNED_OUT") {
        setCurrentUser(null);
        setIsPinUnlocked(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Synchronisation de l'historique de navigation du navigateur / smartphone (touche Retour physique ou geste)
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.history.replaceState({ view, authTab, activeTab }, "");
    }

    const handlePopState = (e: PopStateEvent) => {
      const state = e.state;
      if (!state) return;
      if (state.view) setView(state.view);
      if (state.authTab) setAuthTab(state.authTab);
      if (state.activeTab) setActiveTab(state.activeTab);
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const navigateToView = (nextView: ActiveView, nextAuthTab?: "signup" | "login") => {
    setView(nextView);
    if (nextAuthTab) setAuthTab(nextAuthTab);
    if (typeof window !== "undefined") {
      window.history.pushState(
        { view: nextView, authTab: nextAuthTab || authTab, activeTab },
        ""
      );
    }
  };

  const navigateToTab = (nextTab: NavTab | "profile") => {
    setActiveTab(nextTab);
    if (typeof window !== "undefined") {
      window.history.pushState(
        { view, authTab, activeTab: nextTab },
        ""
      );
    }
  };

  const toggleTheme = () => {
    const nextTheme = !isDark;
    setIsDark(nextTheme);
    document.documentElement.setAttribute("data-theme", nextTheme ? "dark" : "light");
    localStorage.setItem("asoro-theme", nextTheme ? "dark" : "light");
  };

  const handleLogout = async () => {
    clearAllLocalPins();
    setIsPinUnlocked(false);
    await clearAllLocalData();
    await signOutAction();
    setCurrentUser(null);
    setView("welcome");
    setActiveTab("dashboard");
    setToastMessage("Vous êtes déconnecté.");
  };

  const handleDeletedAccount = async () => {
    clearAllLocalPins();
    setIsPinUnlocked(false);
    await clearAllLocalData();
    setCurrentUser(null);
    setView("welcome");
    setActiveTab("dashboard");
    setToastMessage(content.auth.success.accountDeleted);
  };

  return (
    <main className="min-h-screen bg-background text-foreground flex flex-col items-center justify-start transition-colors duration-200">
      {/* Conteneur principal responsive (Plein écran sur mobile, centré et fluide sur tablette/PC) */}
      <div className="w-full max-w-xl md:max-w-2xl lg:max-w-3xl min-h-screen flex flex-col justify-between relative transition-colors duration-200 sm:px-4 md:px-6">
        {/* 1. ÉCRAN ACCUEIL VISITEUR */}
        {view === "welcome" && (
          <div className="flex flex-col h-full justify-between p-6 sm:p-8 max-w-lg mx-auto w-full my-auto animate-fadeIn">
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
                onClick={() => navigateToView("auth", "signup")}
                className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-primary to-primary-dark text-white font-bold text-[15px] shadow-lg shadow-primary/25 flex items-center justify-center gap-2 hover:opacity-95 touch-target transition-all"
              >
                <span>{content.welcome.btnSignup}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => navigateToView("auth", "login")}
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
          <div className="p-6 sm:p-8 max-w-md mx-auto w-full my-auto">
            <AuthCard
              initialTab={authTab}
              onBack={() => {
                if (typeof window !== "undefined" && window.history.length > 1) {
                  window.history.back();
                } else {
                  navigateToView("welcome");
                }
              }}
              onGoForgot={() => navigateToView("forgot")}
              onSuccessLogin={() => {
                setView("authenticated");
                if (typeof window !== "undefined") {
                  window.history.replaceState({ view: "authenticated", activeTab: "dashboard" }, "");
                }
              }}
            />
          </div>
        )}

        {/* 3. ÉCRAN MOT DE PASSE OUBLIÉ */}
        {view === "forgot" && (
          <div className="p-6 sm:p-8 max-w-md mx-auto w-full my-auto">
            <ForgotPasswordCard
              onBack={() => {
                if (typeof window !== "undefined" && window.history.length > 1) {
                  window.history.back();
                } else {
                  navigateToView("auth", "login");
                }
              }}
            />
          </div>
        )}

        {/* 4. ÉCRAN CONNECTÉ AVEC ONGLETS (OU DÉVERROUILLAGE PIN) */}
        {view === "authenticated" && currentUser && (
          (hasPinConfigured(currentUser.id) ||
            (typeof window !== "undefined" &&
              new URLSearchParams(window.location.search).get("view") === "pin")) &&
          !isPinUnlocked ? (
            <PinUnlockScreen
              userId={currentUser.id}
              userName={
                currentUser.user_metadata?.firstname ||
                currentUser.user_metadata?.name ||
                "vous"
              }
              onUnlocked={() => setIsPinUnlocked(true)}
              onForgotPin={() => {
                removePin(currentUser.id);
                setIsPinUnlocked(false);
                handleLogout();
              }}
            />
          ) : (
            <div className="flex flex-col h-full justify-between">
              {/* Bandeau d'état de synchronisation hors ligne (Story O2 & règle 7) */}
              <SyncStatusBanner
                userId={currentUser.id}
                onSyncComplete={() => setRefreshTrigger((t) => t + 1)}
                refreshTrigger={refreshTrigger}
              />

            {/* Contenu de l'onglet actif */}
            <div className="p-5 sm:p-6 flex-1">
              {activeTab === "dashboard" && (
                <DashboardView
                  currentUser={currentUser}
                  isDark={isDark}
                  onToggleTheme={toggleTheme}
                  onOpenAdd={() => {
                    setAddMode("exp");
                    setIsAddOpen(true);
                  }}
                  onGoToBilan={() => navigateToTab("bilan")}
                  onGoToHistory={() => navigateToTab("history")}
                  onGoToProfile={() => navigateToTab("profile")}
                  onShowToast={(msg) => setToastMessage(msg)}
                  refreshTrigger={refreshTrigger}
                />
              )}

              {activeTab === "budget" && (
                <BudgetView
                  initialSubTab={budgetSubTab}
                  onOpenPayPlanned={(id) => {
                    setPayPlannedId(id);
                    setAddMode("exp");
                    setIsAddOpen(true);
                  }}
                  onOpenAddIncome={() => {
                    setPayPlannedId(null);
                    setAddMode("inc");
                    setIsAddOpen(true);
                  }}
                  onOpenAddLoan={() => {
                    setPayPlannedId(null);
                    setAddMode("loan");
                    setIsAddOpen(true);
                  }}
                  onShowToast={(msg) => {
                    setToastMessage(msg);
                    setRefreshTrigger((t) => t + 1);
                  }}
                  refreshTrigger={refreshTrigger}
                />
              )}

              {activeTab === "profile" && (
                <ProfileView
                  currentUser={currentUser}
                  isDark={isDark}
                  onToggleTheme={toggleTheme}
                  onBack={() => {
                    if (typeof window !== "undefined" && window.history.length > 1) {
                      window.history.back();
                    } else {
                      navigateToTab("dashboard");
                    }
                  }}
                  onLogout={handleLogout}
                  onDeletedAccount={handleDeletedAccount}
                  onShowToast={(msg) => setToastMessage(msg)}
                  onCurrencyChange={() => setRefreshTrigger((t) => t + 1)}
                />
              )}

              {activeTab === "bilan" && (
                <BalanceView
                  onShowToast={(msg) => setToastMessage(msg)}
                  refreshTrigger={refreshTrigger}
                />
              )}

              {activeTab === "history" && (
                <HistoryView
                  onShowToast={(msg) => {
                    setToastMessage(msg);
                    setRefreshTrigger((t) => t + 1);
                  }}
                  refreshTrigger={refreshTrigger}
                />
              )}
            </div>

            {/* Barre de navigation inférieure */}
            {activeTab !== "profile" && (
              <BottomNav
                activeTab={activeTab}
                onChangeTab={(tab) => navigateToTab(tab)}
                onOpenAdd={() => {
                  setPayPlannedId(null);
                  setAddMode("exp");
                  setIsAddOpen(true);
                }}
              />
            )}
          </div>
        )
      )}

        {/* 5. Feuille d'ajout rapide (QuickAddSheet) */}
        <QuickAddSheet
          isOpen={isAddOpen}
          userId={currentUser?.id}
          initialMode={addMode}
          initialPlannedExpenseId={payPlannedId}
          onClose={() => {
            setIsAddOpen(false);
            setPayPlannedId(null);
          }}
          onSuccess={(msg) => {
            setToastMessage(msg);
            setRefreshTrigger((t) => t + 1);
          }}
        />

        {/* 6. Notification Toast */}
        <Toast message={toastMessage} onClose={() => setToastMessage(null)} />
      </div>
    </main>
  );
}
