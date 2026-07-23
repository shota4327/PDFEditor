import { describe, it, expect } from 'vitest';
import { createSamplePdf, createSamplePdfFile } from './pdfHelpers';
import { PDFDocument } from 'pdf-lib';

describe('pdfHelpers synthetic PDF generator', () => {
  it('creates a synthetic PDF with default 1 page', async () => {
    const pdfBytes = await createSamplePdf();
    expect(pdfBytes).toBeInstanceOf(Uint8Array);
    expect(pdfBytes.length).toBeGreaterThan(0);

    const pdfDoc = await PDFDocument.load(pdfBytes);
    expect(pdfDoc.getPageCount()).toBe(1);
  });

  it('creates a synthetic PDF with 3 pages', async () => {
    const pdfBytes = await createSamplePdf({ pageCount: 3, title: 'Multi-page Test' });
    const pdfDoc = await PDFDocument.load(pdfBytes);
    expect(pdfDoc.getPageCount()).toBe(3);
  });

  it('creates a synthetic PDF File object', async () => {
    const file = await createSamplePdfFile('test-doc.pdf', { pageCount: 2 });
    expect(file).toBeInstanceOf(File);
    expect(file.name).toBe('test-doc.pdf');
    expect(file.type).toBe('application/pdf');

    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(new Uint8Array(arrayBuffer));
    expect(pdfDoc.getPageCount()).toBe(2);
  });
});
