/**
 * Base de données locale IndexedDB propulsée par Dexie.
 * Conforme à la règle 3 & 7 d'AGENTS.md :
 * « PWA : service worker et IndexedDB (avec Dexie) pour le hors ligne »
 * « Les opérations saisies sans réseau sont mises en file d'attente localement »
 */

import Dexie, { type EntityTable } from "dexie";

export type PendingOpType =
  | "create_expense"
  | "delete_expense"
  | "create_income"
  | "delete_income"
  | "create_loan"
  | "delete_loan"
  | "create_planned"
  | "delete_planned";

export interface PendingOperation {
  localId: string; // UUID unique généré sur l'appareil
  userId: string;
  type: PendingOpType;
  payload: Record<string, unknown>;
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
  retryCount: number;
  status: "pending" | "syncing" | "failed";
  errorMessage?: string;
}

export interface CachedItem {
  key: string; // Ex: `dashboard:${userId}` ou `ops:${userId}`
  userId: string;
  data: unknown;
  updatedAt: string;
}

export class OwomiDatabase extends Dexie {
  pendingOperations!: EntityTable<PendingOperation, "localId">;
  cachedItems!: EntityTable<CachedItem, "key">;

  constructor() {
    super("owomi-offline-db");

    this.version(1).stores({
      pendingOperations: "localId, userId, type, createdAt, status",
      cachedItems: "key, userId, updatedAt",
    });
  }
}

// Instance singleton utilisable dans le navigateur
export const db = new OwomiDatabase();
