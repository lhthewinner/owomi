import { describe, it, expect } from "vitest";
import {
  formatAmount,
  formatSignedAmount,
  getCurrencySymbol,
  SUPPORTED_CURRENCIES,
} from "./currency";

describe("formatAmount", () => {
  it("formate correctement un nombre entier avec le séparateur français", () => {
    const result = formatAmount(10000, "FCFA");
    expect(result).toMatch(/10[\s\u202f]000 FCFA/);
  });

  it("gère zéro correctement", () => {
    expect(formatAmount(0, "€")).toBe("0 €");
  });

  it("formate les devises internationales avec le bon symbole", () => {
    expect(formatAmount(1500, "EUR")).toMatch(/1[\s\u202f]500 €/);
    expect(formatAmount(2000, "USD")).toMatch(/2[\s\u202f]000 \$/);
    expect(formatAmount(3000, "CAD")).toMatch(/3[\s\u202f]000 CA\$/);
    expect(formatAmount(500, "GBP")).toMatch(/500 £/);
    expect(formatAmount(50000, "GNF")).toMatch(/50[\s\u202f]000 FG/);
    expect(formatAmount(800, "MAD")).toMatch(/800 DH/);
  });
});

describe("formatSignedAmount", () => {
  it("ajoute le signe négatif typographique sans bloquer", () => {
    const result = formatSignedAmount(-4500, "FCFA");
    expect(result).toMatch(/^− 4[\s\u202f]500 FCFA$/);
  });

  it("n'ajoute pas de préfixe négatif pour un nombre positif", () => {
    const result = formatSignedAmount(5000, "FCFA");
    expect(result).toMatch(/^5[\s\u202f]000 FCFA$/);
  });

  it("gère le signe négatif avec différentes devises", () => {
    expect(formatSignedAmount(-100, "EUR")).toBe("− 100 €");
    expect(formatSignedAmount(-50, "USD")).toBe("− 50 $");
  });
});

describe("getCurrencySymbol et SUPPORTED_CURRENCIES", () => {
  it("contient exactement les 7 devises demandées", () => {
    const codes = SUPPORTED_CURRENCIES.map((c) => c.code);
    expect(codes).toEqual(["FCFA", "EUR", "USD", "CAD", "GBP", "GNF", "MAD"]);
  });

  it("renvoie les bons symboles pour chaque code", () => {
    expect(getCurrencySymbol("FCFA")).toBe("FCFA");
    expect(getCurrencySymbol("EUR")).toBe("€");
    expect(getCurrencySymbol("USD")).toBe("$");
    expect(getCurrencySymbol("CAD")).toBe("CA$");
    expect(getCurrencySymbol("GBP")).toBe("£");
    expect(getCurrencySymbol("GNF")).toBe("FG");
    expect(getCurrencySymbol("MAD")).toBe("DH");
  });
});
