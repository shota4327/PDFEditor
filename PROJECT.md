# Project: PDFEditor (Offline Client-Side PDF Editor)

## Architecture
Browser-based single-page web application.
- **Frontend Framework**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS + Lucide Icons + Framer Motion
- **PDF Engines**:
  - `pdf-lib` for structural operations (creating PDFs, copying pages, rotating, deleting, merging, exporting Uint8Array)
  - `pdfjs-dist` for client-side rendering (converting PDF pages into HTML5 Canvas / Data URL image thumbnails offline)
- **Drag-and-Drop**: `@hello-pangea/dnd` for smooth, responsive page grid reordering and multi-file drag-and-drop file upload zone.
- **Offline Guarantee**: Bundled `pdfjs` worker asset, zero external HTTP API calls.

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Project Setup & Architecture | Vite + React + TS setup, Tailwind CSS, Vitest, Playwright infra | none | DONE |
| M2 | PDF Processing Engine | Service module wrapping `pdf-lib` and `pdfjs-dist` (load, render thumbnails, rotate, delete, merge, export) | M1 | DONE |
| M3 | UI & Drag-and-Drop Components | Header, File Drop Zone, Thumbnail Grid with drag-and-drop reorder, rotate/delete controls | M1 | DONE |
| M4 | Integration & Download Pipeline | React state integration, export trigger, offline bundling verification | M2, M3 | DONE |
| M5 | E2E Testing Track | Playwright automated test suite for Tiers 1-4, `TEST_INFRA.md` creation | M1 | DONE |
| M6 | E2E Verification & Forensic Audit | Execution of E2E tests, Challenger stress testing, Forensic Auditor integrity check | M4, M5 | DONE |
| M7 | Zoom Controls & UI/UX Hardening | Thumbnail zoom scaling (50%〜300%), grid drag-and-drop overlap fix, robust offline single-file bundling | M3, M4 | DONE |

## Interface Contracts
### `pdfEngine.ts` Interface
- `loadPdfDocument(file: File | ArrayBuffer | Uint8Array): Promise<PdfDocumentData>`
- `renderPageThumbnail(pdfBytes: Uint8Array, pageIndex: number, scale?: number): Promise<string>` (returns JPEG Data URL)
- `exportPdf(pages: ExportPageSpec[]): Promise<Uint8Array>`
- `createDownloadLink(pdfBytes: Uint8Array, filename: string): void`

## Code Layout
```
PDFEditor/
├── package.json
├── vite.config.ts
├── tailwind.config.js
├── postcss.config.js
├── tsconfig.json
├── tsconfig.node.json
├── index.html
├── .gitignore
├── .gemini/
│   └── rules.md
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
│   │   ├── setup.ts
│   │   ├── pdfEngine.test.ts
│   │   ├── pdfHelpers.test.ts
│   │   ├── components.test.tsx
│   │   └── generateFixtures.test.ts
│   └── e2e/
│       ├── fixtures/
│       ├── helpers/
│       └── pdfEditor.spec.ts
├── PROJECT.md
├── TEST_INFRA.md
└── README.md
```
