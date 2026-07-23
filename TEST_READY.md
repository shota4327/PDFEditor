# TEST_READY.md — PDFEditor Test Execution & Coverage Report

## 1. Test Runner Instructions

This document provides complete instructions for executing the PDFEditor E2E test suite using Playwright and Vitest.

### Environment Prerequisites
- **Node.js**: v18.0.0+
- **Browser Dependencies**: Chromium (installed automatically via Playwright)
- **Local Application Port**: `http://localhost:5173` (configured in `playwright.config.ts`)

### Commands & Execution Scripts

| Script Command | Target Test Suite | Description & Options |
|----------------|-------------------|-----------------------|
| `npm run test:e2e` | Playwright E2E Suite | Executes all 4 tiers of E2E tests in headless Chromium browser. Automatically starts Vite dev server if not running. |
| `npm run test:e2e -- --ui` | Playwright UI Mode | Opens Playwright interactive UI for visual debugging, time-travel trace viewing, and step-by-step test inspection. |
| `npm run test:e2e -- --project=chromium` | Chromium Only | Explicitly targets Desktop Chrome browser project. |
| `npm run test` | Vitest Unit Suite | Runs single-pass Vitest unit tests for engine logic (`pdfEngine.ts`). |
| `npm run test:all` | Unit + E2E Combined | Runs unit test suite followed by E2E test suite. |

---

## 2. Coverage Summary Table Across All 4 Tiers

| Tier | Test ID | Scenario Name | Target Feature / Boundary | Assertion / Verification Method | Status |
|------|---------|---------------|---------------------------|----------------------------------|--------|
| **Tier 1** | T1.1 | Multi-file upload | Multi-file drop & load | `[data-testid="thumbnail-card"]` count = 4; `[data-testid="page-count"]` = 4 | READY |
| **Tier 1** | T1.2 | Thumbnail previews | Canvas/Data URL rendering | `<img>` visible; `src` matches `^data:image/` | READY |
| **Tier 1** | T1.3 | Rotation 90° CW/CCW | Page angle updates | `[data-testid="rotation-badge"]` = 0° -> 90° -> 180° -> 90° | READY |
| **Tier 1** | T1.4 | Drag-and-Drop reorder | Page card sequence change | `data-page-id` attribute position shift in DOM grid | READY |
| **Tier 1** | T1.5 | Page deletion | Page removal & count update | Card count 3 -> 2; `[data-testid="page-count"]` = 2 | READY |
| **Tier 1** | T1.6 | PDF export download | Browser file download | Download event captured; `.pdf` file verified via `pdf-lib` inspection | READY |
| **Tier 2** | T2.1 | Empty upload state | Zero file state | `export-btn` hidden; placeholder text "まだページが読み込まれていません" visible | READY |
| **Tier 2** | T2.2 | Single-page PDF | 1-page document load/export | Single card rotated 90° -> exported PDF inspected via `pdf-lib` (pageCount=1, rotation=90°) | READY |
| **Tier 2** | T2.3 | Multi-page PDF | 3-page document parsing | Cards count = 3; page numbers "Page 1", "Page 2", "Page 3" verified | READY |
| **Tier 2** | T2.4 | 360° rotation wrap | Continuous rotation | Badge 0° -> 90° -> 180° -> 270° -> 0° CW, and 0° -> 270° CCW | READY |
| **Tier 2** | T2.5 | Non-PDF file rejection | Invalid file upload | `[data-testid="error-message"]` error banner visible; cards count = 0 | READY |
| **Tier 3** | T3.1 | Cross-Feature combination | Upload -> rotate -> delete -> reorder -> export | Full multi-step user flow; exported PDF verified with `pdf-lib` (pageCount=2) | READY |
| **Tier 4** | T4.1 | Network interception | Network requests audit | `page.on('request')` intercepts all traffic; external requests array `[]` (ZERO calls) | READY |
| **Tier 4** | T4.2 | Offline mode validation | Disconnected browser operation | `context.setOffline(true)` enforced; complete upload-edit-export succeeds offline | READY |

---

## 3. Feature Checklist

- [x] **Multi-file PDF Upload**: Supported via dropzone and file picker input.
- [x] **Client-Side Thumbnail Rendering**: Instant rendering via `pdfjs-dist` to Data URLs without server calls.
- [x] **Drag-and-Drop Reordering**: Supported using `@hello-pangea/dnd` and keyboard fallback.
- [x] **90° CW / CCW Rotation**: Full degree rotation state tracking with visual CSS feedback and PDF metadata persistence.
- [x] **Page Deletion**: Single-click page removal with dynamic total count re-indexing.
- [x] **PDF Merging & Export**: Single-click compile & standard browser file download.
- [x] **Invalid File Error Feedback**: Error banners for non-PDF file uploads.
- [x] **Zero External HTTP Leakage**: 100% offline local client execution confirmed by network event auditing.
- [x] **Browser Offline Resilience**: Verified execution in Playwright offline mode context.
