# Project: PDFEditor (Offline Client-Side PDF Editor)

## Architecture
Browser-based single-page web application.
- **Frontend Framework**: React + TypeScript + Vite
- **Styling**: Tailwind CSS + Lucide Icons + Framer Motion
- **PDF Engines**:
  - `pdf-lib` for structural operations (creating PDFs, copying pages, rotating, deleting, merging, exporting Uint8Array)
  - `pdfjs-dist` for client-side rendering (converting PDF pages into HTML5 Canvas / Data URL image thumbnails offline)
- **Drag-and-Drop**: DND library / HTML5 DnD for page grid reordering and multi-file drag-and-drop file upload zone.
- **Offline Guarantee**: Bundled `pdfjs` worker asset, zero external HTTP API calls.

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Project Setup & Architecture | Vite + React + TS setup, Tailwind CSS, Vitest, Playwright infra | none | DONE |
| M2 | PDF Processing Engine | Service module wrapping `pdf-lib` and `pdfjs-dist` (load, render thumbnails, rotate, delete, merge, export) | M1 | DONE |
| M3 | UI & Drag-and-Drop Components | Header, File Drop Zone, Thumbnail Grid with drag-and-drop reorder, rotate/delete controls | M1 | DONE |
| M4 | Integration & Download Pipeline | React state integration, export trigger, offline bundling verification | M2, M3 | DONE |
| M5 | E2E Testing Track | Playwright automated test suite for Tiers 1-4, `TEST_READY.md` creation | M1 | DONE |
| M6 | E2E Verification & Forensic Audit | Execution of E2E tests, Challenger stress testing, Forensic Auditor integrity check | M4, M5 | DONE |

## Interface Contracts
### `pdfEngine.ts` Interface
- `loadPdfDocument(file: File | ArrayBuffer): Promise<{ id: string, name: string, pageCount: number, pages: PdfPageInfo[] }>`
- `renderPageThumbnail(pdfBytes: Uint8Array, pageIndex: number, scale?: number): Promise<string>` (returns data URL)
- `exportPdf(pages: { pdfBytes: Uint8Array, pageIndex: number, rotation: number }[]): Promise<Uint8Array>`
- `createDownloadLink(pdfBytes: Uint8Array, filename: string): void`

## Code Layout
```
PDFEditor/
├── package.json
├── vite.config.ts
├── tailwind.config.js
├── postcss.config.js
├── index.html
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── types/
│   │   └── pdf.ts
│   ├── services/
│   │   └── pdfEngine.ts
│   ├── components/
│   │   ├── Header.tsx
│   │   ├── DropZone.tsx
│   │   ├── ThumbnailGrid.tsx
│   │   ├── ThumbnailCard.tsx
│   │   └── Toolbar.tsx
│   └── index.css
├── tests/
│   ├── unit/
│   │   └── pdfEngine.test.ts
│   └── e2e/
│       └── pdfEditor.spec.ts
```
