import { z } from "zod";
import { content } from "@/content/fr";

/**
 * Critères stricts pour le mot de passe (règle 6 d'AGENTS.md & cahier des charges) :
 * - 6 caractères minimum
 * - Au moins une majuscule
 * - Au moins une minuscule
 * - Au moins un chiffre
 * - Au moins un caractère spécial
 */
export const passwordRules = [
  {
    id: "minLength",
    label: content.auth.pwRules.minLength,
    test: (val: string) => val.length >= 6,
  },
  {
    id: "uppercase",
    label: content.auth.pwRules.uppercase,
    test: (val: string) => /[A-Z]/.test(val),
  },
  {
    id: "lowercase",
    label: content.auth.pwRules.lowercase,
    test: (val: string) => /[a-z]/.test(val),
  },
  {
    id: "number",
    label: content.auth.pwRules.number,
    test: (val: string) => /[0-9]/.test(val),
  },
  {
    id: "special",
    label: content.auth.pwRules.special,
    test: (val: string) => /[^A-Za-z0-9]/.test(val),
  },
] as const;

export const passwordSchema = z
  .string()
  .min(6, content.auth.pwRules.minLength)
  .regex(/[A-Z]/, content.auth.pwRules.uppercase)
  .regex(/[a-z]/, content.auth.pwRules.lowercase)
  .regex(/[0-9]/, content.auth.pwRules.number)
  .regex(/[^A-Za-z0-9]/, content.auth.pwRules.special);

export const emailSchema = z
  .string()
  .trim()
  .min(1, content.auth.errors.allFieldsRequired)
  .email(content.auth.errors.invalidEmail);

export const signupSchema = z.object({
  name: z.string().trim().min(1, content.auth.errors.allFieldsRequired),
  firstname: z.string().trim().min(1, content.auth.errors.allFieldsRequired),
  email: emailSchema,
  password: passwordSchema,
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, content.auth.errors.allFieldsRequired),
});

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z.object({
  password: passwordSchema,
});

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
