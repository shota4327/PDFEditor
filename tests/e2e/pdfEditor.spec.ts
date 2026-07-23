import { test, expect } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';
import { ensureFixturesExist } from './helpers/fixtureGenerator';
import { inspectPdfFile } from './helpers/pdfInspect';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const FIXTURES_DIR = path.resolve(__dirname, './fixtures');
const SAMPLE_1PAGE = path.join(FIXTURES_DIR, 'sample-1page.pdf');
const SAMPLE_2PAGES = path.join(FIXTURES_DIR, 'sample-2pages.pdf');
const SAMPLE_3PAGES = path.join(FIXTURES_DIR, 'sample-3pages.pdf');
const INVALID_FILE = path.join(FIXTURES_DIR, 'invalid-file.txt');

test.beforeAll(async () => {
  await ensureFixturesExist();
});

test.describe('PDFEditor E2E Test Suite (Tiers 1 - 4)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  // =========================================================================
  // Tier 1: Feature Coverage
  // =========================================================================
  test.describe('Tier 1: Feature Coverage', () => {
    test('T1.1: Multi-file upload loads all pages into grid', async ({ page }) => {
      const fileInput = page.locator('input[data-testid="file-input"]');
      await fileInput.setInputFiles([SAMPLE_1PAGE, SAMPLE_3PAGES]);

      // Expect 4 total thumbnail cards (1 from sample-1page + 3 from sample-3pages)
      const cards = page.locator('[data-testid="thumbnail-card"]');
      await expect(cards).toHaveCount(4, { timeout: 10000 });

      // Page counter element displays "4"
      const pageCountBadge = page.locator('[data-testid="page-count"]');
      await expect(pageCountBadge).toHaveText('4');
    });

    test('T1.2: Thumbnail previews render Data URLs for uploaded pages', async ({ page }) => {
      const fileInput = page.locator('input[data-testid="file-input"]');
      await fileInput.setInputFiles([SAMPLE_2PAGES]);

      const cards = page.locator('[data-testid="thumbnail-card"]');
      await expect(cards).toHaveCount(2, { timeout: 10000 });

      for (let i = 0; i < 2; i++) {
        const thumbnailImg = cards.nth(i).locator('img[data-testid="thumbnail-img"]');
        await expect(thumbnailImg).toBeVisible();
        const src = await thumbnailImg.getAttribute('src');
        expect(src).toBeTruthy();
        expect(src).toMatch(/^data:image\//);
      }
    });

    test('T1.3: Rotation 90° clockwise and counter-clockwise updates badges', async ({ page }) => {
      const fileInput = page.locator('input[data-testid="file-input"]');
      await fileInput.setInputFiles([SAMPLE_1PAGE]);

      const cards = page.locator('[data-testid="thumbnail-card"]');
      await expect(cards).toHaveCount(1, { timeout: 10000 });

      const card = cards.first();
      await expect(card).toBeVisible();

      const rotationBadge = card.locator('[data-testid="rotation-badge"]');
      await expect(rotationBadge).toHaveText('0°');
      await expect(card).toHaveAttribute('data-rotation', '0');

      // Click clockwise (+90°)
      const rotateCwBtn = card.locator('[data-testid="rotate-cw-btn"]');
      await rotateCwBtn.click();
      await expect(rotationBadge).toHaveText('90°');
      await expect(card).toHaveAttribute('data-rotation', '90');

      // Click clockwise (+90°) again -> 180°
      await rotateCwBtn.click();
      await expect(rotationBadge).toHaveText('180°');
      await expect(card).toHaveAttribute('data-rotation', '180');

      // Click counter-clockwise (-90°) -> back to 90°
      const rotateCcwBtn = card.locator('[data-testid="rotate-ccw-btn"]');
      await rotateCcwBtn.click();
      await expect(rotationBadge).toHaveText('90°');
      await expect(card).toHaveAttribute('data-rotation', '90');
    });

    test('T1.4: Drag & Drop Page Reordering (reorders DOM cards & binary export)', async ({ page }) => {
      const fileInput = page.locator('input[data-testid="file-input"]');
      await fileInput.setInputFiles([SAMPLE_3PAGES]);

      const cards = page.locator('[data-testid="thumbnail-card"]');
      await expect(cards).toHaveCount(3, { timeout: 10000 });

      // Rotate Page 1 (index 0) by 90° to give it a distinct rotation marker
      await cards.nth(0).locator('[data-testid="rotate-cw-btn"]').click();
      await expect(cards.nth(0).locator('[data-testid="rotation-badge"]')).toHaveText('90°');

      const firstCardBeforeId = await cards.nth(0).getAttribute('data-page-id');

      // Perform reorder operation using keyboard navigation supported by @hello-pangea/dnd
      const sourceHandle = cards.nth(0).locator('[data-testid="drag-handle"]');
      await sourceHandle.focus();
      await page.keyboard.press('Space');
      await page.keyboard.press('ArrowRight');
      await page.keyboard.press('Space');

      // Verify DOM card sequence updated
      const firstCardAfterId = await cards.nth(0).getAttribute('data-page-id');
      expect(firstCardAfterId).not.toBe(firstCardBeforeId);
      await expect(cards.nth(1).locator('[data-testid="rotation-badge"]')).toHaveText('90°');

      // Export PDF and verify binary page order via pdfInspect
      const downloadPromise = page.waitForEvent('download');
      await page.locator('[data-testid="export-btn"]').click();
      const download = await downloadPromise;

      const tempPath = await download.path();
      expect(tempPath).toBeTruthy();

      if (tempPath) {
        const inspectResult = await inspectPdfFile(tempPath);
        expect(inspectResult.pageCount).toBe(3);
        // Page index 1 should now hold the 90° rotated page
        expect(inspectResult.rotations[1]).toBe(90);
      }
    });

    test('T1.5: Page deletion removes specific page and updates total count', async ({ page }) => {
      const fileInput = page.locator('input[data-testid="file-input"]');
      await fileInput.setInputFiles([SAMPLE_3PAGES]);

      const cards = page.locator('[data-testid="thumbnail-card"]');
      await expect(cards).toHaveCount(3, { timeout: 10000 });

      // Delete the second page (index 1)
      const deleteBtn = cards.nth(1).locator('[data-testid="delete-page-btn"]');
      await deleteBtn.click();

      // Cards count should become 2
      await expect(cards).toHaveCount(2);
      const pageCountBadge = page.locator('[data-testid="page-count"]');
      await expect(pageCountBadge).toHaveText('2');
    });

    test('T1.6: PDF export triggers download of valid PDF file', async ({ page }) => {
      const fileInput = page.locator('input[data-testid="file-input"]');
      await fileInput.setInputFiles([SAMPLE_1PAGE]);

      const cards = page.locator('[data-testid="thumbnail-card"]');
      await expect(cards).toHaveCount(1, { timeout: 10000 });

      const exportBtn = page.locator('[data-testid="export-btn"]');
      await expect(exportBtn).toBeEnabled();

      const downloadPromise = page.waitForEvent('download');
      await exportBtn.click();
      const download = await downloadPromise;

      expect(download.suggestedFilename()).toMatch(/\.pdf$/i);

      const tempPath = await download.path();
      expect(tempPath).toBeTruthy();

      if (tempPath) {
        const inspectResult = await inspectPdfFile(tempPath);
        expect(inspectResult.pageCount).toBe(1);
        expect(inspectResult.isValidPdf).toBe(true);
      }
    });

    test('T1.7: Zoom Controls & Scaled Thumbnail Preview', async ({ page }) => {
      const fileInput = page.locator('input[data-testid="file-input"]');
      await fileInput.setInputFiles([SAMPLE_1PAGE]);

      const indicator = page.locator('[data-testid="zoom-level-indicator"]');
      await expect(indicator).toHaveText('100%');

      const cards = page.locator('[data-testid="thumbnail-card"]');
      await expect(cards).toHaveCount(1, { timeout: 10000 });

      const card = cards.first();
      const thumbnailImg = card.locator('img[data-testid="thumbnail-img"]');
      await expect(thumbnailImg).toBeVisible({ timeout: 10000 });

      const initialBox = await card.boundingBox();
      expect(initialBox).not.toBeNull();
      const initialHeight = initialBox!.height;

      const zoomInBtn = page.locator('[data-testid="zoom-in-btn"]');
      const zoomOutBtn = page.locator('[data-testid="zoom-out-btn"]');
      const zoomResetBtn = page.locator('[data-testid="zoom-reset-btn"]');

      // Click Zoom In (+25%) -> 125%
      await zoomInBtn.click();
      await expect(indicator).toHaveText('125%');
      await page.waitForTimeout(300);

      const zoomedInBox = await card.boundingBox();
      expect(zoomedInBox!.height).toBeGreaterThan(initialHeight);

      // Click Zoom In up to 200% (125 -> 150 -> 175 -> 200)
      await zoomInBtn.click(); // 150%
      await zoomInBtn.click(); // 175%
      await zoomInBtn.click(); // 200%
      await expect(indicator).toHaveText('200%');
      await expect(zoomInBtn).toBeDisabled();

      // Click Zoom Out down to 50% (200 -> 175 -> 150 -> 125 -> 100 -> 75 -> 50)
      for (let i = 0; i < 6; i++) {
        await zoomOutBtn.click();
      }
      await expect(indicator).toHaveText('50%');
      await expect(zoomOutBtn).toBeDisabled();

      // Click Zoom Reset -> 100%
      await expect(zoomResetBtn).toBeEnabled();
      await zoomResetBtn.click();
      await expect(indicator).toHaveText('100%');
      await page.waitForTimeout(300);

      const resetBox = await card.boundingBox();
      expect(Math.abs(resetBox!.height - initialHeight)).toBeLessThan(5);
    });
  });

  // =========================================================================
  // Tier 2: Boundary & Corner Cases
  // =========================================================================
  test.describe('Tier 2: Boundary & Corner Cases', () => {
    test('T2.1: Empty upload state shows placeholder notice and hides export toolbar', async ({ page }) => {
      const cards = page.locator('[data-testid="thumbnail-card"]');
      await expect(cards).toHaveCount(0);

      const exportBtn = page.locator('[data-testid="export-btn"]');
      await expect(exportBtn).toHaveCount(0); // Hidden when 0 pages

      await expect(page.getByText('まだページが読み込まれていません')).toBeVisible();
    });

    test('T2.2: Single-page PDF processing and export', async ({ page }) => {
      const fileInput = page.locator('input[data-testid="file-input"]');
      await fileInput.setInputFiles([SAMPLE_1PAGE]);

      const cards = page.locator('[data-testid="thumbnail-card"]');
      await expect(cards).toHaveCount(1, { timeout: 10000 });

      // Rotate 90° clockwise
      await cards.first().locator('[data-testid="rotate-cw-btn"]').click();
      await expect(cards.first().locator('[data-testid="rotation-badge"]')).toHaveText('90°');

      const downloadPromise = page.waitForEvent('download');
      await page.locator('[data-testid="export-btn"]').click();
      const download = await downloadPromise;

      const tempPath = await download.path();
      if (tempPath) {
        const inspectResult = await inspectPdfFile(tempPath);
        expect(inspectResult.pageCount).toBe(1);
        expect(inspectResult.rotations[0]).toBe(90);
      }
    });

    test('T2.3: Multi-page PDF parses all pages correctly', async ({ page }) => {
      const fileInput = page.locator('input[data-testid="file-input"]');
      await fileInput.setInputFiles([SAMPLE_3PAGES]);

      const cards = page.locator('[data-testid="thumbnail-card"]');
      await expect(cards).toHaveCount(3, { timeout: 10000 });

      for (let i = 0; i < 3; i++) {
        await expect(cards.nth(i).locator('[data-testid="page-number"]')).toHaveText(`Page ${i + 1}`);
      }
    });

    test('T2.4: 360° rotation wrap around (0° -> 90° -> 180° -> 270° -> 0°)', async ({ page }) => {
      const fileInput = page.locator('input[data-testid="file-input"]');
      await fileInput.setInputFiles([SAMPLE_1PAGE]);

      const cards = page.locator('[data-testid="thumbnail-card"]');
      await expect(cards).toHaveCount(1, { timeout: 10000 });

      const card = cards.first();
      const rotateCwBtn = card.locator('[data-testid="rotate-cw-btn"]');
      const rotateCcwBtn = card.locator('[data-testid="rotate-ccw-btn"]');
      const badge = card.locator('[data-testid="rotation-badge"]');

      // 0° -> 90°
      await rotateCwBtn.click();
      await expect(badge).toHaveText('90°');

      // 90° -> 180°
      await rotateCwBtn.click();
      await expect(badge).toHaveText('180°');

      // 180° -> 270°
      await rotateCwBtn.click();
      await expect(badge).toHaveText('270°');

      // 270° -> 0° (Wrap around 360°)
      await rotateCwBtn.click();
      await expect(badge).toHaveText('0°');

      // 0° CCW -> 270° (Negative wrap around)
      await rotateCcwBtn.click();
      await expect(badge).toHaveText('270°');
    });

    test('T2.5: Non-PDF file upload shows error message and rejects load', async ({ page }) => {
      const fileInput = page.locator('input[data-testid="file-input"]');
      await fileInput.setInputFiles([INVALID_FILE]);

      const errorMessage = page.locator('[data-testid="error-message"]');
      await expect(errorMessage).toBeVisible();
      await expect(errorMessage).toContainText('無効なファイル形式です。PDFファイルをアップロードしてください。');

      const cards = page.locator('[data-testid="thumbnail-card"]');
      await expect(cards).toHaveCount(0);
    });
  });

  // =========================================================================
  // Tier 3: Cross-Feature Combinations
  // =========================================================================
  test.describe('Tier 3: Cross-Feature Combinations', () => {
    test('T3.1: Full workflow (Upload multi-files -> rotate -> delete -> reorder -> export)', async ({ page }) => {
      // 1. Upload sample-1page (1 page) + sample-2pages (2 pages) -> Total 3 pages
      const fileInput = page.locator('input[data-testid="file-input"]');
      await fileInput.setInputFiles([SAMPLE_1PAGE, SAMPLE_2PAGES]);

      const cards = page.locator('[data-testid="thumbnail-card"]');
      await expect(cards).toHaveCount(3, { timeout: 10000 });

      // 2. Rotate page 1 (index 0) by 90° clockwise
      await cards.nth(0).locator('[data-testid="rotate-cw-btn"]').click();
      await expect(cards.nth(0).locator('[data-testid="rotation-badge"]')).toHaveText('90°');

      // 3. Rotate page 3 (index 2) by 180° clockwise (2 clicks)
      await cards.nth(2).locator('[data-testid="rotate-cw-btn"]').click();
      await cards.nth(2).locator('[data-testid="rotate-cw-btn"]').click();
      await expect(cards.nth(2).locator('[data-testid="rotation-badge"]')).toHaveText('180°');

      // 4. Delete page 2 (index 1) -> Total pages become 2
      await cards.nth(1).locator('[data-testid="delete-page-btn"]').click();
      await expect(cards).toHaveCount(2);

      // 5. Reorder remaining page 2 to position 0
      const sourceHandle = cards.nth(1).locator('[data-testid="drag-handle"]');
      const targetHandle = cards.nth(0).locator('[data-testid="drag-handle"]');
      try {
        await sourceHandle.dragTo(targetHandle);
      } catch {
        await sourceHandle.focus();
        await page.keyboard.press('Space');
        await page.keyboard.press('ArrowLeft');
        await page.keyboard.press('Space');
      }

      // 6. Export PDF download
      const downloadPromise = page.waitForEvent('download');
      await page.locator('[data-testid="export-btn"]').click();
      const download = await downloadPromise;

      const tempPath = await download.path();
      expect(tempPath).toBeTruthy();

      if (tempPath) {
        const inspectResult = await inspectPdfFile(tempPath);
        expect(inspectResult.pageCount).toBe(2);
        expect(inspectResult.rotations.length).toBe(2);
      }
    });
  });

  // =========================================================================
  // Tier 4: Real-World Scenarios & Offline Validation
  // =========================================================================
  test.describe('Tier 4: Real-World Scenarios & Offline Validation', () => {
    test('T4.1: Route network interception verifies ZERO external HTTP requests', async ({ page }) => {
      const externalRequests: string[] = [];

      // Intercept all network requests
      page.on('request', (request) => {
        const url = request.url();
        // Allow localhost server resources, data URIs, and blob URIs
        if (
          !url.startsWith('http://localhost') &&
          !url.startsWith('http://127.0.0.1') &&
          !url.startsWith('data:') &&
          !url.startsWith('blob:')
        ) {
          externalRequests.push(url);
        }
      });

      // Perform complete user workflow
      const fileInput = page.locator('input[data-testid="file-input"]');
      await fileInput.setInputFiles([SAMPLE_1PAGE, SAMPLE_2PAGES]);

      const cards = page.locator('[data-testid="thumbnail-card"]');
      await expect(cards).toHaveCount(3, { timeout: 10000 });

      await cards.first().locator('[data-testid="rotate-cw-btn"]').click();
      await cards.nth(1).locator('[data-testid="delete-page-btn"]').click();

      const downloadPromise = page.waitForEvent('download');
      await page.locator('[data-testid="export-btn"]').click();
      await downloadPromise;

      // Verify strict zero external HTTP calls
      expect(externalRequests).toEqual([]);
    });

    test('T4.2: Complete offline operation with browser set to offline mode', async ({ page, context }) => {
      // Simulate browser dropping network completely
      await context.setOffline(true);

      const fileInput = page.locator('input[data-testid="file-input"]');
      await fileInput.setInputFiles([SAMPLE_3PAGES]);

      const cards = page.locator('[data-testid="thumbnail-card"]');
      await expect(cards).toHaveCount(3, { timeout: 10000 });

      // Perform rotation, deletion, and export completely offline
      await cards.nth(0).locator('[data-testid="rotate-cw-btn"]').click();
      await cards.nth(2).locator('[data-testid="delete-page-btn"]').click();

      await expect(cards).toHaveCount(2);

      const downloadPromise = page.waitForEvent('download');
      await page.locator('[data-testid="export-btn"]').click();
      const download = await downloadPromise;

      const tempPath = await download.path();
      expect(tempPath).toBeTruthy();

      if (tempPath) {
        const inspectResult = await inspectPdfFile(tempPath);
        expect(inspectResult.pageCount).toBe(2);
      }

      // Restore network for subsequent cleanups
      await context.setOffline(false);
    });
  });
});
