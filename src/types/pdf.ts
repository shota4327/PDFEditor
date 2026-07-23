export type PageRotation = 0 | 90 | 180 | 270;

export interface PdfPage {
  id: string;            // Unique key for drag-and-drop & rendering
  fileId: string;        // Unique ID of source document
  fileName: string;      // Name of source file
  pageIndex: number;     // 0-based index in source PDF
  originalRotation: PageRotation; // Original PDF metadata rotation
  rotation: number;      // User-added cumulative rotation angle in degrees
  thumbnailUrl: string;  // Data URL (image/jpeg or png) of rendered preview
  pdfBytes: Uint8Array;  // Source PDF raw bytes
}

export type PdfPageInfo = PdfPage;

export interface PdfDocument {
  id: string;
  name: string;
  pageCount: number;
  pages: PdfPage[];
}

export type PdfDocumentData = PdfDocument;

export interface ExportPageSpec {
  pdfBytes: Uint8Array;
  pageIndex: number;
  originalRotation?: number;
  rotation: number;
}
