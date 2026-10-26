/**
 * Gestionnaire des notifications et rappels de fin de journée.
 * Conforme au cahier des charges V1.1 :
 * « Notification de fin de journée ; rappel "rien saisi aujourd'hui" »
 */

export interface NotificationSettings {
  enabled: boolean;
  time: string; // Format "HH:mm"
  lastNotifiedDate: string | null; // "YYYY-MM-DD"
}

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  enabled: false,
  time: "20:00",
  lastNotifiedDate: null,
};

export const NOTIFICATION_STORAGE_KEY = "owomi_notification_settings";

/**
 * Récupère les paramètres de notifications depuis le stockage local.
 */
export function getNotificationSettings(): NotificationSettings {
  if (typeof window === "undefined") return { ...DEFAULT_NOTIFICATION_SETTINGS };
  try {
    const raw = localStorage.getItem(NOTIFICATION_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_NOTIFICATION_SETTINGS };
    const parsed = JSON.parse(raw);
    return {
      enabled: typeof parsed.enabled === "boolean" ? parsed.enabled : false,
      time: typeof parsed.time === "string" && /^\d{2}:\d{2}$/.test(parsed.time) ? parsed.time : "20:00",
      lastNotifiedDate: typeof parsed.lastNotifiedDate === "string" ? parsed.lastNotifiedDate : null,
    };
  } catch {
    return { ...DEFAULT_NOTIFICATION_SETTINGS };
  }
}

/**
 * Enregistre les paramètres de notifications dans le stockage local.
 */
export function saveNotificationSettings(settings: NotificationSettings): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(NOTIFICATION_STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Échec silencieux de stockage
  }
}

/**
 * Vérifie si l'heure courante est postérieure ou égale à l'heure du rappel.
 */
export function isPastReminderTime(reminderTime: string, now: Date = new Date()): boolean {
  const parts = reminderTime.split(":");
  const hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);
  if (isNaN(hours) || isNaN(minutes)) return false;

  const currentHours = now.getHours();
  const currentMinutes = now.getMinutes();

  if (currentHours > hours) return true;
  if (currentHours === hours && currentMinutes >= minutes) return true;
  return false;
}

/**
 * Détermine si le rappel de fin de journée doit se déclencher.
 */
export function shouldTriggerDailyReminder(
  settings: NotificationSettings,
  hasExpensesToday: boolean,
  todayStr: string,
  now: Date = new Date()
): boolean {
  if (!settings.enabled) return false;
  if (hasExpensesToday) return false;
  if (settings.lastNotifiedDate === todayStr) return false;
  return isPastReminderTime(settings.time, now);
}

/**
 * Demande la permission de notification au navigateur.
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "denied";
  }
  try {
    return await Notification.requestPermission();
  } catch {
    return "denied";
  }
}

/**
 * Déclenche une notification système native si autorisée.
 */
export function sendBrowserReminderNotification(
  title: string,
  body: string
): boolean {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return false;
  }
  if (Notification.permission !== "granted") {
    return false;
  }
  try {
    new Notification(title, {
      body,
      icon: "/icons/icon-192.svg",
      badge: "/icons/icon-192.svg",
    });
    return true;
  } catch {
    return false;
  }
}
