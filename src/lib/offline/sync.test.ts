import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  enqueueOfflineOperation,
  getPendingOperationsCount,
  getPendingOperations,
  removePendingOperation,
  syncAllPendingOperations,
  clearAllLocalData,
} from "./sync";
import type { PendingOperation } from "./db";

// Mock de la base Dexie pour les tests unitaires
const mockOperations: Map<string, PendingOperation> = new Map();
let mockCachedCount = 0;

vi.mock("./db", () => {
  return {
    db: {
      pendingOperations: {
        put: vi.fn(async (op: PendingOperation) => {
          mockOperations.set(op.localId, op);
          return op.localId;
        }),
        delete: vi.fn(async (localId: string) => {
          mockOperations.delete(localId);
        }),
        clear: vi.fn(async () => {
          mockOperations.clear();
        }),
        update: vi.fn(async (localId: string, changes: Partial<PendingOperation>) => {
          const existing = mockOperations.get(localId);
          if (existing) {
            mockOperations.set(localId, { ...existing, ...changes });
          }
        }),
        where: vi.fn((field: string) => ({
          equals: vi.fn((val: string) => ({
            count: vi.fn(async () => {
              let count = 0;
              mockOperations.forEach((op) => {
                if (field === "userId" && op.userId === val) count++;
              });
              return count;
            }),
            sortBy: vi.fn(async (sortField: string) => {
              const list: PendingOperation[] = [];
              mockOperations.forEach((op) => {
                if (field === "userId" && op.userId === val) list.push(op);
              });
              if (sortField === "createdAt") {
                list.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
              }
              return list;
            }),
          })),
        })),
      },
      cachedItems: {
        clear: vi.fn(async () => {
          mockCachedCount = 0;
        }),
      },
    },
  };
});

// Mock des Server Actions
vi.mock("@/lib/operations/actions", () => ({
  createExpenseAction: vi.fn(async () => ({ success: true })),
  deleteExpenseAction: vi.fn(async () => ({ success: true })),
  createIncomeAction: vi.fn(async () => ({ success: true })),
  deleteIncomeAction: vi.fn(async () => ({ success: true })),
  createLoanAction: vi.fn(async () => ({ success: true })),
  deleteLoanAction: vi.fn(async () => ({ success: true })),
  createPlannedExpenseAction: vi.fn(async () => ({ success: true })),
  deletePlannedExpenseAction: vi.fn(async () => ({ success: true })),
}));

describe("Module de synchronisation hors ligne (sync.ts)", () => {
  beforeEach(() => {
    mockOperations.clear();
    mockCachedCount = 5;
    vi.clearAllMocks();
  });

  it("ajoute une opération en file d'attente avec status 'pending' et retryCount à 0", async () => {
    await enqueueOfflineOperation({
      localId: "uuid-1234",
      userId: "user-1",
      type: "create_expense",
      payload: { amount: 5000, category: "Alimentation" },
    });

    const count = await getPendingOperationsCount("user-1");
    expect(count).toBe(1);

    const ops = await getPendingOperations("user-1");
    expect(ops.length).toBe(1);
    expect(ops[0].localId).toBe("uuid-1234");
    expect(ops[0].status).toBe("pending");
    expect(ops[0].retryCount).toBe(0);
  });

  it("récupère les opérations en attente dans l'ordre chronologique de saisie", async () => {
    await enqueueOfflineOperation({
      localId: "op-second",
      userId: "user-1",
      type: "create_income",
      payload: { amount: 10000 },
    });

    // Simule une opération plus ancienne
    mockOperations.set("op-first", {
      localId: "op-first",
      userId: "user-1",
      type: "create_expense",
      payload: { amount: 2000 },
      createdAt: "2026-10-17T08:00:00Z",
      updatedAt: "2026-10-17T08:00:00Z",
      retryCount: 0,
      status: "pending",
    });

    const ops = await getPendingOperations("user-1");
    expect(ops[0].localId).toBe("op-first");
    expect(ops[1].localId).toBe("op-second");
  });

  it("supprime l'opération de la file d'attente une fois exécutée", async () => {
    await enqueueOfflineOperation({
      localId: "op-to-delete",
      userId: "user-1",
      type: "create_expense",
      payload: { amount: 3000 },
    });

    expect(await getPendingOperationsCount("user-1")).toBe(1);
    await removePendingOperation("op-to-delete");
    expect(await getPendingOperationsCount("user-1")).toBe(0);
  });

  it("synchronise les opérations avec le serveur et vide la file en cas de succès", async () => {
    await enqueueOfflineOperation({
      localId: "op-sync-1",
      userId: "user-1",
      type: "create_expense",
      payload: { amount: 4500, category: "Transport" },
    });

    const result = await syncAllPendingOperations("user-1");
    expect(result.processed).toBe(1);
    expect(result.failed).toBe(0);

    const remaining = await getPendingOperationsCount("user-1");
    expect(remaining).toBe(0);
  });

  it("efface toutes les données locales à la déconnexion (Story A4 & règle 7)", async () => {
    await enqueueOfflineOperation({
      localId: "op-secret",
      userId: "user-1",
      type: "create_expense",
      payload: { amount: 50000 },
    });

    expect(mockOperations.size).toBe(1);
    await clearAllLocalData();
    expect(mockOperations.size).toBe(0);
  });
});
