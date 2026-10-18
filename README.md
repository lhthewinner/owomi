# Owomi — Gestion de Budget Personnel

> **Sache où part ton argent, chaque jour.**  
> Note chaque achat en 5 secondes. En fin de journée, de semaine ou de mois, vois ce que tu as dépensé, gagné en plus de ton salaire, et ce qu'il te reste.

---

## 🌟 Présentation

**Owomi** est une application web et mobile installable (**PWA - Progressive Web App**) conçue pour reprendre le contrôle de ses finances simplement, sans jargon bancaire ni interface complexe. 

Pensée pour le quotidien (salariés, indépendants, étudiants), elle permet de suivre ses dépenses, ses revenus et ses prêts, aussi bien en ligne que **totalement hors ligne**.

---

## ✨ Fonctionnalités clés

- **⚡ Saisie rapide en 5 secondes** : Pavé tactile optimisé, catégories visuelles et date préremplie.
- **📱 PWA 100 % Hors Ligne** : Saisissez vos achats même sans connexion Internet. Vos données sont synchronisées automatiquement et sans doublon dès le retour du réseau (IndexedDB via Dexie).
- **📊 Bilan clair et instantané** : Visualisez vos finances selon 5 périodes :
  - **Jour** : Dépensé aujourd'hui, reste disponible.
  - **Semaine** (lundi à dimanche) : Suivi du rythme de la semaine.
  - **Mois** : Reste du mois prenant en compte le salaire mensuel.
  - **Semestre (6 mois)** & **Année (1 an)** : Évolution annuelle et économies cumulées.
- **🎯 Dépenses prévues & Règlements échelonnés** : Budgétez vos postes à l'avance (ex. transport, loyer). Les règlements se déduisent progressivement et tout surplus éventuel est automatiquement reclassé en dépense imprévue.
- **🔄 Dépenses récurrentes** : Reconduction automatique chaque mois pour le loyer, abonnements et charges fixes, avec ajustement du montant possible en début ou fin de période.
- **🤝 Gestion des prêts** : Prêts accordés ou emprunts reçus, intégrés au solde avec tolérance du solde négatif.
- **🌍 Multi-devises** : Support natif du **FCFA**, **Euro (€)**, **Dollar ($)** et **Naira (₦)**, mémorisé dans le profil.
- **🔒 Sécurité & Confidentialité bancaire** :
  - Sécurité des données garantie par **Row Level Security (RLS)** sur PostgreSQL : chaque utilisateur n'accède qu'à ses propres données.
  - Verrouillage local par **Code PIN à 4 chiffres** avec protection anti-brute force.
  - Suppression complète et irréversible du compte et de ses données en un clic.
- **🛡️ Espace Administrateur sécurisé** : Supervision globale de la communauté, statistiques anonymes d'usage et modération des comptes (activation, suspension, bannissement) **sans aucun accès aux finances des utilisateurs**.

---

## 🛠️ Stack technique

- **Frontend** : Next.js 15 (App Router, Server Actions), React 19, TypeScript (mode strict).
- **Styles & Design** : Tailwind CSS, Thèmes clair et sombre natifs, Lucide Icons.
- **Base de données & Auth** : Supabase (PostgreSQL 15, Row Level Security, Supabase Auth).
- **Hors ligne (Offline-First)** : Service Worker PWA, IndexedDB avec Dexie.
- **Validation** : Zod.
- **Tests** : Vitest (89 tests unitaires et d'intégration validés).

---

## 🚀 Démarrage rapide en local

### 1. Cloner le projet et installer les dépendances
```bash
git clone https://github.com/<votre-pseudo>/owomi.git
cd owomi
npm install
```

### 2. Configurer les variables d'environnement
Créez un fichier `.env.local` à la racine en copiant `.env.example` :
```env
NEXT_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=votre-cle-publique
```

### 3. Installer la base de données Supabase
Copiez et exécutez les scripts SQL situés dans `supabase/migrations/` dans l'éditeur SQL de votre projet Supabase (voir [`supabase/README.md`](supabase/README.md)).

### 4. Lancer le serveur de développement
```bash
npm run dev
```
L'application est accessible sur [http://localhost:3000](http://localhost:3000).

---

## 🧪 Tests et Qualité

Pour exécuter la suite de tests automatisés :
```bash
npm run test
```

Pour vérifier la conformité TypeScript et le build de production :
```bash
npm run build
```

---

## 📖 Documentation complémentaire

- [Guide de déploiement en ligne (Vercel & Supabase)](DEPLOYMENT.md)
- [Guide d'installation de la base de données](supabase/README.md)
- [Cahier des charges complet & Feuille de route](cahier-des-charges.md)

---

## 📄 Licence

Ce projet est sous licence MIT.
