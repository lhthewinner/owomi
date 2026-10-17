"use client";

import { useEffect, useState } from "react";
import {
  Sun,
  Moon,
  LogOut,
  Trash2,
  ArrowLeft,
  Clock,
  Globe,
  Coins,
  KeyRound,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";
import { content } from "@/content/fr";
import {
  getProfilePreferencesAction,
  updateCurrencyAction,
} from "@/lib/operations/actions";
import { checkIsAdminAction, setDemoRoleAction } from "@/lib/admin/actions";
import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { SUPPORTED_CURRENCIES } from "@/lib/utils/currency";
import { DeleteAccountModal } from "./DeleteAccountModal";
import { PinSettingsModal } from "./PinSettingsModal";
import { hasPinConfigured } from "@/lib/auth/pin";
import type { User } from "@supabase/supabase-js";

interface ProfileViewProps {
  currentUser: User;
  isDark: boolean;
  onToggleTheme: () => void;
  onBack: () => void;
  onLogout: () => void;
  onDeletedAccount: () => void;
  onShowToast?: (message: string) => void;
  onCurrencyChange?: () => void;
  initialShowAdmin?: boolean;
}

export function ProfileView({
  currentUser,
  isDark,
  onToggleTheme,
  onBack,
  onLogout,
  onDeletedAccount,
  onShowToast,
  onCurrencyChange,
  initialShowAdmin = false,
}: ProfileViewProps) {
  const [currency, setCurrency] = useState<string>("FCFA");
  const [isMidnightFrozen, setIsMidnightFrozen] = useState<boolean>(true);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [isUpdatingCurrency, setIsUpdatingCurrency] = useState<boolean>(false);
  const [isPinActive, setIsPinActive] = useState<boolean>(() => hasPinConfigured(currentUser.id));
  const [isPinModalOpen, setIsPinModalOpen] = useState<boolean>(false);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [showAdminDashboard, setShowAdminDashboard] = useState<boolean>(initialShowAdmin);

  useEffect(() => {
    setIsPinActive(hasPinConfigured(currentUser.id));
  }, [currentUser.id]);

  useEffect(() => {
    async function loadPrefs() {
      const res = await getProfilePreferencesAction();
      if (res.success && res.data) {
        const cur = res.data.currency;
        if (cur === "€") setCurrency("EUR");
        else if (cur === "$") setCurrency("USD");
        else if (cur === "₦" || cur.toUpperCase() === "NAIRA") setCurrency("NGN");
        else setCurrency(cur);
      }
      const adminOk = await checkIsAdminAction();
      setIsAdmin(adminOk);
    }
    loadPrefs();
  }, []);

  const handleCurrencySelect = async (newCur: string) => {
    setIsUpdatingCurrency(true);
    try {
      const res = await updateCurrencyAction(newCur);
      if (res.success) {
        setCurrency(newCur);
        onShowToast?.(content.profile.currencyUpdatedToast);
        onCurrencyChange?.();
      }
    } finally {
      setIsUpdatingCurrency(false);
    }
  };

  const initialLetter = (
    currentUser.user_metadata?.firstname ||
    currentUser.email ||
    "A"
  )
    .charAt(0)
    .toUpperCase();

  const displayName =
    currentUser.user_metadata?.firstname && currentUser.user_metadata?.lastname
      ? `${currentUser.user_metadata.firstname} ${currentUser.user_metadata.lastname}`
      : currentUser.user_metadata?.firstname ||
        currentUser.email?.split("@")[0] ||
        "Utilisateur";

  if (showAdminDashboard) {
    return (
      <AdminDashboard
        onBackToProfile={() => setShowAdminDashboard(false)}
        onShowToast={onShowToast || (() => {})}
      />
    );
  }

  return (
    <div className="flex flex-col h-full justify-between space-y-6 pb-6 animate-fadeIn">
      <div className="space-y-4">
        {/* 1. En-tête avec bouton retour */}
        <div className="flex items-center gap-3 pt-1">
          <button
            type="button"
            onClick={onBack}
            aria-label={content.common.back}
            className="w-9 h-9 rounded-full bg-card border border-line flex items-center justify-center text-muted hover:text-foreground touch-target transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h1 className="text-xl font-extrabold text-foreground tracking-tight">
            {content.profile.title}
          </h1>
        </div>

        {/* 2. Carte Identité utilisateur */}
        <div className="bg-card rounded-2xl p-4 border border-line shadow-sm flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-accent to-primary text-white flex items-center justify-center text-lg font-extrabold shadow-sm">
            {initialLetter}
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-bold text-foreground truncate">
              {displayName}
            </h2>
            <p className="text-xs text-muted truncate">{currentUser.email}</p>
          </div>
        </div>

        {/* 3. Paramètres & Préférences (Story P1) */}
        <div className="bg-card rounded-2xl border border-line divide-y divide-line overflow-hidden shadow-sm">
          {/* Devise */}
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-2.5 text-xs font-semibold text-foreground">
              <Coins className="w-4 h-4 text-primary" />
              <span>{content.profile.currencyLabel}</span>
            </div>
            <select
              value={currency}
              onChange={(e) => handleCurrencySelect(e.target.value)}
              disabled={isUpdatingCurrency}
              aria-label="Choisir la devise"
              className="bg-card2 border border-line text-foreground text-xs font-bold py-1.5 px-2.5 rounded-xl outline-none focus:border-primary transition-colors cursor-pointer max-w-[170px]"
            >
              {SUPPORTED_CURRENCIES.map((cur) => (
                <option key={cur.code} value={cur.code}>
                  {cur.label}
                </option>
              ))}
            </select>
          </div>

          {/* Mode sombre */}
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-2.5 text-xs font-semibold text-foreground">
              {isDark ? (
                <Moon className="w-4 h-4 text-warn" />
              ) : (
                <Sun className="w-4 h-4 text-primary" />
              )}
              <span>{content.profile.themeLabel}</span>
            </div>
            <button
              type="button"
              onClick={onToggleTheme}
              aria-label="Basculer le mode sombre"
              className={`w-12 h-7 rounded-full p-0.5 transition-colors duration-200 relative ${
                isDark ? "bg-primary" : "bg-card2 border border-line"
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200 transform ${
                  isDark ? "translate-x-5" : "translate-x-0.5"
                }`}
              />
            </button>
          </div>

          {/* Fuseau horaire */}
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-2.5 text-xs font-semibold text-foreground">
              <Globe className="w-4 h-4 text-primary" />
              <span>{content.profile.timezoneLabel}</span>
            </div>
            <span className="text-xs font-medium text-muted">
              Africa/Porto-Novo
            </span>
          </div>

          {/* Bilan figé à minuit */}
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-2.5 text-xs font-semibold text-foreground">
              <Clock className="w-4 h-4 text-primary" />
              <span>{content.profile.midnightFrozenLabel}</span>
            </div>
            <button
              type="button"
              onClick={() => setIsMidnightFrozen((v) => !v)}
              aria-label="Basculer le bilan figé à minuit"
              className={`w-12 h-7 rounded-full p-0.5 transition-colors duration-200 relative ${
                isMidnightFrozen ? "bg-primary" : "bg-card2 border border-line"
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200 transform ${
                  isMidnightFrozen ? "translate-x-5" : "translate-x-0.5"
                }`}
              />
            </button>
          </div>

          {/* Verrouillage par Code PIN */}
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-2.5 text-xs font-semibold text-foreground">
              <KeyRound className="w-4 h-4 text-primary" />
              <span>Code PIN de sécurité</span>
            </div>
            <button
              type="button"
              onClick={() => setIsPinModalOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-card2 border border-line text-xs font-bold text-foreground hover:bg-line touch-target transition-colors"
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  isPinActive ? "bg-gain" : "bg-muted/40"
                }`}
              />
              <span>{isPinActive ? "Actif (Modifier)" : "Activer"}</span>
            </button>
          </div>

          {/* Rôle de test (Mode Démo) */}
          {currentUser.id === "demo-user-id" && (
            <div className="p-4 flex items-center justify-between border-t border-line bg-card2/30">
              <div>
                <div className="text-xs font-bold text-foreground">
                  Rôle de test (Démo)
                </div>
                <div className="text-[11px] text-muted">
                  Basculez entre Utilisateur standard et Administrateur
                </div>
              </div>
              <div className="flex items-center gap-1 bg-card border border-line p-1 rounded-xl">
                <button
                  type="button"
                  onClick={async () => {
                    await setDemoRoleAction("user");
                    setIsAdmin(false);
                    setShowAdminDashboard(false);
                    onShowToast?.("Rôle actif : Utilisateur standard (accès admin masqué)");
                  }}
                  className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-colors ${
                    !isAdmin
                      ? "bg-primary text-white shadow-sm"
                      : "text-muted hover:text-foreground"
                  }`}
                >
                  Utilisateur
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    await setDemoRoleAction("admin");
                    setIsAdmin(true);
                    onShowToast?.("Rôle actif : Administrateur (accès admin affiché)");
                  }}
                  className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-colors ${
                    isAdmin
                      ? "bg-primary text-white shadow-sm"
                      : "text-muted hover:text-foreground"
                  }`}
                >
                  Admin
                </button>
              </div>
            </div>
          )}

          {/* Espace Administrateur (Story AD1) */}
          {isAdmin && (
            <div className="p-4 flex items-center justify-between bg-primary/5 border-t border-line">
              <div className="flex items-center gap-2.5 text-xs font-semibold text-foreground">
                <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5 font-bold">
                    <span>Espace Administrateur</span>
                    <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-full bg-primary/20 text-primary">
                      Admin
                    </span>
                  </div>
                  <div className="text-[10.5px] text-muted font-medium">
                    Supervision globale & modération
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAdminDashboard(true)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-primary text-white text-xs font-bold hover:opacity-95 touch-target transition-opacity shadow-sm"
              >
                <span>Gérer</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 4. Actions de session & Note */}
      <div className="space-y-3 pt-2">
        <button
          type="button"
          onClick={onLogout}
          className="w-full py-3.5 px-4 rounded-2xl bg-card border border-line text-foreground font-bold text-xs flex items-center justify-center gap-2 hover:bg-card2 touch-target transition-colors shadow-sm"
        >
          <LogOut className="w-4 h-4 text-muted" />
          <span>{content.profile.logoutBtn}</span>
        </button>

        <button
          type="button"
          onClick={() => setIsDeleteModalOpen(true)}
          className="w-full py-3 px-4 rounded-2xl text-danger hover:bg-danger/10 text-xs font-bold flex items-center justify-center gap-2 touch-target transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>{content.profile.deleteAccountBtn}</span>
        </button>

        <p className="text-[11.5px] text-muted text-center pt-2">
          {content.profile.v1Note}
        </p>
      </div>

      {/* Modal de réglages du Code PIN */}
      <PinSettingsModal
        isOpen={isPinModalOpen}
        userId={currentUser.id}
        isPinActive={isPinActive}
        onClose={() => setIsPinModalOpen(false)}
        onSuccess={(msg) => {
          setIsPinActive(hasPinConfigured(currentUser.id));
          onShowToast?.(msg);
        }}
      />

      {/* Modal de suppression irréversible du compte */}
      <DeleteAccountModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onDeleted={onDeletedAccount}
      />
    </div>
  );
}
