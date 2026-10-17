# Guide de déploiement en ligne d'Asoro (Vercel & Supabase)

Ce guide pas-à-pas vous explique comment mettre **Asoro** en ligne gratuitement pour que vous puissiez l'utiliser sur votre téléphone et le partager avec d'autres personnes.

---

## Prérequis

1. Un compte [GitHub](https://github.com) (gratuit) contenant votre code.
2. Un compte [Supabase](https://supabase.com) (gratuit).
3. Un compte [Vercel](https://vercel.com) (gratuit).

---

## Étape 1 : Préparer la base de données sur Supabase

1. Connectez-vous sur [supabase.com](https://supabase.com) et cliquez sur **« New Project »**.
2. Remplissez les informations :
   - **Name** : `asoro`
   - **Database Password** : choisissez un mot de passe sécurisé (notez-le précieusement).
   - **Region** : choisissez la région la plus proche de chez vous (ex: *Frankfurt* ou *London* pour l'Afrique de l'Ouest et l'Europe).
   - **Plan** : Free (Gratuit).
3. Cliquez sur **« Create new project »** et attendez 1 minute que la base soit prête.

### Appliquer les tables et la sécurité :
4. Dans le menu de gauche de Supabase, cliquez sur l'icône **SQL Editor** (l'icône d'invite de commande).
5. Cliquez sur **« New query »**.
6. Ouvrez le fichier de migration de votre projet situé ici :
   [`supabase/migrations/20261017000000_init_schema.sql`](./supabase/migrations/20261017000000_init_schema.sql)
7. Copiez l'intégralité du contenu et collez-le dans l'éditeur Supabase.
8. Cliquez sur le bouton vert **« Run »** en bas à droite.
   - Vous verrez le message *« Success. No rows returned »*. Toutes les 6 tables, les contraintes, les 7 catégories de départ et la sécurité Row Level Security (RLS) sont désormais actives !

### Récupérer vos 2 clés d'accès :
9. Dans le menu de gauche, cliquez sur l'icône **Project Settings** (roue crantée tout en bas) puis sur **« API »**.
10. Notez les deux valeurs suivantes :
    - **Project URL** (ex: `https://xyzcompany.supabase.co`)
    - **Project API keys > anon / public** (une longue chaîne de caractères commençant souvent par `eyJ...`)

> [!IMPORTANT]
> Ne partagez jamais votre clé `service_role`. Vous n'avez besoin que de la clé `anon` (publique).

---

## Étape 2 : Mettre en ligne l'application sur Vercel

1. Connectez-vous sur [vercel.com](https://vercel.com) en choisissant **« Continue with GitHub »**.
2. Sur votre tableau de bord Vercel, cliquez sur le bouton bleu **« Add New... »** puis **« Project »**.
3. Dans la liste de vos dépôts GitHub, trouvez votre projet **Asoro** et cliquez sur **« Import »**.
4. Dans la page de configuration qui s'affiche :
   - **Framework Preset** : Next.js (détecté automatiquement).
   - **Root Directory** : `./` (laisser par défaut).
5. Déroulez la section **« Environment Variables »** et ajoutez les 2 variables notées à l'étape 1 :
   - **Key** : `NEXT_PUBLIC_SUPABASE_URL`
     - **Value** : votre URL Supabase (ex: `https://xyzcompany.supabase.co`)
   - **Key** : `NEXT_PUBLIC_SUPABASE_ANON_KEY`
     - **Value** : votre clé `anon` Supabase
6. Cliquez sur le gros bouton bleu **« Deploy »**.
7. Attendez environ 1 à 2 minutes pendant que Vercel compile et déploie le projet.
8. Un feu d'artifice apparaît : **votre application est en ligne !** Vercel vous donne son adresse officielle (ex: `https://asoro.vercel.app`).

---

## Étape 3 : Installer l'application sur votre smartphone (PWA)

### Sur Android (Google Chrome) :
1. Ouvrez l'adresse de votre site (ex: `https://asoro.vercel.app`) dans Chrome.
2. Un bandeau ou une icône en haut à droite vous propose **« Installer l'application »** ou cliquez sur les 3 petits points verticaux puis sur **« Ajouter à l'écran d'accueil »**.
3. L'icône Asoro apparaît sur l'écran de votre téléphone comme une véritable application mobile.

### Sur iPhone (Safari) :
1. Ouvrez l'adresse de votre site dans Safari.
2. Appuyez sur le bouton de partage en bas (carré avec une flèche vers le haut).
3. Faites défiler vers le bas et appuyez sur **« Sur l'écran d'accueil »**.
4. Appuyez sur **« Ajouter »**.

---

## Étape 4 : Vérification de bon fonctionnement

1. **Inscription** : créez un premier compte avec votre adresse email.
2. **Confirmez votre email** si l'option est activée sur votre projet Supabase.
3. **Première dépense** : cliquez sur le gros bouton **+** et ajoutez une dépense.
4. **Test hors ligne** : passez votre téléphone en Mode Avion, ajoutez une dépense (le bandeau indique *« Hors ligne »*), puis retirez le Mode Avion (l'opération se synchronise automatiquement !).
