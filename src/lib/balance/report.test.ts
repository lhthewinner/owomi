import { describe, it, expect } from "vitest";
import { generateReportHtml } from "./report";
import { formatAmount } from "@/lib/utils/currency";
import type { BalanceDataResponse } from "@/lib/operations/actions";

describe("generateReportHtml (Génération du rapport PDF)", () => {
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

  it("génère un document HTML complet avec les informations clés", () => {
    const html = generateReportHtml(mockData, { userName: "Alex" });

    expect(html).toContain("<!DOCTYPE html>");
    expect(html).toContain("Owomi — Rapport Financier");
    expect(html).toContain("Mois d&#039;octobre 2026");
    expect(html).toContain("Alex");
    expect(html).toContain("Économisé ce mois");
    expect(html).toContain(formatAmount(85000, "FCFA"));
    expect(html).toContain("Total Dépensé");
    expect(html).toContain(formatAmount(165000, "FCFA"));
    expect(html).toContain("Logement");
    expect(html).toContain(formatAmount(60000, "FCFA"));
  });

  it("gère correctement les prêts et les catégories vides", () => {
    const emptyData: BalanceDataResponse = {
      ...mockData,
      loansBorrowed: 0,
      loansGiven: 0,
      byCategory: [],
      isNegative: true,
      balance: -15000,
      balanceLabel: "Déficit",
    };

    const html = generateReportHtml(emptyData);

    expect(html).toContain("Aucune dépense enregistrée sur cette période");
    expect(html).not.toContain("Prêts de la période");
    expect(html).toContain("#EF4444"); // Couleur rouge pour solde négatif
  });

  it("échappe les caractères spéciaux pour éviter les failles XSS", () => {
    const maliciousData: BalanceDataResponse = {
      ...mockData,
      range: {
        start: "2026-10-01",
        end: "2026-10-31",
        formattedLabel: "<script>alert('xss')</script>",
      },
    };

    const html = generateReportHtml(maliciousData, {
      userName: "<b>Hacker</b>",
    });

    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;alert(&#039;xss&#039;)&lt;/script&gt;");
    expect(html).toContain("&lt;b&gt;Hacker&lt;/b&gt;");
  });
});
