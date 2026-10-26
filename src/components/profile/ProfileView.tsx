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
  Bell,
  Pencil,
  X,
} from "lucide-react";
import { content } from "@/content/fr";
import {
  getProfilePreferencesAction,
  updateCurrencyAction,
  updateProfileNameAction,
} from "@/lib/operations/actions";
import { checkIsAdminAction, setDemoRoleAction } from "@/lib/admin/actions";
import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { SUPPORTED_CURRENCIES } from "@/lib/utils/currency";
import { DeleteAccountModal } from "./DeleteAccountModal";
import { PinSettingsModal } from "./PinSettingsModal";
import { hasPinConfigured } from "@/lib/auth/pin";
import { getUserDisplayName } from "@/lib/utils/user";
import {
  getNotificationSettings,
  saveNotificationSettings,
  requestNotificationPermission,
  sendBrowserReminderNotification,
  type NotificationSettings,
} from "@/lib/notifications/reminder";
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
  const [currency, setCurrency] = useState<string>(() => {
    if (typeof window !== "undefined") {
      try {
        const cached = sessionStorage.getItem("owomi_user_currency");
        if (cached) return cached;
      } catch {}
    }
    return "FCFA";
  });
  const [isMidnightFrozen, setIsMidnightFrozen] = useState<boolean>(true);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [isUpdatingCurrency, setIsUpdatingCurrency] = useState<boolean>(false);
  const [isPinActive, setIsPinActive] = useState<boolean>(() => hasPinConfigured(currentUser.id));
  const [isPinModalOpen, setIsPinModalOpen] = useState<boolean>(false);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [showAdminDashboard, setShowAdminDashboard] = useState<boolean>(initialShowAdmin);
  const [notifSettings, setNotifSettings] = useState<NotificationSettings>(() => getNotificationSettings());

  const handleToggleNotifications = async () => {
    if (!notifSettings.enabled) {
      const permission = await requestNotificationPermission();
      if (permission === "denied") {
        onShowToast?.(content.profile.notificationsDenied);
        return;
      }
      const updated = { ...notifSettings, enabled: true };
      setNotifSettings(updated);
      saveNotificationSettings(updated);
      onShowToast?.(content.profile.notificationsEnabledToast);
      if (permission === "granted") {
        sendBrowserReminderNotification(
          content.profile.dailyReminderTitle,
          `Vous recevrez un rappel bienveillant à ${updated.time} si aucune opération n'a été saisie.`
        );
      }
    } else {
      const updated = { ...notifSettings, enabled: false };
      setNotifSettings(updated);
      saveNotificationSettings(updated);
      onShowToast?.(content.profile.notificationsDisabledToast);
    }
  };

  const handleTimeChange = (newTime: string) => {
    if (!newTime) return;
    const updated = { ...notifSettings, time: newTime };
    setNotifSettings(updated);
    saveNotificationSettings(updated);
  };

  useEffect(() => {
    setIsPinActive(hasPinConfigured(currentUser.id));
  }, [currentUser.id]);

  useEffect(() => {
    async function loadPrefs() {
      const [res, adminOk] = await Promise.all([
        getProfilePreferencesAction(),
        checkIsAdminAction(),
      ]);
      if (res.success && res.data) {
        let cur = res.data.currency;
        if (cur === "€") cur = "EUR";
        else if (cur === "$") cur = "USD";
        else if (cur === "₦" || cur.toUpperCase() === "NAIRA") cur = "NGN";
        setCurrency(cur);
        if (res.data.firstname) {
          setEditFirstname(res.data.firstname);
        }
        if (res.data.name) {
          setEditName(res.data.name);
        }
        if (typeof window !== "undefined") {
          try {
            sessionStorage.setItem("owomi_user_currency", cur);
          } catch {}
        }
      }
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
        if (typeof window !== "undefined") {
          try {
            sessionStorage.setItem("owomi_user_currency", newCur);
          } catch {}
        }
        onShowToast?.(content.profile.currencyUpdatedToast);
        onCurrencyChange?.();
      }
    } finally {
      setIsUpdatingCurrency(false);
    }
  };

  const { firstName, fullName: initialDisplayName } = getUserDisplayName(currentUser);
  const [profileDisplayName, setProfileDisplayName] = useState<string>(initialDisplayName);

  useEffect(() => {
    setProfileDisplayName(getUserDisplayName(currentUser).fullName);
  }, [currentUser]);

  const initialLetter = (profileDisplayName || "U").charAt(0).toUpperCase();

  const [isEditNameOpen, setIsEditNameOpen] = useState<boolean>(false);
  const [editFirstname, setEditFirstname] = useState<string>(() => (firstName === "Ami" ? "" : firstName));
  const [editName, setEditName] = useState<string>(() => {
    const meta = currentUser.user_metadata || {};
    return typeof meta.name === "string" ? meta.name : "";
  });
  const [isSavingName, setIsSavingName] = useState<boolean>(false);

  const handleSaveName = async () => {
    if (!editFirstname.trim()) return;
    setIsSavingName(true);
    try {
      const res = await updateProfileNameAction({
        firstname: editFirstname.trim(),
        name: editName.trim(),
      });
      if (res.success) {
        const newFull = editName.trim()
          ? `${editFirstname.trim()} ${editName.trim()}`
          : editFirstname.trim();
        setProfileDisplayName(newFull);

        if (typeof window !== "undefined") {
          try {
            localStorage.setItem(`owomi_user_firstname_${currentUser.id}`, editFirstname.trim());
            localStorage.setItem(`owomi_user_name_${currentUser.id}`, editName.trim());
            localStorage.setItem("owomi_user_firstname", editFirstname.trim());
            localStorage.setItem("owomi_user_name", editName.trim());
            const cachedRaw = localStorage.getItem("owomi_cached_user");
            if (cachedRaw) {
              const parsed = JSON.parse(cachedRaw);
              parsed.user_metadata = {
                ...parsed.user_metadata,
                firstname: editFirstname.trim(),
                name: editName.trim(),
              };
              localStorage.setItem("owomi_cached_user", JSON.stringify(parsed));
            }
          } catch {}
        }
        if (currentUser.user_metadata) {
          currentUser.user_metadata.firstname = editFirstname.trim();
          currentUser.user_metadata.name = editName.trim();
        }
        setIsEditNameOpen(false);
        onShowToast?.("Prénom et nom mis à jour avec succès.");
        onCurrencyChange?.();
      } else {
        onShowToast?.(res.message || "Erreur de mise à jour");
      }
    } finally {
      setIsSavingName(false);
    }
  };

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

        {/* 2. Carte Identité utilisateur avec bouton de modification du nom */}
        <div className="bg-card rounded-2xl p-4 border border-line shadow-sm flex items-center justify-between gap-3">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-accent to-primary text-white flex items-center justify-center text-lg font-extrabold shadow-sm shrink-0">
              {initialLetter}
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-foreground truncate">
                {profileDisplayName}
              </h2>
              <p className="text-xs text-muted truncate">{currentUser.email}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsEditNameOpen(true)}
            aria-label="Modifier mon prénom et nom"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-line bg-card2 text-xs font-bold text-foreground hover:bg-line touch-target transition-colors shrink-0"
          >
            <Pencil className="w-3.5 h-3.5 text-primary" />
            <span className="text-[11px]">Modifier</span>
          </button>
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

          {/* Rappels de fin de journée (Story V1.1) */}
          <div className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5 text-xs font-semibold text-foreground">
                <Bell className="w-4 h-4 text-primary" />
                <div>
                  <div>{content.profile.notificationsLabel}</div>
                  <div className="text-[11px] text-muted font-normal">
                    {content.profile.notificationsSubtitle}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={handleToggleNotifications}
                aria-label="Basculer les rappels de fin de journée"
                className={`w-12 h-7 rounded-full p-0.5 transition-colors duration-200 relative ${
                  notifSettings.enabled ? "bg-primary" : "bg-card2 border border-line"
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200 transform ${
                    notifSettings.enabled ? "translate-x-5" : "translate-x-0.5"
                  }`}
                />
              </button>
            </div>

            {notifSettings.enabled && (
              <div className="flex items-center justify-between pt-2 border-t border-line/50 text-xs">
                <span className="text-muted font-medium">
                  {content.profile.notificationsTimeLabel}
                </span>
                <input
                  type="time"
                  value={notifSettings.time}
                  onChange={(e) => handleTimeChange(e.target.value)}
                  aria-label={content.profile.notificationsTimeLabel}
                  className="bg-card2 border border-line rounded-xl px-2.5 py-1 text-xs font-bold text-foreground outline-none focus:border-primary cursor-pointer"
                />
              </div>
            )}
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

      {/* 4. Actions de session */}
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

      {/* Modal de modification du prénom et nom */}
      {isEditNameOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-name-title"
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn"
        >
          <div className="bg-card w-full max-w-sm rounded-3xl p-6 border border-line shadow-2xl space-y-4 animate-slideUp">
            <div className="flex items-center justify-between pb-2 border-b border-line">
              <h3 id="edit-name-title" className="text-base font-extrabold text-foreground">
                Modifier mon identité
              </h3>
              <button
                type="button"
                onClick={() => setIsEditNameOpen(false)}
                aria-label={content.common.close}
                className="w-8 h-8 rounded-full border border-line flex items-center justify-center text-muted hover:text-foreground touch-target"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label htmlFor="edit-firstname-input" className="font-bold text-muted block mb-1">
                  Prénom
                </label>
                <input
                  id="edit-firstname-input"
                  type="text"
                  value={editFirstname}
                  onChange={(e) => setEditFirstname(e.target.value)}
                  placeholder="Ex: Lucien"
                  className="w-full bg-card2 border border-line rounded-xl px-3 py-2 text-foreground font-semibold outline-none focus:border-primary"
                />
              </div>

              <div>
                <label htmlFor="edit-name-input" className="font-bold text-muted block mb-1">
                  Nom de famille (optionnel)
                </label>
                <input
                  id="edit-name-input"
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Ex: Agbodjan"
                  className="w-full bg-card2 border border-line rounded-xl px-3 py-2 text-foreground font-semibold outline-none focus:border-primary"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsEditNameOpen(false)}
                className="flex-1 py-2.5 px-3 rounded-xl border border-line bg-card text-foreground font-bold text-xs hover:bg-card2 transition-colors touch-target"
              >
                Annuler
              </button>
              <button
                type="button"
                disabled={isSavingName || !editFirstname.trim()}
                onClick={handleSaveName}
                className="flex-1 py-2.5 px-3 rounded-xl bg-primary text-white font-bold text-xs shadow-sm hover:opacity-95 touch-target transition-all disabled:opacity-50"
              >
                {isSavingName ? "Enregistrement..." : "Enregistrer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
