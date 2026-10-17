import { describe, it, expect, beforeEach } from "vitest";
import {
  hashPin,
  setPin,
  hasPinConfigured,
  verifyPin,
  removePin,
  clearAllLocalPins,
} from "./pin";

// Mock de localStorage et window pour l'environnement de test Node.js
const store = new Map<string, string>();
const localStorageMock = {
  getItem: (key: string) => store.get(key) ?? null,
  setItem: (key: string, value: string) => store.set(key, String(value)),
  removeItem: (key: string) => store.delete(key),
  clear: () => store.clear(),
  get length() {
    return store.size;
  },
  key: (index: number) => Array.from(store.keys())[index] ?? null,
};

Object.defineProperty(globalThis, "window", {
  value: { localStorage: localStorageMock },
  writable: true,
  configurable: true,
});
Object.defineProperty(globalThis, "localStorage", {
  value: localStorageMock,
  writable: true,
  configurable: true,
});

describe("Module de gestion du code PIN (pin.ts)", () => {
  const userId = "test-user-uuid-123";

  beforeEach(() => {
    localStorageMock.clear();
  });

  it("génère des empreintes SHA-256 différentes selon l'utilisateur et le PIN", async () => {
    const hash1 = await hashPin("1234", userId);
    const hash2 = await hashPin("1234", "another-user");
    const hash3 = await hashPin("5678", userId);

    expect(hash1).toBeDefined();
    expect(hash1.length).toBe(64); // Longueur hexadécimale d'un hachage SHA-256
    expect(hash1).not.toBe(hash2);
    expect(hash1).not.toBe(hash3);
  });

  it("configure, détecte et supprime le code PIN d'un utilisateur", async () => {
    expect(hasPinConfigured(userId)).toBe(false);

    await setPin("1234", userId);
    expect(hasPinConfigured(userId)).toBe(true);

    removePin(userId);
    expect(hasPinConfigured(userId)).toBe(false);
  });

  it("valide avec succès le code PIN exact", async () => {
    await setPin("4321", userId);

    const result = await verifyPin("4321", userId);
    expect(result.success).toBe(true);
    expect(result.isLocked).toBe(false);
    expect(result.remainingAttempts).toBe(3);
  });

  it("décompte les tentatives et verrouille après 3 échecs", async () => {
    await setPin("9999", userId);

    // Tentative 1
    const res1 = await verifyPin("0000", userId);
    expect(res1.success).toBe(false);
    expect(res1.remainingAttempts).toBe(2);
    expect(res1.isLocked).toBe(false);

    // Tentative 2
    const res2 = await verifyPin("1111", userId);
    expect(res2.success).toBe(false);
    expect(res2.remainingAttempts).toBe(1);
    expect(res2.isLocked).toBe(false);

    // Tentative 3 : Verrouillage
    const res3 = await verifyPin("2222", userId);
    expect(res3.success).toBe(false);
    expect(res3.remainingAttempts).toBe(0);
    expect(res3.isLocked).toBe(true);

    // Le PIN doit être supprimé pour obliger à se reconnecter par mot de passe
    expect(hasPinConfigured(userId)).toBe(false);
  });

  it("nettoie tous les PIN locaux avec clearAllLocalPins", async () => {
    await setPin("1234", "user-1");
    await setPin("5678", "user-2");

    expect(hasPinConfigured("user-1")).toBe(true);
    expect(hasPinConfigured("user-2")).toBe(true);

    clearAllLocalPins();

    expect(hasPinConfigured("user-1")).toBe(false);
    expect(hasPinConfigured("user-2")).toBe(false);
  });
});
