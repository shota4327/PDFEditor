# Context & Decision Log

## Overview
PDFEditor is a modern, responsive, 100% offline client-side web application for PDF document editing.

## Technical Architecture Selection
- **Framework**: React 18 / 19 + TypeScript + Vite
- **Styling**: Tailwind CSS + Lucide Icons + Framer Motion (smooth micro-animations)
- **PDF Core**: `pdf-lib` (PDF manipulation, merge, page extract, rotation, export) + `pdfjs-dist` (PDF rendering to canvas/thumbnails completely offline)
- **Drag-and-Drop**: HTML5 Drag & Drop or `@hello-pangea/dnd` / `@dnd-kit/core`
- **Testing**: Vitest (Unit tests) + Playwright (E2E tests)

## Constraints & Requirements
1. 100% Client-Side Offline: PDF parsing, rendering, manipulation, and download take place in browser memory with zero network traffic.
2. Drag & Drop: Drag multiple files to load; drag thumbnail cards to reorder pages.
3. Page Controls: 90° rotation (clockwise & counterclockwise), page deletion, multi-file merging.
4. UI/UX: Dark mode / modern color palette, responsive, mouse/touch fully supported.
