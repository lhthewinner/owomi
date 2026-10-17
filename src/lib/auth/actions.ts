"use server";

import { cookies } from "next/headers";
import { createServerSideClient } from "@/lib/supabase/server";
import {
  signupSchema,
  loginSchema,
  forgotPasswordSchema,
  type SignupInput,
  type LoginInput,
  type ForgotPasswordInput,
} from "@/lib/validation/auth";
import { content } from "@/content/fr";

export type AuthActionResult<T = unknown> = {
  success: boolean;
  message?: string;
  data?: T;
  needsEmailVerification?: boolean;
};

/**
 * Inscription d'un nouvel utilisateur (Story A1).
 * Validation stricte côté serveur avec Zod.
 * Envoi de l'email de confirmation.
 */
export async function signUpAction(
  data: SignupInput
): Promise<AuthActionResult> {
  const parsed = signupSchema.safeParse(data);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message || content.auth.errors.allFieldsRequired;
    return { success: false, message: firstError };
  }

  const { name, firstname, email, password } = parsed.data;
  const supabase = await createServerSideClient();

  const { data: authData, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name,
        firstname,
      },
    },
  });

  if (error) {
    // Si l'utilisateur existe déjà
    if (error.message.includes("User already registered") || error.code === "user_already_exists") {
      return { success: false, message: content.auth.errors.emailAlreadyUsed };
    }
    if (error.message.includes("rate limit") || error.status === 429) {
      return { success: false, message: content.auth.errors.rateLimitExceeded };
    }
    // Erreur de sécurité générique sans exposer de détails sensibles
    return { success: false, message: content.auth.errors.invalidCredentials };
  }

  // Si Supabase a envoyé un email de confirmation (cas nominal)
  return {
    success: true,
    needsEmailVerification: true,
    message: content.auth.success.signupConfirmationSent,
  };
}

/**
 * Connexion d'un utilisateur (Story A2).
 * Conforme à la règle de sécurité : message unique « email ou mot de passe incorrect ».
 * Blocage tant que l'email n'a pas été validé (décision validée).
 */
export async function signInAction(
  data: LoginInput
): Promise<AuthActionResult> {
  const parsed = loginSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, message: content.auth.errors.invalidCredentials };
  }

  const { email, password } = parsed.data;

  // Compte de test local (environnement de dev / prévisualisation)
  const isLocalEnv = process.env.NODE_ENV !== "production";
  if (
    isLocalEnv &&
    email.toLowerCase().trim() === "test@asoro.app" &&
    password === "Asoro2026!"
  ) {
    try {
      const cookieStore = await cookies();
      cookieStore.set("asoro_demo", "true", { path: "/" });
    } catch {
      // Ignorer si hors contexte Next.js
    }
    return { success: true };
  }

  const supabase = await createServerSideClient();

  const { data: authData, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    // Si l'adresse email n'a pas encore été confirmée
    if (
      error.message.includes("Email not confirmed") ||
      error.code === "email_not_confirmed"
    ) {
      return {
        success: false,
        needsEmailVerification: true,
        message: content.auth.errors.emailNotVerified,
      };
    }

    if (error.message.includes("rate limit") || error.status === 429) {
      return { success: false, message: content.auth.errors.rateLimitExceeded };
    }

    // Message unique exigé par la règle de sécurité (section 6 d'AGENTS.md)
    return { success: false, message: content.auth.errors.invalidCredentials };
  }

  if (authData.user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("status")
      .eq("id", authData.user.id)
      .single();

    if (profile?.status === "suspended" || profile?.status === "banned") {
      await supabase.auth.signOut();
      return {
        success: false,
        message:
          profile.status === "banned"
            ? "Ce compte a été définitivement banni."
            : "Ce compte est actuellement suspendu. Veuillez contacter un administrateur.",
      };
    }
  }

  return { success: true };
}

/**
 * Demande de réinitialisation de mot de passe oublié (Story A3).
 * Envoie un lien à usage unique par email.
 */
export async function forgotPasswordAction(
  data: ForgotPasswordInput
): Promise<AuthActionResult> {
  const parsed = forgotPasswordSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, message: content.auth.errors.invalidEmail };
  }

  const { email } = parsed.data;
  const supabase = await createServerSideClient();

  const { error } = await supabase.auth.resetPasswordForEmail(email);

  if (error) {
    if (error.message.includes("rate limit") || error.status === 429) {
      return { success: false, message: content.auth.errors.rateLimitExceeded };
    }
  }

  // Pour des raisons de sécurité, on affiche toujours le même message pour ne pas divulguer si l'email existe ou non
  return {
    success: true,
    message: content.auth.success.resetLinkSent,
  };
}

/**
 * Déconnexion de l'utilisateur (Story A4).
 * Ferme la session Supabase côté serveur.
 */
export async function signOutAction(): Promise<AuthActionResult> {
  try {
    const cookieStore = await cookies();
    cookieStore.delete("asoro_demo");
  } catch {
    // Ignorer si hors contexte Next.js
  }

  const supabase = await createServerSideClient();
  const { error } = await supabase.auth.signOut();

  if (error) {
    return { success: false, message: content.common.errorTitle };
  }

  return { success: true };
}

/**
 * Suppression irréversible du compte utilisateur (Story A5).
 * Efface le profil et toutes les données associées en cascade via PostgreSQL.
 */
export async function deleteAccountAction(): Promise<AuthActionResult> {
  const supabase = await createServerSideClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, message: content.auth.errors.invalidCredentials };
  }

  // La suppression du profil déclenche les contraintes ON DELETE CASCADE
  // et les règles de nettoyage RGPD
  const { error: profileError } = await supabase
    .from("profiles")
    .delete()
    .eq("id", user.id);

  if (profileError) {
    return { success: false, message: content.common.errorTitle };
  }

  // Déconnexion de la session
  await supabase.auth.signOut();

  return {
    success: true,
    message: content.auth.success.accountDeleted,
  };
}
