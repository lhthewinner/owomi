"use client";

import { useEffect } from "react";
import { CheckCircle2 } from "lucide-react";

interface ToastProps {
  message: string | null;
  onClose: () => void;
  duration?: number;
}

export function Toast({ message, onClose, duration = 3000 }: ToastProps) {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [message, onClose, duration]);

  if (!message) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 max-w-[90%] sm:max-w-[340px] px-4 py-3 bg-foreground text-background dark:bg-card-secondary dark:text-foreground rounded-2xl shadow-xl border border-line flex items-center gap-2.5 text-xs font-semibold animate-slideUp"
    >
      <CheckCircle2 className="w-4 h-4 text-gain shrink-0" />
      <span>{message}</span>
    </div>
  );
}
