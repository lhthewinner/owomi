/**
 * Utilitaires pour la gestion et l'affichage des informations utilisateur.
 * Garantit l'affichage du vrai prénom ou nom de chaque utilisateur partout dans l'application.
 */

export interface UserLike {
  id?: string;
  email?: string | null;
  user_metadata?: Record<string, unknown> | null;
}

/**
 * Met en majuscule la première lettre d'une chaîne.
 */
function capitalize(str: string): string {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Extrait et nettoie le prénom et le nom complet d'un utilisateur.
 * Supporte toutes les variantes de métadonnées Supabase (firstname, first_name, name, full_name, email).
 */
export function getUserDisplayName(user?: UserLike | null): {
  firstName: string;
  fullName: string;
} {
  if (!user) {
    return { firstName: "Ami", fullName: "Utilisateur" };
  }

  const meta = user.user_metadata || {};

  // 1. Métadonnées Supabase (source authentique du compte)
  const metaFirstname =
    (typeof meta.firstname === "string" && meta.firstname.trim()) ||
    (typeof meta.first_name === "string" && meta.first_name.trim()) ||
    "";

  const metaLastname =
    (typeof meta.lastname === "string" && meta.lastname.trim()) ||
    (typeof meta.last_name === "string" && meta.last_name.trim()) ||
    (typeof meta.name === "string" && meta.name.trim()) ||
    "";

  // 2. Vérification dans le stockage local pour cet utilisateur spécifique (modifié dans la session)
  let localFirstname = "";
  let localName = "";
  if (typeof window !== "undefined") {
    try {
      const userKey = user.id ? `_${user.id}` : "";
      const storedFirst =
        localStorage.getItem(`owomi_user_firstname${userKey}`) ||
        localStorage.getItem("owomi_user_firstname") ||
        "";
      const storedLast =
        localStorage.getItem(`owomi_user_name${userKey}`) ||
        localStorage.getItem("owomi_user_name") ||
        "";

      // Purge de l'ancienne valeur maquette "Alex" si présente
      if (storedFirst && storedFirst.toLowerCase() !== "alex") {
        localFirstname = storedFirst;
      }
      if (storedLast && storedLast.toLowerCase() !== "testeur") {
        localName = storedLast;
      }
    } catch {}
  }

  // Priorité : les métadonnées officielles du compte, ou le stockage local mis à jour
  const effectiveFirstname = metaFirstname || localFirstname;
  const effectiveLastname = metaLastname || localName;

  // Si effectiveLastname contient à la fois prénom et nom (ex: "Lucien Agbodjan") et que effectiveFirstname est vide
  if (!effectiveFirstname && effectiveLastname.includes(" ")) {
    const parts = effectiveLastname.split(/\s+/);
    const deducedFirst = parts[0];
    const deducedLast = parts.slice(1).join(" ");
    return {
      firstName: capitalize(deducedFirst),
      fullName: `${capitalize(deducedFirst)} ${capitalize(deducedLast)}`.trim(),
    };
  }

  // Extraction à partir de l'email si aucune métadonnée n'est présente (ex: "lucien.agbodjan@..." -> "Lucien")
  const emailPrefix = user.email ? user.email.split("@")[0].trim() : "";
  const emailParts = emailPrefix ? emailPrefix.split(/[._-]/).filter(Boolean) : [];
  const emailFirst = emailParts.length > 0 ? capitalize(emailParts[0]) : "";
  const emailLast = emailParts.length > 1 ? capitalize(emailParts[1]) : "";

  // Détermination du prénom pour le Dashboard / PIN (ex: "Bonjour, Lucien")
  const firstName =
    effectiveFirstname ||
    (effectiveLastname && !effectiveLastname.includes(" ") ? effectiveLastname : "") ||
    emailFirst ||
    "Ami";

  // Détermination du nom complet pour les rapports / PDF / Profil (ex: "Lucien Agbodjan")
  let fullName = "";
  if (effectiveFirstname && effectiveLastname && effectiveFirstname !== effectiveLastname) {
    fullName = `${effectiveFirstname} ${effectiveLastname}`.trim();
  } else if (effectiveFirstname) {
    fullName = effectiveFirstname;
  } else if (effectiveLastname) {
    fullName = effectiveLastname;
  } else if (emailFirst && emailLast) {
    fullName = `${emailFirst} ${emailLast}`;
  } else if (emailFirst) {
    fullName = emailFirst;
  } else {
    fullName = "Utilisateur";
  }

  return { firstName, fullName };
}
