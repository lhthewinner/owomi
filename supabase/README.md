# Guide d'installation de la base de données Supabase (Lot 1)

Ce guide explique comment installer la base de données du projet **Asoro** sur votre compte Supabase gratuit en quelques minutes.

---

### Étape 1 : Créer votre projet Supabase (gratuit)
1. Rendez-vous sur [https://supabase.com](https://supabase.com) et connectez-vous.
2. Cliquez sur **« New Project »**.
3. Choisissez un nom (ex: `asoro-budget`), un mot de passe sécurisé pour la base, et la région la plus proche.

---

### Étape 2 : Exécuter le script de migration (en 1 clic)
1. Dans le menu de gauche de votre projet Supabase, cliquez sur l'icône **SQL Editor** (l'icône d'un terminal/feuille).
2. Cliquez sur **« New query »** (Nouvelle requête).
3. Ouvrez le fichier de migration de votre projet situé ici :
   [`supabase/migrations/20261017000000_init_schema.sql`](file:///h:/PROJET/Asoro/supabase/migrations/20261017000000_init_schema.sql)
4. Copiez l'intégralité du contenu du fichier et collez-le dans l'éditeur SQL de Supabase.
5. Cliquez sur le bouton vert **« Run »** en bas à droite.
6. Le message `Success. No rows returned` confirme que :
   - Les 6 tables (`profiles`, `categories`, `planned_expenses`, `expenses`, `incomes`, `loans`) sont créées.
   - Les 7 catégories par défaut sont enregistrées.
   - La sécurité RLS est activée sur chaque table.
   - L'automatisme de création de profil à l'inscription est actif.

---

### Étape 3 : Récupérer vos identifiants de projet
1. Dans le menu de gauche de Supabase, cliquez sur **Project Settings** (l'icône d'engrenage), puis sur **API**.
2. Repérez :
   - **Project URL** (ex: `https://xyzcompany.supabase.co`)
   - **Project API keys** -> la clé **`anon` / `public`**
3. Créez un fichier `.env.local` à la racine de votre projet en copiant `.env.example` et renseignez vos 2 valeurs :
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://xyzcompany.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
   ```
4. Ce fichier `.env.local` reste uniquement sur votre ordinateur et n'est jamais envoyé sur Git (conforme à nos règles de sécurité).
