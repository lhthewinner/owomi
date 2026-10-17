/**
 * Utilitaires pour la gestion des dates et des fuseaux horaires.
 * Conforme à la règle 5 d'AGENTS.md :
 * « Aujourd'hui » et « minuit » se calculent selon le fuseau horaire de l'utilisateur.
 */

const DAYS = [
  "dimanche",
  "lundi",
  "mardi",
  "mercredi",
  "jeudi",
  "vendredi",
  "samedi",
];

const MONTHS = [
  "janvier",
  "février",
  "mars",
  "avril",
  "mai",
  "juin",
  "juillet",
  "août",
  "septembre",
  "octobre",
  "novembre",
  "décembre",
];

/**
 * Renvoie la date du jour au format YYYY-MM-DD selon le fuseau horaire spécifié.
 */
export function getTodayDateString(timezone: string = "Africa/Porto-Novo"): string {
  try {
    const formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    return formatter.format(new Date()); // format YYYY-MM-DD
  } catch {
    // Repli sécurisé en UTC si le fuseau est invalide
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
}

/**
 * Formate une date YYYY-MM-DD en français simple (ex: « samedi 17 octobre »).
 */
export function formatDateFrench(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  if (!y || !m || !d) return dateStr;

  const date = new Date(y, m - 1, d);
  const dayName = DAYS[date.getDay()];
  const monthName = MONTHS[date.getMonth()];

  return `${dayName} ${d} ${monthName}`;
}

/**
 * Génère un identifiant unique (UUID v4) sur l'appareil pour les opérations.
 */
export function generateLocalId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Repli compatible RFC 4122
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Calcule la plage de la semaine courante (du lundi au dimanche inclus) pour une date YYYY-MM-DD donnée.
 */
export function getCurrentWeekRange(dateStr: string): { start: string; end: string } {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  const dayOfWeek = (date.getDay() + 6) % 7; // 0 = lundi, 6 = dimanche

  const monday = new Date(date);
  monday.setDate(date.getDate() - dayOfWeek);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const pad = (n: number) => String(n).padStart(2, "0");
  const fmt = (dt: Date) => `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`;

  return {
    start: fmt(monday),
    end: fmt(sunday),
  };
}

/**
 * Calcule la plage du mois courant pour une date YYYY-MM-DD donnée.
 */
export function getCurrentMonthRange(dateStr: string): { start: string; end: string } {
  const [y, m] = dateStr.split("-").map(Number);
  const lastDay = new Date(y, m, 0).getDate();
  const pad = (n: number) => String(n).padStart(2, "0");

  return {
    start: `${y}-${pad(m)}-01`,
    end: `${y}-${pad(m)}-${pad(lastDay)}`,
  };
}

/**
 * Renvoie la plage de dates { start, end } pour une période ('day' | 'week' | 'month')
 * et une date de référence YYYY-MM-DD.
 */
export function getDateRange(
  period: "day" | "week" | "month",
  dateStr: string
): { start: string; end: string } {
  if (period === "day") {
    return { start: dateStr, end: dateStr };
  }
  if (period === "week") {
    return getCurrentWeekRange(dateStr);
  }
  return getCurrentMonthRange(dateStr);
}

/**
 * Formate un libellé de plage de dates en français selon la période.
 * - 'day': "samedi 17 octobre"
 * - 'week': "Du 12 octobre au 18 octobre" (ou "Du 28 septembre au 4 octobre")
 * - 'month': "octobre 2026"
 */
export function formatDateRangeFrench(
  period: "day" | "week" | "month",
  startStr: string,
  endStr: string
): string {
  if (period === "day") {
    return formatDateFrench(startStr);
  }

  const [y1, m1, d1] = startStr.split("-").map(Number);
  const [y2, m2, d2] = endStr.split("-").map(Number);

  if (period === "week") {
    const month1 = MONTHS[m1 - 1] || "";
    const month2 = MONTHS[m2 - 1] || "";
    return `Du ${d1} ${month1} au ${d2} ${month2}`;
  }

  // period === 'month'
  const monthName = MONTHS[m1 - 1] || "";
  return `${monthName} ${y1}`;
}

/**
 * Décale une date YYYY-MM-DD d'un certain nombre d'unités de la période.
 */
export function shiftDate(
  dateStr: string,
  period: "day" | "week" | "month",
  delta: number
): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(y, m - 1, d);

  if (period === "day") {
    dt.setDate(dt.getDate() + delta);
  } else if (period === "week") {
    dt.setDate(dt.getDate() + delta * 7);
  } else {
    dt.setMonth(dt.getMonth() + delta);
  }

  const pad = (n: number) => String(n).padStart(2, "0");
  return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`;
}

