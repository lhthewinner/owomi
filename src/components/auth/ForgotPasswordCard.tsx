"use client";

import { useState } from "react";
import { ArrowLeft, AlertCircle, Loader2, MailCheck } from "lucide-react";
import { content } from "@/content/fr";
import { forgotPasswordSchema } from "@/lib/validation/auth";
import { forgotPasswordAction } from "@/lib/auth/actions";

interface ForgotPasswordCardProps {
  onBack: () => void;
}

export function ForgotPasswordCard({ onBack }: ForgotPasswordCardProps) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessNotice(null);

    const clientValidation = forgotPasswordSchema.safeParse({ email });
    if (!clientValidation.success) {
      setErrorMessage(content.auth.errors.invalidEmail);
      return;
    }

    setLoading(true);
    try {
      const origin = typeof window !== "undefined" ? window.location.origin : undefined;
      const result = await forgotPasswordAction({ email }, origin);
      if (!result.success) {
        setErrorMessage(result.message || content.common.errorTitle);
      } else {
        setSuccessNotice(result.message || content.auth.success.resetLinkSent);
      }
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

      {/* Titres */}
      <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
        {content.auth.forgotTitle}
      </h1>
      <p className="text-muted text-[13.5px] mt-1 mb-6 leading-relaxed">
        {content.auth.forgotSubtitle}
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

      {/* Bandeau de succès */}
      {successNotice && (
        <div
          role="status"
          className="flex items-start gap-2.5 p-3.5 mb-4 rounded-xl bg-gain/10 border border-gain/20 text-gain text-[13px] font-medium animate-fadeIn"
        >
          <MailCheck className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{successNotice}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 flex-1 flex flex-col">
        <div>
          <label
            htmlFor="fgEmail"
            className="block text-xs font-semibold text-muted mb-1 px-1"
          >
            {content.auth.fieldEmail}
          </label>
          <input
            id="fgEmail"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={content.auth.placeholderEmail}
            className="w-full px-4 py-3 rounded-xl border border-line bg-card text-foreground text-sm outline-none focus:border-primary transition-colors touch-target"
          />
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
            content.auth.btnSendResetLink
          )}
        </button>
      </form>
    </div>
  );
}
