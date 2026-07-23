import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function ensureFixturesExist() {
  const fixturesDir = path.resolve(__dirname, '../fixtures');
  if (!fs.existsSync(fixturesDir)) {
    fs.mkdirSync(fixturesDir, { recursive: true });
  }

  const createPdf = async (filename: string, pageCount: number, docTitle: string) => {
    const filePath = path.join(fixturesDir, filename);
    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

    for (let i = 0; i < pageCount; i++) {
      const page = pdfDoc.addPage([600, 800]);
      page.drawRectangle({
        x: 20,
        y: 20,
        width: 560,
        height: 760,
        color: rgb(0.9, 0.95, 1.0),
      });

      page.drawText(`${docTitle} - Page ${i + 1}`, {
        x: 50,
        y: 720,
        size: 24,
        font,
        color: rgb(0.1, 0.3, 0.6),
      });

      page.drawText(`File: ${filename} | Index: ${i}`, {
        x: 50,
        y: 680,
        size: 14,
        font,
        color: rgb(0.4, 0.4, 0.4),
      });
    }

    const pdfBytes = await pdfDoc.save();
    fs.writeFileSync(filePath, pdfBytes);
  };

  await createPdf('sample-1page.pdf', 1, 'Sample 1-Page Document');
  await createPdf('sample-2pages.pdf', 2, 'Sample 2-Pages Document');
  await createPdf('sample-3pages.pdf', 3, 'Sample 3-Pages Document');
}

