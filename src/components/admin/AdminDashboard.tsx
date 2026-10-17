"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import {
  ShieldCheck,
  Users,
  UserCheck,
  UserX,
  Activity,
  Search,
  ArrowLeft,
  Loader2,
  RefreshCw,
  Ban,
  CheckCircle2,
  AlertTriangle,
  Lock,
} from "lucide-react";
import {
  getAdminDataAction,
  updateUserStatusAction,
  type AdminUserItem,
  type AdminStats,
} from "@/lib/admin/actions";
import type { UserStatus } from "@/types/database";

interface AdminDashboardProps {
  onBackToProfile: () => void;
  onShowToast: (message: string) => void;
}

export function AdminDashboard({ onBackToProfile, onShowToast }: AdminDashboardProps) {
  const [loading, setLoading] = useState<boolean>(true);
  const [users, setUsers] = useState<AdminUserItem[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Filtres et recherche
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<"all" | UserStatus>("all");

  // Modale de confirmation pour bannissement ou suspension
  const [confirmTarget, setConfirmTarget] = useState<{
    user: AdminUserItem;
    action: "suspend" | "ban" | "activate";
  } | null>(null);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getAdminDataAction();
      if (res.success && res.data) {
        setUsers(res.data.users);
        setStats(res.data.stats);
      } else {
        setError(res.message || "Erreur lors du chargement de l'espace administrateur.");
      }
    } catch {
      setError("Impossible de joindre le serveur d'administration.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filtrage combiné : recherche textuelle + statut
  const filteredUsers = useMemo(() => {
    let result = users;
    if (statusFilter !== "all") {
      result = result.filter((u) => u.status === statusFilter);
    }
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      result = result.filter(
        (u) =>
          u.name.toLowerCase().includes(q) ||
          u.firstname.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q)
      );
    }
    return result;
  }, [users, statusFilter, searchQuery]);

  const handleApplyStatus = async () => {
    if (!confirmTarget) return;
    setIsUpdating(true);
    try {
      const targetStatus: UserStatus =
        confirmTarget.action === "activate"
          ? "active"
          : confirmTarget.action === "suspend"
          ? "suspended"
          : "banned";

      const res = await updateUserStatusAction(confirmTarget.user.id, targetStatus);
      if (res.success) {
        onShowToast(res.message || "Statut utilisateur mis à jour");
        setConfirmTarget(null);
        await loadData();
      } else {
        onShowToast(res.message || "Erreur de modération");
      }
    } finally {
      setIsUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-3">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <p className="text-xs font-semibold text-muted">Chargement de l&apos;espace administrateur...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-card rounded-2xl p-6 border border-line shadow-sm space-y-4 max-w-lg mx-auto text-center">
        <div className="w-12 h-12 rounded-2xl bg-danger/10 text-danger flex items-center justify-center mx-auto">
          <Lock className="w-6 h-6" />
        </div>
        <h2 className="text-base font-extrabold text-foreground">Accès restreint</h2>
        <p className="text-xs text-muted leading-relaxed">{error}</p>
        <button
          type="button"
          onClick={onBackToProfile}
          className="inline-flex items-center gap-2 py-2.5 px-4 rounded-xl bg-card-secondary text-foreground text-xs font-bold hover:bg-line transition-colors touch-target"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Retour au profil</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-8 animate-fadeIn">
      {/* 1. En-tête avec bouton retour et badge rôle */}
      <div className="flex items-center justify-between pt-1">
        <button
          type="button"
          onClick={onBackToProfile}
          className="inline-flex items-center gap-1.5 py-1.5 px-3 rounded-xl bg-card border border-line text-xs font-bold text-muted hover:text-foreground hover:bg-card-secondary transition-colors touch-target"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Retour au profil</span>
        </button>

        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Espace Administrateur</span>
        </span>
      </div>

      <div>
        <h1 className="text-xl font-extrabold text-foreground tracking-tight">
          Supervision & Modération
        </h1>
        <p className="text-xs text-muted mt-0.5">
          Suivi de la communauté et gestion des accès (confidentialité bancaire absolue garantie).
        </p>
      </div>

      {/* 2. Cartes de statistiques anonymes d'usage */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div className="bg-card rounded-2xl p-3.5 border border-line shadow-sm space-y-1">
            <div className="flex items-center justify-between text-muted">
              <span className="text-[11px] font-semibold">Total inscrits</span>
              <Users className="w-4 h-4 text-primary" />
            </div>
            <div className="tabular-nums font-extrabold text-2xl text-foreground">
              {stats.totalUsers}
            </div>
            <div className="text-[10px] text-muted font-medium">Comptes créés</div>
          </div>

          <div className="bg-card rounded-2xl p-3.5 border border-line shadow-sm space-y-1">
            <div className="flex items-center justify-between text-muted">
              <span className="text-[11px] font-semibold">Actifs</span>
              <UserCheck className="w-4 h-4 text-gain" />
            </div>
            <div className="tabular-nums font-extrabold text-2xl text-gain">
              {stats.activeUsers}
            </div>
            <div className="text-[10px] text-muted font-medium">Accès opérationnel</div>
          </div>

          <div className="bg-card rounded-2xl p-3.5 border border-line shadow-sm space-y-1">
            <div className="flex items-center justify-between text-muted">
              <span className="text-[11px] font-semibold">Modérés</span>
              <UserX className="w-4 h-4 text-warn" />
            </div>
            <div className="tabular-nums font-extrabold text-2xl text-warn">
              {stats.suspendedUsers + stats.bannedUsers}
            </div>
            <div className="text-[10px] text-muted font-medium">
              {stats.suspendedUsers} susp. · {stats.bannedUsers} bannis
            </div>
          </div>

          <div className="bg-card rounded-2xl p-3.5 border border-line shadow-sm space-y-1">
            <div className="flex items-center justify-between text-muted">
              <span className="text-[11px] font-semibold">Volume d&apos;opérations</span>
              <Activity className="w-4 h-4 text-accent" />
            </div>
            <div className="tabular-nums font-extrabold text-2xl text-accent">
              {stats.totalOperations}
            </div>
            <div className="text-[10px] text-muted font-medium">Transactions créées</div>
          </div>
        </div>
      )}

      {/* 3. Barre de recherche et filtres */}
      <div className="bg-card rounded-2xl p-3 border border-line shadow-sm space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher par nom, prénom ou email..."
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-line bg-card-secondary text-foreground text-xs outline-none focus:border-primary transition-colors touch-target"
          />
        </div>

        {/* Filtres par état */}
        <div className="flex bg-card-secondary p-1 rounded-xl gap-1">
          <button
            type="button"
            onClick={() => setStatusFilter("all")}
            className={`flex-1 py-1.5 rounded-lg text-[11px] font-bold transition-all touch-target ${
              statusFilter === "all"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted hover:text-foreground"
            }`}
          >
            Tous ({users.length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("active")}
            className={`flex-1 py-1.5 rounded-lg text-[11px] font-bold transition-all touch-target ${
              statusFilter === "active"
                ? "bg-gain/15 text-gain shadow-sm"
                : "text-muted hover:text-foreground"
            }`}
          >
            Actifs ({users.filter((u) => u.status === "active").length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("suspended")}
            className={`flex-1 py-1.5 rounded-lg text-[11px] font-bold transition-all touch-target ${
              statusFilter === "suspended"
                ? "bg-warn/20 text-warn shadow-sm"
                : "text-muted hover:text-foreground"
            }`}
          >
            Suspendus ({users.filter((u) => u.status === "suspended").length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("banned")}
            className={`flex-1 py-1.5 rounded-lg text-[11px] font-bold transition-all touch-target ${
              statusFilter === "banned"
                ? "bg-danger/15 text-danger shadow-sm"
                : "text-muted hover:text-foreground"
            }`}
          >
            Bannis ({users.filter((u) => u.status === "banned").length})
          </button>
        </div>
      </div>

      {/* 4. Liste des utilisateurs */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between text-xs font-semibold text-muted px-1">
          <span>Utilisateurs ({filteredUsers.length})</span>
          <button
            type="button"
            onClick={loadData}
            aria-label="Actualiser la liste"
            className="flex items-center gap-1 hover:text-foreground transition-colors touch-target"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Actualiser</span>
          </button>
        </div>

        {filteredUsers.length === 0 ? (
          <div className="bg-card rounded-2xl p-6 border border-line text-center space-y-1">
            <Users className="w-8 h-8 text-muted mx-auto" />
            <p className="text-xs font-bold text-foreground">Aucun utilisateur trouvé</p>
            <p className="text-[11px] text-muted">Modifiez vos critères de recherche ou de filtre.</p>
          </div>
        ) : (
          filteredUsers.map((userItem) => {
            const isSelfOrRoot = userItem.id === "usr-admin-1" || userItem.role === "admin";

            return (
              <div
                key={userItem.id}
                className="bg-card rounded-2xl p-4 border border-line shadow-sm space-y-3 transition-colors hover:border-line/90"
              >
                {/* Ligne 1 : Identité et Badges */}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-sm text-foreground truncate">
                        {userItem.firstname} {userItem.name}
                      </span>
                      {userItem.role === "admin" && (
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/20 shrink-0">
                          Admin
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-muted truncate mt-0.5">{userItem.email}</div>
                    <div className="text-[10px] text-muted mt-0.5">
                      Inscrit le {userItem.createdAt}
                    </div>
                  </div>

                  {/* Badge de statut */}
                  <div className="shrink-0">
                    {userItem.status === "active" && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-gain/15 text-gain">
                        <CheckCircle2 className="w-2.5 h-2.5" />
                        <span>Actif</span>
                      </span>
                    )}
                    {userItem.status === "suspended" && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-warn/20 text-warn">
                        <AlertTriangle className="w-2.5 h-2.5" />
                        <span>Suspendu</span>
                      </span>
                    )}
                    {userItem.status === "banned" && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-danger/15 text-danger">
                        <Ban className="w-2.5 h-2.5" />
                        <span>Banni</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Ligne 2 : Actions de modération */}
                <div className="flex items-center justify-end gap-1.5 pt-2 border-t border-line/60">
                  {isSelfOrRoot ? (
                    <span className="text-[10px] text-muted italic">Compte protégé</span>
                  ) : (
                    <>
                      {userItem.status !== "active" && (
                        <button
                          type="button"
                          onClick={() => setConfirmTarget({ user: userItem, action: "activate" })}
                          className="py-1 px-2.5 rounded-lg bg-gain/10 text-gain hover:bg-gain/20 text-[11px] font-bold flex items-center gap-1 touch-target transition-colors"
                        >
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Réactiver</span>
                        </button>
                      )}

                      {userItem.status === "active" && (
                        <button
                          type="button"
                          onClick={() => setConfirmTarget({ user: userItem, action: "suspend" })}
                          className="py-1 px-2.5 rounded-lg bg-warn/15 text-warn hover:bg-warn/25 text-[11px] font-bold flex items-center gap-1 touch-target transition-colors"
                        >
                          <AlertTriangle className="w-3 h-3" />
                          <span>Suspendre</span>
                        </button>
                      )}

                      {userItem.status !== "banned" && (
                        <button
                          type="button"
                          onClick={() => setConfirmTarget({ user: userItem, action: "ban" })}
                          className="py-1 px-2.5 rounded-lg bg-danger/10 text-danger hover:bg-danger/20 text-[11px] font-bold flex items-center gap-1 touch-target transition-colors"
                        >
                          <Ban className="w-3 h-3" />
                          <span>Bannir</span>
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 5. Modale de confirmation pour action de modération */}
      {confirmTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-card rounded-3xl p-6 border border-line shadow-2xl max-w-sm w-full space-y-4">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center mx-auto ${
                confirmTarget.action === "activate"
                  ? "bg-gain/15 text-gain"
                  : confirmTarget.action === "suspend"
                  ? "bg-warn/20 text-warn"
                  : "bg-danger/15 text-danger"
              }`}
            >
              {confirmTarget.action === "activate" ? (
                <CheckCircle2 className="w-6 h-6" />
              ) : confirmTarget.action === "suspend" ? (
                <AlertTriangle className="w-6 h-6" />
              ) : (
                <Ban className="w-6 h-6" />
              )}
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-extrabold text-foreground">
                {confirmTarget.action === "activate"
                  ? "Réactiver ce compte ?"
                  : confirmTarget.action === "suspend"
                  ? "Suspendre ce compte ?"
                  : "Bannir définitivement ce compte ?"}
              </h3>
              <p className="text-xs text-muted leading-relaxed">
                Utilisateur :{" "}
                <strong className="text-foreground">
                  {confirmTarget.user.firstname} {confirmTarget.user.name}
                </strong>{" "}
                ({confirmTarget.user.email}).
                {confirmTarget.action === "ban" &&
                  " Cette action bloque immédiatement tout accès à l'application."}
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                disabled={isUpdating}
                onClick={() => setConfirmTarget(null)}
                className="flex-1 py-2.5 px-3 rounded-xl border border-line bg-card text-foreground font-bold text-xs hover:bg-card-secondary transition-colors touch-target"
              >
                Annuler
              </button>
              <button
                type="button"
                disabled={isUpdating}
                onClick={handleApplyStatus}
                className={`flex-1 py-2.5 px-3 rounded-xl text-white font-bold text-xs flex items-center justify-center gap-1.5 touch-target transition-opacity ${
                  confirmTarget.action === "activate"
                    ? "bg-gain hover:opacity-95"
                    : confirmTarget.action === "suspend"
                    ? "bg-warn hover:opacity-95"
                    : "bg-danger hover:opacity-95"
                }`}
              >
                {isUpdating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <span>Confirmer</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
