/**
 * Fichier unique de textes de l'application (en français).
 * Conforme à la règle 4 d'AGENTS.md : centralise tous les textes pour permettre
 * une traduction future sans toucher au code d'affichage.
 */

export const content = {
  app: {
    name: "Asoro",
    baseline: "Sache où part ton argent, chaque jour.",
    description:
      "Note chaque achat en 5 secondes. En fin de journée ou de semaine, vois ce que tu as dépensé, gagné en plus de ton salaire, et ce qu'il te reste.",
    currencyDefault: "FCFA",
  },
  welcome: {
    title: "Sache où part",
    titleHighlight: "argent",
    titleEnd: ", chaque jour.",
    previewLabel: "Bilan du jour",
    previewTag: "Aujourd'hui",
    previewSpentLabel: "Dépensé",
    previewGainedLabel: "Gagné",
    btnSignup: "Créer un compte",
    btnLogin: "J'ai déjà un compte",
    offlineNotice: "Saisie disponible même sans connexion internet.",
  },
  auth: {
    signupTitle: "Créer un compte",
    loginTitle: "Content de vous revoir",
    subtitle: "Avec une adresse email et un mot de passe.",
    tabSignup: "Inscription",
    tabLogin: "Connexion",
    fieldName: "Nom",
    placeholderName: "Votre nom",
    fieldFirstname: "Prénom",
    placeholderFirstname: "Votre prénom",
    fieldEmail: "Adresse email",
    placeholderEmail: "prenom@gmail.com",
    fieldPassword: "Mot de passe",
    placeholderPassword: "Choisissez un mot de passe",
    placeholderPasswordLogin: "Votre mot de passe",
    forgotPasswordLink: "Mot de passe oublié ?",
    btnSubmitSignup: "Créer mon compte",
    btnSubmitLogin: "Se connecter",
    forgotTitle: "Mot de passe oublié",
    forgotSubtitle:
      "Saisissez votre adresse email : nous vous envoyons un lien à usage unique pour choisir un nouveau mot de passe.",
    btnSendResetLink: "Envoyer le lien",
    pwRules: {
      minLength: "6 caractères minimum",
      uppercase: "Une majuscule",
      lowercase: "Une minuscule",
      number: "Un chiffre",
      special: "Un caractère spécial",
    },
    errors: {
      allFieldsRequired: "Tous les champs sont obligatoires.",
      invalidEmail: "Format d'adresse email invalide.",
      invalidCredentials: "Email ou mot de passe incorrect.",
      emailNotVerified: "Veuillez valider votre adresse email avant de vous connecter.",
      passwordRuleFailed: "Le mot de passe ne respecte pas tous les critères de sécurité.",
      emailAlreadyUsed: "Cette adresse email est déjà utilisée.",
      rateLimitExceeded: "Trop de tentatives. Veuillez patienter un instant avant de réessayer.",
    },
    success: {
      signupConfirmationSent:
        "Compte créé avec succès ! Un lien de confirmation a été envoyé à votre adresse email. Veuillez cliquer dessus pour activer votre compte avant de vous connecter.",
      resetLinkSent:
        "Si cette adresse est enregistrée, un lien de réinitialisation vous a été envoyé par email.",
      accountDeleted:
        "Votre compte et toutes vos données ont été définitivement supprimés.",
    },
    deleteAccount: {
      button: "Supprimer mon compte et mes données",
      confirmTitle: "Supprimer définitivement votre compte ?",
      confirmWarning:
        "Cette action est irréversible. Toutes vos données (dépenses, revenus, prêts et bilans) seront définitivement effacées du serveur et de votre appareil.",
      confirmButton: "Confirmer la suppression définitive",
      cancelButton: "Annuler",
    },
  },
  sync: {
    offline: "Hors ligne",
    pendingOps: (count: number) =>
      count === 1 ? "1 opération en attente" : `${count} opérations en attente`,
    synced: "Synchronisé",
    syncSuccess: "Toutes vos opérations sont enregistrées.",
  },
  dashboard: {
    greeting: (name: string) => `Bonjour, ${name} 👋`,
    restLabel: "Reste ce mois-ci",
    negativeAlert: "Solde négatif : simple alerte, rien n'est bloqué",
    positiveFormula: "Salaire + gains + prêts − dépenses",
    spentToday: "Dépensé aujourd'hui",
    gainedToday: "Gagné hors salaire (jour)",
    spentWeek: "Dépensé cette semaine",
    gainedWeek: "Gagné hors salaire (sem.)",
    viewDayBalance: "📊 Voir le bilan du jour",
    recentOps: "Dernières opérations",
    viewAll: "Tout voir",
    emptyOpsTitle: "Aucune opération pour l'instant.",
    emptyOpsSubtitle: "Appuyez sur + pour commencer.",
  },
  nav: {
    home: "Accueil",
    balance: "Bilan",
    history: "Historique",
    budget: "Budget",
    add: "Ajouter",
  },
  common: {
    back: "Retour",
    close: "Fermer",
    loading: "Chargement en cours...",
    errorTitle: "Une erreur est survenue",
    errorRetry: "Réessayer",
  },
} as const;

export type AppContent = typeof content;
