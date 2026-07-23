import { PDFDocument, degrees } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.js?url';
import type { PdfDocumentData, PdfPageInfo, ExportPageSpec, PageRotation } from '../types/pdf';

// Configure pdfjs-dist GlobalWorkerOptions workerSrc using Vite local asset import
if (typeof window !== 'undefined') {
  if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'test') {
    // In Node / Vitest jsdom environment, require standard module path for fake worker
    pdfjsLib.GlobalWorkerOptions.workerSrc = '';
  } else {
    // In browser / Vite environment, use Vite ?url asset import path
    pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;
  }
}

/**
 * Loads a PDF document from a File, ArrayBuffer, or Uint8Array.
 * Extracts document metadata, page count, initial page rotations, and generates thumbnail previews.
 */
export async function loadPdfDocument(file: File | ArrayBuffer | Uint8Array): Promise<PdfDocumentData> {
  let pdfBytes: Uint8Array;
  let fileName = 'document.pdf';

  if (typeof File !== 'undefined' && file instanceof File) {
    fileName = file.name;
    const arrayBuffer = await file.arrayBuffer();
    pdfBytes = new Uint8Array(arrayBuffer);
  } else if (file instanceof Uint8Array) {
    pdfBytes = file;
  } else if (file instanceof ArrayBuffer) {
    pdfBytes = new Uint8Array(file);
  } else {
    throw new Error('Unsupported file input type for loadPdfDocument');
  }

  const pdfDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
  const pageCount = pdfDoc.getPageCount();
  const fileId = `file_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

  const pages: PdfPageInfo[] = [];

  for (let i = 0; i < pageCount; i++) {
    const page = pdfDoc.getPage(i);
    const rawRotation = page.getRotation().angle;
    const normalizedOriginalRotation = (((rawRotation % 360) + 360) % 360) as PageRotation;

    let thumbnailUrl = '';
    try {
      thumbnailUrl = await renderPageThumbnail(pdfBytes, i);
    } catch (e) {
      console.warn(`Failed to render thumbnail for page ${i} of ${fileName}:`, e);
    }

    pages.push({
      id: `${fileId}_page_${i}_${Math.random().toString(36).substring(2, 7)}`,
      fileId,
      fileName,
      pageIndex: i,
      originalRotation: normalizedOriginalRotation,
      rotation: 0,
      thumbnailUrl,
      pdfBytes,
    });
  }

  return {
    id: fileId,
    name: fileName,
    pageCount,
    pages,
  };
}

/**
 * Renders a thumbnail preview of a specific PDF page onto an HTML5 Canvas and returns a JPEG Data URL.
 */
export async function renderPageThumbnail(
  pdfBytes: Uint8Array,
  pageIndex: number,
  scale?: number
): Promise<string> {
  const loadingTask = pdfjsLib.getDocument({ data: pdfBytes.slice() });
  const pdfDoc = await loadingTask.promise;

  try {
    const page = await pdfDoc.getPage(pageIndex + 1); // pdfjs is 1-indexed

    const unscaledViewport = page.getViewport({ scale: 1.0 });
    const targetWidth = 1200;
    const computedScale = scale !== undefined ? scale : (targetWidth / (unscaledViewport.width || 1));
    const viewport = page.getViewport({ scale: computedScale });

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');

    if (!context) {
      throw new Error('Canvas 2D context is not available');
    }

    canvas.width = Math.max(1, Math.floor(viewport.width));
    canvas.height = Math.max(1, Math.floor(viewport.height));

    // Fill canvas with white background (PDF paper background)
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);

    const renderContext = {
      canvasContext: context,
      viewport: viewport,
    };

    await page.render(renderContext).promise;
    return canvas.toDataURL('image/jpeg', 0.95);
  } finally {
    await pdfDoc.destroy();
  }
}

/**
 * Exports a new PDF Uint8Array based on an ordered list of page specifications,
 * allowing merging across multiple documents, reordering, deletion, and rotation.
 */
export async function exportPdf(pages: ExportPageSpec[]): Promise<Uint8Array> {
  const newPdfDoc = await PDFDocument.create();
  const docCache = new Map<Uint8Array, PDFDocument>();

  for (const pageSpec of pages) {
    let sourceDoc = docCache.get(pageSpec.pdfBytes);
    if (!sourceDoc) {
      sourceDoc = await PDFDocument.load(pageSpec.pdfBytes, { ignoreEncryption: true });
      docCache.set(pageSpec.pdfBytes, sourceDoc);
    }

    const [copiedPage] = await newPdfDoc.copyPages(sourceDoc, [pageSpec.pageIndex]);
    const originalRot = pageSpec.originalRotation ?? 0;
    const userRot = pageSpec.rotation ?? 0;
    const totalRotation = (((originalRot + userRot) % 360 + 360) % 360);
    copiedPage.setRotation(degrees(totalRotation));

    newPdfDoc.addPage(copiedPage);
  }

  return await newPdfDoc.save();
}

/**
 * Creates an in-memory Object URL Blob and triggers a browser download for the exported PDF.
 */
export function createDownloadLink(pdfBytes: Uint8Array, filename: string): void {
  const blob = new Blob([pdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
