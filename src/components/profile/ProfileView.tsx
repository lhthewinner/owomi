"use client";

import { useState } from "react";
import {
  Sun,
  Moon,
  LogOut,
  Trash2,
  ArrowLeft,
  ShieldCheck,
  Globe,
  Coins,
} from "lucide-react";
import { content } from "@/content/fr";
import { DeleteAccountModal } from "./DeleteAccountModal";
import type { User } from "@supabase/supabase-js";

interface ProfileViewProps {
  currentUser: User;
  isDark: boolean;
  onToggleTheme: () => void;
  onBack: () => void;
  onLogout: () => void;
  onDeletedAccount: () => void;
}

export function ProfileView({
  currentUser,
  isDark,
  onToggleTheme,
  onBack,
  onLogout,
  onDeletedAccount,
}: ProfileViewProps) {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

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

  return (
    <div className="flex flex-col h-full justify-between space-y-6 pb-6 animate-fadeIn">
      <div className="space-y-5">
        {/* En-tête avec bouton retour */}
        <div className="flex items-center gap-3 pt-1">
          <button
            type="button"
            onClick={onBack}
            aria-label={content.common.back}
            className="w-9 h-9 rounded-full bg-card border border-line flex items-center justify-center text-muted hover:text-foreground touch-target"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h1 className="text-xl font-extrabold text-foreground tracking-tight">
            Mon profil
          </h1>
        </div>

        {/* Carte Identité utilisateur */}
        <div className="bg-card rounded-2xl p-4 border border-line shadow-sm flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-primary-dark to-primary text-white flex items-center justify-center text-lg font-extrabold shadow-sm">
            {initialLetter}
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-bold text-foreground truncate">
              {displayName}
            </h2>
            <p className="text-xs text-muted truncate">{currentUser.email}</p>
          </div>
        </div>

        {/* Préférences & Paramètres */}
        <div className="bg-card rounded-2xl border border-line divide-y divide-line overflow-hidden shadow-sm">
          {/* Devise */}
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-2.5 text-xs font-semibold text-foreground">
              <Coins className="w-4 h-4 text-primary" />
              <span>Devise principale</span>
            </div>
            <span className="text-xs font-bold text-muted bg-card-secondary px-2.5 py-1 rounded-lg">
              FCFA (XOF)
            </span>
          </div>

          {/* Mode sombre */}
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-2.5 text-xs font-semibold text-foreground">
              {isDark ? (
                <Moon className="w-4 h-4 text-warn" />
              ) : (
                <Sun className="w-4 h-4 text-primary" />
              )}
              <span>Apparence</span>
            </div>
            <button
              type="button"
              onClick={onToggleTheme}
              className="px-3 py-1.5 rounded-xl border border-line bg-card-secondary text-xs font-bold text-foreground hover:bg-card touch-target transition-colors"
            >
              {isDark ? "Mode sombre" : "Mode clair"}
            </button>
          </div>

          {/* Fuseau horaire */}
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-2.5 text-xs font-semibold text-foreground">
              <Globe className="w-4 h-4 text-primary" />
              <span>Fuseau horaire</span>
            </div>
            <span className="text-xs font-medium text-muted">
              Africa/Porto-Novo
            </span>
          </div>

          {/* Sécurité */}
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-2.5 text-xs font-semibold text-foreground">
              <ShieldCheck className="w-4 h-4 text-gain" />
              <span>Sécurité du compte</span>
            </div>
            <span className="text-[11px] font-bold text-gain bg-gain/10 px-2 py-0.5 rounded-full">
              Protégé RLS
            </span>
          </div>
        </div>
      </div>

      {/* Boutons d'actions de session */}
      <div className="space-y-3 pt-4 border-t border-line">
        <button
          type="button"
          onClick={onLogout}
          className="w-full py-3.5 px-4 rounded-2xl bg-card border border-line text-foreground font-bold text-sm flex items-center justify-center gap-2 hover:bg-card-secondary touch-target transition-colors shadow-sm"
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

      {/* Modal de suppression de compte */}
      <DeleteAccountModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onDeleted={onDeletedAccount}
      />
    </div>
  );
}
