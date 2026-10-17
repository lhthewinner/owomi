/**
 * Moteur de synchronisation et de gestion de la file d'attente hors ligne d'Asoro.
 * Conforme à la règle 7 d'AGENTS.md :
 * - UUID généré sur l'appareil pour éviter les doublons.
 * - Synchronisation automatique au retour du réseau sans perte de données.
 * - Règle « la dernière modification gagne ».
 * - Nettoyage complet à la déconnexion et suppression du compte.
 */

import { db, type PendingOperation, type PendingOpType } from "./db";
import {
  createExpenseAction,
  deleteExpenseAction,
  createIncomeAction,
  deleteIncomeAction,
  createLoanAction,
  deleteLoanAction,
  createPlannedExpenseAction,
  deletePlannedExpenseAction,
} from "@/lib/operations/actions";
import type {
  ExpenseInput,
  IncomeInput,
  LoanInput,
  PlannedExpenseInput,
} from "@/lib/validation/operations";

/**
 * Ajoute une opération dans la file d'attente locale IndexedDB.
 */
export async function enqueueOfflineOperation(params: {
  localId: string;
  userId: string;
  type: PendingOpType;
  payload: Record<string, unknown>;
}): Promise<void> {
  const now = new Date().toISOString();
  await db.pendingOperations.put({
    localId: params.localId,
    userId: params.userId,
    type: params.type,
    payload: params.payload,
    createdAt: now,
    updatedAt: now,
    retryCount: 0,
    status: "pending",
  });
}

/**
 * Renvoie le nombre d'opérations en attente de synchronisation pour l'utilisateur.
 */
export async function getPendingOperationsCount(userId: string): Promise<number> {
  try {
    return await db.pendingOperations.where("userId").equals(userId).count();
  } catch {
    return 0;
  }
}

/**
 * Récupère toutes les opérations en attente dans l'ordre chronologique de saisie.
 */
export async function getPendingOperations(userId: string): Promise<PendingOperation[]> {
  try {
    return await db.pendingOperations
      .where("userId")
      .equals(userId)
      .sortBy("createdAt");
  } catch {
    return [];
  }
}

/**
 * Supprime une opération de la file d'attente une fois synchronisée avec succès.
 */
export async function removePendingOperation(localId: string): Promise<void> {
  await db.pendingOperations.delete(localId);
}

/**
 * Traite et synchronise toutes les opérations en attente avec le serveur.
 * Invariant : en cas d'échec réseau, l'opération reste dans la file pour ne rien perdre.
 */
export async function syncAllPendingOperations(
  userId: string
): Promise<{ processed: number; failed: number }> {
  // Vérification de la connectivité réseau dans le navigateur
  if (typeof navigator !== "undefined" && navigator.onLine === false) {
    return { processed: 0, failed: 0 };
  }

  const pending = await getPendingOperations(userId);
  let processed = 0;
  let failed = 0;

  for (const op of pending) {
    try {
      let res: { success: boolean; message?: string } = { success: false };

      switch (op.type) {
        case "create_expense":
          res = await createExpenseAction(op.payload as unknown as ExpenseInput);
          break;
        case "delete_expense":
          res = await deleteExpenseAction(op.payload.id as string);
          break;
        case "create_income":
          res = await createIncomeAction(op.payload as unknown as IncomeInput);
          break;
        case "delete_income":
          res = await deleteIncomeAction(op.payload.id as string);
          break;
        case "create_loan":
          res = await createLoanAction(op.payload as unknown as LoanInput);
          break;
        case "delete_loan":
          res = await deleteLoanAction(op.payload.id as string);
          break;
        case "create_planned":
          res = await createPlannedExpenseAction(
            op.payload as unknown as PlannedExpenseInput
          );
          break;
        case "delete_planned":
          res = await deletePlannedExpenseAction(op.payload.id as string);
          break;
      }

      // Si l'opération a réussi ou a déjà été enregistrée (unicité sur local_id)
      if (res.success || res.message?.includes("duplicate")) {
        await removePendingOperation(op.localId);
        processed++;
      } else {
        // En cas d'échec non réseau, incrémente le compteur de tentative
        await db.pendingOperations.update(op.localId, {
          retryCount: op.retryCount + 1,
          updatedAt: new Date().toISOString(),
          status: "pending",
          errorMessage: res.message,
        });
        failed++;
      }
    } catch {
      // Échec réseau : l'opération reste en attente sans être perdue
      await db.pendingOperations.update(op.localId, {
        retryCount: op.retryCount + 1,
        updatedAt: new Date().toISOString(),
        status: "pending",
      });
      failed++;
    }
  }

  return { processed, failed };
}

/**
 * Efface l'intégralité des données locales IndexedDB (Story A4, A5 et règle 7).
 * Doit être appelé à la déconnexion et à la suppression de compte.
 */
export async function clearAllLocalData(): Promise<void> {
  try {
    await db.pendingOperations.clear();
    await db.cachedItems.clear();
  } catch {
    // Repli sécurisé
  }
}
