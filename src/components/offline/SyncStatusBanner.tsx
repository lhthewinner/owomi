"use client";

import { useEffect, useState, useCallback } from "react";
import { WifiOff, Loader2, CheckCircle2, RefreshCw } from "lucide-react";
import { content } from "@/content/fr";
import {
  getPendingOperationsCount,
  syncAllPendingOperations,
} from "@/lib/offline/sync";

interface SyncStatusBannerProps {
  userId: string;
  onSyncComplete?: () => void;
  refreshTrigger?: number;
}

export function SyncStatusBanner({
  userId,
  onSyncComplete,
  refreshTrigger = 0,
}: SyncStatusBannerProps) {
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [justSynced, setJustSynced] = useState<boolean>(false);

  const checkPending = useCallback(async () => {
    if (!userId) return;
    const count = await getPendingOperationsCount(userId);
    setPendingCount(count);
  }, [userId]);

  const triggerSync = useCallback(async () => {
    if (!userId || typeof navigator === "undefined" || !navigator.onLine) return;

    const count = await getPendingOperationsCount(userId);
    if (count === 0) return;

    setIsSyncing(true);
    try {
      const res = await syncAllPendingOperations(userId);
      if (res.processed > 0) {
        setJustSynced(true);
        setTimeout(() => setJustSynced(false), 3500);
        onSyncComplete?.();
      }
      await checkPending();
    } finally {
      setIsSyncing(false);
    }
  }, [userId, checkPending, onSyncComplete]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    setIsOnline(navigator.onLine);
    checkPending();

    const handleOnline = () => {
      setIsOnline(true);
      triggerSync();
    };

    const handleOffline = () => {
      setIsOnline(false);
      checkPending();
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Vérification périodique des opérations en attente
    const interval = setInterval(() => {
      checkPending();
    }, 4000);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      clearInterval(interval);
    };
  }, [checkPending, triggerSync]);

  useEffect(() => {
    checkPending();
  }, [checkPending, refreshTrigger]);

  // Si l'utilisateur est en ligne sans opération en attente et sans synchronisation récente, bandeau discret
  if (isOnline && pendingCount === 0 && !isSyncing && !justSynced) {
    return null;
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className={`w-full py-2 px-3 text-xs font-bold flex items-center justify-between transition-colors border-b ${
        !isOnline
          ? "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30"
          : isSyncing
          ? "bg-primary/15 text-primary border-primary/30"
          : "bg-gain/15 text-gain border-gain/30"
      }`}
    >
      <div className="flex items-center gap-2">
        {!isOnline ? (
          <>
            <WifiOff className="w-3.5 h-3.5 shrink-0" />
            <span>
              {content.sync.offline}
              {pendingCount > 0 ? ` · ${content.sync.pendingOps(pendingCount)}` : ""}
            </span>
          </>
        ) : isSyncing ? (
          <>
            <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
            <span>
              Synchronisation en cours... ({pendingCount} en attente)
            </span>
          </>
        ) : (
          <>
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
            <span>{content.sync.synced}</span>
          </>
        )}
      </div>

      {isOnline && pendingCount > 0 && !isSyncing && (
        <button
          type="button"
          onClick={triggerSync}
          className="flex items-center gap-1 text-[11px] font-extrabold underline hover:opacity-80 touch-target"
        >
          <RefreshCw className="w-3 h-3" />
          <span>Synchroniser</span>
        </button>
      )}
    </div>
  );
}
