-- Migration versionnée : Lot 11 - Dépenses prévues récurrentes et reconduction automatique
-- Ajoute la colonne is_recurring à la table des dépenses prévues

alter table public.planned_expenses
  add column if not exists is_recurring boolean not null default false;

-- Index de performance pour filtrer rapidement les dépenses récurrentes d'un utilisateur
create index if not exists idx_planned_expenses_recurring
  on public.planned_expenses(user_id, is_recurring);
