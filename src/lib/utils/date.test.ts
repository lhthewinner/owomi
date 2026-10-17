import { describe, it, expect } from "vitest";
import {
  getTodayDateString,
  formatDateFrench,
  generateLocalId,
  getCurrentWeekRange,
  getCurrentMonthRange,
} from "./date";

describe("Utilitaires de date et fuseau horaire", () => {
  it("renvoie la date du jour au format YYYY-MM-DD", () => {
    const todayStr = getTodayDateString("Africa/Porto-Novo");
    expect(todayStr).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("formate correctement une date en français", () => {
    const formatted = formatDateFrench("2026-10-17");
    expect(formatted).toBe("samedi 17 octobre");
  });

  it("génère des identifiants UUID uniques valides", () => {
    const id1 = generateLocalId();
    const id2 = generateLocalId();
    expect(id1).not.toBe(id2);
    expect(id1).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    );
  });

  it("calcule la semaine du lundi au dimanche", () => {
    // 2026-10-17 est un samedi
    const range = getCurrentWeekRange("2026-10-17");
    expect(range.start).toBe("2026-10-12"); // Lundi
    expect(range.end).toBe("2026-10-18"); // Dimanche
  });

  it("calcule la plage du mois", () => {
    const range = getCurrentMonthRange("2026-10-17");
    expect(range.start).toBe("2026-10-01");
    expect(range.end).toBe("2026-10-31");
  });
});
