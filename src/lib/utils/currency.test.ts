import { describe, it, expect } from "vitest";
import { formatAmount, formatSignedAmount } from "./currency";

describe("formatAmount", () => {
  it("formate correctement un nombre entier avec le séparateur français", () => {
    // Dans l'espace insécable français standard
    const result = formatAmount(10000, "FCFA");
    expect(result).toMatch(/10[\s\u202f]000 FCFA/);
  });

  it("gère zéro correctement", () => {
    expect(formatAmount(0, "€")).toBe("0 €");
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
});
