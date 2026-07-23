# TEST_INFRA.md — PDFEditor Testing Methodology & Architecture

## 1. Opaque-Box Requirement-Driven Testing Methodology

The testing strategy for PDFEditor is built upon an **opaque-box (black-box) requirement-driven testing methodology**. 

### Core Principles:
- **Zero Internal Knowledge Coupling**: Tests interact strictly with the application via user-facing interfaces (DOM events, button clicks, file inputs, download events, and network boundaries). Tests do not mock or depend on React internal state, internal functions, or sub-component properties.
- **Requirement-Driven Verification**: Every test case directly verifies a requirement specified in `PROJECT.md` and user workflows.
- **Genuine Artifact Validation**: Instead of mocking the PDF export module or assuming output correctness, exported PDF files are downloaded during Playwright test runs and inspected using `pdf-lib` to verify physical page counts, page rotation metadata, and binary integrity.
- **Strict Network & Offline Auditing**: External HTTP request listeners (`page.on('request')`) and Playwright offline context setting (`context.setOffline(true)`) enforce the core architectural constraint: **100% offline client-side execution with ZERO external data leakage**.

---

## 2. Feature Inventory

| Feature ID | Category | Feature Description | User Interface Trigger | Expected Behavior |
|------------|----------|---------------------|------------------------|-------------------|
| **FEAT-01** | Upload | Multi-File Upload | Drag & Drop onto `[data-testid="dropzone"]` or input file via `[data-testid="file-input"]` | All pages from uploaded PDFs are rendered as thumbnail cards in order. |
| **FEAT-02** | Preview | Page Thumbnail Previews | Grid container `[data-testid="thumbnail-grid"]` | Render HTML5 Canvas/Data URL image preview for each page with page badge and filename. |
| **FEAT-03** | Manipulation | 90° Clockwise Rotation | Button `[data-testid="rotate-cw-btn"]` on thumbnail card | Increments page rotation angle by +90° (0° -> 90° -> 180° -> 270° -> 0° wrap). |
| **FEAT-04** | Manipulation | 90° Counter-Clockwise Rotation | Button `[data-testid="rotate-ccw-btn"]` on thumbnail card | Decrements page rotation angle by -90° (0° -> 270° -> 180° -> 90° -> 0° wrap). |
| **FEAT-05** | Manipulation | Drag-and-Drop Reorder | Drag handle `[data-testid="drag-handle"]` on thumbnail card | Reorders pages within the grid and updates the output sequence accordingly. |
| **FEAT-06** | Manipulation | Page Deletion | Button `[data-testid="delete-page-btn"]` on thumbnail card | Removes page from grid, updates total page count indicator. |
| **FEAT-07** | Export | PDF Export & Download | Button `[data-testid="export-btn"]` in toolbar | Merges, rotates, and compiles pages into a single PDF binary and triggers standard browser download. |
| **FEAT-08** | Boundary | Empty Upload State | Initial page load without files | Dropzone displayed; Toolbar & Export buttons disabled/hidden; zero page cards. |
| **FEAT-09** | Security | Non-PDF File Rejection | Drag or upload invalid file (e.g. `.txt`) | Displays Japanese error alert (`[data-testid="error-message"]`) and rejects loading. |
| **FEAT-10** | Offline | Network Isolation Audit | Any UI operation during app lifecycle | Zero HTTP/HTTPS requests to external hosts (only `localhost`/`127.0.0.1`/`data:`/`blob:` permitted). |

---

## 3. 4-Tier Coverage Plan

Our E2E test suite in `tests/e2e/pdfEditor.spec.ts` is organized into 4 distinct tiers:

### Tier 1: Feature Coverage
Focuses on verifying each individual feature independently under standard operating conditions.
- **T1.1 Multi-File Upload**: Uploading 1-page and 3-page PDFs simultaneously populates 4 thumbnail cards and updates page count indicator to `4`.
- **T1.2 Thumbnail Previews**: Verifies `<img>` elements in thumbnail cards render valid `data:image/` Data URLs.
- **T1.3 Rotation Controls**: Verifies clicking CW (+90°) and CCW (-90°) updates `[data-testid="rotation-badge"]` and `data-rotation` DOM attributes.
- **T1.4 Drag-and-Drop Reordering**: Verifies dragging page cards updates sequence order in the grid.
- **T1.5 Page Deletion**: Verifies deleting a page removes card DOM element and updates total page count.
- **T1.6 PDF Export Download**: Verifies clicking Export triggers browser download of a valid `.pdf` file.

### Tier 2: Boundary & Corner Cases
Focuses on edge cases, invalid inputs, state transitions, and numerical boundary conditions.
- **T2.1 Empty State**: Verifies initial page load renders empty state notice ("まだページが読み込まれていません") and hides export toolbar.
- **T2.2 Single-Page PDF**: Verifies loading, rotating, and exporting a 1-page PDF.
- **T2.3 Multi-Page PDF**: Verifies loading and indexing a 3-page PDF with correct sequential page numbers (`Page 1`, `Page 2`, `Page 3`).
- **T2.4 360° Rotation Wrap**: Verifies rotation wrap-around (0° -> 90° -> 180° -> 270° -> 0° CW, and 0° -> 270° CCW).
- **T2.5 Non-PDF File Handling**: Verifies uploading `.txt` file triggers `[data-testid="error-message"]` ("無効なファイル形式です...") and keeps page list empty.

### Tier 3: Cross-Feature Combinations
Focuses on complex multi-step workflows representing realistic user editing sessions.
- **T3.1 End-to-End Edit Workflow**:
  1. Multi-file upload (`sample-1page.pdf` + `sample-2pages.pdf` = 3 pages).
  2. Rotate Page 1 by 90° CW.
  3. Rotate Page 3 by 180° CW.
  4. Delete Page 2 (reducing total to 2 pages).
  5. Reorder remaining pages.
  6. Export PDF download.
  7. Audit exported PDF file via `inspectPdfFile()` (`pdf-lib`) to confirm exact page count (2) and rotation attributes.

### Tier 4: Real-World Scenarios & Offline Validation
Focuses on strict non-functional constraints, privacy guarantees, and network resilience.
- **T4.1 Zero External HTTP Requests**: Listens to all browser `request` events during an entire edit workflow. Asserts `externalRequests` list is strictly empty (`[]`).
- **T4.2 Full Offline Operation**: Invokes `context.setOffline(true)` before file upload and performs full upload-rotate-delete-export flow while completely offline. Verifies PDF export succeeds without network connectivity.

---

## 4. Test Architecture & Directory Structure

```
PDFEditor/
├── TEST_INFRA.md                  # Testing methodology & architecture documentation
├── TEST_READY.md                  # Test runner instructions & coverage summary
├── playwright.config.ts           # Playwright E2E configuration & dev webServer launch
├── tests/
│   ├── unit/                      # Vitest unit test suite
│   └── e2e/
│       ├── fixtures/              # Test sample PDFs and invalid files
│       │   ├── sample-1page.pdf
│       │   ├── sample-2pages.pdf
│       │   ├── sample-3pages.pdf
│       │   └── invalid-file.txt
│       ├── helpers/
│       │   ├── fixtureGenerator.ts # Generates test PDF files using pdf-lib on setup
│       │   └── pdfInspect.ts       # Independent PDF binary verification helper using pdf-lib
│       └── pdfEditor.spec.ts      # Complete 4-Tier Playwright E2E test suite
```

### Key Infrastructure Helpers:
1. **`fixtureGenerator.ts`**: Uses `pdf-lib` to dynamically generate valid PDF test fixtures (`sample-1page.pdf`, `sample-2pages.pdf`, `sample-3pages.pdf`) before test execution, ensuring zero reliance on external external test assets.
2. **`pdfInspect.ts`**: Provides `inspectPdfFile(filePath)` to parse downloaded output PDFs using `pdf-lib` to verify page counts, dimensions, and rotation angles without relying on UI assertions alone.
