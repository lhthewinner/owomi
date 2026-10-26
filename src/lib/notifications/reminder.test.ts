import { describe, it, expect, beforeEach } from "vitest";
import {
  isPastReminderTime,
  shouldTriggerDailyReminder,
  getNotificationSettings,
  saveNotificationSettings,
  DEFAULT_NOTIFICATION_SETTINGS,
  NOTIFICATION_STORAGE_KEY,
} from "./reminder";

// Mock de localStorage pour l'environnement Node de Vitest
const store: Record<string, string> = {};
const mockStorage = {
  getItem: (key: string) => store[key] || null,
  setItem: (key: string, val: string) => {
    store[key] = val;
  },
  removeItem: (key: string) => {
    delete store[key];
  },
  clear: () => {
    for (const k of Object.keys(store)) delete store[k];
  },
};

Object.defineProperty(globalThis, "window", {
  value: { localStorage: mockStorage },
  writable: true,
});
Object.defineProperty(globalThis, "localStorage", {
  value: mockStorage,
  writable: true,
});

describe("Notifications & Rappels de fin de journée (Story V1.1)", () => {
  beforeEach(() => {
    mockStorage.clear();
  });

  describe("isPastReminderTime", () => {
    it("détecte correctement quand l'heure est passée", () => {
      const now = new Date("2026-10-25T20:30:00");
      expect(isPastReminderTime("20:00", now)).toBe(true);
      expect(isPastReminderTime("20:30", now)).toBe(true);
      expect(isPastReminderTime("21:00", now)).toBe(false);
    });

    it("gère les formats invalides sans planter", () => {
      const now = new Date("2026-10-25T20:30:00");
      expect(isPastReminderTime("invalid", now)).toBe(false);
    });
  });

  describe("shouldTriggerDailyReminder", () => {
    const today = "2026-10-25";

    it("ne se déclenche pas si désactivé", () => {
      const now = new Date("2026-10-25T21:00:00");
      const should = shouldTriggerDailyReminder(
        { enabled: false, time: "20:00", lastNotifiedDate: null },
        false,
        today,
        now
      );
      expect(should).toBe(false);
    });

    it("ne se déclenche pas si des dépenses ont déjà été saisies aujourd'hui", () => {
      const now = new Date("2026-10-25T21:00:00");
      const should = shouldTriggerDailyReminder(
        { enabled: true, time: "20:00", lastNotifiedDate: null },
        true, // hasExpensesToday = true
        today,
        now
      );
      expect(should).toBe(false);
    });

    it("ne se déclenche pas si l'heure du rappel n'est pas encore arrivée", () => {
      const now = new Date("2026-10-25T18:00:00");
      const should = shouldTriggerDailyReminder(
        { enabled: true, time: "20:00", lastNotifiedDate: null },
        false,
        today,
        now
      );
      expect(should).toBe(false);
    });

    it("ne se déclenche pas s'il a déjà été notifié aujourd'hui", () => {
      const now = new Date("2026-10-25T21:00:00");
      const should = shouldTriggerDailyReminder(
        { enabled: true, time: "20:00", lastNotifiedDate: today },
        false,
        today,
        now
      );
      expect(should).toBe(false);
    });

    it("se déclenche si activé, aucune dépense, heure passée et pas encore notifié aujourd'hui", () => {
      const now = new Date("2026-10-25T20:15:00");
      const should = shouldTriggerDailyReminder(
        { enabled: true, time: "20:00", lastNotifiedDate: null },
        false,
        today,
        now
      );
      expect(should).toBe(true);
    });
  });

  describe("getNotificationSettings & saveNotificationSettings", () => {
    it("retourne les réglages par défaut si aucun réglage enregistré", () => {
      const settings = getNotificationSettings();
      expect(settings).toEqual(DEFAULT_NOTIFICATION_SETTINGS);
    });

    it("sauvegarde et récupère les réglages avec succès", () => {
      const custom = {
        enabled: true,
        time: "21:30",
        lastNotifiedDate: "2026-10-24",
      };
      saveNotificationSettings(custom);
      const loaded = getNotificationSettings();
      expect(loaded).toEqual(custom);
    });
  });
});
