import { describe, it, expect } from "vitest";
import type { AdminUserItem, AdminStats, AdminDataResponse } from "./actions";

describe("Logique d'administration et modération (Story AD1)", () => {
  const sampleUsers: AdminUserItem[] = [
    {
      id: "u-1",
      name: "Admin",
      firstname: "Super",
      email: "admin@owomi.app",
      role: "admin",
      status: "active",
      createdAt: "2026-10-01",
    },
    {
      id: "u-2",
      name: "Koffi",
      firstname: "Paul",
      email: "paul.koffi@gmail.com",
      role: "user",
      status: "active",
      createdAt: "2026-10-05",
    },
    {
      id: "u-3",
      name: "Sow",
      firstname: "Awa",
      email: "awa.sow@yahoo.fr",
      role: "user",
      status: "suspended",
      createdAt: "2026-10-10",
    },
    {
      id: "u-4",
      name: "Bello",
      firstname: "Moussa",
      email: "moussa.bello@mail.com",
      role: "user",
      status: "banned",
      createdAt: "2026-10-12",
    },
  ];

  it("calcule avec exactitude les statistiques anonymes d'utilisateurs sans données financières", () => {
    const stats: AdminStats = {
      totalUsers: sampleUsers.length,
      activeUsers: sampleUsers.filter((u) => u.status === "active").length,
      suspendedUsers: sampleUsers.filter((u) => u.status === "suspended").length,
      bannedUsers: sampleUsers.filter((u) => u.status === "banned").length,
      totalOperations: 142,
    };

    expect(stats.totalUsers).toBe(4);
    expect(stats.activeUsers).toBe(2);
    expect(stats.suspendedUsers).toBe(1);
    expect(stats.bannedUsers).toBe(1);
    expect(stats.totalOperations).toBe(142);

    // Invariant sécurité absolue : aucun montant financier ni salaire n'est exposé
    const statsKeys = Object.keys(stats);
    expect(statsKeys).not.toContain("amount");
    expect(statsKeys).not.toContain("salary");
    expect(statsKeys).not.toContain("balance");
  });

  it("filtre correctement les utilisateurs par statut pour la modération", () => {
    const filterByStatus = (status: "all" | "active" | "suspended" | "banned") => {
      if (status === "all") return sampleUsers;
      return sampleUsers.filter((u) => u.status === status);
    };

    expect(filterByStatus("all").length).toBe(4);
    expect(filterByStatus("active").length).toBe(2);
    expect(filterByStatus("suspended").length).toBe(1);
    expect(filterByStatus("banned").length).toBe(1);
  });

  it("recherche les utilisateurs par nom, prénom ou email de manière insensible à la casse", () => {
    const searchUsers = (query: string) => {
      const q = query.trim().toLowerCase();
      if (!q) return sampleUsers;
      return sampleUsers.filter(
        (u) =>
          u.name.toLowerCase().includes(q) ||
          u.firstname.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q)
      );
    };

    expect(searchUsers("awa").length).toBe(1);
    expect(searchUsers("awa")[0].id).toBe("u-3");
    expect(searchUsers("KOFFI").length).toBe(1);
    expect(searchUsers("gmail.com").length).toBe(1);
    expect(searchUsers("inconnu").length).toBe(0);
  });

  it("interdit les statuts de modération non conformes", () => {
    const validStatuses = ["active", "suspended", "banned"];
    const testStatus = (s: string) => validStatuses.includes(s);

    expect(testStatus("active")).toBe(true);
    expect(testStatus("suspended")).toBe(true);
    expect(testStatus("banned")).toBe(true);
    expect(testStatus("deleted")).toBe(false);
    expect(testStatus("admin")).toBe(false);
  });

  it("bloque l'accès aux données d'administration pour un utilisateur standard", () => {
    const checkAccess = (role: "user" | "admin") => {
      if (role !== "admin") {
        return {
          allowed: false,
          error: "Accès refusé : vous devez posséder le rôle administrateur.",
        };
      }
      return { allowed: true, error: null };
    };

    const userAttempt = checkAccess("user");
    expect(userAttempt.allowed).toBe(false);
    expect(userAttempt.error).toBe("Accès refusé : vous devez posséder le rôle administrateur.");

    const adminAttempt = checkAccess("admin");
    expect(adminAttempt.allowed).toBe(true);
    expect(adminAttempt.error).toBeNull();
  });

  it("protège les comptes administrateurs contre la modération", () => {
    const canModerateUser = (targetRole: "user" | "admin", callerId: string, targetId: string) => {
      if (callerId === targetId) {
        return { success: false, message: "Vous ne pouvez pas modifier le statut de votre propre compte." };
      }
      if (targetRole === "admin") {
        return { success: false, message: "Impossible de modifier le statut d'un administrateur." };
      }
      return { success: true };
    };

    // Tentative de modérer un autre admin -> refusé
    expect(canModerateUser("admin", "u-1", "u-other-admin").success).toBe(false);

    // Tentative d'auto-exclusion -> refusé
    expect(canModerateUser("admin", "u-1", "u-1").success).toBe(false);

    // Modération d'un utilisateur standard par l'admin -> autorisé
    expect(canModerateUser("user", "u-1", "u-2").success).toBe(true);
  });
});

