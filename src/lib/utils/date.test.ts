import { describe, it, expect } from "vitest";
import {
  getTodayDateString,
  formatDateFrench,
  generateLocalId,
  getCurrentWeekRange,
  getCurrentMonthRange,
  getCurrentSemesterRange,
  getCurrentYearRange,
  formatDateRangeFrench,
  shiftDate,
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

  it("calcule la plage du semestre civil (S1 et S2)", () => {
    // S2 : octobre 2026
    const s2 = getCurrentSemesterRange("2026-10-17");
    expect(s2.start).toBe("2026-07-01");
    expect(s2.end).toBe("2026-12-31");

    // S1 : mars 2026
    const s1 = getCurrentSemesterRange("2026-03-15");
    expect(s1.start).toBe("2026-01-01");
    expect(s1.end).toBe("2026-06-30");
  });

  it("calcule la plage de l'année civile", () => {
    const year = getCurrentYearRange("2026-10-17");
    expect(year.start).toBe("2026-01-01");
    expect(year.end).toBe("2026-12-31");
  });

  it("formate correctement les plages de semestre et d'année en français", () => {
    expect(formatDateRangeFrench("semester", "2026-01-01", "2026-06-30")).toBe("1er semestre 2026");
    expect(formatDateRangeFrench("semester", "2026-07-01", "2026-12-31")).toBe("2nd semestre 2026");
    expect(formatDateRangeFrench("year", "2026-01-01", "2026-12-31")).toBe("Année 2026");
  });

  it("décale correctement les semestres et les années", () => {
    // Décalage semestre : +6 mois
    const nextSem = shiftDate("2026-03-01", "semester", 1);
    expect(nextSem).toBe("2026-09-01");

    // Décalage année : +1 an
    const nextYear = shiftDate("2026-10-17", "year", 1);
    expect(nextYear).toBe("2027-10-17");
  });
});
