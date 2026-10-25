"use client";

import { useState } from "react";
import { ArrowLeft, Check, Circle, AlertCircle, Loader2, Eye, EyeOff, KeyRound } from "lucide-react";
import { content } from "@/content/fr";
import { passwordRules, passwordSchema } from "@/lib/validation/auth";
import { updatePasswordAction } from "@/lib/auth/actions";
import { createClient } from "@/lib/supabase/client";

interface ResetPasswordCardProps {
  onBack: () => void;
  onSuccess: () => void;
}

export function ResetPasswordCard({ onBack, onSuccess }: ResetPasswordCardProps) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // 1. Validation de la correspondance des deux mots de passe
    if (password !== confirmPassword) {
      setErrorMessage(content.auth.errors.passwordsDoNotMatch);
      return;
    }

    // 2. Validation stricte Zod côté client
    const validation = passwordSchema.safeParse(password);
    if (!validation.success) {
      setErrorMessage(content.auth.errors.passwordRuleFailed);
      return;
    }

    setLoading(true);
    try {
      // 3. Mise à jour via l'action serveur (vérification côté serveur obligatoire)
      const res = await updatePasswordAction(password);
      if (!res.success) {
        setErrorMessage(res.message || content.common.errorTitle);
        return;
      }

      // 4. Synchronisation client Supabase immédiate
      const supabase = createClient();
      await supabase.auth.updateUser({ password });

      onSuccess();
    } catch {
      setErrorMessage(content.common.errorTitle);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full animate-fadeIn">
      {/* Bouton retour */}
      <button
        onClick={onBack}
        aria-label={content.common.back}
        className="w-10 h-10 rounded-full bg-card shadow-sm border border-line flex items-center justify-center text-muted hover:text-foreground touch-target mb-4 transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
      </button>

      {/* En-tête */}
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-xl bg-primary/15 text-primary flex items-center justify-center shrink-0">
          <KeyRound className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
            {content.auth.resetTitle}
          </h1>
        </div>
      </div>

      <p className="text-muted text-[13.5px] mt-1 mb-6 leading-relaxed">
        {content.auth.resetSubtitle}
      </p>

      {/* Bandeau d'erreur */}
      {errorMessage && (
        <div
          role="alert"
          className="flex items-start gap-2.5 p-3.5 mb-4 rounded-xl bg-danger/10 border border-danger/20 text-danger text-[13px] font-medium animate-fadeIn"
        >
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 flex-1 flex flex-col">
        {/* Nouveau mot de passe */}
        <div>
          <label
            htmlFor="newPw"
            className="block text-xs font-semibold text-muted mb-1 px-1"
          >
            {content.auth.fieldNewPassword}
          </label>
          <div className="relative">
            <input
              id="newPw"
              type={showPassword ? "text" : "password"}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={content.auth.placeholderNewPassword}
              className="w-full pl-4 pr-11 py-3 rounded-xl border border-line bg-card text-foreground text-sm outline-none focus:border-primary transition-colors touch-target"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg text-muted hover:text-foreground flex items-center justify-center touch-target transition-colors"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {/* Règles de sécurité affichées en direct */}
          <ul className="mt-2.5 space-y-1.5 px-1" aria-label="Règles du mot de passe">
            {passwordRules.map((rule) => {
              const isMet = rule.test(password);
              return (
                <li
                  key={rule.id}
                  className={`flex items-center gap-2 text-xs transition-colors ${
                    isMet ? "text-gain font-semibold" : "text-muted"
                  }`}
                >
                  {isMet ? (
                    <Check className="w-3.5 h-3.5 text-gain stroke-[3]" />
                  ) : (
                    <Circle className="w-3 h-3 text-muted/50" />
                  )}
                  <span>{rule.label}</span>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Confirmation du mot de passe */}
        <div>
          <label
            htmlFor="confirmPw"
            className="block text-xs font-semibold text-muted mb-1 px-1"
          >
            {content.auth.fieldConfirmPassword}
          </label>
          <div className="relative">
            <input
              id="confirmPw"
              type={showConfirmPassword ? "text" : "password"}
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder={content.auth.placeholderConfirmPassword}
              className="w-full pl-4 pr-11 py-3 rounded-xl border border-line bg-card text-foreground text-sm outline-none focus:border-primary transition-colors touch-target"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              aria-label={showConfirmPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg text-muted hover:text-foreground flex items-center justify-center touch-target transition-colors"
            >
              {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {confirmPassword && password !== confirmPassword && (
            <div className="text-[11px] text-danger mt-1.5 px-1 font-medium">
              {content.auth.errors.passwordsDoNotMatch}
            </div>
          )}
        </div>

        <div className="flex-1 min-h-6" />

        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-primary to-primary-dark text-white font-bold text-[15px] shadow-lg shadow-primary/25 flex items-center justify-center gap-2 hover:opacity-95 touch-target transition-all disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            content.auth.btnSubmitResetPassword
          )}
        </button>
      </form>
    </div>
  );
}
