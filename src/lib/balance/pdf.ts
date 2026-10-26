import { jsPDF } from "jspdf";
import type { BalanceDataResponse } from "@/lib/operations/actions";
import { formatAmount } from "@/lib/utils/currency";

export interface PdfOptions {
  userName?: string;
  generationDate?: string;
}

/**
 * Construit un document jsPDF professionnel et vectoriel pour le bilan Owomi.
 * Conforme au cahier des charges V1.1 (Export PDF du bilan).
 */
export function generateBalancePdf(
  data: BalanceDataResponse,
  options: PdfOptions = {}
): jsPDF {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const currency = data.currency || "FCFA";
  const user = options.userName || "Utilisateur";
  const genDate =
    options.generationDate ||
    new Date().toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 16;
  const contentWidth = pageWidth - margin * 2;

  // 1. En-tête : Badge Owomi
  doc.setFillColor(16, 185, 129); // #10B981
  doc.roundedRect(margin, 16, 10, 10, 2.5, 2.5, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("O", margin + 3, 23.2);

  doc.setTextColor(15, 23, 42); // #0F172A
  doc.setFontSize(15);
  doc.text("OWOMI", margin + 13.5, 23);

  doc.setFontSize(8.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 116, 139); // #64748B
  doc.text("Rapport de Bilan Financier", margin + 13.5, 27);

  // Méta à droite
  doc.setFontSize(8.5);
  doc.text(`Utilisateur : ${user}`, pageWidth - margin, 19, { align: "right" });
  doc.text(`Période : ${data.range.formattedLabel}`, pageWidth - margin, 23.5, { align: "right" });
  doc.text(`Généré le ${genDate}`, pageWidth - margin, 28, { align: "right" });

  // Ligne de séparation
  doc.setDrawColor(226, 232, 240); // #E2E8F0
  doc.setLineWidth(0.4);
  doc.line(margin, 32, pageWidth - margin, 32);

  // 2. Carte Héro Résumé (Solde et totaux)
  let y = 37;
  doc.setFillColor(248, 250, 252); // #F8FAFC
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, contentWidth, 38, 3, 3, "FD");

  // Solde
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text(data.balanceLabel.toUpperCase(), margin + 8, y + 9);

  doc.setFontSize(20);
  if (data.isNegative) {
    doc.setTextColor(239, 68, 68); // Rouge déficit
    doc.text(`- ${formatAmount(Math.abs(data.balance), currency)}`, margin + 8, y + 20);
  } else {
    doc.setTextColor(16, 185, 129); // Vert économie
    doc.text(`+ ${formatAmount(data.balance, currency)}`, margin + 8, y + 20);
  }

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(data.balanceNote, margin + 8, y + 27);

  // Totaux à droite dans la carte Héro
  const rightColX = margin + contentWidth - 58;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text("TOTAL DÉPENSÉ", rightColX, y + 9);

  doc.setTextColor(244, 63, 94); // Dépense #F43F5E
  doc.setFontSize(12);
  doc.text(formatAmount(data.totalSpent, currency), rightColX, y + 16);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text("TOTAL GAGNÉ (HORS SALAIRE)", rightColX, y + 23);

  doc.setTextColor(16, 185, 129);
  doc.setFontSize(12);
  doc.text(`+ ${formatAmount(data.totalGain, currency)}`, rightColX, y + 30);

  y += 44;

  // 3. Section Prévu vs Imprévu
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, contentWidth, 24, 2.5, 2.5, "FD");

  const halfWidth = contentWidth / 2;

  // Prévu
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  doc.text("DÉPENSES PRÉVUES", margin + 8, y + 7);

  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text(`${formatAmount(data.plannedSpent, currency)}  (${data.plannedPercent} %)`, margin + 8, y + 14);

  // Imprévu
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  doc.text("DÉPENSES IMPRÉVUES", margin + halfWidth + 8, y + 7);

  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text(`${formatAmount(data.unplannedSpent, currency)}  (${data.unplannedPercent} %)`, margin + halfWidth + 8, y + 14);

  // Barre visuelle de proportion
  const barY = y + 18.5;
  const barWidth = contentWidth - 16;
  const plannedBarW = (barWidth * Math.min(100, Math.max(0, data.plannedPercent))) / 100;
  const unplannedBarW = barWidth - plannedBarW;

  if (plannedBarW > 0) {
    doc.setFillColor(16, 185, 129);
    doc.rect(margin + 8, barY, plannedBarW, 2, "F");
  }
  if (unplannedBarW > 0) {
    doc.setFillColor(245, 158, 11); // Ambre/Orange
    doc.rect(margin + 8 + plannedBarW, barY, unplannedBarW, 2, "F");
  }

  y += 30;

  // 4. Section Prêts (si applicable)
  if (data.loansBorrowed > 0 || data.loansGiven > 0) {
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(margin, y, contentWidth, 18, 2, 2, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(100, 116, 139);
    doc.text("PRÊTS & DETTES DE LA PÉRIODE", margin + 8, y + 6);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(`Emprunté (+) : `, margin + 8, y + 12.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(16, 185, 129);
    doc.text(`+ ${formatAmount(data.loansBorrowed, currency)}`, margin + 30, y + 12.5);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 116, 139);
    doc.text(`Prêté (−) : `, margin + 75, y + 12.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(245, 158, 11);
    doc.text(`- ${formatAmount(data.loansGiven, currency)}`, margin + 92, y + 12.5);

    y += 24;
  }

  // 5. Tableau des Catégories de Dépenses
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text("RÉPARTITION PAR CATÉGORIE", margin, y);
  y += 4;

  // En-tête du tableau
  doc.setFillColor(241, 245, 249); // #F1F5F9
  doc.rect(margin, y, contentWidth, 7, "F");
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text("CATÉGORIE", margin + 6, y + 4.8);
  doc.text("MONTANT", margin + contentWidth - 45, y + 4.8, { align: "right" });
  doc.text("PART", margin + contentWidth - 8, y + 4.8, { align: "right" });
  y += 7;

  if (data.byCategory.length === 0) {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(8.5);
    doc.setTextColor(148, 163, 184);
    doc.text("Aucune dépense enregistrée sur cette période.", margin + 6, y + 6);
    y += 12;
  } else {
    data.byCategory.forEach((cat, index) => {
      // Alternance de fond
      if (index % 2 === 1) {
        doc.setFillColor(250, 250, 250);
        doc.rect(margin, y, contentWidth, 7.5, "F");
      }

      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.setTextColor(15, 23, 42);
      doc.text(cat.category, margin + 6, y + 5);

      doc.setFont("helvetica", "bold");
      doc.setTextColor(15, 23, 42);
      doc.text(formatAmount(cat.amount, currency), margin + contentWidth - 45, y + 5, {
        align: "right",
      });

      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 116, 139);
      doc.text(`${cat.percentage} %`, margin + contentWidth - 8, y + 5, {
        align: "right",
      });

      // Ligne fine inférieure
      doc.setDrawColor(241, 245, 249);
      doc.setLineWidth(0.2);
      doc.line(margin, y + 7.5, margin + contentWidth, y + 7.5);

      y += 7.5;
    });
  }

  // 6. Pied de page
  const footerY = pageHeight - 14;
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.4);
  doc.line(margin, footerY - 4, pageWidth - margin, footerY - 4);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184); // #94A3B8
  doc.text(
    "Owomi • Gestion de budget personnel — Données strictement confidentielles et privées.",
    margin,
    footerY
  );
  doc.text("Page 1 / 1", pageWidth - margin, footerY, { align: "right" });

  return doc;
}

/**
 * Télécharge directement le bilan financier sous forme de vrai fichier PDF.
 * Conforme à la règle UX : un clic déclenche immédiatement le téléchargement du fichier.
 */
export function downloadBalancePdf(
  data: BalanceDataResponse,
  options: PdfOptions = {}
): void {
  const doc = generateBalancePdf(data, options);
  const filename = `owomi-bilan-${data.range.start}.pdf`;
  doc.save(filename);
}
