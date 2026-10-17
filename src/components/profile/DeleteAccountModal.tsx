"use client";

import { useState, useEffect } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import { content } from "@/content/fr";
import { deleteAccountAction } from "@/lib/auth/actions";
import { useMobileBackHandler } from "@/lib/utils/useMobileBackHandler";

interface DeleteAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDeleted: () => void;
}

export function DeleteAccountModal({
  isOpen,
  onClose,
  onDeleted,
}: DeleteAccountModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fermeture automatique lors de l'appui sur le bouton/geste Retour du smartphone
  useMobileBackHandler(isOpen, onClose);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleConfirmDelete = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await deleteAccountAction();
      if (!res.success) {
        setError(res.message || content.common.errorTitle);
      } else {
        onDeleted();
      }
    } catch {
      setError(content.common.errorTitle);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn"
    >
      <div className="w-full max-w-sm bg-background border border-line rounded-3xl p-6 shadow-2xl space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-danger/15 text-danger flex items-center justify-center mx-auto">
          <AlertTriangle className="w-6 h-6 stroke-[2.5]" />
        </div>

        <div className="text-center space-y-1.5">
          <h2 className="text-lg font-extrabold text-foreground">
            {content.auth.deleteAccount.confirmTitle}
          </h2>
          <p className="text-xs text-muted leading-relaxed">
            {content.auth.deleteAccount.confirmWarning}
          </p>
        </div>

        {error && (
          <div
            role="alert"
            className="p-3 rounded-xl bg-danger/10 text-danger text-xs font-semibold text-center"
          >
            {error}
          </div>
        )}

        <div className="space-y-2 pt-2">
          <button
            type="button"
            disabled={loading}
            onClick={handleConfirmDelete}
            className="w-full py-3.5 px-4 rounded-xl bg-danger text-white font-bold text-sm shadow-md hover:opacity-95 touch-target transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              content.auth.deleteAccount.confirmButton
            )}
          </button>

          <button
            type="button"
            disabled={loading}
            onClick={onClose}
            className="w-full py-3 px-4 rounded-xl bg-card border border-line text-foreground font-semibold text-sm hover:bg-card-secondary touch-target transition-colors"
          >
            {content.auth.deleteAccount.cancelButton}
          </button>
        </div>
      </div>
    </div>
  );
}
