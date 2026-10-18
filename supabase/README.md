# Guide d'installation de la base de données Supabase (Lot 1)

Ce guide explique comment installer la base de données du projet **Owomi** sur votre compte Supabase gratuit en quelques minutes.

---

### Étape 1 : Créer votre projet Supabase (gratuit)
1. Rendez-vous sur [https://supabase.com](https://supabase.com) et connectez-vous.
2. Cliquez sur **« New Project »**.
3. Choisissez un nom (ex: `owomi-budget`), un mot de passe sécurisé pour la base, et la région la plus proche.

---

### Étape 2 : Exécuter les scripts de migration (dans l'ordre)
Dans le menu de gauche de votre projet Supabase, cliquez sur l'icône **SQL Editor** (l'icône d'un terminal/feuille), puis cliquez sur **« New query »** (Nouvelle requête).

Exécutez les fichiers situés dans `supabase/migrations/` **dans cet ordre chronologique** :

1. **[`20261017000000_init_schema.sql`](file:///h:/PROJET/Asoro/supabase/migrations/20261017000000_init_schema.sql)** :
   - Crée le schéma complet (tables `profiles`, `categories`, `planned_expenses`, `expenses`, `incomes`, `loans`).
   - Active la sécurité Row Level Security (RLS) et les clés étrangères.
   - Insère les 7 catégories par défaut.
   - Configure le déclencheur de création automatique de profil à l'inscription.
   *(Copiez tout le contenu, collez dans le SQL Editor, cliquez sur **Run**)*.

2. **[`20261017000001_add_recurring_planned_expenses.sql`](file:///h:/PROJET/Asoro/supabase/migrations/20261017000001_add_recurring_planned_expenses.sql)** :
   - Ajoute le support des dépenses récurrentes (`is_recurring`) et son index de performance.
   *(Copiez tout le contenu, collez dans le SQL Editor, cliquez sur **Run**)*.

3. **[`20261017000002_add_admin_and_moderation.sql`](file:///h:/PROJET/Asoro/supabase/migrations/20261017000002_add_admin_and_moderation.sql)** :
   - Ajoute les rôles (`user` / `admin`), le statut (`active`, `suspended`, `banned`), et l'email.
   - Crée la fonction de sécurité `is_admin()` et les politiques d'accès administrateur.
   *(Copiez tout le contenu, collez dans le SQL Editor, cliquez sur **Run**)*.

*(Astuce : Vous pouvez également coller les 3 fichiers l'un après l'autre dans la même requête SQL et cliquer sur **Run** en une seule fois !)*

---

### Étape 3 : Récupérer vos identifiants de projet
1. Dans le menu de gauche de Supabase, cliquez sur **Project Settings** (l'icône d'engrenage), puis sur **API** (ou cliquez sur le bouton **« Connect »** en haut à droite).
2. Repérez :
   - **Project URL** (ex: `https://xyzcompany.supabase.co`)
   - **Project API keys** -> la clé **`Publishable key`** (ou `anon` / `public`)
3. Créez un fichier `.env.local` à la racine de votre projet en copiant `.env.example` et renseignez vos valeurs :
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://xyzcompany.supabase.co
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=votre-cle-ici
   ```
4. Ce fichier `.env.local` reste uniquement sur votre ordinateur et n'est jamais envoyé sur Git (conforme à nos règles de sécurité).
