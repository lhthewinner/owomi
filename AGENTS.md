# Règles pour l'agent de développement

Tu construis une application web et mobile (PWA) de gestion de budget personnel. Ce fichier fixe ta façon de travailler. Il complète deux documents que tu dois lire avant toute chose :

- le **cahier des charges** : source de vérité sur le quoi (fonctions, règles métier, user stories) ;
- la **maquette** `maquette-budget.html` : référence visuelle et de comportement.

## 1. Sources et priorités

1. En cas de contradiction entre ces documents et tes idées, **les documents gagnent**.
2. En cas de contradiction entre le cahier des charges et la maquette, **le cahier des charges gagne**.
3. Si un point est absent ou ambigu, **pose la question avant de coder**. Ne devine pas.
4. Ne construis **rien qui soit hors du MVP** (voir section « Périmètre » du cahier des charges). Pas de fonctionnalité « bonus », même utile.
5. Les décisions marquées « ouvertes » dans le cahier des charges suivent la recommandation indiquée, sauf instruction contraire.

## 2. Méthode de travail

- **Plan d'abord** : avant chaque lot, écris en quelques lignes ce que tu vas faire et attends mon accord.
- **Un lot à la fois**, petit et terminé, plutôt que beaucoup de choses à moitié faites.
- **Pas de modification hors du lot en cours.** Si tu vois un problème ailleurs, signale-le sans y toucher.
- **Avant d'ajouter une dépendance**, demande. Privilégie ce qui est déjà dans la stack.
- **Avant d'utiliser une API ou une bibliothèque**, vérifie sa documentation officielle actuelle : ne te fie pas à ta mémoire, les versions changent.
- **Explique en français simple**, sans jargon inutile. Je ne suis pas développeur.

## 3. Stack imposée

- Next.js (App Router) avec TypeScript en mode strict
- Tailwind CSS
- Supabase : PostgreSQL et authentification par email et mot de passe
- PWA : service worker et IndexedDB (avec Dexie) pour le hors ligne
- Validation des données avec Zod
- Tests avec Vitest
- Hébergement prévu : Vercel et Supabase (offres gratuites)

Toute autre technologie demande mon accord.

## 4. Règles de code

- Noms de variables, fonctions, fichiers et tables de base **en anglais**. Textes affichés à l'utilisateur et commentaires **en français**.
- Interdit : le type `any`, le code mort, les `console.log` laissés, les valeurs magiques (mets-les en constantes).
- Un composant = une responsabilité. Si un fichier dépasse environ 200 lignes, découpe-le.
- Tout le texte affiché passe par un seul endroit (fichier de textes), pour pouvoir traduire plus tard.
- Tout accès à la base passe par une couche dédiée, jamais directement depuis les composants d'affichage.
- **Les calculs du bilan vivent dans un seul module**, testé. Aucun calcul de solde ou de total ailleurs dans l'interface.
- Chaque entrée utilisateur est validée côté client **et** côté serveur.
- Les erreurs sont gérées : message clair pour l'utilisateur, détail technique dans les journaux, jamais d'écran blanc.

## 5. Invariants métier (à ne jamais casser)

- Les montants sont stockés en **nombres entiers**, jamais en décimaux flottants.
- Une dépense est « imprévue » quand elle n'a **aucun lien** vers une dépense prévue. Ce n'est pas un champ à cocher.
- Le **solde peut être négatif** : ne bloque jamais une opération pour cette raison.
- La semaine va du **lundi au dimanche**.
- « Aujourd'hui » et « minuit » se calculent selon le **fuseau horaire de l'utilisateur**, pas celui du serveur.
- Supprimer une dépense prévue ne supprime pas ses règlements : ils deviennent imprévus.

## 6. Sécurité (priorité absolue : ce sont des données financières)

- **Aucun secret dans le code** : clés, mots de passe et jetons vont dans des variables d'environnement. Le fichier `.env` n'est jamais versionné ; fournis un `.env.example` sans valeurs.
- **Row Level Security activée sur toutes les tables** Supabase, avec une règle « un utilisateur ne voit et ne modifie que ses propres lignes ». Une table sans règle est un bug bloquant.
- La clé `service_role` n'est **jamais** envoyée au navigateur.
- Les mots de passe sont gérés uniquement par Supabase Auth : ne les stocke, ne les affiche et ne les journalise jamais.
- La règle de mot de passe (6 caractères minimum avec majuscule, minuscule, chiffre et caractère spécial) est vérifiée à l'inscription **côté client et côté serveur**.
- Message de connexion unique : « email ou mot de passe incorrect », sans dire lequel des deux est faux.
- **Aucune donnée financière dans les journaux**, ni dans les messages d'erreur, ni envoyée à un service tiers.
- La suppression d'un compte efface **toutes** les données liées (en base et sur l'appareil).
- Ajoute les en-têtes de sécurité usuels et ne désactive jamais une protection pour « faire marcher » un test.

## 7. Hors ligne (PWA)

- Chaque opération reçoit un **identifiant unique généré sur l'appareil** (UUID), pour éviter les doublons à l'envoi.
- Les opérations saisies sans réseau sont **mises en file d'attente** localement et envoyées automatiquement au retour du réseau, de façon **répétable sans doublon**.
- Un bandeau indique l'état : hors ligne, X opérations en attente, synchronisé.
- En cas de conflit, la **dernière modification gagne** (date de dernière modification).
- Les données locales sont **effacées à la déconnexion** et à la suppression du compte.
- Ne perds jamais une opération en attente : en cas d'échec d'envoi, elle reste dans la file.

## 8. Interface et accessibilité

- **Mobile d'abord**, puis adaptation aux grands écrans.
- Couleurs, typographie et espacements de la maquette : déclare-les **une seule fois** comme variables de thème (clair et sombre), jamais en dur dans les composants.
- Le mode sombre doit marcher dès le départ.
- Zones tactiles d'au moins 44 px ; contrastes conformes WCAG AA ; chaque champ a une étiquette ; navigation au clavier possible.
- Les montants s'affichent avec des **chiffres de largeur fixe** et le séparateur de milliers français.
- **Chaque écran gère ses trois états** : chargement, vide (message soigné) et erreur.
- Une seule bibliothèque d'icônes, cohérente (pas d'emojis dans l'interface finale).
- Ton des textes : simple, bienveillant, sans culpabiliser (voir principes UX du cahier des charges).

## 9. Tests et qualité

- Chaque règle de calcul du bilan a des **tests unitaires**, dont les cas limites :
  - solde négatif ;
  - semaine à cheval sur deux mois ;
  - opération juste avant et juste après minuit, selon le fuseau ;
  - dépense prévue réglée en plusieurs fois, soldée, dépassée ;
  - suppression d'une dépense prévue ayant des règlements ;
  - période sans aucune donnée.
- Les parcours principaux sont testés à la main avant d'annoncer qu'un lot est terminé : inscription, connexion, ajout d'une dépense, bilan, passage hors ligne puis retour du réseau.
- Le lint, la vérification des types et la compilation doivent **passer sans erreur**.

## 10. Définition de « terminé »

Un lot n'est terminé que si **toutes** ces conditions sont vraies :

1. Les critères d'acceptation des user stories du lot sont satisfaits, un par un.
2. Les tests passent et le projet compile.
3. Les cas vide, chargement et erreur sont gérés.
4. Aucune règle de sécurité (section 6) n'est violée.
5. Le rendu correspond à la maquette, en clair et en sombre.
6. Tu as exécuté le code toi-même : **n'affirme jamais que ça marche sans l'avoir vérifié**.

## 11. Git

- Une branche par lot, des commits petits avec un message clair en français (« ajoute la saisie rapide d'une dépense »).
- Jamais de commit contenant un secret, jamais de `push --force`.
- Les changements de base de données passent par des **migrations versionnées**, jamais par des modifications manuelles.

## 12. Communication à la fin de chaque lot

Réponds toujours avec :

1. **Ce qui est fait** (en 3 à 5 lignes, en français simple) ;
2. **Comment je peux le tester** (étapes précises) ;
3. **Ce qui reste ou ce qui t'inquiète** (doutes, hypothèses, points à valider) ;
4. **Ta proposition de lot suivant**.

Si tu es bloqué, dis pourquoi et propose deux options. N'invente jamais de données, de chiffres ou de résultats de test.

## 13. Interdits

- Supprimer ou réinitialiser des données sans ma confirmation explicite.
- Ajouter du suivi, des statistiques ou des services tiers non prévus.
- Contourner la sécurité (RLS, validation) pour aller plus vite.
- Toucher aux fichiers de configuration de déploiement sans me prévenir.
- Réécrire de gros morceaux déjà validés sans que je l'aie demandé.

## 14. Ordre de réalisation

| Lot | Contenu |
| --- | --- |
| 0 | Mise en place du projet, thème (couleurs clair et sombre), structure, variables d'environnement |
| 1 | Base de données, migrations et Row Level Security |
| 2 | Authentification : inscription, connexion, mot de passe oublié, déconnexion, suppression du compte |
| 3 | Dépenses, revenus hors salaire, salaire et prêts |
| 4 | Dépenses prévues et règlements en plusieurs fois |
| 5 | Module de calcul du bilan, bilan et tableau de bord |
| 6 | Historique et profil |
| 7 | PWA et mode hors ligne |
| 8 | Finitions : accessibilité, états vides et erreurs, performance |
| 9 | Déploiement et vérification finale de sécurité |

Ne commence un lot qu'après validation du précédent.
