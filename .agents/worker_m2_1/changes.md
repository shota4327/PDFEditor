# Changes Report — Milestone 2 PDF Core Processing Engine

**Date:** 2026-07-22  
**Worker:** Worker 2 (`worker_m2_1`)  
**Milestone:** Milestone 2 (PDF Processing Engine)  

---

## 1. Files Created / Modified

### Created Files
1. **`src/services/pdfEngine.ts`**
   - Core PDF processing engine implementing the interface contracts in `PROJECT.md` and `src/types/pdf.ts`.
   - Functions implemented:
     - `loadPdfDocument(file: File | ArrayBuffer | Uint8Array): Promise<PdfDocumentData>`
     - `renderPageThumbnail(pdfBytes: Uint8Array, pageIndex: number, scale?: number): Promise<string>`
     - `exportPdf(pages: ExportPageSpec[]): Promise<Uint8Array>`
     - `createDownloadLink(pdfBytes: Uint8Array, filename: string): void`
   - Worker configuration: Configured `pdfjs-dist` `GlobalWorkerOptions.workerSrc` using Vite local asset import `import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.js?url';` with environment fallback for Node/Vitest fake worker.

2. **`src/vite-env.d.ts`**
   - Added Vite client type reference (`/// <reference types="vite/client" />`) and declaration for `*?url` modules to ensure strict TypeScript compilation (`npx tsc --noEmit`) passes without errors.

3. **`tests/unit/pdfEngine.test.ts`**
   - Comprehensive Vitest unit test suite (10 test cases) covering all engine functions and edge cases:
     - Synthetic PDF loading (File, ArrayBuffer, Uint8Array) and metadata/page extraction.
     - Thumbnail rendering with canvas 2D context stubs.
     - Rotation angles (0°, 90°, 180°, 270°).
     - Page reordering and deletion.
     - Multi-document PDF merging.
     - Exported PDF bytes roundtrip verification using `pdf-lib` and `loadPdfDocument`.
     - Download link DOM anchor creation and triggering.

### Modified Files
1. **`tests/unit/setup.ts`**
   - Enhanced `HTMLCanvasElement.prototype.getContext('2d')` mock to include `canvas: this`, `getTransform`, `resetTransform`, and full 2D context stubs required by `pdfjs-dist` `CanvasGraphics` when executing under `jsdom`.

---

## 2. Technical Decisions & Rationale

- **Library Separation**:
  - `pdf-lib` handles structural PDF manipulation (loading, page extraction, rotation degrees, merging, saving Uint8Array).
  - `pdfjs-dist` handles rendering page vectors into HTML5 canvas stubs and returning JPEG Data URLs.
- **Offline Asset Guarantee**:
  - `pdfjs-dist/build/pdf.worker.min.js?url` guarantees Vite bundles the worker JS file locally (`dist/assets/pdf.worker-[hash].js`), ensuring zero external HTTP/CDN requests.
- **Test Synthetic PDF Generation**:
  - Used `createSamplePdf` from `tests/unit/pdfHelpers.ts` to dynamically generate test PDFs in memory, ensuring fast, deterministic, reproducible test execution.

---

## 3. Verification Results

- **Unit Tests (`npx vitest run`)**: 100% Pass (13 passed across 2 test files).
- **TypeScript Type Check (`npx tsc --noEmit`)**: 0 errors.
- **Vite Build (`npm run build`)**: Pass, generated `dist/assets/pdf.worker-CV_uJcFn.js`.
