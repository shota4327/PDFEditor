# Project Orchestration Plan: Client-Side Offline PDF Editor (Follow-up Phase)

## Goal
Address user follow-up requirements:
1. Fix drag-and-drop layout overlap bug in grid view.
2. Add preview zoom controls (Zoom In, Zoom Out, Reset) to Toolbar/Grid with dynamic thumbnail sizing.
3. Update and pass all Vitest unit tests and Playwright E2E tests (covering drag&drop, zoom, rotate, delete, PDF export).

## Decomposition Strategy & Milestones

### Milestone 7 (M7): Drag & Drop Overlap Fix & Zoom Control Feature
- **Scope**:
  - Investigate `ThumbnailGrid.tsx`, `ThumbnailCard.tsx`, `@hello-pangea/dnd` / `dnd-kit` grid styling, transform styles, CSS transitions, and item layout.
  - Fix element positioning / transform overflow so dragging cards displacement is smooth and cards never overlap.
  - Implement Zoom Controls (Zoom In, Zoom Out, Reset) in `Toolbar.tsx` or grid header.
  - Dynamically scale thumbnail card sizes (grid column minimum widths or pixel dimensions) smoothly without breaking layout, drag handle, or causing visual overlap at any zoom scale (e.g. 50% to 200%).
- **Worker**: Worker Subagent (`teamwork_preview_worker`)

### Milestone 8 (M8): Vitest Unit & Playwright E2E Test Suite Update
- **Scope**:
  - Update unit tests in `tests/unit/` for any state or zoom/dnd helper functions.
  - Expand E2E tests in `tests/e2e/pdfEditor.spec.ts` covering:
    - Drag & drop page reordering without overlap / verifying reordered page sequence.
    - Zoom In, Zoom Out, Reset controls and verifying thumbnail size changes.
    - Page rotation (clockwise & counterclockwise).
    - Page deletion.
    - PDF merging and export download verification.
- **Worker**: Worker Subagent (`teamwork_preview_worker`)

### Milestone 9 (M9): E2E Verification, Challenger Stress Test & Forensic Integrity Audit
- **Scope**:
  - Execute Vitest and Playwright test runs.
  - Challenger stress test for zoom + DnD interaction, layout stability, edge cases.
  - Forensic Auditor check for zero integrity violations.
- **Subagents**: Challenger (`teamwork_preview_challenger`), Forensic Auditor (`teamwork_preview_auditor`)

## Dispatch Topology
1. Dispatch Explorers to analyze DnD overlap cause, zoom control implementation strategy, and existing test setup.
2. Dispatch Worker for M7 & M8 implementations.
3. Dispatch Reviewers / Challengers for verification.
4. Dispatch Forensic Auditor for integrity check.
