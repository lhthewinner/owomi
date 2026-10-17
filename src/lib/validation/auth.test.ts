import { describe, it, expect } from "vitest";
import {
  passwordSchema,
  signupSchema,
  loginSchema,
  passwordRules,
} from "./auth";

describe("Validation des règles de mot de passe", () => {
  it("valide un mot de passe conforme à tous les critères", () => {
    const valid = "Secret1!";
    expect(passwordSchema.safeParse(valid).success).toBe(true);
  });

  it("rejette un mot de passe trop court (< 6 caractères)", () => {
    const short = "Aa1!";
    const res = passwordSchema.safeParse(short);
    expect(res.success).toBe(false);
  });

  it("rejette un mot de passe sans majuscule", () => {
    const noUpper = "secret1!";
    expect(passwordSchema.safeParse(noUpper).success).toBe(false);
  });

  it("rejette un mot de passe sans minuscule", () => {
    const noLower = "SECRET1!";
    expect(passwordSchema.safeParse(noLower).success).toBe(false);
  });

  it("rejette un mot de passe sans chiffre", () => {
    const noDigit = "Secret!!";
    expect(passwordSchema.safeParse(noDigit).success).toBe(false);
  });

  it("rejette un mot de passe sans caractère spécial", () => {
    const noSpecial = "Secret12";
    expect(passwordSchema.safeParse(noSpecial).success).toBe(false);
  });

  it("les fonctions de test visuel en direct fonctionnent correctement", () => {
    const pwd = "Ab1!";
    expect(passwordRules.find((r) => r.id === "minLength")?.test(pwd)).toBe(false);
    expect(passwordRules.find((r) => r.id === "uppercase")?.test(pwd)).toBe(true);
    expect(passwordRules.find((r) => r.id === "lowercase")?.test(pwd)).toBe(true);
    expect(passwordRules.find((r) => r.id === "number")?.test(pwd)).toBe(true);
    expect(passwordRules.find((r) => r.id === "special")?.test(pwd)).toBe(true);
  });
});

describe("Validation de l'inscription et de la connexion", () => {
  it("valide une inscription complète et correcte", () => {
    const res = signupSchema.safeParse({
      name: "Doe",
      firstname: "John",
      email: "john.doe@example.com",
      password: "Password1!",
    });
    expect(res.success).toBe(true);
  });

  it("rejette une inscription avec un nom manquant", () => {
    const res = signupSchema.safeParse({
      name: "   ",
      firstname: "John",
      email: "john.doe@example.com",
      password: "Password1!",
    });
    expect(res.success).toBe(false);
  });

  it("rejette une inscription avec un email invalide", () => {
    const res = signupSchema.safeParse({
      name: "Doe",
      firstname: "John",
      email: "not-an-email",
      password: "Password1!",
    });
    expect(res.success).toBe(false);
  });

  it("valide une connexion avec email et mot de passe renseignés", () => {
    const res = loginSchema.safeParse({
      email: "john@example.com",
      password: "AnyPassword1!",
    });
    expect(res.success).toBe(true);
  });

  it("rejette une connexion si le mot de passe est vide", () => {
    const res = loginSchema.safeParse({
      email: "john@example.com",
      password: "",
    });
    expect(res.success).toBe(false);
  });
});
