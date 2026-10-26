import { describe, it, expect, beforeEach } from "vitest";
import { getUserDisplayName } from "./user";

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

describe("getUserDisplayName (Nom et prénom adaptatif utilisateur)", () => {
  beforeEach(() => {
    mockStorage.clear();
  });

  it("utilise le prénom et le nom complet s'ils sont renseignés dans les métadonnées", () => {
    const user = {
      email: "lucien@example.com",
      user_metadata: {
        firstname: "Lucien",
        name: "Agbodjan",
      },
    };

    const { firstName, fullName } = getUserDisplayName(user);
    expect(firstName).toBe("Lucien");
    expect(fullName).toBe("Lucien Agbodjan");
  });

  it("gère les variantes first_name et last_name de Supabase", () => {
    const user = {
      email: "awa@example.com",
      user_metadata: {
        first_name: "Awa",
        last_name: "Diallo",
      },
    };

    const { firstName, fullName } = getUserDisplayName(user);
    expect(firstName).toBe("Awa");
    expect(fullName).toBe("Awa Diallo");
  });

  it("extrait proprement le prénom et nom depuis l'adresse email si aucune métadonnée n'existe", () => {
    const user = {
      email: "fatou.sow@gmail.com",
      user_metadata: {},
    };

    const { firstName, fullName } = getUserDisplayName(user);
    expect(firstName).toBe("Fatou");
    expect(fullName).toBe("Fatou Sow");
  });

  it("priorise les valeurs sauvegardées localement si l'utilisateur a personnalisé son profil", () => {
    localStorage.setItem("owomi_user_firstname", "Marc");
    localStorage.setItem("owomi_user_name", "Koffi");

    const user = {
      email: "test@owomi.app",
      user_metadata: {},
    };

    const { firstName, fullName } = getUserDisplayName(user);
    expect(firstName).toBe("Marc");
    expect(fullName).toBe("Marc Koffi");
  });

  it("ignore la valeur résiduelle 'Alex' issue d'anciennes maquettes si le compte a ses propres données", () => {
    localStorage.setItem("owomi_user_firstname", "Alex");

    const user = {
      email: "sarah.mensah@gmail.com",
      user_metadata: {
        firstname: "Sarah",
        name: "Mensah",
      },
    };

    const { firstName, fullName } = getUserDisplayName(user);
    expect(firstName).toBe("Sarah");
    expect(fullName).toBe("Sarah Mensah");
  });

  it("fournit une valeur de repli propre si l'utilisateur est nul", () => {
    const { firstName, fullName } = getUserDisplayName(null);
    expect(firstName).toBe("Ami");
    expect(fullName).toBe("Utilisateur");
  });
});
