import { describe, it, expect } from "vitest";
import { plannedExpenseInputSchema } from "@/lib/validation/operations";
import { calculatePlannedExpenseProgress } from "@/lib/balance/calculator";
import { getDemoPlannedExpenses } from "./demoData";

describe("Dépenses prévues récurrentes et reconduction (Story D5)", () => {
  const dummyUuid = "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11";

  it("permet de marquer une dépense prévue comme récurrente à la création", () => {
    const res = plannedExpenseInputSchema.safeParse({
      name: "Loyer mensuel",
      amount: 80000,
      category: "Logement",
      period: "month",
      startDate: "2026-10-01",
      isRecurring: true,
      localId: dummyUuid,
    });

    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.data.isRecurring).toBe(true);
    }
  });

  it("met la récurrence à false par défaut si non spécifiée", () => {
    const res = plannedExpenseInputSchema.safeParse({
      name: "Achat ponctuel",
      amount: 15000,
      category: "Loisirs",
      period: "month",
      startDate: "2026-10-01",
      localId: dummyUuid,
    });

    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.data.isRecurring).toBe(false);
    }
  });

  it("calcule correctement la progression après ajustement du montant prévu", () => {
    // Initial : prévu 80 000, dépensé 80 000 -> Soldée
    const initial = calculatePlannedExpenseProgress(80000, 80000);
    expect(initial.status).toBe("solde");
    expect(initial.left).toBe(0);
    expect(initial.progressPercent).toBe(100);

    // Ajustement de loyer à 90 000 : reste 10 000 -> En cours
    const adjusted = calculatePlannedExpenseProgress(90000, 80000);
    expect(adjusted.status).toBe("cours");
    expect(adjusted.left).toBe(10000);
    expect(adjusted.progressPercent).toBe(89);
  });

  it("gère l'ajustement à la baisse provoquant un dépassement sans blocage", () => {
    // Si l'utilisateur ajuste le montant à 60 000 alors que 70 000 ont déjà été dépensés
    const res = calculatePlannedExpenseProgress(60000, 70000);
    expect(res.status).toBe("depasse");
    expect(res.left).toBe(0);
    expect(res.progressPercent).toBe(100);
  });

  it("fournit les données récurrentes dans les données de test (mode démo)", () => {
    const demo = getDemoPlannedExpenses("2026-10-17");
    const loyer = demo.items.find((i) => i.name === "Loyer mensuel");
    const courses = demo.items.find((i) => i.name === "Courses & Marché");
    const elec = demo.items.find((i) => i.name === "Facture électricité");

    expect(loyer?.isRecurring).toBe(true);
    expect(elec?.isRecurring).toBe(true);
    expect(courses?.isRecurring).toBe(false);
  });

  it("prend en compte un montant personnalisé ajusté dans le mode démo", () => {
    const demo = getDemoPlannedExpenses("2026-10-17", { "pe-1": 95000 });
    const loyer = demo.items.find((i) => i.id === "pe-1");

    expect(loyer?.amount).toBe(95000);
    expect(loyer?.left).toBe(15000); // 95000 - 80000 = 15000
    expect(loyer?.status).toBe("cours");
  });
});
