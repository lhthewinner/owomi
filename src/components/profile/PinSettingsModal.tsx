"use client";

import { useState } from "react";
import { X, Lock, KeyRound, Check, AlertCircle, ShieldAlert, Trash2 } from "lucide-react";
import { useMobileBackHandler } from "@/lib/utils/useMobileBackHandler";
import { setPin, verifyPin, removePin } from "@/lib/auth/pin";

interface PinSettingsModalProps {
  isOpen: boolean;
  userId: string;
  isPinActive: boolean;
  onClose: () => void;
  onSuccess: (message: string) => void;
}

type ModalFlow = "setup" | "menu" | "change" | "disable";

export function PinSettingsModal({
  isOpen,
  userId,
  isPinActive,
  onClose,
  onSuccess,
}: PinSettingsModalProps) {
  // Navigation retour smartphone
  useMobileBackHandler(isOpen, onClose);

  const [flow, setFlow] = useState<ModalFlow>(isPinActive ? "menu" : "setup");
  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const resetForm = () => {
    setCurrentPin("");
    setNewPin("");
    setConfirmPin("");
    setError(null);
    setLoading(false);
  };

  const handleCreatePin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPin.length !== 4 || !/^\d{4}$/.test(newPin)) {
      setError("Le code PIN doit comporter exactement 4 chiffres.");
      return;
    }

    if (newPin !== confirmPin) {
      setError("Les deux codes PIN ne correspondent pas.");
      return;
    }

    setLoading(true);
    try {
      await setPin(newPin, userId);
      onSuccess("Code PIN activé avec succès !");
      onClose();
    } catch {
      setError("Une erreur est survenue lors de l'enregistrement du code PIN.");
    } finally {
      setLoading(false);
    }
  };

  const handleChangePin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (currentPin.length !== 4 || !/^\d{4}$/.test(currentPin)) {
      setError("Le code PIN actuel doit comporter 4 chiffres.");
      return;
    }

    if (newPin.length !== 4 || !/^\d{4}$/.test(newPin)) {
      setError("Le nouveau code PIN doit comporter 4 chiffres.");
      return;
    }

    if (newPin !== confirmPin) {
      setError("Les nouveaux codes PIN ne correspondent pas.");
      return;
    }

    setLoading(true);
    try {
      const verifyRes = await verifyPin(currentPin, userId);
      if (!verifyRes.success) {
        setError(
          `Code PIN actuel incorrect (${verifyRes.remainingAttempts} essai${
            verifyRes.remainingAttempts > 1 ? "s" : ""
          } restant${verifyRes.remainingAttempts > 1 ? "s" : ""}).`
        );
        setLoading(false);
        return;
      }

      await setPin(newPin, userId);
      onSuccess("Votre code PIN a été modifié avec succès !");
      onClose();
    } catch {
      setError("Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  };

  const handleDisablePin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    setLoading(true);
    try {
      const verifyRes = await verifyPin(currentPin, userId);
      if (!verifyRes.success) {
        setError(
          `Code PIN actuel incorrect (${verifyRes.remainingAttempts} essai${
            verifyRes.remainingAttempts > 1 ? "s" : ""
          } restant${verifyRes.remainingAttempts > 1 ? "s" : ""}).`
        );
        setLoading(false);
        return;
      }

      removePin(userId);
      onSuccess("Le verrouillage par code PIN a été désactivé.");
      onClose();
    } catch {
      setError("Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn"
    >
      <div className="w-full max-w-sm bg-background border border-line rounded-3xl p-6 shadow-2xl space-y-4">
        {/* En-tête */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-foreground">
                {flow === "setup" && "Activer un code PIN"}
                {flow === "menu" && "Code PIN de sécurité"}
                {flow === "change" && "Modifier mon code PIN"}
                {flow === "disable" && "Désactiver le code PIN"}
              </h2>
              <p className="text-[11.5px] text-muted">Accès rapide sur cet appareil</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="w-8 h-8 rounded-full bg-card-secondary text-muted hover:text-foreground flex items-center justify-center touch-target transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div
            role="alert"
            className="flex items-center gap-2 p-3 rounded-xl bg-danger/10 text-danger text-xs font-semibold animate-shake"
          >
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* 1. Menu si déjà actif */}
        {flow === "menu" && (
          <div className="space-y-3 pt-2">
            <p className="text-xs text-muted leading-relaxed">
              Un code PIN est actuellement configuré pour verrouiller l'application sur cet appareil.
            </p>

            <button
              type="button"
              onClick={() => {
                resetForm();
                setFlow("change");
              }}
              className="w-full py-3 px-4 rounded-xl bg-card border border-line text-foreground text-xs font-bold hover:bg-card-secondary flex items-center justify-center gap-2 touch-target transition-colors"
            >
              <KeyRound className="w-4 h-4 text-primary" />
              <span>Modifier le code PIN</span>
            </button>

            <button
              type="button"
              onClick={() => {
                resetForm();
                setFlow("disable");
              }}
              className="w-full py-3 px-4 rounded-xl bg-danger/10 text-danger text-xs font-bold hover:bg-danger/15 flex items-center justify-center gap-2 touch-target transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              <span>Désactiver le code PIN</span>
            </button>
          </div>
        )}

        {/* 2. Formulaire de première activation */}
        {flow === "setup" && (
          <form onSubmit={handleCreatePin} className="space-y-3 pt-1">
            <div>
              <label htmlFor="createPin" className="block text-xs font-semibold text-muted mb-1 px-1">
                Nouveau code PIN (4 chiffres)
              </label>
              <input
                id="createPin"
                type="password"
                inputMode="numeric"
                maxLength={4}
                pattern="[0-9]*"
                required
                autoFocus
                value={newPin}
                onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ""))}
                placeholder="Ex: 1234"
                className="w-full text-center tracking-[0.5em] text-lg font-bold px-4 py-3 rounded-xl border border-line bg-card text-foreground outline-none focus:border-primary"
              />
            </div>

            <div>
              <label htmlFor="confirmPin" className="block text-xs font-semibold text-muted mb-1 px-1">
                Confirmer le code PIN
              </label>
              <input
                id="confirmPin"
                type="password"
                inputMode="numeric"
                maxLength={4}
                pattern="[0-9]*"
                required
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ""))}
                placeholder="Ex: 1234"
                className="w-full text-center tracking-[0.5em] text-lg font-bold px-4 py-3 rounded-xl border border-line bg-card text-foreground outline-none focus:border-primary"
              />
            </div>

            <div className="pt-2 flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 rounded-xl bg-card border border-line text-xs font-bold text-foreground hover:bg-card-secondary touch-target transition-colors"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={loading || newPin.length !== 4 || confirmPin.length !== 4}
                className="flex-1 py-3 rounded-xl bg-primary text-white text-xs font-bold hover:opacity-95 touch-target transition-opacity disabled:opacity-50"
              >
                Activer
              </button>
            </div>
          </form>
        )}

        {/* 3. Formulaire de modification */}
        {flow === "change" && (
          <form onSubmit={handleChangePin} className="space-y-3 pt-1">
            <div>
              <label htmlFor="curPin" className="block text-xs font-semibold text-muted mb-1 px-1">
                Code PIN actuel
              </label>
              <input
                id="curPin"
                type="password"
                inputMode="numeric"
                maxLength={4}
                pattern="[0-9]*"
                required
                autoFocus
                value={currentPin}
                onChange={(e) => setCurrentPin(e.target.value.replace(/\D/g, ""))}
                placeholder="4 chiffres"
                className="w-full text-center tracking-[0.5em] text-base font-bold px-4 py-2.5 rounded-xl border border-line bg-card text-foreground outline-none focus:border-primary"
              />
            </div>

            <div>
              <label htmlFor="chNewPin" className="block text-xs font-semibold text-muted mb-1 px-1">
                Nouveau code PIN
              </label>
              <input
                id="chNewPin"
                type="password"
                inputMode="numeric"
                maxLength={4}
                pattern="[0-9]*"
                required
                value={newPin}
                onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ""))}
                placeholder="4 chiffres"
                className="w-full text-center tracking-[0.5em] text-base font-bold px-4 py-2.5 rounded-xl border border-line bg-card text-foreground outline-none focus:border-primary"
              />
            </div>

            <div>
              <label htmlFor="chConfPin" className="block text-xs font-semibold text-muted mb-1 px-1">
                Confirmer le nouveau code
              </label>
              <input
                id="chConfPin"
                type="password"
                inputMode="numeric"
                maxLength={4}
                pattern="[0-9]*"
                required
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ""))}
                placeholder="4 chiffres"
                className="w-full text-center tracking-[0.5em] text-base font-bold px-4 py-2.5 rounded-xl border border-line bg-card text-foreground outline-none focus:border-primary"
              />
            </div>

            <div className="pt-2 flex gap-2">
              <button
                type="button"
                onClick={() => setFlow("menu")}
                className="flex-1 py-3 rounded-xl bg-card border border-line text-xs font-bold text-foreground hover:bg-card-secondary touch-target transition-colors"
              >
                Retour
              </button>
              <button
                type="submit"
                disabled={loading || currentPin.length !== 4 || newPin.length !== 4 || confirmPin.length !== 4}
                className="flex-1 py-3 rounded-xl bg-primary text-white text-xs font-bold hover:opacity-95 touch-target transition-opacity disabled:opacity-50"
              >
                Enregistrer
              </button>
            </div>
          </form>
        )}

        {/* 4. Formulaire de désactivation */}
        {flow === "disable" && (
          <form onSubmit={handleDisablePin} className="space-y-3 pt-1">
            <p className="text-xs text-muted">
              Entrez votre code PIN actuel pour confirmer sa désactivation :
            </p>
            <div>
              <input
                id="disPin"
                type="password"
                inputMode="numeric"
                maxLength={4}
                pattern="[0-9]*"
                required
                autoFocus
                value={currentPin}
                onChange={(e) => setCurrentPin(e.target.value.replace(/\D/g, ""))}
                placeholder="4 chiffres"
                className="w-full text-center tracking-[0.5em] text-lg font-bold px-4 py-3 rounded-xl border border-line bg-card text-foreground outline-none focus:border-primary"
              />
            </div>

            <div className="pt-2 flex gap-2">
              <button
                type="button"
                onClick={() => setFlow("menu")}
                className="flex-1 py-3 rounded-xl bg-card border border-line text-xs font-bold text-foreground hover:bg-card-secondary touch-target transition-colors"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={loading || currentPin.length !== 4}
                className="flex-1 py-3 rounded-xl bg-danger text-white text-xs font-bold hover:opacity-95 touch-target transition-opacity disabled:opacity-50"
              >
                Désactiver
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
