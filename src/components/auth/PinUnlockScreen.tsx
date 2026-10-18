"use client";

import { useState } from "react";
import { Wallet, Delete, Lock, AlertCircle } from "lucide-react";
import { verifyPin } from "@/lib/auth/pin";
import { formatAmount } from "@/lib/utils/currency";
import { content } from "@/content/fr";

interface PinUnlockScreenProps {
  userId: string;
  userName?: string;
  onUnlocked: () => void;
  onForgotPin: () => void;
}

export function PinUnlockScreen({
  userId,
  userName = "vous",
  onUnlocked,
  onForgotPin,
}: PinUnlockScreenProps) {
  const [pinDigits, setPinDigits] = useState<string[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  const handlePressDigit = async (digit: string) => {
    if (isVerifying || pinDigits.length >= 4) return;
    setErrorMessage(null);

    const nextDigits = [...pinDigits, digit];
    setPinDigits(nextDigits);

    if (nextDigits.length === 4) {
      setIsVerifying(true);
      const fullPin = nextDigits.join("");
      const result = await verifyPin(fullPin, userId);

      if (result.success) {
        onUnlocked();
      } else {
        setPinDigits([]);
        setIsVerifying(false);

        if (result.isLocked) {
          setErrorMessage(
            "Trop de tentatives erronées. Veuillez vous reconnecter avec votre mot de passe."
          );
          setTimeout(() => {
            onForgotPin();
          }, 2000);
        } else {
          setErrorMessage(
            `Code PIN incorrect. Il vous reste ${result.remainingAttempts} tentative${
              result.remainingAttempts > 1 ? "s" : ""
            }.`
          );
        }
      }
    }
  };

  const handleDeleteDigit = () => {
    if (isVerifying || pinDigits.length === 0) return;
    setErrorMessage(null);
    setPinDigits((prev) => prev.slice(0, -1));
  };

  return (
    <div className="flex flex-col h-full justify-between p-6 sm:p-7 animate-fadeIn">
      {/* En-tête */}
      <div className="flex flex-col items-center pt-4">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-dark to-primary flex items-center justify-center text-white shadow-lg shadow-primary/20 mb-4">
          <Lock className="w-7 h-7 text-white" aria-hidden="true" />
        </div>
        <h1 className="text-xl font-extrabold text-foreground tracking-tight text-center">
          Déverrouiller {content.app.name}
        </h1>
        <p className="text-xs text-muted mt-1 text-center">
          Content de vous revoir, <span className="font-semibold text-foreground">{userName}</span>
        </p>
      </div>

      {/* Ronds indicateurs du code PIN */}
      <div className="my-auto py-6 flex flex-col items-center">
        <div className="flex items-center gap-4 mb-4">
          {[0, 1, 2, 3].map((idx) => {
            const isFilled = idx < pinDigits.length;
            return (
              <div
                key={idx}
                className={`w-4 h-4 rounded-full transition-all duration-200 ${
                  isFilled
                    ? "bg-primary scale-110 shadow-sm"
                    : "border-2 border-line bg-card-secondary"
                }`}
              />
            );
          })}
        </div>

        {errorMessage && (
          <div
            role="alert"
            className="flex items-center gap-1.5 text-xs text-danger font-medium bg-danger/10 px-3.5 py-2 rounded-xl text-center max-w-xs animate-shake"
          >
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}
      </div>

      {/* Pavé numérique tactile 0-9 */}
      <div className="w-full max-w-[280px] mx-auto space-y-3 pb-2">
        <div className="grid grid-cols-3 gap-3">
          {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((digit) => (
            <button
              key={digit}
              type="button"
              disabled={isVerifying}
              onClick={() => handlePressDigit(digit)}
              className="h-14 rounded-2xl bg-card border border-line text-foreground font-bold text-xl hover:bg-card-secondary active:scale-95 touch-target transition-all flex items-center justify-center shadow-xs"
            >
              {digit}
            </button>
          ))}
          <div />
          <button
            type="button"
            disabled={isVerifying}
            onClick={() => handlePressDigit("0")}
            className="h-14 rounded-2xl bg-card border border-line text-foreground font-bold text-xl hover:bg-card-secondary active:scale-95 touch-target transition-all flex items-center justify-center shadow-xs"
          >
            0
          </button>
          <button
            type="button"
            disabled={isVerifying || pinDigits.length === 0}
            onClick={handleDeleteDigit}
            aria-label="Effacer le dernier chiffre"
            className="h-14 rounded-2xl bg-card border border-line text-muted hover:text-foreground active:scale-95 touch-target transition-all flex items-center justify-center disabled:opacity-40 shadow-xs"
          >
            <Delete className="w-5 h-5" />
          </button>
        </div>

        {/* Bouton PIN oublié */}
        <div className="text-center pt-3">
          <button
            type="button"
            onClick={onForgotPin}
            className="text-xs font-semibold text-primary hover:underline touch-target py-2 inline-block"
          >
            PIN oublié ? Se connecter avec mot de passe
          </button>
        </div>
      </div>
    </div>
  );
}
