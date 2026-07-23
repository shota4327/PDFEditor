# Changes Report: Non-PDF Upload Error Notification Bugfix

## Executive Summary
This document details the code modification performed in `src/components/DropZone.tsx` and `src/components/Toolbar.tsx` to fix the non-PDF upload error notification suppression bug identified by Challenger 2 (`challenge.md`).

## Defect Summary
- **Component**: `src/components/DropZone.tsx`
- **Issue**: Previously, `handleFiles` filtered input files for `application/pdf` or `.pdf` extension into `files`. If non-PDF files (or 0 valid PDF files) were uploaded or dropped, `files.length` was `0`. The original code evaluated `if (files.length > 0)` before calling `onFilesSelected(files)`, causing `onFilesSelected([])` to NEVER be called.
- **Impact**: `App.tsx`'s `handleFilesSelected` handler was never invoked, so its `if (files.length === 0)` branch (which sets `errorMessage` to `'無効なファイル形式です。PDFファイルをアップロードしてください。'`) was bypassed. Consequently, `errorMessage` remained `null`, `[data-testid="error-message"]` notice was not rendered in the UI, and E2E test `T2.5` failed.

## Modifications Made

### 1. `src/components/DropZone.tsx`
- **File Path**: `src/components/DropZone.tsx`
- **Lines Modified**: Lines 24–35
- **Original Code**:
```typescript
  const handleFiles = (fileList: FileList | File[]) => {
    const files = Array.from(fileList).filter(
      (file) => file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
    );

    if (files.length > 0) {
      if (onFilesSelected) onFilesSelected(files);
      if (onFilesAdded) onFilesAdded(files);
    }
  };
```
- **Updated Code**:
```typescript
  const handleFiles = (fileList: FileList | File[]) => {
    const files = Array.from(fileList).filter(
      (file) => file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
    );

    if (onFilesSelected) {
      onFilesSelected(files);
    }
    if (onFilesAdded && onFilesAdded !== onFilesSelected) {
      onFilesAdded(files);
    }
  };
```

### 2. `src/components/Toolbar.tsx`
- **File Path**: `src/components/Toolbar.tsx`
- **Lines Modified**: Lines 28–30
- **Original Code**:
```typescript
      if (files.length > 0 && onAddFiles) {
        onAddFiles(files);
      }
```
- **Updated Code**:
```typescript
      if (onAddFiles) {
        onAddFiles(files);
      }
```

## Detailed Rationale & Verification
1. **Error Notification Handling**: When non-PDF files are dropped/uploaded, `onFilesSelected(files)` is invoked with `files = []`. In `App.tsx`:
   ```typescript
   const handleFilesSelected = async (files: File[]) => {
     if (files.length === 0) {
       setErrorMessage('無効なファイル形式です。PDFファイルをアップロードしてください。');
       return;
     }
   ```
   `App.tsx` sets `errorMessage`, which is passed to `<DropZone errorMessage={errorMessage} ... />`.
2. **UI Error Notice Rendering**: `DropZone.tsx` renders `<div data-testid="error-message">` whenever `errorMessage` is set, satisfying E2E test `T2.5`.
3. **Dual Callback Safeguard**: Checks `onFilesAdded !== onFilesSelected` to prevent duplicate invocations when both props point to the same handler function in `App.tsx`.
