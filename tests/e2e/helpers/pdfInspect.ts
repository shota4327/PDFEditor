import { PDFDocument } from 'pdf-lib';
import fs from 'fs';

export interface PdfInspectResult {
  pageCount: number;
  rotations: number[];
  pageSizes: { width: number; height: number }[];
  isValidPdf: boolean;
}

/**
 * Inspects a PDF file path or Buffer using pdf-lib to return page count, rotation angles, and page dimensions.
 */
export async function inspectPdfFile(filePathOrBuffer: string | Buffer | Uint8Array): Promise<PdfInspectResult> {
  let pdfBytes: Uint8Array;
  if (typeof filePathOrBuffer === 'string') {
    pdfBytes = fs.readFileSync(filePathOrBuffer);
  } else {
    pdfBytes = new Uint8Array(filePathOrBuffer);
  }

  const pdfDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
  const pageCount = pdfDoc.getPageCount();
  const rotations: number[] = [];
  const pageSizes: { width: number; height: number }[] = [];

  for (let i = 0; i < pageCount; i++) {
    const page = pdfDoc.getPage(i);
    rotations.push(page.getRotation().angle);
    const size = page.getSize();
    pageSizes.push({ width: size.width, height: size.height });
  }

  return {
    pageCount,
    rotations,
    pageSizes,
    isValidPdf: pageCount > 0,
  };
}
