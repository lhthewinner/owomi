"use server";

import { cookies } from "next/headers";
import { createServerSideClient } from "@/lib/supabase/server";
import type { Database, UserRole, UserStatus } from "@/types/database";

export interface AdminUserItem {
  id: string;
  name: string;
  firstname: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
}

export interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  suspendedUsers: number;
  bannedUsers: number;
  totalOperations: number;
}

export interface AdminDataResponse {
  isAdmin: boolean;
  users: AdminUserItem[];
  stats: AdminStats;
}

export interface AdminActionResult<T = undefined> {
  success: boolean;
  message?: string;
  data?: T;
}

const BASE_DEMO_USERS: AdminUserItem[] = [
  {
    id: "usr-admin-1",
    name: "Admin",
    firstname: "Principal",
    email: "admin@asoro.app",
    role: "admin",
    status: "active",
    createdAt: "2026-10-01",
  },
  {
    id: "usr-demo-2",
    name: "Mensah",
    firstname: "Kofi",
    email: "kofi.mensah@gmail.com",
    role: "user",
    status: "active",
    createdAt: "2026-10-05",
  },
  {
    id: "usr-demo-3",
    name: "Diallo",
    firstname: "Aminata",
    email: "aminata.diallo@yahoo.fr",
    role: "user",
    status: "active",
    createdAt: "2026-10-08",
  },
  {
    id: "usr-demo-4",
    name: "Koffi",
    firstname: "Jean-Paul",
    email: "jp.koffi@hotmail.com",
    role: "user",
    status: "suspended",
    createdAt: "2026-10-10",
  },
  {
    id: "usr-demo-5",
    name: "Toure",
    firstname: "Fatou",
    email: "fatou.toure@orange.sn",
    role: "user",
    status: "banned",
    createdAt: "2026-10-12",
  },
];

/**
 * Récupère les données d'administration (Story AD1).
 * Réservé exclusivement aux administrateurs.
 * Règle de sécurité : aucun montant financier personnel n'est exposé.
 */
export async function getAdminDataAction(): Promise<AdminActionResult<AdminDataResponse>> {
  const cookieStore = await cookies();
  const isDemo = cookieStore.get("asoro_demo")?.value === "true";

  if (isDemo) {
    const demoRole = cookieStore.get("asoro_demo_role")?.value;
    if (demoRole === "user") {
      return {
        success: false,
        message: "Accès refusé : vous devez posséder le rôle administrateur.",
      };
    }

    // Mode démo : récupération des statuts modifiés localement
    let customStatuses: Record<string, UserStatus> = {};
    try {
      const raw = cookieStore.get("asoro_demo_user_statuses")?.value;
      if (raw) {
        customStatuses = JSON.parse(raw);
      }
    } catch {}

    const users = BASE_DEMO_USERS.map((u) => ({
      ...u,
      status: customStatuses[u.id] || u.status,
    }));

    const activeUsers = users.filter((u) => u.status === "active").length;
    const suspendedUsers = users.filter((u) => u.status === "suspended").length;
    const bannedUsers = users.filter((u) => u.status === "banned").length;

    return {
      success: true,
      data: {
        isAdmin: true,
        users,
        stats: {
          totalUsers: users.length,
          activeUsers,
          suspendedUsers,
          bannedUsers,
          totalOperations: 48,
        },
      },
    };
  }

  // Mode Supabase réel
  const supabase = await createServerSideClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, message: "Vous devez être connecté pour accéder à cette section." };
  }

  // Vérification stricte du rôle administrateur en base de données
  const { data: callerProfile, error: profileErr } = await supabase
    .from("profiles")
    .select("role, status")
    .eq("id", user.id)
    .single();

  if (profileErr || !callerProfile || callerProfile.role !== "admin") {
    return {
      success: false,
      message: "Accès refusé : vous devez posséder le rôle administrateur.",
    };
  }

  if (callerProfile.status !== "active") {
    return {
      success: false,
      message: "Votre compte administrateur est inactif.",
    };
  }

  // Récupération de tous les profils (autorisé par la policy RLS is_admin())
  const { data: profileRows, error: rowsErr } = await supabase
    .from("profiles")
    .select("id, name, firstname, email, role, status, created_at")
    .order("created_at", { ascending: false });

  if (rowsErr) {
    return { success: false, message: "Erreur lors du chargement des utilisateurs." };
  }

  const rows = (profileRows || []) as Database["public"]["Tables"]["profiles"]["Row"][];
  const users: AdminUserItem[] = rows.map((row) => ({
    id: row.id,
    name: row.name || "Utilisateur",
    firstname: row.firstname || "",
    email: row.email || "Non renseigné",
    role: row.role,
    status: row.status,
    createdAt: row.created_at ? row.created_at.split("T")[0] : "",
  }));

  // Statistiques anonymes globales (comptage de lignes uniquement, aucun montant !)
  const [expCountRes, incCountRes, loanCountRes] = await Promise.all([
    supabase.from("expenses").select("id", { count: "exact", head: true }),
    supabase.from("incomes").select("id", { count: "exact", head: true }),
    supabase.from("loans").select("id", { count: "exact", head: true }),
  ]);

  const totalOperations =
    (expCountRes.count || 0) + (incCountRes.count || 0) + (loanCountRes.count || 0);

  const activeUsers = users.filter((u) => u.status === "active").length;
  const suspendedUsers = users.filter((u) => u.status === "suspended").length;
  const bannedUsers = users.filter((u) => u.status === "banned").length;

  return {
    success: true,
    data: {
      isAdmin: true,
      users,
      stats: {
        totalUsers: users.length,
        activeUsers,
        suspendedUsers,
        bannedUsers,
        totalOperations,
      },
    },
  };
}

/**
 * Modération d'un compte utilisateur (Story AD1).
 * Permet de passer un compte à actif, suspendu ou banni.
 */
export async function updateUserStatusAction(
  targetUserId: string,
  newStatus: UserStatus
): Promise<AdminActionResult> {
  if (!["active", "suspended", "banned"].includes(newStatus)) {
    return { success: false, message: "Statut de modération invalide." };
  }

  const cookieStore = await cookies();
  const isDemo = cookieStore.get("asoro_demo")?.value === "true";

  if (isDemo) {
    const demoRole = cookieStore.get("asoro_demo_role")?.value;
    if (demoRole === "user") {
      return { success: false, message: "Action refusée : réservée aux administrateurs." };
    }

    if (targetUserId === "usr-admin-1") {
      return { success: false, message: "Impossible de modifier le compte de l'administrateur principal." };
    }

    let customStatuses: Record<string, UserStatus> = {};
    try {
      const raw = cookieStore.get("asoro_demo_user_statuses")?.value;
      if (raw) customStatuses = JSON.parse(raw);
    } catch {}

    customStatuses[targetUserId] = newStatus;
    cookieStore.set("asoro_demo_user_statuses", JSON.stringify(customStatuses), {
      path: "/",
      maxAge: 3600 * 24,
    });

    return {
      success: true,
      message: `Statut utilisateur mis à jour (${newStatus}).`,
    };
  }

  const supabase = await createServerSideClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, message: "Non authentifié." };
  }

  // Vérification de sécurité : l'appelant est-il admin ?
  const { data: callerProfile } = await supabase
    .from("profiles")
    .select("role, status")
    .eq("id", user.id)
    .single();

  if (!callerProfile || callerProfile.role !== "admin" || callerProfile.status !== "active") {
    return { success: false, message: "Action réservée aux administrateurs actifs." };
  }

  // Protection anti auto-exclusion : un admin ne peut pas suspendre ou bannir son propre compte
  if (targetUserId === user.id) {
    return { success: false, message: "Vous ne pouvez pas modifier le statut de votre propre compte." };
  }

  const { error } = await supabase
    .from("profiles")
    .update({ status: newStatus })
    .eq("id", targetUserId);

  if (error) {
    return { success: false, message: "Erreur lors de la mise à jour du statut." };
  }

  return { success: true, message: `Statut utilisateur mis à jour avec succès (${newStatus}).` };
}

/**
 * Vérifie rapidement si l'utilisateur courant est administrateur (pour l'affichage du badge/lien dans le Profil).
 */
export async function checkIsAdminAction(): Promise<boolean> {
  const cookieStore = await cookies();
  const isDemo = cookieStore.get("asoro_demo")?.value === "true";

  if (isDemo) {
    const demoRole = cookieStore.get("asoro_demo_role")?.value;
    return demoRole !== "user";
  }

  const supabase = await createServerSideClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return false;

  const { data } = await supabase
    .from("profiles")
    .select("role, status")
    .eq("id", user.id)
    .single();

  return data?.role === "admin" && data?.status === "active";
}

/**
 * Permet de basculer entre le rôle utilisateur standard et administrateur en mode démo.
 */
export async function setDemoRoleAction(role: "user" | "admin"): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set("asoro_demo_role", role, { path: "/", maxAge: 3600 * 24 });
}
