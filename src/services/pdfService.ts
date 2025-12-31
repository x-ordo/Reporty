import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import { Report, TimelineEvent, DefensePack } from '../types';

// Noto Sans KR font URL (Google Fonts)
const NOTO_SANS_KR_URL = 'https://fonts.gstatic.com/s/notosanskr/v36/PbyxFmXiEBPT4ITbgNA5Cgms3VYcOA-vvnIzzuoyeLGC5nwmHfhb.woff2';

interface DefensePackData {
  report: Report;
  riskAssessment?: string;
  generatedAt: Date;
}

/**
 * Defense Pack PDF 생성
 * - 사건 요약
 * - 증거 체인 (HMAC 해시)
 * - AI 리스크 분석 결과
 * - 무결성 검증 상태
 */
export async function generateDefensePackPDF(data: DefensePackData): Promise<Uint8Array> {
  const { report, riskAssessment, generatedAt } = data;

  // Create PDF document
  const pdfDoc = await PDFDocument.create();
  pdfDoc.registerFontkit(fontkit);

  // Load Korean font
  let koreanFont;
  try {
    const fontBytes = await fetch(NOTO_SANS_KR_URL).then(res => res.arrayBuffer());
    koreanFont = await pdfDoc.embedFont(fontBytes);
  } catch (e) {
    console.warn('Korean font load failed, using Helvetica');
    koreanFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  }

  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // PDF Metadata
  pdfDoc.setTitle(`Defense Pack - ${report.id}`);
  pdfDoc.setSubject('SafeReport Legal Shield - Evidence Package');
  pdfDoc.setCreator('SafeReport Legal Shield v3.0');
  pdfDoc.setCreationDate(generatedAt);

  // Colors
  const primaryBlue = rgb(0.145, 0.388, 0.921); // #2563EB
  const darkGray = rgb(0.2, 0.2, 0.2);
  const lightGray = rgb(0.6, 0.6, 0.6);
  const successGreen = rgb(0.133, 0.545, 0.133);
  const dangerRed = rgb(0.863, 0.078, 0.235);

  // Page dimensions
  const pageWidth = 595.28; // A4
  const pageHeight = 841.89;
  const margin = 50;
  const contentWidth = pageWidth - (margin * 2);

  // === PAGE 1: Cover & Summary ===
  let page = pdfDoc.addPage([pageWidth, pageHeight]);
  let y = pageHeight - margin;

  // Header
  page.drawText('SAFEREPORT', {
    x: margin,
    y: y,
    size: 24,
    font: helveticaBold,
    color: darkGray,
  });

  page.drawText('DEFENSE PACK', {
    x: margin,
    y: y - 30,
    size: 32,
    font: helveticaBold,
    color: primaryBlue,
  });

  // Subtitle
  page.drawText('Legal Shield - Secure Evidence Package', {
    x: margin,
    y: y - 60,
    size: 12,
    font: koreanFont,
    color: lightGray,
  });

  // Horizontal line
  y -= 90;
  page.drawLine({
    start: { x: margin, y },
    end: { x: pageWidth - margin, y },
    thickness: 2,
    color: primaryBlue,
  });

  // Report Info Box
  y -= 40;
  const boxHeight = 150;
  page.drawRectangle({
    x: margin,
    y: y - boxHeight,
    width: contentWidth,
    height: boxHeight,
    borderColor: rgb(0.9, 0.9, 0.9),
    borderWidth: 1,
  });

  // Report details
  const infoX = margin + 20;
  let infoY = y - 25;
  const lineHeight = 22;

  const reportInfo = [
    ['Report ID:', report.id],
    ['Status:', report.status.toUpperCase()],
    ['Priority:', report.priority],
    ['Category:', report.category || 'N/A'],
    ['Created:', new Date(report.createdAt).toLocaleString('ko-KR')],
    ['Generated:', generatedAt.toLocaleString('ko-KR')],
  ];

  for (const [label, value] of reportInfo) {
    page.drawText(label, { x: infoX, y: infoY, size: 10, font: helveticaBold, color: lightGray });
    page.drawText(String(value), { x: infoX + 100, y: infoY, size: 10, font: koreanFont, color: darkGray });
    infoY -= lineHeight;
  }

  // Integrity Status
  y -= boxHeight + 40;
  const integrityColor = report.integrityOk ? successGreen : dangerRed;
  const integrityText = report.integrityOk ? 'VERIFIED' : 'VERIFICATION FAILED';

  page.drawText('Evidence Chain Integrity:', {
    x: margin,
    y,
    size: 14,
    font: helveticaBold,
    color: darkGray,
  });

  page.drawText(integrityText, {
    x: margin + 180,
    y,
    size: 14,
    font: helveticaBold,
    color: integrityColor,
  });

  // Head Hash
  y -= 25;
  page.drawText('Head Hash:', {
    x: margin,
    y,
    size: 10,
    font: helveticaBold,
    color: lightGray,
  });
  page.drawText(report.evidenceHeadHash || 'N/A', {
    x: margin + 70,
    y,
    size: 8,
    font: koreanFont,
    color: darkGray,
  });

  // === PAGE 2: Report Content ===
  page = pdfDoc.addPage([pageWidth, pageHeight]);
  y = pageHeight - margin;

  page.drawText('INCIDENT REPORT', {
    x: margin,
    y,
    size: 18,
    font: helveticaBold,
    color: primaryBlue,
  });

  y -= 40;

  // Subject
  if (report.subject) {
    page.drawText('Subject:', { x: margin, y, size: 12, font: helveticaBold, color: darkGray });
    y -= 20;
    page.drawText(report.subject, { x: margin, y, size: 11, font: koreanFont, color: darkGray });
    y -= 30;
  }

  // Content - wrap text
  page.drawText('Content:', { x: margin, y, size: 12, font: helveticaBold, color: darkGray });
  y -= 25;

  const contentLines = wrapText(report.content, 80);
  for (const line of contentLines) {
    if (y < margin + 50) {
      page = pdfDoc.addPage([pageWidth, pageHeight]);
      y = pageHeight - margin;
    }
    page.drawText(line, { x: margin, y, size: 10, font: koreanFont, color: darkGray });
    y -= 16;
  }

  // === PAGE 3: Evidence Chain Timeline ===
  page = pdfDoc.addPage([pageWidth, pageHeight]);
  y = pageHeight - margin;

  page.drawText('EVIDENCE CHAIN', {
    x: margin,
    y,
    size: 18,
    font: helveticaBold,
    color: primaryBlue,
  });

  y -= 30;
  page.drawText(`Total Events: ${report.events?.length || 0}`, {
    x: margin,
    y,
    size: 10,
    font: koreanFont,
    color: lightGray,
  });

  y -= 30;

  // Timeline events
  if (report.events && report.events.length > 0) {
    for (const event of report.events) {
      if (y < margin + 100) {
        page = pdfDoc.addPage([pageWidth, pageHeight]);
        y = pageHeight - margin;
      }

      // Event box
      page.drawRectangle({
        x: margin,
        y: y - 60,
        width: contentWidth,
        height: 65,
        color: rgb(0.98, 0.98, 0.98),
        borderColor: rgb(0.9, 0.9, 0.9),
        borderWidth: 1,
      });

      // Event type badge
      page.drawText(event.type.toUpperCase(), {
        x: margin + 10,
        y: y - 15,
        size: 9,
        font: helveticaBold,
        color: primaryBlue,
      });

      // Timestamp
      page.drawText(new Date(event.createdAt).toLocaleString('ko-KR'), {
        x: margin + 150,
        y: y - 15,
        size: 8,
        font: koreanFont,
        color: lightGray,
      });

      // Actor
      page.drawText(`Actor: ${event.actorRole}`, {
        x: margin + 10,
        y: y - 32,
        size: 8,
        font: koreanFont,
        color: darkGray,
      });

      // Hash (truncated)
      const hashDisplay = event.eventHash ? `${event.eventHash.substring(0, 32)}...` : 'N/A';
      page.drawText(`Hash: ${hashDisplay}`, {
        x: margin + 10,
        y: y - 48,
        size: 7,
        font: koreanFont,
        color: lightGray,
      });

      y -= 75;
    }
  } else {
    page.drawText('No events recorded.', {
      x: margin,
      y,
      size: 10,
      font: koreanFont,
      color: lightGray,
    });
  }

  // === PAGE 4: AI Risk Assessment (if available) ===
  if (riskAssessment) {
    page = pdfDoc.addPage([pageWidth, pageHeight]);
    y = pageHeight - margin;

    page.drawText('AI RISK ANALYSIS', {
      x: margin,
      y,
      size: 18,
      font: helveticaBold,
      color: primaryBlue,
    });

    y -= 40;

    const assessmentLines = wrapText(riskAssessment, 85);
    for (const line of assessmentLines) {
      if (y < margin + 50) {
        page = pdfDoc.addPage([pageWidth, pageHeight]);
        y = pageHeight - margin;
      }
      page.drawText(line, { x: margin, y, size: 9, font: koreanFont, color: darkGray });
      y -= 14;
    }
  }

  // === LAST PAGE: Legal Disclaimer ===
  page = pdfDoc.addPage([pageWidth, pageHeight]);
  y = pageHeight - margin;

  page.drawText('LEGAL DISCLAIMER', {
    x: margin,
    y,
    size: 18,
    font: helveticaBold,
    color: dangerRed,
  });

  y -= 40;

  const disclaimer = `This Defense Pack is generated by SafeReport Legal Shield for evidence preservation purposes.

IMPORTANT NOTICES:

1. DATA ANALYSIS ONLY: The AI-generated risk assessment contained in this document is based on statistical analysis and pattern recognition. It does NOT constitute legal advice.

2. EVIDENCE INTEGRITY: The evidence chain uses HMAC-SHA256 cryptographic hashing to ensure tamper detection. Any modification to the original data will invalidate the hash chain.

3. LEGAL CONSULTATION: For any legal decisions or actions, please consult with qualified legal professionals. This document is intended as supplementary reference material only.

4. CONFIDENTIALITY: This document may contain sensitive information. Handle according to your organization's data protection policies.

5. VERIFICATION: The integrity status shown in this document reflects the state at the time of generation. For real-time verification, use the SafeReport platform.

Generated by SafeReport Legal Shield v3.0
Generation Date: ${generatedAt.toISOString()}
Document ID: ${report.id}-${Date.now()}`;

  const disclaimerLines = disclaimer.split('\n');
  for (const line of disclaimerLines) {
    if (y < margin + 20) {
      page = pdfDoc.addPage([pageWidth, pageHeight]);
      y = pageHeight - margin;
    }
    page.drawText(line, { x: margin, y, size: 9, font: koreanFont, color: darkGray });
    y -= 14;
  }

  // Save and return
  return await pdfDoc.save();
}

/**
 * Simple text wrapping
 */
function wrapText(text: string, maxChars: number): string[] {
  const lines: string[] = [];
  const paragraphs = text.split('\n');

  for (const para of paragraphs) {
    if (para.length <= maxChars) {
      lines.push(para);
    } else {
      let remaining = para;
      while (remaining.length > maxChars) {
        let breakPoint = remaining.lastIndexOf(' ', maxChars);
        if (breakPoint === -1) breakPoint = maxChars;
        lines.push(remaining.substring(0, breakPoint));
        remaining = remaining.substring(breakPoint).trim();
      }
      if (remaining) lines.push(remaining);
    }
  }

  return lines;
}

/**
 * PDF 다운로드 트리거
 */
export function downloadPDF(pdfBytes: Uint8Array, filename: string): void {
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
