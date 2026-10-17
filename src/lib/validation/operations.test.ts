import { describe, it, expect } from "vitest";
import {
  expenseInputSchema,
  incomeInputSchema,
  loanInputSchema,
  salaryInputSchema,
} from "./operations";

const dummyUuid = "123e4567-e89b-12d3-a456-426614174000";

describe("Validation des dépenses (Story D1)", () => {
  it("valide une dépense imprévue correcte avec montant entier", () => {
    const res = expenseInputSchema.safeParse({
      amount: 4500,
      category: "Alimentation",
      date: "2026-10-17",
      localId: dummyUuid,
    });
    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.data.plannedExpenseId).toBeNull();
    }
  });

  it("rejette un montant avec virgule décimale", () => {
    const res = expenseInputSchema.safeParse({
      amount: 45.5,
      category: "Alimentation",
      date: "2026-10-17",
      localId: dummyUuid,
    });
    expect(res.success).toBe(false);
  });

  it("rejette un montant négatif ou égal à zéro", () => {
    expect(
      expenseInputSchema.safeParse({
        amount: 0,
        category: "Alimentation",
        date: "2026-10-17",
        localId: dummyUuid,
      }).success
    ).toBe(false);

    expect(
      expenseInputSchema.safeParse({
        amount: -100,
        category: "Alimentation",
        date: "2026-10-17",
        localId: dummyUuid,
      }).success
    ).toBe(false);
  });
});

describe("Validation des revenus hors salaire (Story R2)", () => {
  it("valide un revenu avec source facultative", () => {
    const res = incomeInputSchema.safeParse({
      amount: 10000,
      source: "Mission freelance",
      date: "2026-10-17",
      localId: dummyUuid,
    });
    expect(res.success).toBe(true);
  });

  it("valide un revenu sans source renseignée", () => {
    const res = incomeInputSchema.safeParse({
      amount: 5000,
      date: "2026-10-17",
      localId: dummyUuid,
    });
    expect(res.success).toBe(true);
  });
});

describe("Validation des prêts (Story L1)", () => {
  it("valide un prêt emprunté avec personne renseignée", () => {
    const res = loanInputSchema.safeParse({
      direction: "borrowed",
      amount: 15000,
      counterpart: "Un ami",
      date: "2026-10-17",
      localId: dummyUuid,
    });
    expect(res.success).toBe(true);
  });

  it("valide un prêt accordé (prêté)", () => {
    const res = loanInputSchema.safeParse({
      direction: "given",
      amount: 5000,
      counterpart: "Cousin",
      date: "2026-10-17",
      localId: dummyUuid,
    });
    expect(res.success).toBe(true);
  });

  it("rejette un prêt sans personne ou organisme", () => {
    const res = loanInputSchema.safeParse({
      direction: "borrowed",
      amount: 5000,
      counterpart: "   ",
      date: "2026-10-17",
      localId: dummyUuid,
    });
    expect(res.success).toBe(false);
  });
});

describe("Validation du salaire mensuel (Story R1)", () => {
  it("valide un montant de salaire positif ou nul", () => {
    expect(salaryInputSchema.safeParse({ salary: 250000 }).success).toBe(true);
    expect(salaryInputSchema.safeParse({ salary: 0 }).success).toBe(true);
  });

  it("rejette un salaire négatif", () => {
    expect(salaryInputSchema.safeParse({ salary: -500 }).success).toBe(false);
  });
});
