-- ==============================================================================
-- Migration initiale Asoro : Schéma de données, RLS et Invariants métier
-- ==============================================================================

-- 1. Table des profils utilisateurs
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null default '',
  firstname text not null default '',
  currency text not null default 'FCFA',
  timezone text not null default 'Africa/Porto-Novo',
  theme text not null default 'light' check (theme in ('light', 'dark', 'system')),
  monthly_salary bigint not null default 0 check (monthly_salary >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. Table des catégories
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade, -- null si catégorie globale du système
  name text not null,
  icon text not null, -- Identifiant d'icône Lucide
  created_at timestamptz not null default now()
);

-- 3. Table des dépenses prévues
create table if not exists public.planned_expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  amount bigint not null check (amount > 0),
  category text not null,
  period text not null check (period in ('day', 'week', 'month')),
  start_date date not null,
  local_id uuid not null,
  last_modified_at timestamptz not null default now(),
  sync_status text not null default 'synced' check (sync_status in ('pending', 'synced')),
  created_at timestamptz not null default now()
);

-- 4. Table des dépenses réelles
create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  amount bigint not null check (amount > 0),
  category text not null,
  date date not null,
  note text not null default '',
  -- Invariant métier : si la dépense prévue est supprimée, la dépense devient imprévue (planned_expense_id = null)
  planned_expense_id uuid references public.planned_expenses(id) on delete set null,
  local_id uuid not null,
  last_modified_at timestamptz not null default now(),
  sync_status text not null default 'synced' check (sync_status in ('pending', 'synced')),
  created_at timestamptz not null default now()
);

-- 5. Table des revenus hors salaire
create table if not exists public.incomes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  amount bigint not null check (amount > 0),
  source text not null default '',
  date date not null,
  local_id uuid not null,
  last_modified_at timestamptz not null default now(),
  sync_status text not null default 'synced' check (sync_status in ('pending', 'synced')),
  created_at timestamptz not null default now()
);

-- 6. Table des prêts
create table if not exists public.loans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  direction text not null check (direction in ('borrowed', 'given')),
  amount bigint not null check (amount > 0),
  counterpart text not null, -- Personne ou organisme
  date date not null,
  note text not null default '',
  local_id uuid not null,
  last_modified_at timestamptz not null default now(),
  sync_status text not null default 'synced' check (sync_status in ('pending', 'synced')),
  created_at timestamptz not null default now()
);

-- Index de performance pour les recherches fréquentes par utilisateur et date
create index if not exists idx_expenses_user_date on public.expenses(user_id, date);
create index if not exists idx_expenses_planned on public.expenses(planned_expense_id);
create index if not exists idx_incomes_user_date on public.incomes(user_id, date);
create index if not exists idx_loans_user_date on public.loans(user_id, date);
create index if not exists idx_planned_expenses_user on public.planned_expenses(user_id, start_date);
create index if not exists idx_categories_user on public.categories(user_id);

-- Index d'idempotence et d'intégrité pour la synchronisation hors ligne (anti-doublons)
create unique index if not exists idx_expenses_user_local_id on public.expenses(user_id, local_id);
create unique index if not exists idx_incomes_user_local_id on public.incomes(user_id, local_id);
create unique index if not exists idx_loans_user_local_id on public.loans(user_id, local_id);
create unique index if not exists idx_planned_expenses_user_local_id on public.planned_expenses(user_id, local_id);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) - Activation obligatoire sur toutes les tables
-- ==============================================================================

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.planned_expenses enable row level security;
alter table public.expenses enable row level security;
alter table public.incomes enable row level security;
alter table public.loans enable row level security;

-- Politiques RLS : Profiles
create policy "Les utilisateurs peuvent consulter leur propre profil"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Les utilisateurs peuvent mettre à jour leur propre profil"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Les utilisateurs peuvent insérer leur propre profil"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Les utilisateurs peuvent supprimer leur propre profil"
  on public.profiles for delete
  using (auth.uid() = id);

-- Politiques RLS : Categories (visibilité des globales + des siennes propres)
create policy "Les utilisateurs peuvent voir les catégories globales et les leurs"
  on public.categories for select
  using (user_id is null or auth.uid() = user_id);

create policy "Les utilisateurs peuvent créer leurs propres catégories"
  on public.categories for insert
  with check (auth.uid() = user_id);

create policy "Les utilisateurs peuvent modifier leurs propres catégories"
  on public.categories for update
  using (auth.uid() = user_id);

create policy "Les utilisateurs peuvent supprimer leurs propres catégories"
  on public.categories for delete
  using (auth.uid() = user_id);

-- Politiques RLS : Planned Expenses
create policy "Les utilisateurs gèrent uniquement leurs dépenses prévues (SELECT)"
  on public.planned_expenses for select
  using (auth.uid() = user_id);

create policy "Les utilisateurs gèrent uniquement leurs dépenses prévues (INSERT)"
  on public.planned_expenses for insert
  with check (auth.uid() = user_id);

create policy "Les utilisateurs gèrent uniquement leurs dépenses prévues (UPDATE)"
  on public.planned_expenses for update
  using (auth.uid() = user_id);

create policy "Les utilisateurs gèrent uniquement leurs dépenses prévues (DELETE)"
  on public.planned_expenses for delete
  using (auth.uid() = user_id);

-- Politiques RLS : Expenses
create policy "Les utilisateurs gèrent uniquement leurs dépenses (SELECT)"
  on public.expenses for select
  using (auth.uid() = user_id);

create policy "Les utilisateurs gèrent uniquement leurs dépenses (INSERT)"
  on public.expenses for insert
  with check (auth.uid() = user_id);

create policy "Les utilisateurs gèrent uniquement leurs dépenses (UPDATE)"
  on public.expenses for update
  using (auth.uid() = user_id);

create policy "Les utilisateurs gèrent uniquement leurs dépenses (DELETE)"
  on public.expenses for delete
  using (auth.uid() = user_id);

-- Politiques RLS : Incomes
create policy "Les utilisateurs gèrent uniquement leurs revenus (SELECT)"
  on public.incomes for select
  using (auth.uid() = user_id);

create policy "Les utilisateurs gèrent uniquement leurs revenus (INSERT)"
  on public.incomes for insert
  with check (auth.uid() = user_id);

create policy "Les utilisateurs gèrent uniquement leurs revenus (UPDATE)"
  on public.incomes for update
  using (auth.uid() = user_id);

create policy "Les utilisateurs gèrent uniquement leurs revenus (DELETE)"
  on public.incomes for delete
  using (auth.uid() = user_id);

-- Politiques RLS : Loans
create policy "Les utilisateurs gèrent uniquement leurs prêts (SELECT)"
  on public.loans for select
  using (auth.uid() = user_id);

create policy "Les utilisateurs gèrent uniquement leurs prêts (INSERT)"
  on public.loans for insert
  with check (auth.uid() = user_id);

create policy "Les utilisateurs gèrent uniquement leurs prêts (UPDATE)"
  on public.loans for update
  using (auth.uid() = user_id);

create policy "Les utilisateurs gèrent uniquement leurs prêts (DELETE)"
  on public.loans for delete
  using (auth.uid() = user_id);

-- ==============================================================================
-- AUTOMATISATION : Trigger de création automatique de profil à l'inscription
-- ==============================================================================

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name, firstname)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', ''),
    coalesce(new.raw_user_meta_data->>'firstname', '')
  );
  return new;
end;
$$ language plpgsql security definer;

-- Suppression du trigger s'il existe déjà avant recréation propre
drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ==============================================================================
-- INSERTION DES 7 CATÉGORIES PAR DÉFAUT DU CAHIER DES CHARGES
-- ==============================================================================

insert into public.categories (name, icon, user_id)
values
  ('Alimentation', 'UtensilsCrossed', null),
  ('Transport', 'Car', null),
  ('Logement', 'Home', null),
  ('Santé', 'HeartPulse', null),
  ('Loisirs', 'PartyPopper', null),
  ('Factures', 'Receipt', null),
  ('Autre', 'ShoppingBag', null)
on conflict do nothing;
