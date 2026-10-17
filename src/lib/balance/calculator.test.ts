import { describe, it, expect } from "vitest";
import {
  calculateBalance,
  calculatePlannedExpenseProgress,
  type ExpenseItem,
  type IncomeItem,
  type LoanItem,
} from "./calculator";

describe("Module unique de calcul du bilan (calculator.ts)", () => {
  // 1. Cas limite : Période sans aucune donnée
  it("gère une période sans aucune opération sans erreur ni NaN", () => {
    const res = calculateBalance({
      period: "day",
      referenceDate: "2026-10-17",
      salary: 250000,
      expenses: [],
      incomes: [],
      loans: [],
    });

    expect(res.totalSpent).toBe(0);
    expect(res.plannedSpent).toBe(0);
    expect(res.unplannedSpent).toBe(0);
    expect(res.totalGain).toBe(0);
    expect(res.loansBorrowed).toBe(0);
    expect(res.loansGiven).toBe(0);
    expect(res.netLoans).toBe(0);
    expect(res.balance).toBe(0);
    expect(res.isNegative).toBe(false);
    expect(res.plannedPercent).toBe(0);
    expect(res.unplannedPercent).toBe(0);
    expect(res.byCategory).toEqual([]);
    expect(res.evolution.length).toBe(7);
  });

  it("gère un mois sans aucune opération (le solde est égal au salaire)", () => {
    const res = calculateBalance({
      period: "month",
      referenceDate: "2026-10-17",
      salary: 250000,
      expenses: [],
      incomes: [],
      loans: [],
    });

    expect(res.totalSpent).toBe(0);
    expect(res.balance).toBe(250000);
    expect(res.isNegative).toBe(false);
    expect(res.balanceLabel).toBe("Économisé ce mois");
    expect(res.balanceNote).toBe("Salaire et prêts inclus");
  });

  // 2. Cas limite : Solde négatif (aucun blocage, note d'alerte)
  it("calcule correctement un solde négatif sur un jour ou une semaine sans bloquer", () => {
    const expenses: ExpenseItem[] = [
      {
        id: "exp-1",
        amount: 15000,
        category: "Alimentation",
        date: "2026-10-17",
        planned_expense_id: null,
      },
    ];

    const res = calculateBalance({
      period: "day",
      referenceDate: "2026-10-17",
      salary: 250000,
      expenses,
      incomes: [],
      loans: [],
    });

    expect(res.balance).toBe(-15000);
    expect(res.isNegative).toBe(true);
    expect(res.balanceNote).toBe("Solde négatif, aucun blocage");
    expect(res.balanceLabel).toBe("Solde du jour");
  });

  it("calcule correctement un solde négatif sur le mois", () => {
    const expenses: ExpenseItem[] = [
      {
        id: "exp-1",
        amount: 300000,
        category: "Logement",
        date: "2026-10-05",
        planned_expense_id: null,
      },
    ];

    const res = calculateBalance({
      period: "month",
      referenceDate: "2026-10-17",
      salary: 250000,
      expenses,
      incomes: [],
      loans: [],
    });

    // 250000 - 300000 = -50000
    expect(res.balance).toBe(-50000);
    expect(res.isNegative).toBe(true);
    expect(res.balanceNote).toBe("Solde négatif, aucun blocage");
  });

  // 3. Cas limite : Semaine à cheval sur deux mois
  it("agrège correctement une semaine à cheval sur deux mois (du lundi 28 sept au dimanche 4 oct 2026)", () => {
    // 2026-10-01 est un jeudi. La semaine va du 2026-09-28 au 2026-10-04.
    const expenses: ExpenseItem[] = [
      {
        id: "e-sept",
        amount: 12000,
        category: "Alimentation",
        date: "2026-09-30",
        planned_expense_id: null,
      },
      {
        id: "e-oct",
        amount: 8000,
        category: "Transport",
        date: "2026-10-02",
        planned_expense_id: null,
      },
      {
        id: "e-hors-semaine",
        amount: 50000,
        category: "Loisirs",
        date: "2026-09-25", // Hors semaine (semaine précédente)
        planned_expense_id: null,
      },
    ];

    const incomes: IncomeItem[] = [
      {
        id: "inc-1",
        amount: 25000,
        source: "Vente",
        date: "2026-10-01",
      },
    ];

    const res = calculateBalance({
      period: "week",
      referenceDate: "2026-10-01",
      salary: 250000,
      expenses,
      incomes,
      loans: [],
    });

    expect(res.range.start).toBe("2026-09-28");
    expect(res.range.end).toBe("2026-10-04");
    expect(res.totalSpent).toBe(20000); // 12000 + 8000
    expect(res.totalGain).toBe(25000);
    expect(res.balance).toBe(5000); // 25000 - 20000
    expect(res.isNegative).toBe(false);
    expect(res.range.formattedLabel).toContain("septembre");
    expect(res.range.formattedLabel).toContain("octobre");
  });

  // 4. Cas limite : Opération juste avant et juste après minuit selon le fuseau
  it("isole rigoureusement une opération de 23:59 (J) et 00:01 (J+1)", () => {
    const expenses: ExpenseItem[] = [
      {
        id: "e-before-midnight",
        amount: 4000,
        category: "Transport",
        date: "2026-10-17",
        planned_expense_id: null,
      },
      {
        id: "e-after-midnight",
        amount: 6000,
        category: "Alimentation",
        date: "2026-10-18",
        planned_expense_id: null,
      },
    ];

    const resDay17 = calculateBalance({
      period: "day",
      referenceDate: "2026-10-17",
      salary: 200000,
      expenses,
      incomes: [],
      loans: [],
    });

    const resDay18 = calculateBalance({
      period: "day",
      referenceDate: "2026-10-18",
      salary: 200000,
      expenses,
      incomes: [],
      loans: [],
    });

    expect(resDay17.totalSpent).toBe(4000);
    expect(resDay18.totalSpent).toBe(6000);
  });

  // 5. Cas limite : Dépense prévue réglée en plusieurs fois, soldée, dépassée
  it("calcule avec exactitude la progression et les statuts des dépenses prévues", () => {
    // À venir (aucun règlement)
    const p1 = calculatePlannedExpenseProgress(10000, 0);
    expect(p1.status).toBe("venir");
    expect(p1.left).toBe(10000);
    expect(p1.progressPercent).toBe(0);

    // En cours (règlement partiel 4 000 / 10 000)
    const p2 = calculatePlannedExpenseProgress(10000, 4000);
    expect(p2.status).toBe("cours");
    expect(p2.left).toBe(6000);
    expect(p2.progressPercent).toBe(40);

    // Soldée (10 000 / 10 000)
    const p3 = calculatePlannedExpenseProgress(10000, 10000);
    expect(p3.status).toBe("solde");
    expect(p3.left).toBe(0);
    expect(p3.progressPercent).toBe(100);

    // Dépassée (12 000 / 10 000)
    const p4 = calculatePlannedExpenseProgress(10000, 12000);
    expect(p4.status).toBe("depasse");
    expect(p4.left).toBe(0);
    expect(p4.progressPercent).toBe(100);
  });

  // 6. Cas limite : Suppression d'une dépense prévue ayant des règlements
  it("reclasse automatiquement les règlements orphelins en dépenses imprévues", () => {
    // Lorsque la dépense prévue est supprimée, la base applique ON DELETE SET NULL : planned_expense_id devient null.
    const expenses: ExpenseItem[] = [
      {
        id: "exp-former-planned",
        amount: 7500,
        category: "Alimentation",
        date: "2026-10-17",
        planned_expense_id: null, // Devenu imprévu
      },
      {
        id: "exp-active-planned",
        amount: 2500,
        category: "Factures",
        date: "2026-10-17",
        planned_expense_id: "plan-still-alive",
      },
    ];

    const res = calculateBalance({
      period: "day",
      referenceDate: "2026-10-17",
      salary: 200000,
      expenses,
      incomes: [],
      loans: [],
    });

    expect(res.totalSpent).toBe(10000);
    expect(res.plannedSpent).toBe(2500);
    expect(res.unplannedSpent).toBe(7500);
    expect(res.plannedPercent).toBe(25);
    expect(res.unplannedPercent).toBe(75);
  });

  // 7. Prêts : emprunté (entrée) vs prêté (sortie)
  it("intègre les prêts au solde : argent emprunté en positif, argent prêté en négatif", () => {
    const loans: LoanItem[] = [
      {
        id: "l-borrowed",
        amount: 50000,
        direction: "borrowed", // Emprunté = rentrée d'argent
        counterpart: "Banque",
        date: "2026-10-17",
      },
      {
        id: "l-given",
        amount: 10000,
        direction: "given", // Prêté = sortie d'argent
        counterpart: "Frère",
        date: "2026-10-17",
      },
    ];

    const res = calculateBalance({
      period: "day",
      referenceDate: "2026-10-17",
      salary: 250000,
      expenses: [],
      incomes: [],
      loans,
    });

    expect(res.loansBorrowed).toBe(50000);
    expect(res.loansGiven).toBe(10000);
    expect(res.netLoans).toBe(40000); // 50000 - 10000
    expect(res.balance).toBe(40000);
  });

  // 8. Répartition par catégorie
  it("trie les catégories par montant décroissant et calcule les pourcentages", () => {
    const expenses: ExpenseItem[] = [
      { id: "1", amount: 2000, category: "Transport", date: "2026-10-17" },
      { id: "2", amount: 6000, category: "Alimentation", date: "2026-10-17" },
      { id: "3", amount: 2000, category: "Factures", date: "2026-10-17" },
    ];

    const res = calculateBalance({
      period: "day",
      referenceDate: "2026-10-17",
      salary: 200000,
      expenses,
      incomes: [],
      loans: [],
    });

    expect(res.byCategory[0].category).toBe("Alimentation");
    expect(res.byCategory[0].amount).toBe(6000);
    expect(res.byCategory[0].percentage).toBe(60);
  });
});
