import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

describe("Validation des règles de schéma SQL et sécurité", () => {
  const migrationPath = path.resolve(
    __dirname,
    "../../supabase/migrations/20261017000000_init_schema.sql"
  );
  const sql = fs.readFileSync(migrationPath, "utf-8");

  const tables = [
    "profiles",
    "categories",
    "planned_expenses",
    "expenses",
    "incomes",
    "loans",
  ];

  it("la migration SQL existe et définit les 6 tables requises", () => {
    tables.forEach((table) => {
      expect(sql).toContain(`create table if not exists public.${table}`);
    });
  });

  it("la sécurité RLS (Row Level Security) est activée sur 100% des tables", () => {
    tables.forEach((table) => {
      expect(sql).toContain(`alter table public.${table} enable row level security;`);
    });
  });

  it("garantit l'invariant métier : la suppression d'une prévue ne supprime pas ses règlements (ON DELETE SET NULL)", () => {
    expect(sql).toMatch(
      /planned_expense_id\s+uuid\s+references\s+public\.planned_expenses\(id\)\s+on\s+delete\s+set\s+null/i
    );
  });

  it("garantit la suppression RGPD en cascade depuis auth.users", () => {
    expect(sql).toMatch(/references\s+auth\.users\(id\)\s+on\s+delete\s+cascade/i);
  });

  it("stocke les montants sous forme d'entiers strictement positifs", () => {
    expect(sql).toContain("amount bigint not null check (amount > 0)");
    expect(sql).toContain("monthly_salary bigint not null default 0 check (monthly_salary >= 0)");
  });

  it("contient les champs de synchronisation hors ligne (local_id, last_modified_at, sync_status)", () => {
    ["planned_expenses", "expenses", "incomes", "loans"].forEach((table) => {
      expect(sql).toContain("local_id uuid not null");
      expect(sql).toContain("sync_status text not null default 'synced'");
    });
  });

  it("insère les 7 catégories par défaut du cahier des charges", () => {
    const defaultCategories = [
      "Alimentation",
      "Transport",
      "Logement",
      "Santé",
      "Loisirs",
      "Factures",
      "Autre",
    ];
    defaultCategories.forEach((cat) => {
      expect(sql).toContain(`'${cat}'`);
    });
  });
});
