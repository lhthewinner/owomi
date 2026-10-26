import type { BalanceDataResponse } from "@/lib/operations/actions";
import { formatAmount } from "@/lib/utils/currency";

export interface ReportOptions {
  userName?: string;
  generationDate?: string;
}

/**
 * Nettoie une chaîne pour éviter toute injection HTML dans le rapport.
 */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Génère le code HTML complet et optimisé pour l'impression / export PDF du bilan financier.
 * Conforme à la règle 6 (aucune donnée envoyée à un tiers, rendu 100% local sur l'appareil).
 */
export function generateReportHtml(
  data: BalanceDataResponse,
  options: ReportOptions = {}
): string {
  const currency = data.currency || "FCFA";
  const user = options.userName ? escapeHtml(options.userName) : "Utilisateur";
  const genDate = options.generationDate || new Date().toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const rangeLabel = escapeHtml(data.range.formattedLabel);
  const balanceLabel = escapeHtml(data.balanceLabel);
  const balanceNote = escapeHtml(data.balanceNote);
  const formattedBalance = formatAmount(data.balance, currency);
  const formattedSpent = formatAmount(data.totalSpent, currency);
  const formattedGain = formatAmount(data.totalGain, currency);
  const balanceColor = data.isNegative ? "#EF4444" : "#10B981";

  // Catégories
  const categoriesHtml = data.byCategory.length > 0
    ? data.byCategory
        .map(
          (c) => `
        <tr>
          <td style="padding: 8px 12px; border-bottom: 1px solid #E2E8F0; font-weight: 600; color: #0F172A;">
            ${escapeHtml(c.category)}
          </td>
          <td style="padding: 8px 12px; border-bottom: 1px solid #E2E8F0; text-align: right; font-weight: 700; color: #0F172A; font-variant-numeric: tabular-nums;">
            ${formatAmount(c.amount, currency)}
          </td>
          <td style="padding: 8px 12px; border-bottom: 1px solid #E2E8F0; text-align: right; color: #64748B; font-size: 12px; width: 80px;">
            ${c.percentage} %
          </td>
          <td style="padding: 8px 12px; border-bottom: 1px solid #E2E8F0; width: 120px;">
            <div style="background: #F1F5F9; border-radius: 99px; height: 8px; overflow: hidden;">
              <div style="background: #10B981; height: 100%; width: ${Math.min(100, Math.max(0, c.percentage))}%;"></div>
            </div>
          </td>
        </tr>
      `
        )
        .join("")
    : `<tr><td colspan="4" style="padding: 16px; text-align: center; color: #64748B; font-size: 13px;">Aucune dépense enregistrée sur cette période.</td></tr>`;

  // Prêts (si présents)
  const hasLoans = data.loansBorrowed > 0 || data.loansGiven > 0;
  const loansHtml = hasLoans
    ? `
      <div style="margin-top: 20px; padding: 16px; background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 12px;">
        <h3 style="margin: 0 0 10px 0; font-size: 14px; font-weight: 700; color: #0F172A;">Prêts de la période</h3>
        <div style="display: flex; gap: 20px;">
          <div>
            <span style="font-size: 12px; color: #64748B;">Emprunté (+) :</span>
            <span style="font-weight: 700; color: #10B981; margin-left: 6px;">+ ${formatAmount(data.loansBorrowed, currency)}</span>
          </div>
          <div>
            <span style="font-size: 12px; color: #64748B;">Prêté (−) :</span>
            <span style="font-weight: 700; color: #F97316; margin-left: 6px;">− ${formatAmount(data.loansGiven, currency)}</span>
          </div>
        </div>
      </div>
    `
    : "";

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <title>Rapport de Bilan Financier - Owomi</title>
  <style>
    @page {
      size: A4;
      margin: 15mm;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #0F172A;
      background: #FFFFFF;
      margin: 0;
      padding: 24px;
      line-height: 1.45;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #10B981;
      padding-bottom: 16px;
      margin-bottom: 24px;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .logo-badge {
      background: #10B981;
      color: #FFFFFF;
      font-weight: 800;
      font-size: 16px;
      width: 36px;
      height: 36px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .title-box h1 {
      margin: 0;
      font-size: 20px;
      font-weight: 800;
      color: #0F172A;
    }
    .title-box p {
      margin: 2px 0 0 0;
      font-size: 12px;
      color: #64748B;
    }
    .meta-box {
      text-align: right;
      font-size: 12px;
      color: #64748B;
    }
    .meta-box strong {
      color: #0F172A;
    }
    .hero-card {
      background: #F8FAFC;
      border: 1px solid #E2E8F0;
      border-radius: 16px;
      padding: 20px;
      margin-bottom: 24px;
    }
    .hero-main {
      text-align: center;
      padding-bottom: 16px;
      border-bottom: 1px solid #E2E8F0;
    }
    .hero-main .label {
      font-size: 13px;
      font-weight: 600;
      color: #64748B;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .hero-main .val {
      font-size: 36px;
      font-weight: 800;
      margin: 6px 0;
      color: ${balanceColor};
      font-variant-numeric: tabular-nums;
    }
    .hero-main .note {
      font-size: 12px;
      color: #64748B;
    }
    .hero-grid {
      display: flex;
      justify-content: space-around;
      padding-top: 16px;
      text-align: center;
    }
    .hero-grid .col-val {
      font-size: 18px;
      font-weight: 800;
      margin-top: 2px;
      font-variant-numeric: tabular-nums;
    }
    .planned-box {
      display: flex;
      gap: 16px;
      background: #FFFFFF;
      border: 1px solid #E2E8F0;
      border-radius: 12px;
      padding: 14px 18px;
      margin-bottom: 24px;
    }
    .planned-col {
      flex: 1;
    }
    .table-container {
      width: 100%;
      border-collapse: collapse;
      margin-top: 8px;
      font-size: 13px;
    }
    .table-container th {
      background: #F1F5F9;
      padding: 10px 12px;
      text-align: left;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #475569;
    }
    .footer {
      margin-top: 36px;
      padding-top: 16px;
      border-top: 1px solid #E2E8F0;
      display: flex;
      justify-content: space-between;
      font-size: 11px;
      color: #94A3B8;
    }
  </style>
</head>
<body>

  <!-- En-tête -->
  <div class="header">
    <div class="brand">
      <div class="logo-badge">O</div>
      <div class="title-box">
        <h1>Owomi — Rapport Financier</h1>
        <p>Bilan : ${rangeLabel}</p>
      </div>
    </div>
    <div class="meta-box">
      <div>Titulaire : <strong>${user}</strong></div>
      <div>Généré le : <strong>${genDate}</strong></div>
    </div>
  </div>

  <!-- Chiffres clés -->
  <div class="hero-card">
    <div class="hero-main">
      <div class="label">${balanceLabel}</div>
      <div class="val">${formattedBalance}</div>
      <div class="note">${balanceNote}</div>
    </div>
    <div class="hero-grid">
      <div>
        <div style="font-size: 12px; color: #64748B;">Total Dépensé</div>
        <div class="col-val" style="color: #F97316;">${formattedSpent}</div>
      </div>
      <div>
        <div style="font-size: 12px; color: #64748B;">Total Gagné (hors salaire)</div>
        <div class="col-val" style="color: #22C55E;">+ ${formattedGain}</div>
      </div>
    </div>
  </div>

  <!-- Prévu vs Imprévu -->
  <div class="planned-box">
    <div class="planned-col">
      <div style="font-size: 12px; color: #64748B;">Dépenses prévues</div>
      <div style="font-weight: 800; font-size: 15px; color: #0F172A; margin-top: 2px;">
        ${formatAmount(data.plannedSpent, currency)}
        <span style="font-size: 12px; font-weight: 600; color: #10B981; margin-left: 4px;">(${data.plannedPercent}%)</span>
      </div>
    </div>
    <div style="width: 1px; background: #E2E8F0;"></div>
    <div class="planned-col">
      <div style="font-size: 12px; color: #64748B;">Dépenses imprévues</div>
      <div style="font-weight: 800; font-size: 15px; color: #0F172A; margin-top: 2px;">
        ${formatAmount(data.unplannedSpent, currency)}
        <span style="font-size: 12px; font-weight: 600; color: #F59E0B; margin-left: 4px;">(${data.unplannedPercent}%)</span>
      </div>
    </div>
  </div>

  <!-- Répartition par catégorie -->
  <div style="margin-top: 24px;">
    <h3 style="margin: 0 0 8px 0; font-size: 14px; font-weight: 700; color: #0F172A;">
      Répartition des dépenses par catégorie
    </h3>
    <table class="table-container">
      <thead>
        <tr>
          <th>Catégorie</th>
          <th style="text-align: right;">Montant</th>
          <th style="text-align: right;">Part</th>
          <th>Progression</th>
        </tr>
      </thead>
      <tbody>
        ${categoriesHtml}
      </tbody>
    </table>
  </div>

  <!-- Prêts -->
  ${loansHtml}

  <!-- Pied de page -->
  <div class="footer">
    <div>Owomi • Sache où part ton argent, chaque jour.</div>
    <div>Document personnel et confidentiel • 100% sécurisé</div>
  </div>

</body>
</html>`;
}
