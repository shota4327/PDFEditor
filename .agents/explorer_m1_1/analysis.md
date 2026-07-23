# PDFEditor Setup & Architecture Analysis (Milestone 1)

**Author:** Explorer 1 (Milestone 1 Setup & Architecture)  
**Date:** 2026-07-22  
**Status:** Completed Analysis  
**Project Root:** `c:/Users/saito/OneDrive/60  ツール/Git/PDFEditor/`  

---

## 1. Executive Summary

PDFEditor is a 100% client-side, browser-based offline PDF editor single-page web application (SPA).
The key requirement is **zero external HTTP API calls** during runtime, ensuring privacy, offline execution, and fast performance.

To achieve this, the architecture relies on:
- **Vite + React 18 + TypeScript** for lightweight, fast-bundling SPA framework.
- **Tailwind CSS + Lucide Icons + Framer Motion** for responsive, modern, accessible UI with smooth micro-interactions.
- **`pdf-lib`** for client-side structural PDF operations (loading documents, extracting pages, rotating pages, deleting pages, merging pages, saving Uint8Array).
- **`pdfjs-dist`** for rendering PDF pages into HTML5 `<canvas>` elements to extract image thumbnails (Data URLs) completely offline.
- **`@hello-pangea/dnd`** (or `@dnd-kit`) for intuitive drag-and-drop thumbnail reordering and multi-file drag-and-drop upload zone.
- **Vitest & Playwright** for unit tests (`tests/unit/pdfEngine.test.ts`) and end-to-end tests (`tests/e2e/pdfEditor.spec.ts`).

---

## 2. Package Dependencies Analysis (`package.json`)

### 2.1 Dependency Breakdown

#### Core Dependencies
- **`react` & `react-dom`** (`^18.3.1`): Stable, compatible foundation for drag-and-drop libraries and UI state management.
- **`pdf-lib`** (`^1.17.1`): Pure JS/TS PDF manipulation library. Operates on `Uint8Array` / `ArrayBuffer`.
- **`pdfjs-dist`** (`^3.11.174`): Mozilla's PDF rendering library. Used for rendering PDF pages to HTML5 Canvas.
- **`lucide-react`** (`^0.450.0`): Icon set for UI buttons (rotate, delete, download, upload, reorder handles).
- **`framer-motion`** (`^11.11.0`): Animation library for thumbnail grid transitions, drop zone hover states, and modal/toolbar animations.
- **`@hello-pangea/dnd`** (`^16.6.0`): Maintained React 18 friendly fork of `react-beautiful-dnd` for drag-and-drop grid list reordering.

#### Development Dependencies
- **`vite`** (`^5.4.0`): ESM-first build tool and development server.
- **`@vitejs/plugin-react`** (`^4.3.0`): React Fast Refresh plugin for Vite.
- **`typescript`** (`^5.6.0`): Static typing across all modules.
- **`@types/react` & `@types/react-dom` & `@types/node`**: TypeScript type definitions.
- **`tailwindcss`** (`^3.4.14`), **`postcss`** (`^8.4.47`), **`autoprefixer`** (`^10.4.20`): Tailwind CSS v3 utility pipeline.
- **`vitest`** (`^2.1.0`), **`@testing-library/react`** (`^16.0.0`), **`@testing-library/jest-dom`** (`^6.6.0`), **`jsdom`** (`^25.0.0`): Vitest unit testing framework.
- **`@playwright/test`** (`^1.48.0`): E2E test runner for browser automation testing.

### 2.2 Recommended `package.json` Blueprint

```json
{
  "name": "pdf-editor",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:e2e": "playwright test"
  },
  "dependencies": {
    "@hello-pangea/dnd": "^16.6.0",
    "framer-motion": "^11.11.0",
    "lucide-react": "^0.450.0",
    "pdf-lib": "^1.17.1",
    "pdfjs-dist": "3.11.174",
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "@playwright/test": "^1.48.0",
    "@testing-library/jest-dom": "^6.6.0",
    "@testing-library/react": "^16.0.0",
    "@types/node": "^22.7.0",
    "@types/react": "^18.3.10",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.2",
    "autoprefixer": "^10.4.20",
    "jsdom": "^25.0.1",
    "postcss": "^8.4.47",
    "tailwindcss": "^3.4.14",
    "typescript": "^5.6.2",
    "vite": "^5.4.8",
    "vitest": "^2.1.2"
  }
}
```

*Note:* `pdfjs-dist` version is explicitly locked to `3.11.174` (or exact matching version) to prevent worker asset mismatch between host library and worker bundle.

---

## 3. Vite Configuration Analysis (`vite.config.ts`)

### 3.1 Key Requirements
1. **Path Alias**: Map `@/` to `src/` for clean imports.
2. **Vitest Integration**: Configure unit testing environment (`jsdom`, setup files, glob pattern `tests/unit/**/*.test.ts`).
3. **Asset Handling**: Support worker script bundling for `pdfjs-dist`.

### 3.2 Recommended `vite.config.ts` Blueprint

```typescript
/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  optimizeDeps: {
    include: ['pdfjs-dist'],
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/unit/setup.ts'],
    include: ['tests/unit/**/*.test.ts', 'tests/unit/**/*.test.tsx'],
  },
});
```

---

## 4. TypeScript Configuration Analysis

### 4.1 Root `tsconfig.json` Blueprint

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "useDefineForClassFields": true,
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,

    /* Bundler mode */
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",

    /* Linting & Strictness */
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,

    /* Path Aliasing */
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": ["src", "tests"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

### 4.2 `tsconfig.node.json` Blueprint

```json
{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true
  },
  "include": ["vite.config.ts", "playwright.config.ts"]
}
```

---

## 5. PostCSS & Tailwind CSS Setup

### 5.1 `tailwind.config.js` Blueprint

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
        }
      }
    },
  },
  plugins: [],
}
```

### 5.2 `postcss.config.js` Blueprint

```javascript
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

### 5.3 `src/index.css` Blueprint

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  @apply bg-slate-50 text-slate-900 antialiased min-h-screen;
}
```

---

## 6. HTML Entry Shell (`index.html`)

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>PDFEditor - Offline Client-Side PDF Tools</title>
  </head>
  <body class="bg-slate-50 min-h-screen">
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

---

## 7. PDF Engine Architecture (`pdf-lib` & `pdfjs-dist`)

### 7.1 Separation of Concerns
The application uses two distinct PDF engines for optimal offline performance:
1. **`pdf-lib`**: Handles structural mutations.
   - Parsing PDF bytes (`PDFDocument.load`).
   - Extracting/copying pages into new documents (`PDFDocument.create()`, `copyPages`).
   - Rotating pages (`page.setRotation(degrees(currentRotation + angle))`).
   - Deleting pages (`doc.removePage(index)`).
   - Merging pages across multiple PDF files.
   - Serializing final document into `Uint8Array` (`doc.save()`).

2. **`pdfjs-dist`**: Handles client-side rendering.
   - Loading PDF document into PDF.js worker.
   - Rendering individual pages to an offscreen `<canvas>` context.
   - Converting the canvas content into a Data URL (`canvas.toDataURL('image/jpeg', 0.8)`).
   - Passing thumbnail image strings to React UI for fast rendering without keeping active WebGL/canvas contexts in DOM memory.

### 7.2 Offline Worker Bundling Strategy for `pdfjs-dist`

To guarantee 100% offline operation without CDN network requests:
In Vite, `pdfjs-dist` worker can be imported directly using Vite's `?url` query parameter.

```typescript
import * as pdfjsLib from 'pdfjs-dist';

// Explicitly set offline worker binary bundled by Vite asset pipeline
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.js?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;
```

**Why this works:**
- During `vite dev`, Vite serves `pdf.worker.min.js` directly from node_modules over local dev server (`http://localhost:5173/@fs/.../pdf.worker.min.js`).
- During `vite build`, Vite copies `pdf.worker.min.js` into `dist/assets/pdf.worker-[hash].js` and replaces the `pdfjsWorker` variable with the local relative asset URL.
- Zero network requests to `cdnjs.cloudflare.com` or `unpkg.com`.

### 7.3 Interface Contract (`src/services/pdfEngine.ts`)

As specified in `PROJECT.md`, `pdfEngine.ts` must expose:

```typescript
import { PdfPageInfo, PdfDocumentData, ExportPageSpec } from '@/types/pdf';

export async function loadPdfDocument(file: File | ArrayBuffer): Promise<PdfDocumentData>;
export async function renderPageThumbnail(pdfBytes: Uint8Array, pageIndex: number, scale?: number): Promise<string>;
export async function exportPdf(pages: ExportPageSpec[]): Promise<Uint8Array>;
export function createDownloadLink(pdfBytes: Uint8Array, filename: string): void;
```

#### TypeScript Types (`src/types/pdf.ts`) Blueprint

```typescript
export interface PdfPageInfo {
  id: string;            // Unique identifier for grid keying (e.g. `${fileId}_page_${pageIndex}_${timestamp}`)
  fileId: string;        // ID of source document
  fileName: string;      // Original filename
  pageIndex: number;     // Original 0-based page index in source document
  rotation: number;      // Rotation angle in degrees (0, 90, 180, 270)
  thumbnailUrl: string;  // Data URL (image/jpeg) of page thumbnail
  pdfBytes: Uint8Array;  // Raw source PDF bytes
}

export interface PdfDocumentData {
  id: string;
  name: string;
  pageCount: number;
  pages: PdfPageInfo[];
}

export interface ExportPageSpec {
  pdfBytes: Uint8Array;
  pageIndex: number;
  rotation: number;
}
```

---

## 8. Unit & E2E Testing Infrastructure Setup

### 8.1 Unit Testing (`tests/unit/`)
- Tool: **Vitest** + **@testing-library/react** + **jsdom**
- Setup File (`tests/unit/setup.ts`):
  ```typescript
  import '@testing-library/jest-dom';

  // Mocking HTMLCanvasElement getContext for pdfjs-dist in jsdom environment if necessary
  if (typeof HTMLCanvasElement !== 'undefined') {
    HTMLCanvasElement.prototype.getContext = Vitest.fn().mockReturnValue({
      fillRect: () => {},
      clearRect: () => {},
      getImageData: () => ({ data: [] }),
      putImageData: () => {},
      createImageData: () => ([]),
      setTransform: () => {},
      drawImage: () => {},
      save: () => {},
      fillText: () => {},
      restore: () => {},
      beginPath: () => {},
      moveTo: () => {},
      lineTo: () => {},
      closePath: () => {},
      stroke: () => {},
      translate: () => {},
      scale: () => {},
      rotate: () => {},
      arc: () => {},
      fill: () => {},
    });
  }
  ```

### 8.2 End-to-End Testing (`tests/e2e/` & `playwright.config.ts`)

#### `playwright.config.ts` Blueprint

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
  },
});
```

---

## 9. Verification & Invalidation Criteria

### 9.1 Verification Steps
1. Verify `package.json` contains locked versions for `pdfjs-dist` and core UI libraries.
2. Verify `vite.config.ts` alias `@` maps to `./src` and Vitest jsdom setup is configured.
3. Verify `pdfjs-dist` worker import syntax (`pdfjs-dist/build/pdf.worker.min.js?url`) avoids external CDN calls.
4. Verify `tsconfig.json` enables React JSX, strict mode, and path mapping.

### 9.2 Invalidation Conditions
- If `pdfjs-dist` throws a worker CORS / CDN fetching error, the worker path configuration must be updated.
- If React 19 is used with `@hello-pangea/dnd`, peer dependency conflicts may occur; React 18 is recommended.

---

## 10. Implementation Plan Recommendations for Implementer 1

1. **Step 1**: Write root configuration files: `package.json`, `vite.config.ts`, `tsconfig.json`, `tsconfig.node.json`, `tailwind.config.js`, `postcss.config.js`, `index.html`.
2. **Step 2**: Create application source tree: `src/main.tsx`, `src/App.tsx`, `src/index.css`, `src/types/pdf.ts`.
3. **Step 3**: Create test setup files: `tests/unit/setup.ts`, `tests/unit/pdfEngine.test.ts` (stub), `playwright.config.ts`, `tests/e2e/pdfEditor.spec.ts` (stub).
4. **Step 4**: Run `npm install` and run `npm run dev` & `npm test` to verify build & test environment.

---
