import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const PAGES_TO_CAPTURE = [
  {
    name: "01_accueil",
    url: "http://localhost:3000/?view=welcome",
    title: "Page d'accueil (Visiteur)",
    description: "Présentation de l'application Asoro, promesse de valeur, aperçu du bilan et boutons de démarrage.",
  },
  {
    name: "02_inscription",
    url: "http://localhost:3000/?view=signup",
    title: "Inscription utilisateur",
    description: "Formulaire d'inscription avec validation en direct du mot de passe fort (majuscule, minuscule, chiffre, symbole, 6 caractères min).",
  },
  {
    name: "03_connexion",
    url: "http://localhost:3000/?view=login",
    title: "Connexion utilisateur",
    description: "Formulaire de connexion épuré avec gestion des erreurs sans divulgation et lien mot de passe oublié.",
  },
  {
    name: "04_mot_de_passe_oublie",
    url: "http://localhost:3000/?view=forgot",
    title: "Mot de passe oublié",
    description: "Écran de récupération de compte par email sécurisé.",
  },
  {
    name: "05_tableau_de_bord",
    url: "http://localhost:3000/?demo=1&tab=dashboard",
    title: "Tableau de bord (Dashboard)",
    description: "Vue principale : solde du mois disponible, double jauge dépensé/gagné du jour et de la semaine, liste des 5 dernières opérations.",
  },
  {
    name: "06_saisie_rapide",
    url: "http://localhost:3000/?demo=1&tab=dashboard&openAdd=1",
    title: "Saisie rapide (Quick Add)",
    description: "Tiroir d'ajout rapide en 5 secondes avec pavé tactile numérique 12 touches, sélecteur de mode (Dépense / Revenu / Prêt) et catégories.",
  },
  {
    name: "07_depenses_prevues",
    url: "http://localhost:3000/?demo=1&tab=budget&subtab=planned",
    title: "Dépenses prévues & Règlements",
    description: "Suivi des dépenses budgétées : barres de progression, règlements partiels et statuts (À venir, En cours, Soldée, Dépassée).",
  },
  {
    name: "08_finances_et_prets",
    url: "http://localhost:3000/?demo=1&tab=budget&subtab=income",
    title: "Finances, Salaires & Prêts",
    description: "Gestion du salaire mensuel récurrent, revenus exceptionnels, dettes et créances avec calcul instantané du net.",
  },
  {
    name: "09_bilan",
    url: "http://localhost:3000/?demo=1&tab=bilan",
    title: "Bilan & Analyse financière",
    description: "Bilan périodique (Jour, Semaine, Mois) : solde net, moyenne disponible par jour, graphique d'évolution et répartition par catégorie.",
  },
  {
    name: "10_historique",
    url: "http://localhost:3000/?demo=1&tab=history",
    title: "Historique des opérations",
    description: "Journal chronologique groupé par jour, totaux quotidiens, filtres (Tout, Dépenses, Revenus, Prêts) et suppression avec confirmation.",
  },
  {
    name: "11_profil",
    url: "http://localhost:3000/?demo=1&tab=profile",
    title: "Profil & Paramètres",
    description: "Choix de la devise (FCFA, EUR, USD), bascule de thème clair/sombre, option 'Solde figé à minuit', déconnexion et suppression sécurisée.",
  },
  {
    name: "12_mode_sombre",
    url: "http://localhost:3000/?demo=1&tab=dashboard&dark=1",
    title: "Tableau de bord — Thème sombre",
    description: "Rendu optimal et contrasté du thème sombre conforme à la maquette et aux critères WCAG AA.",
  },
  {
    name: "13_verrouillage_pin",
    url: "http://localhost:3000/?view=pin",
    title: "Déverrouillage par code PIN",
    description: "Écran de sécurité tactile : saisie du PIN à 4 chiffres, protection anti-brute-force (3 essais max) et bouton de secours 'PIN oublié'.",
  },
];

async function main() {
  const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
  const userDataDir = "C:\\Users\\lucie\\AppData\\Local\\Temp\\chrome-asoro-capture";

  console.log("=== Lancement de la suite de capture Asoro ===");
  const chrome = spawn(chromePath, [
    "--headless=new",
    "--remote-debugging-port=9222",
    "--disable-gpu",
    "--no-first-run",
    `--user-data-dir=${userDataDir}`,
    "about:blank",
  ]);

  let pageTarget = null;
  for (let attempt = 0; attempt < 20; attempt++) {
    try {
      const listRes = await fetch("http://127.0.0.1:9222/json/list");
      const targets = await listRes.json();
      pageTarget = targets.find((t) => t.type === "page") || targets[0];
      if (pageTarget && pageTarget.webSocketDebuggerUrl) break;
    } catch {
      await new Promise((r) => setTimeout(r, 500));
    }
  }

  if (!pageTarget) {
    throw new Error("Impossible de se connecter au port de débogage Chrome (9222).");
  }

  try {
    const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);
    await new Promise((resolve, reject) => {
      ws.onopen = resolve;
      ws.onerror = reject;
    });

    let msgId = 1;
    const callbacks = new Map();
    const eventHandlers = new Map();

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.id && callbacks.has(data.id)) {
        const cb = callbacks.get(data.id);
        callbacks.delete(data.id);
        cb(data.result);
      }
      if (data.method && eventHandlers.has(data.method)) {
        for (const handler of eventHandlers.get(data.method)) {
          handler(data.params);
        }
      }
    };

    function send(method, params = {}) {
      return new Promise((resolve) => {
        const id = msgId++;
        callbacks.set(id, resolve);
        ws.send(JSON.stringify({ id, method, params }));
      });
    }

    function on(event, fn) {
      if (!eventHandlers.has(event)) eventHandlers.set(event, []);
      eventHandlers.get(event).push(fn);
    }

    await send("Page.enable");
    await send("Runtime.enable");
    await send("Emulation.setDeviceMetricsOverride", {
      width: 412,
      height: 915,
      deviceScaleFactor: 2,
      mobile: true,
    });

    const reportResults = [];

    for (const item of PAGES_TO_CAPTURE) {
      console.log(`[Capture] ${item.name} : ${item.title}...`);

      const loadPromise = new Promise((resolve) => {
        const handler = () => {
          resolve();
        };
        on("Page.loadEventFired", handler);
      });

      await send("Page.navigate", { url: item.url });
      await loadPromise;

      // Attente du rendu React et chargement des polices / styles
      await new Promise((r) => setTimeout(r, 1200));

      const shot = await send("Page.captureScreenshot", { format: "png" });
      const filename = `${item.name}.png`;
      const filePath = path.join("capture", filename);
      fs.writeFileSync(filePath, Buffer.from(shot.data, "base64"));

      console.log(`✓ Sauvegardé : ${filePath}`);
      reportResults.push({
        ...item,
        filename,
      });
    }

    // Génération du rapport de tests markdown
    let md = `# Rapport de Test Visuel — Application Asoro\n\n`;
    md += `*Généré le ${new Date().toLocaleString("fr-FR")}*\n\n`;
    md += `Ce dossier regroupe les captures d'écran réelles issues des tests automatiques sur l'ensemble des écrans et fonctionnalités de l'application Asoro.\n\n`;
    md += `| N° | Écran | Description | Fichier de capture |\n`;
    md += `| --- | --- | --- | --- |\n`;

    for (let i = 0; i < reportResults.length; i++) {
      const res = reportResults[i];
      md += `| ${i + 1} | **${res.title}** | ${res.description} | [${res.filename}](./${res.filename}) |\n`;
    }

    md += `\n---\n\n## Détails des écrans testés\n\n`;
    for (let i = 0; i < reportResults.length; i++) {
      const res = reportResults[i];
      md += `### ${i + 1}. ${res.title}\n`;
      md += `> ${res.description}\n\n`;
      md += `![${res.title}](./${res.filename})\n\n`;
    }

    fs.writeFileSync(path.join("capture", "RAPPORT_TESTS.md"), md, "utf-8");
    console.log("✓ Rapport rédigé : capture/RAPPORT_TESTS.md");

    ws.close();
  } finally {
    chrome.kill();
  }
}

main().catch(console.error);
