import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

export interface SamplePdfOptions {
  pageCount?: number;
  title?: string;
  width?: number;
  height?: number;
}

/**
 * Helper to generate synthetic PDF Uint8Array for unit testing using pdf-lib.
 */
export async function createSamplePdf(options: SamplePdfOptions = {}): Promise<Uint8Array> {
  const {
    pageCount = 1,
    title = 'Test Document',
    width = 600,
    height = 800,
  } = options;

  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

  for (let i = 0; i < pageCount; i++) {
    const page = pdfDoc.addPage([width, height]);

    const r = ((i * 70) % 255) / 255;
    const g = ((i * 110) % 255) / 255;
    const b = ((i * 150) % 255) / 255;

    page.drawRectangle({
      x: 20,
      y: 20,
      width: width - 40,
      height: height - 40,
      color: rgb(r, g, b),
      opacity: 0.2,
    });

    page.drawText(`${title} - Page ${i + 1} of ${pageCount}`, {
      x: 40,
      y: height - 60,
      size: 18,
      font,
      color: rgb(0.1, 0.1, 0.1),
    });

    page.drawText(`Page Index: ${i}`, {
      x: 40,
      y: height - 90,
      size: 14,
      font,
      color: rgb(0.3, 0.3, 0.3),
    });
  }

  return await pdfDoc.save();
}

/**
 * Creates a File object containing a synthetic PDF for testing file upload / load logic.
 */
export async function createSamplePdfFile(
  filename: string = 'sample.pdf',
  options: SamplePdfOptions = {}
): Promise<File> {
  const bytes = await createSamplePdf(options);
  return new File([bytes.buffer as ArrayBuffer], filename, { type: 'application/pdf' });
}
