/**
 * Module de gestion sécurisée du code PIN local (Web Crypto API).
 * Le code PIN n'est jamais stocké en clair : seule une empreinte SHA-256 salée est conservée.
 */

const MAX_FAILURES = 3;
const PIN_KEY_PREFIX = "asoro_pin_hash_";
const PIN_FAILURES_PREFIX = "asoro_pin_failures_";

/**
 * Calcule l'empreinte cryptographique SHA-256 du code PIN salé par l'ID utilisateur.
 */
export async function hashPin(pin: string, userId: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(`asoro_salt_${userId}_${pin}_safe_secure`);

  // Utilisation de Web Crypto API (supportée nativement par les navigateurs modernes et Node.js)
  const hashBuffer = await globalThis.crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Vérifie si un code PIN est configuré pour cet utilisateur sur cet appareil.
 */
export function hasPinConfigured(userId: string): boolean {
  if (typeof window === "undefined" || !userId) return false;
  return Boolean(localStorage.getItem(`${PIN_KEY_PREFIX}${userId}`));
}

/**
 * Définit ou remplace le code PIN d'un utilisateur.
 */
export async function setPin(pin: string, userId: string): Promise<void> {
  if (typeof window === "undefined" || !userId) return;
  const hash = await hashPin(pin, userId);
  localStorage.setItem(`${PIN_KEY_PREFIX}${userId}`, hash);
  localStorage.setItem(`${PIN_FAILURES_PREFIX}${userId}`, "0");
}

/**
 * Supprime le code PIN d'un utilisateur.
 */
export function removePin(userId: string): void {
  if (typeof window === "undefined" || !userId) return;
  localStorage.removeItem(`${PIN_KEY_PREFIX}${userId}`);
  localStorage.removeItem(`${PIN_FAILURES_PREFIX}${userId}`);
}

/**
 * Nettoie tous les codes PIN enregistrés localement (déconnexion / suppression de compte).
 */
export function clearAllLocalPins(): void {
  if (typeof window === "undefined") return;
  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && (key.startsWith(PIN_KEY_PREFIX) || key.startsWith(PIN_FAILURES_PREFIX))) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach((k) => localStorage.removeItem(k));
}

export type VerifyPinResult = {
  success: boolean;
  remainingAttempts: number;
  isLocked: boolean;
};

/**
 * Vérifie la saisie du code PIN et gère le verrouillage anti-brute-force.
 */
export async function verifyPin(pin: string, userId: string): Promise<VerifyPinResult> {
  if (typeof window === "undefined" || !userId) {
    return { success: false, remainingAttempts: 0, isLocked: false };
  }

  const storedHash = localStorage.getItem(`${PIN_KEY_PREFIX}${userId}`);
  if (!storedHash) {
    return { success: false, remainingAttempts: 0, isLocked: false };
  }

  const currentFailures = Number(localStorage.getItem(`${PIN_FAILURES_PREFIX}${userId}`) || "0");
  const candidateHash = await hashPin(pin, userId);

  if (candidateHash === storedHash) {
    // Succès : réinitialisation du compteur d'erreurs
    localStorage.setItem(`${PIN_FAILURES_PREFIX}${userId}`, "0");
    return { success: true, remainingAttempts: MAX_FAILURES, isLocked: false };
  }

  // Échec : incrémenter le compteur
  const newFailures = currentFailures + 1;
  localStorage.setItem(`${PIN_FAILURES_PREFIX}${userId}`, String(newFailures));

  if (newFailures >= MAX_FAILURES) {
    // Verrouillage : suppression du PIN pour exiger le mot de passe complet du compte
    removePin(userId);
    return { success: false, remainingAttempts: 0, isLocked: true };
  }

  return {
    success: false,
    remainingAttempts: MAX_FAILURES - newFailures,
    isLocked: false,
  };
}
