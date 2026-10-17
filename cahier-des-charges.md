# Cahier des charges — Application de gestion de budget personnel

Version 1.2 · Extension du périmètre avec Vues Semestre/Année, Multi-devises étendu, Dépenses récurrentes ajustables et Espace Administrateur · @Lucien

---

## 1. Vision et pitch

L'application permet à n'importe qui de noter chaque dépense en quelques secondes, puis d'obtenir en fin de journée, de semaine ou de mois un bilan clair : ce qui a été dépensé, ce qui a été gagné en plus du salaire, et ce qui a été économisé. L'utilisateur peut aussi y enregistrer un prêt : son solde final peut alors être négatif.

**Pitch.** Beaucoup de gens ne savent pas où part leur argent. Cette application web et mobile leur permet de saisir chaque achat au moment où il a lieu, de distinguer ce qui était prévu de ce qui ne l'était pas, et d'enregistrer les revenus qui s'ajoutent au salaire. À minuit, ou à tout moment sur demande, elle calcule le bilan de la journée ou de la semaine. À terme, un assistant IA permettra de saisir une dépense en langage naturel (« taxi 1 500 »), à l'écrit ou à la voix.

### Objectifs du produit
- Saisir une dépense en moins de 5 secondes.
- Pouvoir saisir une dépense même sans connexion.
- Lire son bilan en trois chiffres : dépensé, gagné hors salaire, économisé. Le solde peut être négatif, par exemple en cas de prêt.
- Rester ouvert à tous : inscription avec une adresse email valide (Gmail conseillé) et un mot de passe de 6 caractères minimum, contenant une majuscule, une minuscule, un chiffre et un caractère spécial. Pour le moment, pas de connexion avec Google.

**Origine du projet.** Idée née pour un usage personnel, devenue une application ouverte à tous les utilisateurs.

---

## 2. Utilisateurs cibles et rôles

L'application s'adresse à toute personne qui veut suivre son argent sans outil compliqué : salariés, étudiants, indépendants, avec un salaire mensuel et des gains occasionnels. Trois rôles sont prévus.

| Rôle | Description | Droits | Phase |
| --- | --- | --- | --- |
| **Visiteur** | Non connecté | Voir l'accueil, s'inscrire ou se connecter avec une adresse email valide et un mot de passe | Phase 1 (MVP) |
| **Utilisateur** | Connecté | Gérer ses propres dépenses, revenus, prêts et bilans ; modifier son profil ; supprimer son compte | Phase 1 (MVP) |
| **Administrateur** | Gère la plateforme | Statistiques anonymes globales et modération des comptes (activation, suspension et bannissement d'un utilisateur) ; voit le nom et l'email des utilisateurs ; **aucun accès à leurs données financières** (montants et opérations strictement protégés par RLS) | Phase 1 (Enrichie) |

**Sécurité et confidentialité du rôle Administrateur.** L'administrateur gère les comptes (activation, suspension, bannissement) et voit le nom et l'email des utilisateurs, mais **jamais** leurs données financières : pour une application de finances personnelles, un accès complet crée un risque de confiance et viole le RGPD.

---

## 3. Règles métier

Une dépense est « imprévue » par défaut : seule la création préalable d'une dépense prévue la rend « prévue ». Une dépense prévue se règle en plusieurs fois, et toutes les autres règles en découlent.

| Notion | Règle |
| --- | --- |
| **Salaire mensuel ou revenu** | Saisi une fois, il revient chaque mois mais peut être modifié. Il n'est pas découpé par jour. |
| **Autres revenus** | Argent gagné ponctuellement hors salaire (date, montant, source), saisi à part. |
| **Prêt** | L'utilisateur peut enregistrer un prêt. Il est compté dans le solde, qui peut devenir négatif : l'application ne bloque jamais une opération parce que le solde serait négatif. Sens du prêt à confirmer (voir décisions ouvertes). |
| **Dépense prévue** | On peut prévoir une dépense au début du mois, de la semaine ou du jour. Elle est créée à l'avance avec un nom, un montant prévu, une catégorie et une période (jour, semaine ou mois). |
| **Dépense récurrente** | Une dépense prévue peut être marquée comme récurrente. Elle se reconduit automatiquement à chaque période (ex: chaque mois pour le loyer), avec possibilité pour l'utilisateur de modifier ou d'ajuster son montant en début ou en fin de mois. |
| **Dépense imprévue** | Toute dépense saisie sans être rattachée à une dépense prévue. Aucune case à cocher. |
| **Régler une dépense prévue en plusieurs fois** | Une dépense prévue n'est pas forcément soldée d'un seul coup. Exemple : 10 000 F prévus pour le transport dans le mois ; l'utilisateur saisit 500 F un lundi, 2 000 F le lendemain, et chaque montant se déduit des 10 000 F prévus. Chaque règlement est une dépense rattachée, à sa date. Le même principe vaut pour toutes les dépenses prévues. |
| **Reste à dépenser** | Montant prévu moins la somme des règlements rattachés. Supprimer un règlement le remet dans le reste. |
| **Statut d'une dépense prévue** | À venir (aucun règlement), en cours (règlements partiels), soldée (reste nul ou marquée soldée par l'utilisateur), dépassée (règlements supérieurs au montant prévu). |
| **Date d'une opération** | Date du jour par défaut, modifiable : on peut saisir le soir les achats de la journée. |
| **Total dépensé** | Dépenses rattachées à une dépense prévue + dépenses imprévues de la période. |
| **Solde du jour ou de la semaine** | Autres revenus − total dépensé, prêts compris (voir décisions). Le salaire est exclu. |
| **Économies du mois, semestre ou année** | Salaire + autres revenus − total dépensé, prêts compris. Peut être négatif. |
| **Semaine** | Du lundi au dimanche. |
| **Fin de journée** | À 00h, selon le fuseau de l'utilisateur, le bilan du jour est arrêté et reste consultable. Le bilan peut aussi être demandé à tout moment : il est calculé en direct. |

---

## 4. Périmètre

Le projet se structure en phases claires pour livrer un outil complet tout en gardant une exécution maîtrisée.

| Phase | Contenu |
| --- | --- |
| **Phase 1 (Actuelle & Enrichie)** | **Cœur MVP** : Inscription et connexion par email et mot de passe, mot de passe oublié, déconnexion, suppression de compte ; tableau de bord (reste du mois, dépensé et gagné du jour et de la semaine, dernières opérations) ; saisie rapide d'une dépense ; dépenses prévues par jour, semaine ou mois, réglées en plusieurs fois ; salaire modifiable et autres revenus ; prêts ; bilan jour, semaine, mois ; historique filtrable ; profil (devise, thème) ; saisie hors ligne PWA.<br>**Extensions actuelles validées** :<br>1. **Vues Semestre (6 mois) et Année (1 an)** dans le Bilan.<br>2. **Choix de devises étendu** dans le profil (FCFA, EUR, USD, CAD, GBP, GNF, MAD).<br>3. **Dépenses récurrentes & Reconduction automatique** avec ajustement possible du montant en début ou fin de mois.<br>4. **Espace Administrateur sécurisé** : gestion des comptes (activation, suspension, bannissement) et statistiques globales anonymes (sans accès aux finances des utilisateurs). |
| **V1.1** | Notification de fin de journée ; rappel « rien saisi aujourd'hui » ; export PDF du bilan ; synchronisation complète entre plusieurs appareils et gestion des conflits ; historique des salaires ; suivi des remboursements de prêts. |
| **V2** | Assistant IA de saisie en langage naturel, à l'écrit et à la voix ; connexion Google en option ; budgets plafonds et alertes de dépassement par catégorie ; rapports automatiques par email ; import CSV / Excel ; application mobile native (Play Store & App Store). |
| **Hors périmètre** | Connexion automatique aux comptes bancaires ; paiement ou transfert d'argent ; conseil financier personnalisé ; budgets partagés entre plusieurs personnes. |

---

## 5. User stories du MVP

Le MVP compte 21 stories, chacune avec des critères d'acceptation testables ; la story unique « gérer revenus, dépenses et rapport » de la première version a été découpée.

| ID | User story | Critères d'acceptation |
| --- | --- | --- |
| **A1** | En tant que visiteur, je m'inscris avec mon nom, mon prénom, mon adresse email et un mot de passe. | Tous les champs sont obligatoires ; l'email a un format valide et n'est pas déjà utilisé ; le mot de passe fait 6 caractères minimum avec une majuscule, une minuscule, un chiffre et un caractère spécial, règles affichées en direct ; compte créé avec envoi d'un email de confirmation ; la connexion est bloquée tant que l'email n'a pas été validé ; messages d'erreur précis. |
| **A2** | En tant qu'utilisateur, je me connecte avec mon email et mon mot de passe. | Connexion réussie si les identifiants sont corrects et l'email validé ; si l'email n'est pas encore validé, accès bloqué avec message explicite invitant à confirmer son adresse ; en cas d'erreur d'identifiants, message unique « email ou mot de passe incorrect » ; session ouverte jusqu'à la déconnexion ou son expiration. |
| **A3** | En tant qu'utilisateur, je réinitialise mon mot de passe oublié. | Un lien est envoyé par email ; il est à usage unique et expire ; le nouveau mot de passe respecte les mêmes règles qu'à l'inscription. |
| **A4** | En tant qu'utilisateur, je me déconnecte. | La session est fermée ; retour à l'accueil ; les pages privées ne sont plus accessibles. |
| **A5** | En tant qu'utilisateur, je supprime mon compte. | Confirmation explicite demandée ; toutes les données sont effacées ; action irréversible annoncée avant validation. |
| **T1** | En tant qu’utilisateur, je vois un tableau de bord dès ma connexion. | Affiche le reste du mois (salaire + gains + prêts − dépenses, négatif possible), le dépensé et le gagné hors salaire du jour et de la semaine, et les 5 dernières opérations ; un solde négatif s’affiche en ambre ; un bouton mène au bilan du jour ; état vide soigné sans donnée. |
| **D1** | En tant qu'utilisateur, je saisis une dépense en quelques secondes. | Montant obligatoire et supérieur à 0 ; catégorie et date du jour préremplies ; enregistrement en 3 actions maximum ; sans rattachement, la dépense est imprévue. |
| **D2** | En tant qu'utilisateur, je règle une dépense prévue en plusieurs fois. | Je rattache une dépense à une prévue non soldée ; le montant peut être inférieur au reste ; chaque règlement se déduit du montant prévu ; l'écran affiche prévu, dépensé et reste ; le statut se met à jour ; un dépassement est signalé sans être bloqué. |
| **D3** | En tant qu'utilisateur, je crée, modifie et supprime des dépenses prévues pour un jour, une semaine ou un mois. | Nom, montant prévu, catégorie, période et date de début obligatoires ; statut visible (à venir, en cours, soldée, dépassée) ; supprimer une prévue ne supprime pas les règlements déjà saisis, qui deviennent imprévus. |
| **D4** | En tant qu'utilisateur, je modifie ou supprime une dépense saisie. | Les totaux, le reste des prévues et le bilan sont recalculés immédiatement ; une confirmation est demandée avant suppression. |
| **R1** | En tant qu'utilisateur, je définis puis je modifie mon salaire mensuel. | Un montant ; appliqué à chaque mois ; modifiable à tout moment. |
| **R2** | En tant qu'utilisateur, j'ajoute un revenu hors salaire. | Montant supérieur à 0 ; source facultative ; date modifiable ; pris en compte dans le bilan. |
| **R3** | En tant qu'utilisateur, je modifie ou supprime un revenu hors salaire. | Bilan recalculé immédiatement ; confirmation avant suppression. |
| **L1** | En tant qu'utilisateur, j'enregistre un prêt. | Montant, personne ou organisme, date et sens obligatoires ; le prêt est compté dans le solde ; un solde négatif s'affiche en ambre, sans blocage. |
| **B1** | En tant qu'utilisateur, je vois mon bilan du jour, de la semaine ou du mois. | Affiche total dépensé, prévu et imprévu, gagné hors salaire, solde ou économies (négatifs possibles), détail par catégorie ; changement de période en moins d'une seconde ; état vide soigné sans donnée. |
| **B2** | En tant qu'utilisateur, je demande mon bilan à tout moment. | Le bilan inclut les opérations saisies à l'instant. |
| **B3** | En tant qu'utilisateur, je retrouve le bilan d'un jour passé. | Le bilan correspond aux opérations datées de ce jour ; une modification ultérieure d'une opération le met à jour. |
| **B4** | En tant qu'utilisateur, je consulte mon bilan sur 6 mois (semestre) ou 1 an (année). | Sélecteurs Semestre et Année disponibles ; calcul immédiat des totaux dépensé, gagné hors salaire, cumul des salaires et économies ; répartition par catégorie sur la période étendue. |
| **H1** | En tant qu'utilisateur, je consulte mon historique. | Liste groupée par jour ; filtres Tout, Dépenses, Revenus ; filtre par période et catégorie. |
| **P1** | En tant qu'utilisateur, je choisis mon thème (clair ou sombre). | Thème clair ou sombre mémorisé sur l'appareil et appliqué immédiatement. |
| **P2** | En tant qu'utilisateur, je choisis ma devise parmi la sélection disponible. | Choix parmi FCFA, EUR (€), USD ($) et Naira (₦) ; formatage instantané des montants avec symbole approprié dans toute l'interface sans rechargement. |
| **D5** | En tant qu'utilisateur, je définis une dépense prévue comme récurrente et j'ajuste son montant lors de sa reconduction. | Option « Récurrente » lors de la création d'une prévue mensuelle ; reconduction automatique à chaque début de période ; possibilité pour l'utilisateur de modifier et d'ajuster le montant au début ou à la fin de chaque mois. |
| **AD1** | En tant qu'administrateur, j'accède à un espace sécurisé de modération et de suivi. | Accès strictement réservé aux utilisateurs ayant le rôle `admin` ; consultation de la liste des comptes inscrits (nom, prénom, email, date d'inscription, statut) ; actions de modération (activer, suspendre, bannir) ; statistiques globales anonymes ; aucun accès aux montants financiers des utilisateurs (protection RLS stricte). |
| **G1** | En tant que visiteur, je comprends la promesse de l'application. | L'accueil présente la promesse en une phrase, un aperçu de bilan et les boutons Créer un compte et Se connecter. |
| **O1** | En tant qu’utilisateur, je saisis mes opérations sans connexion. | L’application s’ouvre sans internet une fois installée ; je peux ajouter, modifier et supprimer dépenses, revenus, prêts et règlements ; je consulte le tableau de bord, le bilan et l’historique avec les données présentes ; ma session reste ouverte hors ligne. |
| **O2** | En tant qu’utilisateur, mes opérations hors ligne sont envoyées automatiquement au retour du réseau. | Un bandeau indique « Hors ligne » et le nombre d’opérations en attente ; à la reconnexion, tout est envoyé sans action de ma part ; un message confirme la synchronisation ; en cas d’échec, les opérations restent en attente et rien n’est perdu. |

---

## 6. Écrans et navigation

Le périmètre couvre les écrans essentiels de l'application, organisés pour un usage mobile fluide et un affichage responsive sur ordinateur.

| Écran | Rôle | Contenu clé |
| --- | --- | --- |
| **Accueil visiteur** | Visiteur | Promesse, aperçu d'un bilan, boutons Créer un compte et Se connecter |
| **Inscription et connexion** | Visiteur | Formulaires nom, prénom, email, mot de passe avec règles affichées en direct |
| **Mot de passe oublié** | Visiteur | Saisie de l'email, envoi du lien, nouveau mot de passe |
| **Dashboard** | Utilisateur | Reste du mois (négatif possible), dépensé et gagné du jour et de la semaine, dernières opérations |
| **Ajout rapide** | Utilisateur | Fenêtre depuis le bas : clavier numérique, catégories, choix Dépense, Revenu, Prévue ou Prêt |
| **Bilan** | Utilisateur | Sélecteur Jour, Semaine, Mois, **Semestre (6 mois)**, **Année (1 an)** ; trois chiffres clés ; prévu contre imprévu ; graphique ; catégories ; bouton de rapport |
| **Historique** | Utilisateur | Opérations groupées par jour, filtrables, suppression |
| **Budget : dépenses prévues** | Utilisateur | Filtre jour, semaine, mois ; gestion des dépenses prévues récurrentes (loyer, abonnements) avec ajustement de montant ; prévu, dépensé, reste, progression, bouton Ajouter un règlement |
| **Budget : revenus et prêts** | Utilisateur | Salaire mensuel modifiable en haut, autres revenus, prêts |
| **Profil** | Utilisateur | Sélecteur de devise (FCFA, EUR, USD, Naira), thème, code PIN de sécurité, déconnexion, suppression du compte |
| **Espace Administrateur** | Administrateur | Tableau de bord réservé aux administrateurs : liste des utilisateurs inscrits, statut (actif, suspendu, banni), statistiques anonymes d'usage. |
| **Bandeau d’état de connexion** | Utilisateur | Visible sur tous les écrans connectés : Hors ligne, X opérations en attente, Synchronisé. |

---

## 7. Modèle de données

Le modèle de données assure l'intégrité et la séparation stricte des informations.

| Entité | Champs principaux | Remarque |
| --- | --- | --- |
| **Utilisateur / Profil** | id, nom, prénom, email, rôle (`user` ou `admin`), statut (`active`, `suspended`, `banned`), devise, fuseau horaire, thème, salaire mensuel, date de création | Le rôle `admin` donne accès à la modération sans jamais donner accès aux données financières d'autrui |
| **Catégorie** | id, nom, icône, utilisateur (vide si catégorie par défaut) | Sept catégories par défaut : Alimentation, Transport, Logement, Santé, Loisirs, Factures, Autre |
| **Dépense prévue** | id, utilisateur, nom, montant prévu, catégorie, période (jour, semaine ou mois), date de début, est_recurrente (booléen), identifiant local, date de dernière modification, statut de synchronisation | Si récurrente, reconduction automatique avec ajustement possible du montant |
| **Dépense** | id, utilisateur, montant, catégorie, date, note, dépense prévue (facultatif), identifiant local, date de dernière modification, statut de synchronisation (en attente ou envoyée) | Lien vide = imprévue |
| **Revenu hors salaire** | id, utilisateur, montant, source, date, identifiant local, date de dernière modification, statut de synchronisation (en attente ou envoyée) | Le salaire n'y figure pas |
| **Prêt** | id, utilisateur, sens, montant, personne ou organisme, date, note, identifiant local, date de dernière modification, statut de synchronisation (en attente ou envoyée) | Sens : argent prêté ou emprunté |

Les montants sont stockés en nombres entiers dans la plus petite unité de la devise, pour éviter les erreurs d'arrondi. Un mot de passe n'est jamais stocké en clair. Chaque ligne appartient à un seul utilisateur et n'est jamais lisible par un autre.

---

## 8. Design

Le design vise une saisie en moins de 5 secondes et un bilan lisible d'un coup d'œil, avec des couleurs qui portent un sens : vert pour les gains, orange pour les dépenses.

### Principes UX
- **Mobile d'abord** : l'usage principal se fait d'une main, en magasin ou dans la rue.
- **Montant d'abord**, le reste en option.
- **Trois chiffres dominants sur le bilan** : dépensé, gagné hors salaire, économisé.
- **Pas de culpabilisation** : économies en vert, alerte en ambre, rouge réservé aux vrais dépassements.
- **Mode sombre dès le départ**, car l'usage est fréquent le soir.
- **États vides soignés**, par exemple « Aucune dépense aujourd'hui, belle journée ! ».

### Palette recommandée (A en mode clair, B en mode sombre)

| Rôle | Mode clair | Mode sombre |
| --- | --- | --- |
| **Primaire** | #10B981 | #2DD4BF |
| **Primaire foncé** | #047857 | #14B8A6 |
| **Accent** | #6366F1 | #A78BFA |
| **Fond** | #F8FAFC | #0B1220 |
| **Cartes** | #FFFFFF | #151E32 |
| **Texte** | #0F172A | #E2E8F0 |
| **Gain** | #22C55E | #4ADE80 |
| **Dépense** | #F97316 | #FB923C |
| **Alerte** | #F59E0B | #FBBF24 |
| **Dépassement** | #EF4444 | #F87171 |

**Palette alternative C, « Sunny Africa »** (plus chaleureuse, si le public visé est africain) : vert forêt #166534, or #EAB308, terracotta #C2410C, fond #FFFBEB, texte #1C1917.

**Typographie.** Plus Jakarta Sans (ou Inter), avec chiffres tabulaires pour aligner les montants.

---

## 9. Exigences non fonctionnelles, sécurité et RGPD

Les données financières sont sensibles : la sécurité et la confidentialité passent avant toute fonctionnalité. Les cibles chiffrées sont des propositions à valider.

| Domaine | Exigence |
| --- | --- |
| **Authentification** | Email et mot de passe ; mots de passe hachés avec un algorithme dédié (bcrypt ou Argon2), jamais stockés en clair ; limitation des tentatives de connexion ; lien de réinitialisation à usage unique et à durée limitée |
| **Règle de mot de passe** | 6 caractères minimum avec une majuscule, une minuscule, un chiffre et un caractère spécial (règle retenue ; voir décision sur une longueur de 8) |
| **Sécurité générale** | HTTPS partout ; sessions sécurisées avec expiration ; données chiffrées au repos ; sauvegardes régulières |
| **Isolation** | Un utilisateur ne peut lire et modifier que ses propres données |
| **RGPD** | Consentement à l'inscription ; politique de confidentialité ; export des données ; suppression du compte avec effacement complet ; information claire que l'administrateur (V2) voit le nom des utilisateurs |
| **Performance** | Enregistrement d'une dépense en moins d'1 seconde ; ouverture de l'application en moins de 2 secondes sur une connexion mobile moyenne |
| **Accessibilité** | Contrastes conformes WCAG AA ; zones tactiles d'au moins 44 px ; navigation au clavier sur le web |
| **Hors ligne** | Saisie et consultation hors ligne dès le MVP, avec envoi différé au retour du réseau ; la première connexion, la création de compte et la réinitialisation du mot de passe exigent internet. |
| **Données locales** | Données stockées sur l’appareil protégées par la session ; effacées à la déconnexion et à la suppression du compte. |
| **Langue** | Français ; interface prête à être traduite |
| **Compatibilité** | Navigateurs récents ; iOS et Android via le navigateur (PWA) |

---

## 10. Plateforme et stack recommandées

Pour le MVP, une application web responsive installable (PWA) couvre « web et mobile » avec un seul code et un seul budget ; une application native peut suivre en V2 si l'usage le justifie. La stack ci-dessous est une proposition à confirmer.

| Couche | Proposition | Alternative |
| --- | --- | --- |
| **Interface** | Next.js (React, TypeScript) et Tailwind CSS | Vue avec Nuxt |
| **Serveur** | Routes API intégrées à Next.js | Node.js avec Express |
| **Base de données** | PostgreSQL | MySQL |
| **Authentification** | Email et mot de passe (Auth.js ou Supabase Auth) ; Google OAuth 2.0 en option plus tard | Firebase Auth |
| **Envoi d'emails** | Service transactionnel pour la réinitialisation et la vérification du mot de passe | Serveur SMTP du fournisseur d'hébergement |
| **Hébergement** | Vercel et Supabase | Serveur privé virtuel |
| **Mobile** | PWA installable | Flutter ou React Native en V2 |
| **Hors ligne** | PWA : service worker pour garder l’application sur l’appareil, base locale IndexedDB pour les opérations en attente | Application native en V2. |
| **Assistant IA (V2)** | API d'un modèle de langage pour transformer une phrase en dépense | Saisie vocale par reconnaissance vocale du téléphone ou du navigateur |

---

## 11. Indicateurs de succès

Le MVP réussit si les utilisateurs saisissent régulièrement et reviennent consulter leur bilan. Les cibles à trois mois sont des propositions à ajuster.

| Indicateur | Cible proposée |
| --- | --- |
| **Activation** : inscrits ayant saisi au moins 3 opérations le premier jour | 50 % |
| **Régularité** : opérations saisies par utilisateur actif et par semaine | 10 ou plus |
| **Rétention** : utilisateurs actifs la semaine suivant l'inscription | 30 % |
| **Vitesse** : temps médian de saisie d'une dépense | moins de 10 secondes |
| **Valeur** : bilans consultés par utilisateur actif et par semaine | 2 ou plus |

---

## 12. Décisions ouvertes

Seize points restent à trancher ; chacun a une recommandation par défaut que le document applique tant que vous n'avez pas décidé autrement.

| N° | Décision | Options | Recommandation |
| --- | --- | --- | --- |
| 1 | Marché de départ et devise par défaut | FCFA, euro, plusieurs | Une devise au choix de l'utilisateur, sans conversion |
| 2 | Nom de l'application | « Kopek » ou « Asoro » | Asoro retenu comme nom officiel |
| 3 | Palette | A et B, ou C | A en clair, B en sombre |
| 4 | Sens et traitement des prêts | Argent prêté (sortie), argent emprunté (entrée), les deux | Gérer les deux, comptés dans le solde, affichés à part des gains et dépenses courants ; solde négatif toujours autorisé |
| 5 | Adresses email acceptées | Gmail uniquement, ou toute adresse valide | Toute adresse valide acceptée (Gmail en suggestion principale) |
| 6 | Vérification de l'email à l'inscription | Oui ou non | Oui, validation obligatoire avant la première connexion pour pouvoir accéder à l'application |
| 7 | Longueur minimale du mot de passe | 6 caractères (règle actuelle), ou 8 | 8 caractères avec les mêmes autres règles ; 6 reste acceptable pour le MVP |
| 8 | Économies sur un jour ou une semaine | Gains moins dépenses, ou salaire réparti au prorata | Gains moins dépenses |
| 9 | Dépassement d'une dépense prévue | Refusé, ou autorisé et signalé | Autorisé et signalé en ambre ; l'excédent reste compté comme prévu |
| 10 | Supprimer une prévue déjà réglée en partie | Règlements deviennent imprévus, ou suppression interdite | Ils deviennent imprévus |
| 11 | Reconduire une dépense prévue au mois suivant | Duplication manuelle, ou reconduction automatique | Duplication manuelle en MVP, automatique en V2 |
| 12 | Changement de salaire et mois passés | Écraser, ou garder un historique | Écraser en MVP, historique en V1.1 |
| 13 | Rôle Administrateur | MVP ou V2 | V2 : gestion des comptes (suspension/bannissement), noms des utilisateurs et statistiques anonymes, sans données financières |
| 14 | Assistant IA, texte et voix | Intégré à l'application, ou agent séparé | Après le MVP, branché sur les données de l'application |
| 15 | Règle en cas de conflit entre deux appareils | Dernière modification gagne, ou demander à l’utilisateur | Dernière modification gagne |
| 16 | Hors ligne dès le MVP | MVP (version simple), ou tout en V1.1 | Version simple en MVP, complète en V1.1 |
