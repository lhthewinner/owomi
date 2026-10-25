"use client";

import { useState } from "react";
import { ArrowLeft, Check, Circle, AlertCircle, Loader2, MailCheck, Eye, EyeOff } from "lucide-react";
import { content } from "@/content/fr";
import { passwordRules, signupSchema, loginSchema } from "@/lib/validation/auth";
import { signUpAction, signInAction } from "@/lib/auth/actions";

interface AuthCardProps {
  initialTab?: "signup" | "login";
  onBack: () => void;
  onGoForgot: () => void;
  onSuccessLogin: () => void;
}

export function AuthCard({
  initialTab = "signup",
  onBack,
  onGoForgot,
  onSuccessLogin,
}: AuthCardProps) {
  const [tab, setTab] = useState<"signup" | "login">(initialTab);

  // Champs Inscription
  const [suName, setSuName] = useState("");
  const [suFirstname, setSuFirstname] = useState("");
  const [suEmail, setSuEmail] = useState("");
  const [suPassword, setSuPassword] = useState("");
  const [showSuPassword, setShowSuPassword] = useState(false);

  // Champs Connexion
  const [liEmail, setLiEmail] = useState("");
  const [liPassword, setLiPassword] = useState("");
  const [showLiPassword, setShowLiPassword] = useState(false);

  // États
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [isRegisteredWaitingEmail, setIsRegisteredWaitingEmail] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");

  const switchTab = (nextTab: "signup" | "login") => {
    setTab(nextTab);
    setErrorMessage(null);
    setSuccessNotice(null);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessNotice(null);

    // Validation préalable côté client
    const clientValidation = signupSchema.safeParse({
      name: suName,
      firstname: suFirstname,
      email: suEmail,
      password: suPassword,
    });

    if (!clientValidation.success) {
      const firstMsg =
        clientValidation.error.issues[0]?.message || content.auth.errors.allFieldsRequired;
      setErrorMessage(firstMsg);
      return;
    }

    setLoading(true);
    try {
      const result = await signUpAction({
        name: suName,
        firstname: suFirstname,
        email: suEmail,
        password: suPassword,
      });

      if (!result.success) {
        setErrorMessage(result.message || content.auth.errors.invalidCredentials);
      } else if (!result.needsEmailVerification) {
        onSuccessLogin();
      } else {
        setRegisteredEmail(suEmail);
        setIsRegisteredWaitingEmail(true);
        setSuPassword("");
      }
    } catch {
      setErrorMessage(content.common.errorTitle);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessNotice(null);

    // Validation préalable côté client
    const clientValidation = loginSchema.safeParse({
      email: liEmail,
      password: liPassword,
    });

    if (!clientValidation.success) {
      setErrorMessage(content.auth.errors.invalidCredentials);
      return;
    }

    setLoading(true);
    try {
      const result = await signInAction({
        email: liEmail,
        password: liPassword,
      });

      if (!result.success) {
        setErrorMessage(result.message || content.auth.errors.invalidCredentials);
      } else {
        onSuccessLogin();
      }
    } catch {
      setErrorMessage(content.auth.errors.invalidCredentials);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full animate-fadeIn">
      {/* Bouton retour */}
      <button
        onClick={() => {
          if (isRegisteredWaitingEmail) {
            setIsRegisteredWaitingEmail(false);
          }
          onBack();
        }}
        aria-label={content.common.back}
        className="w-10 h-10 rounded-full bg-card shadow-sm border border-line flex items-center justify-center text-muted hover:text-foreground touch-target mb-4 transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
      </button>

      {isRegisteredWaitingEmail ? (
        <div className="flex flex-col items-center text-center py-6 px-2 my-auto animate-fadeIn">
          <div className="w-16 h-16 rounded-2xl bg-gain/15 text-gain flex items-center justify-center mb-5 shadow-sm">
            <MailCheck className="w-8 h-8 stroke-[2.5]" />
          </div>

          <h2 className="text-2xl font-extrabold text-foreground tracking-tight mb-3">
            {content.auth.signupVerification.title}
          </h2>

          <p className="text-sm text-muted leading-relaxed max-w-sm mb-6">
            Un email de confirmation vient d'être envoyé à{" "}
            <strong className="text-foreground font-bold">{registeredEmail}</strong>.
            <br />
            Cliquez sur le lien reçu dans votre boîte de réception pour activer votre compte.
          </p>

          <button
            type="button"
            onClick={() => {
              setIsRegisteredWaitingEmail(false);
              switchTab("login");
            }}
            className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-primary to-primary-dark text-white font-bold text-[15px] shadow-lg shadow-primary/25 flex items-center justify-center gap-2 hover:opacity-95 touch-target transition-all"
          >
            {content.auth.signupVerification.goToLogin}
          </button>
        </div>
      ) : (
        <>
      {/* Titres */}
      <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight mb-5">
        {tab === "signup" ? content.auth.signupTitle : content.auth.loginTitle}
      </h1>

      {/* Sélecteur d'onglets (Inscription / Connexion) */}
      <div className="flex bg-card-secondary p-1 rounded-2xl mb-5">
        <button
          type="button"
          onClick={() => switchTab("signup")}
          className={`flex-1 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all touch-target ${
            tab === "signup"
              ? "bg-card text-foreground shadow-sm"
              : "text-muted hover:text-foreground"
          }`}
        >
          {content.auth.tabSignup}
        </button>
        <button
          type="button"
          onClick={() => switchTab("login")}
          className={`flex-1 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all touch-target ${
            tab === "login"
              ? "bg-card text-foreground shadow-sm"
              : "text-muted hover:text-foreground"
          }`}
        >
          {content.auth.tabLogin}
        </button>
      </div>

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

      {/* Bandeau de succès (ex: email envoyé) */}
      {successNotice && (
        <div
          role="status"
          className="flex items-start gap-2.5 p-3.5 mb-4 rounded-xl bg-gain/10 border border-gain/20 text-gain text-[13px] font-medium animate-fadeIn"
        >
          <MailCheck className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{successNotice}</span>
        </div>
      )}

      {/* FORMULAIRE INSCRIPTION */}
      {tab === "signup" && (
        <form onSubmit={handleSignup} className="space-y-3.5 flex-1 flex flex-col">
          <div>
            <label
              htmlFor="suName"
              className="block text-xs font-semibold text-muted mb-1 px-1"
            >
              {content.auth.fieldName}
            </label>
            <input
              id="suName"
              type="text"
              required
              value={suName}
              onChange={(e) => setSuName(e.target.value)}
              placeholder={content.auth.placeholderName}
              className="w-full px-4 py-3 rounded-xl border border-line bg-card text-foreground text-sm outline-none focus:border-primary transition-colors touch-target"
            />
          </div>

          <div>
            <label
              htmlFor="suFirstname"
              className="block text-xs font-semibold text-muted mb-1 px-1"
            >
              {content.auth.fieldFirstname}
            </label>
            <input
              id="suFirstname"
              type="text"
              required
              value={suFirstname}
              onChange={(e) => setSuFirstname(e.target.value)}
              placeholder={content.auth.placeholderFirstname}
              className="w-full px-4 py-3 rounded-xl border border-line bg-card text-foreground text-sm outline-none focus:border-primary transition-colors touch-target"
            />
          </div>

          <div>
            <label
              htmlFor="suEmail"
              className="block text-xs font-semibold text-muted mb-1 px-1"
            >
              {content.auth.fieldEmail}
            </label>
            <input
              id="suEmail"
              type="email"
              required
              value={suEmail}
              onChange={(e) => setSuEmail(e.target.value)}
              placeholder={content.auth.placeholderEmail}
              className="w-full px-4 py-3 rounded-xl border border-line bg-card text-foreground text-sm outline-none focus:border-primary transition-colors touch-target"
            />
          </div>

          <div>
            <label
              htmlFor="suPw"
              className="block text-xs font-semibold text-muted mb-1 px-1"
            >
              {content.auth.fieldPassword}
            </label>
            <div className="relative">
              <input
                id="suPw"
                type={showSuPassword ? "text" : "password"}
                required
                value={suPassword}
                onChange={(e) => setSuPassword(e.target.value)}
                placeholder={content.auth.placeholderPassword}
                className="w-full pl-4 pr-11 py-3 rounded-xl border border-line bg-card text-foreground text-sm outline-none focus:border-primary transition-colors touch-target"
              />
              <button
                type="button"
                onClick={() => setShowSuPassword(!showSuPassword)}
                aria-label={showSuPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg text-muted hover:text-foreground flex items-center justify-center touch-target transition-colors"
              >
                {showSuPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>

            {/* Liste en direct des règles du mot de passe */}
            <ul className="mt-2.5 space-y-1.5 px-1" aria-label="Règles du mot de passe">
              {passwordRules.map((rule) => {
                const isMet = rule.test(suPassword);
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

          <div className="flex-1 min-h-4" />

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-primary to-primary-dark text-white font-bold text-[15px] shadow-lg shadow-primary/25 flex items-center justify-center gap-2 hover:opacity-95 touch-target transition-all disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              content.auth.btnSubmitSignup
            )}
          </button>
        </form>
      )}

      {/* FORMULAIRE CONNEXION */}
      {tab === "login" && (
        <form onSubmit={handleLogin} className="space-y-4 flex-1 flex flex-col">
          <div>
            <label
              htmlFor="liEmail"
              className="block text-xs font-semibold text-muted mb-1 px-1"
            >
              {content.auth.fieldEmail}
            </label>
            <input
              id="liEmail"
              type="email"
              required
              value={liEmail}
              onChange={(e) => setLiEmail(e.target.value)}
              placeholder={content.auth.placeholderEmail}
              className="w-full px-4 py-3 rounded-xl border border-line bg-card text-foreground text-sm outline-none focus:border-primary transition-colors touch-target"
            />
          </div>

          <div>
            <label
              htmlFor="liPw"
              className="block text-xs font-semibold text-muted mb-1 px-1"
            >
              {content.auth.fieldPassword}
            </label>
            <div className="relative">
              <input
                id="liPw"
                type={showLiPassword ? "text" : "password"}
                required
                value={liPassword}
                onChange={(e) => setLiPassword(e.target.value)}
                placeholder={content.auth.placeholderPasswordLogin}
                className="w-full pl-4 pr-11 py-3 rounded-xl border border-line bg-card text-foreground text-sm outline-none focus:border-primary transition-colors touch-target"
              />
              <button
                type="button"
                onClick={() => setShowLiPassword(!showLiPassword)}
                aria-label={showLiPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg text-muted hover:text-foreground flex items-center justify-center touch-target transition-colors"
              >
                {showLiPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
            <div className="text-right mt-1.5">
              <button
                type="button"
                onClick={onGoForgot}
                className="text-xs font-semibold text-primary hover:underline touch-target py-1 inline-block"
              >
                {content.auth.forgotPasswordLink}
              </button>
            </div>
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
              content.auth.btnSubmitLogin
            )}
          </button>
        </form>
      )}
        </>
      )}
    </div>
  );
}
