import { describe, it, expect, vi } from 'vitest';
import { PDFDocument } from 'pdf-lib';
import { createSamplePdf, createSamplePdfFile } from './pdfHelpers';
import {
  loadPdfDocument,
  renderPageThumbnail,
  exportPdf,
  createDownloadLink,
} from '../../src/services/pdfEngine';
import type { ExportPageSpec } from '../../src/types/pdf';

describe('pdfEngine service', () => {
  describe('loadPdfDocument', () => {
    it('loads a single-page File object correctly', async () => {
      const file = await createSamplePdfFile('single.pdf', { pageCount: 1 });
      const docData = await loadPdfDocument(file);

      expect(docData.id).toBeTruthy();
      expect(docData.name).toBe('single.pdf');
      expect(docData.pageCount).toBe(1);
      expect(docData.pages.length).toBe(1);

      const page = docData.pages[0];
      expect(page.fileName).toBe('single.pdf');
      expect(page.pageIndex).toBe(0);
      expect(page.rotation).toBe(0);
      expect(page.thumbnailUrl).toContain('data:image/');
      expect(page.pdfBytes).toBeInstanceOf(Uint8Array);
    });

    it('loads a multi-page ArrayBuffer / Uint8Array correctly', async () => {
      const pdfBytes = await createSamplePdf({ pageCount: 3, title: 'Multi-Page Doc' });
      const docData = await loadPdfDocument(pdfBytes);

      expect(docData.name).toBe('document.pdf');
      expect(docData.pageCount).toBe(3);
      expect(docData.pages.length).toBe(3);

      docData.pages.forEach((page, index) => {
        expect(page.pageIndex).toBe(index);
        expect(page.rotation).toBe(0);
        expect(page.thumbnailUrl).toContain('data:image/');
        expect(page.pdfBytes).toEqual(pdfBytes);
      });
    });

    it('throws error for invalid file input type', async () => {
      // @ts-expect-error Testing invalid input at runtime
      await expect(loadPdfDocument(12345)).rejects.toThrow('Unsupported file input type');
    });
  });

  describe('renderPageThumbnail', () => {
    it('renders a data URL for a valid PDF page', async () => {
      const pdfBytes = await createSamplePdf({ pageCount: 2 });
      const dataUrl = await renderPageThumbnail(pdfBytes, 0);

      expect(typeof dataUrl).toBe('string');
      expect(dataUrl).toContain('data:image/');
    });

    it('supports custom scale factor', async () => {
      const pdfBytes = await createSamplePdf({ pageCount: 1 });
      const dataUrl = await renderPageThumbnail(pdfBytes, 0, 0.5);

      expect(typeof dataUrl).toBe('string');
      expect(dataUrl).toContain('data:image/');
    });
  });

  describe('exportPdf & roundtrip verification', () => {
    it('handles page rotation (0°, 90°, 180°, 270°)', async () => {
      const pdfBytes = await createSamplePdf({ pageCount: 4, title: 'Rotation Test' });

      const exportSpecs: ExportPageSpec[] = [
        { pdfBytes, pageIndex: 0, rotation: 0 },
        { pdfBytes, pageIndex: 1, rotation: 90 },
        { pdfBytes, pageIndex: 2, rotation: 180 },
        { pdfBytes, pageIndex: 3, rotation: 270 },
      ];

      const exportedBytes = await exportPdf(exportSpecs);
      expect(exportedBytes).toBeInstanceOf(Uint8Array);
      expect(exportedBytes.length).toBeGreaterThan(0);

      // Roundtrip verification with pdf-lib
      const roundtripDoc = await PDFDocument.load(exportedBytes);
      expect(roundtripDoc.getPageCount()).toBe(4);

      expect(roundtripDoc.getPage(0).getRotation().angle).toBe(0);
      expect(roundtripDoc.getPage(1).getRotation().angle).toBe(90);
      expect(roundtripDoc.getPage(2).getRotation().angle).toBe(180);
      expect(roundtripDoc.getPage(3).getRotation().angle).toBe(270);
    });

    it('supports page reordering and page deletion', async () => {
      const pdfBytes = await createSamplePdf({ pageCount: 5, title: 'Reorder Deletion Test' });

      // Select indices 4, 1, 0 (reordering and deleting indices 2 and 3)
      const exportSpecs: ExportPageSpec[] = [
        { pdfBytes, pageIndex: 4, rotation: 0 },
        { pdfBytes, pageIndex: 1, rotation: 90 },
        { pdfBytes, pageIndex: 0, rotation: 0 },
      ];

      const exportedBytes = await exportPdf(exportSpecs);
      const roundtripDoc = await PDFDocument.load(exportedBytes);

      expect(roundtripDoc.getPageCount()).toBe(3);
      expect(roundtripDoc.getPage(0).getRotation().angle).toBe(0);
      expect(roundtripDoc.getPage(1).getRotation().angle).toBe(90);
      expect(roundtripDoc.getPage(2).getRotation().angle).toBe(0);
    });

    it('merges pages from multiple distinct PDF documents', async () => {
      const docABytes = await createSamplePdf({ pageCount: 2, title: 'Document A' });
      const docBBytes = await createSamplePdf({ pageCount: 3, title: 'Document B' });

      const exportSpecs: ExportPageSpec[] = [
        { pdfBytes: docABytes, pageIndex: 0, rotation: 0 },
        { pdfBytes: docBBytes, pageIndex: 2, rotation: 180 },
        { pdfBytes: docABytes, pageIndex: 1, rotation: 90 },
        { pdfBytes: docBBytes, pageIndex: 0, rotation: 0 },
      ];

      const mergedBytes = await exportPdf(exportSpecs);
      const mergedDoc = await PDFDocument.load(mergedBytes);

      expect(mergedDoc.getPageCount()).toBe(4);
      expect(mergedDoc.getPage(0).getRotation().angle).toBe(0);
      expect(mergedDoc.getPage(1).getRotation().angle).toBe(180);
      expect(mergedDoc.getPage(2).getRotation().angle).toBe(90);
      expect(mergedDoc.getPage(3).getRotation().angle).toBe(0);

      // Reload exported merged bytes using loadPdfDocument
      const reloadedData = await loadPdfDocument(mergedBytes);
      expect(reloadedData.pageCount).toBe(4);
      expect(reloadedData.pages[1].originalRotation).toBe(180);
      expect(reloadedData.pages[2].originalRotation).toBe(90);
      expect(reloadedData.pages[1].rotation).toBe(0);
      expect(reloadedData.pages[2].rotation).toBe(0);
    });
  });

  describe('createDownloadLink', () => {
    it('creates an anchor element and triggers download', () => {
      const mockAnchor = {
        href: '',
        download: '',
        click: vi.fn(),
      } as unknown as HTMLAnchorElement;

      const createElementSpy = vi.spyOn(document, 'createElement').mockReturnValue(mockAnchor);
      const appendChildSpy = vi.spyOn(document.body, 'appendChild').mockImplementation((node) => node);
      const removeChildSpy = vi.spyOn(document.body, 'removeChild').mockImplementation((node) => node);

      const dummyBytes = new Uint8Array([1, 2, 3, 4]);
      createDownloadLink(dummyBytes, 'exported-doc');

      expect(createElementSpy).toHaveBeenCalledWith('a');
      expect(mockAnchor.download).toBe('exported-doc.pdf');
      expect(mockAnchor.href).toContain('blob:');
      expect(appendChildSpy).toHaveBeenCalledWith(mockAnchor);
      expect(mockAnchor.click).toHaveBeenCalledTimes(1);
      expect(removeChildSpy).toHaveBeenCalledWith(mockAnchor);

      createElementSpy.mockRestore();
      appendChildSpy.mockRestore();
      removeChildSpy.mockRestore();
    });

    it('preserves .pdf extension if already provided in filename', () => {
      const mockAnchor = {
        href: '',
        download: '',
        click: vi.fn(),
      } as unknown as HTMLAnchorElement;

      vi.spyOn(document, 'createElement').mockReturnValue(mockAnchor);
      vi.spyOn(document.body, 'appendChild').mockImplementation((node) => node);
      vi.spyOn(document.body, 'removeChild').mockImplementation((node) => node);

      createDownloadLink(new Uint8Array([1, 2, 3]), 'my_file.pdf');
      expect(mockAnchor.download).toBe('my_file.pdf');

      vi.restoreAllMocks();
    });
  });
});
