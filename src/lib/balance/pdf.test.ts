import { describe, it, expect } from "vitest";
import { generateBalancePdf } from "./pdf";
import type { BalanceDataResponse } from "@/lib/operations/actions";

describe("generateBalancePdf (Export PDF avec jsPDF)", () => {
  const mockData: BalanceDataResponse = {
    period: "month",
    referenceDate: "2026-10-15",
    range: {
      start: "2026-10-01",
      end: "2026-10-31",
      formattedLabel: "Mois d'octobre 2026",
    },
    salary: 200000,
    balance: 85000,
    isNegative: false,
    balanceLabel: "Économisé ce mois",
    balanceNote: "Salaire et prêts inclus",
    totalSpent: 165000,
    totalGain: 50000,
    loansBorrowed: 20000,
    loansGiven: 10000,
    netLoans: 10000,
    plannedSpent: 120000,
    unplannedSpent: 45000,
    plannedPercent: 73,
    unplannedPercent: 27,
    byCategory: [
      { category: "Logement", amount: 60000, percentage: 36 },
      { category: "Alimentation", amount: 45000, percentage: 27 },
      { category: "Transport", amount: 25000, percentage: 15 },
    ],
    chartTitle: "Évolution",
    evolution: [],
    currency: "FCFA",
  };

  it("génère un document PDF binaire valide pour un solde positif", () => {
    const doc = generateBalancePdf(mockData, { userName: "Alex" });
    const output = doc.output();

    expect(output).toBeDefined();
    expect(output.startsWith("%PDF-")).toBe(true);
    expect(output.length).toBeGreaterThan(1000);
  });

  it("gère correctement un solde négatif (déficit) et aucune dépense", () => {
    const deficitData: BalanceDataResponse = {
      ...mockData,
      isNegative: true,
      balance: -35000,
      balanceLabel: "Déficit ce mois",
      byCategory: [],
      loansBorrowed: 0,
      loansGiven: 0,
    };

    const doc = generateBalancePdf(deficitData);
    const output = doc.output();

    expect(output.startsWith("%PDF-")).toBe(true);
    expect(output.length).toBeGreaterThan(1000);
  });
});
