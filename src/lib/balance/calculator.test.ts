import { describe, it, expect } from "vitest";
import {
  calculateBalance,
  calculatePlannedExpenseProgress,
  groupOperationsByDay,
  type ExpenseItem,
  type IncomeItem,
  type LoanItem,
  type GenericOperation,
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

  // 9. Regroupement par jour pour l'historique
  it("regroupe correctement les opérations par jour avec totaux de journée et tri chronologique", () => {
    const ops: GenericOperation[] = [
      {
        id: "exp-1",
        kind: "expense",
        amount: 4500,
        date: "2026-10-17",
        createdAt: "2026-10-17T10:00:00Z",
      },
      {
        id: "inc-1",
        kind: "income",
        amount: 10000,
        date: "2026-10-17",
        createdAt: "2026-10-17T12:00:00Z",
      },
      {
        id: "exp-2",
        kind: "expense",
        amount: 3000,
        date: "2026-10-16",
        createdAt: "2026-10-16T18:00:00Z",
      },
    ];

    const groups = groupOperationsByDay(ops);

    expect(groups.length).toBe(2);
    // Premier jour : 2026-10-17 (le plus récent)
    expect(groups[0].date).toBe("2026-10-17");
    expect(groups[0].totalExpenses).toBe(4500);
    expect(groups[0].totalIncomes).toBe(10000);
    expect(groups[0].operations.length).toBe(2);
    // L'opération la plus récente en premier (inc-1 à 12:00 avant exp-1 à 10:00)
    expect(groups[0].operations[0].id).toBe("inc-1");

    // Second jour : 2026-10-16
    expect(groups[1].date).toBe("2026-10-16");
    expect(groups[1].totalExpenses).toBe(3000);
    expect(groups[1].totalIncomes).toBe(0);
  });

  // 10. Vue Semestre (6 mois)
  it("calcule avec exactitude le bilan semestriel sur 6 mois", () => {
    const expenses: ExpenseItem[] = [
      { id: "e1", amount: 50000, category: "Alimentation", date: "2026-08-10" },
      { id: "e2", amount: 30000, category: "Transport", date: "2026-09-15" },
    ];
    const incomes: IncomeItem[] = [
      { id: "i1", amount: 20000, date: "2026-08-20" },
    ];

    const res = calculateBalance({
      period: "semester",
      referenceDate: "2026-10-17", // S2 2026 (juillet à décembre)
      salary: 100000, // Salaire mensuel 100 000 F -> 600 000 F sur le semestre
      expenses,
      incomes,
      loans: [],
    });

    expect(res.range.start).toBe("2026-07-01");
    expect(res.range.end).toBe("2026-12-31");
    expect(res.range.formattedLabel).toBe("2nd semestre 2026");
    expect(res.totalSpent).toBe(80000);
    expect(res.totalGain).toBe(20000);
    // Solde : (100 000 * 6) + 20 000 - 80 000 = 540 000
    expect(res.balance).toBe(540000);
    expect(res.isNegative).toBe(false);
    expect(res.balanceLabel).toBe("Économisé sur 6 mois");
    expect(res.evolution.length).toBe(6);
    expect(res.evolution[0].label).toBe("Juil");
    expect(res.evolution[5].label).toBe("Déc");
  });

  // 11. Vue Année (1 an)
  it("calcule avec exactitude le bilan annuel sur 12 mois", () => {
    const expenses: ExpenseItem[] = [
      { id: "e1", amount: 120000, category: "Loyer", date: "2026-02-01" },
      { id: "e2", amount: 80000, category: "Factures", date: "2026-11-15" },
    ];
    const incomes: IncomeItem[] = [
      { id: "i1", amount: 50000, date: "2026-05-10" },
    ];

    const res = calculateBalance({
      period: "year",
      referenceDate: "2026-10-17", // Année 2026
      salary: 100000, // Salaire mensuel 100 000 F -> 1 200 000 F sur l'année
      expenses,
      incomes,
      loans: [],
    });

    expect(res.range.start).toBe("2026-01-01");
    expect(res.range.end).toBe("2026-12-31");
    expect(res.range.formattedLabel).toBe("Année 2026");
    expect(res.totalSpent).toBe(200000);
    expect(res.totalGain).toBe(50000);
    // Solde : (100 000 * 12) + 50 000 - 200 000 = 1 050 000
    expect(res.balance).toBe(1050000);
    expect(res.isNegative).toBe(false);
    expect(res.balanceLabel).toBe("Économisé cette année");
    expect(res.evolution.length).toBe(12);
    expect(res.evolution[0].label).toBe("J"); // Janvier
    expect(res.evolution[11].label).toBe("D"); // Décembre
  });

  // 12. Solde négatif sur semestre et année
  it("gère un solde annuel ou semestriel négatif sans blocage", () => {
    const expenses: ExpenseItem[] = [
      { id: "e1", amount: 800000, category: "Santé", date: "2026-04-10" },
    ];

    const resSem = calculateBalance({
      period: "semester",
      referenceDate: "2026-03-15", // S1 2026
      salary: 50000, // 300 000 F sur 6 mois
      expenses,
      incomes: [],
      loans: [],
    });

    expect(resSem.balance).toBe(-500000);
    expect(resSem.isNegative).toBe(true);
    expect(resSem.balanceNote).toBe("Solde négatif, aucun blocage");
  });
});

