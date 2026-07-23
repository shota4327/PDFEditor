# M8 & M9 テストインフラストラクチャ・テストスイート詳細調査報告書 (analysis.md)

## 1. 調査概要 (Executive Summary)

本レポートは、PDFEditorプロジェクトのM8（機能拡張）およびM9（最終統合・リファクタリング）に向けたテストインフラストラクチャおよびテストスイートの評価・拡張計画に関する調査結果をまとめたものです。

現在のテスト構成は、**Vitest + jsdom** によるユニットテスト層と、**Playwright + Chromium** による4-Tier構成のE2Eテスト層で構築されており、 requirement-driven（要件駆動）かつ opaque-box（ブラックボックス）検証原則を厳格に順守しています。

本調査では、既存の `package.json`, `vite.config.ts`, `vitest.config.ts`, `playwright.config.ts`, `tests/unit/`, `tests/e2e/` を網羅的に分析し、M8/M9で拡張・追加が必要な詳細テストケースおよびテスト実行上の注意点を明確化しました。

---

## 2. 既存テストインフラストラクチャ分析

### 2.1 テストスタックと設定ファイル構造

| 構成要素 | 採用技術 / 設定 | ファイルパス | 役割と特徴 |
|---|---|---|---|
| **ユニットテストフレームワーク** | Vitest v2.1.2 | `vitest.config.ts` | `jsdom` 環境で `pdfEngine.ts` サービスおよびUIコンポーネントを高速に単体検証 |
| **ユニットテストセットアップ** | Vitest Setup | `tests/unit/setup.ts` | `URL.createObjectURL`, `Blob.prototype.arrayBuffer`, `HTMLCanvasElement.getContext('2d')`, `toDataURL` のモック処理 |
| **E2Eテストフレームワーク** | Playwright v1.48.0 | `playwright.config.ts` | Headless Chromium 上で Vite 開発サーバー (`http://localhost:5173`) と連携し、完全なブラウザ動作を検証 |
| **E2Eフィクスチャ生成** | `pdf-lib` | `tests/e2e/helpers/fixtureGenerator.ts` | 外部PDFファイルに依存せず、動的に1/2/3ページの正常系PDFおよび不正テキストファイルを事前生成 |
| **PDFバイナリ検証ヘルパー** | `pdf-lib` | `tests/e2e/helpers/pdfInspect.ts` | エクスポートされたPDFファイルをローカルに保存し、実際のページ数・回転角度などをバイナリレベルで物理検証 |

### 2.2 設定ファイルの検証ポイント

1. **`vitest.config.ts`**:
   - `globals: true`, `environment: 'jsdom'` が有効化されており、React Testing Library (`@testing-library/react`, `@testing-library/jest-dom`) と互換性があります。
   - `alias: { '@': path.resolve(__dirname, './src') }` により、ソースコード内のエイラスパスが正しく解決されます。

2. **`playwright.config.ts`**:
   - `webServer` 設定において `command: 'npm run dev'`, `url: 'http://localhost:5173'`, `reuseExistingServer: !process.env.CI` が構成されています。
   - `fullyParallel: true` により高速並列実行がサポートされています。

---

## 3. 既存テストスイートのレビュー

### 3.1 ユニットテストスイート (`tests/unit/`)
- **`pdfEngine.test.ts`**:
  - `loadPdfDocument`: 単一ページFile、複数ページUint8Arrayのパース、回転角初期値(0)、サムネイル生成の検証。
  - `renderPageThumbnail`: `pdfjs-dist` によるキャンバスレンダリング・Data URL出力の検証。
  - `exportPdf`: `pdf-lib` を使用した回転角(0°, 90°, 180°, 270°)、並び替え、削除、複数PDFの結合処理の検証とラウンドトリップテスト。
  - `createDownloadLink`: 擬似アンカーエレメントによるダウンロード動作と拡張子 `.pdf` 付与の検証。
- **`components.test.tsx`**:
  - `Header`, `DropZone`, `ThumbnailCard`, `Toolbar` の各Reactコンポーネントに対する独立レンダリングとユーザーアクションイベント（ボタンクリック、ファイルドロップ）の検証。
- **不足しているユニットテスト**:
  - Zoomコントロール (Zoom In / Zoom Out / Reset) に関連するコンポーネント状態・イベントハンドラのテスト。
  - アプリケーション全体の状態管理フック（`usePdfState` または `App.tsx` 内のロジック）の独立単体テスト。

### 3.2 E2Eテストスイート (`tests/e2e/pdfEditor.spec.ts`)
- **Tier 1 (Feature Coverage)**: T1.1(マルチファイルロード), T1.2(サムネイルData URL表示), T1.3(CW/CCW 90°回転), T1.4(ドラッグ＆ドロップ並び替え), T1.5(ページ削除), T1.6(PDFエクスポート・ダウンロード検証).
- **Tier 2 (Boundary & Corner Cases)**: T2.1(空状態表示), T2.2(1ページPDF), T2.3(3ページPDF), T2.4(360°回転ラップアラウンド), T2.5(非PDFファイル拒否とエラーメッセージ).
- **Tier 3 (Cross-Feature Combinations)**: T3.1(ロード→回転→削除→並び替え→エクスポート統合ワークフロー).
- **Tier 4 (Real-World & Offline Validation)**: T4.1(Zero External HTTP Request ネットワーク監査), T4.2(完全オフラインブラウザ実行検証).

---

## 4. M8 & M9 に向けた新機能・詳細テストケース仕様

### 4.1 ドラッグ＆ドロップ並び替えテストの強化 (Drag & Drop Reordering)

`@hello-pangea/dnd` を使用したドラッグ＆ドロップ操作は、標準の Playwright `locator.dragTo()` のみではイベント発火条件（ドラッグ閾値移動）により不完全になる場合があります。

- **Playwright Mouse Drag 実装方式**:
  ```typescript
  // mouse drag helper アプローチ
  const sourceBox = await sourceHandle.boundingBox();
  const targetBox = await targetHandle.boundingBox();
  if (sourceBox && targetBox) {
    await page.mouse.move(sourceBox.x + sourceBox.width / 2, sourceBox.y + sourceBox.height / 2);
    await page.mouse.down();
    // ドラッグ発火用に小さな移動
    await page.mouse.move(sourceBox.x + sourceBox.width / 2 + 10, sourceBox.y + sourceBox.height / 2 + 10, { steps: 5 });
    // ターゲットへの移動
    await page.mouse.move(targetBox.x + targetBox.width / 2, targetBox.y + targetBox.height / 2, { steps: 15 });
    await page.mouse.up();
  }
  ```
- **検証項目**:
  1. DOM上のカード順序変化 (`data-page-id` 属性の入れ替わり)。
  2. ページバッジ番号 (`Page 1`, `Page 2`, `Page 3`) の順序自動更新。
  3. 並び替え後にエクスポートしたPDFファイルを `pdf-lib` で解析し、内部のページ順序がUI上の配置と完全に一致することの確認。

### 4.2 ズームコントロール機能のテスト (Zoom Controls: In, Out, Reset)

M8/M9で追加されるズーム操作機能 (Zoom In `+`, Zoom Out `-`, Reset `100%`) に対する検証設計。

- **ユニットテストケース (`tests/unit/components.test.tsx`)**:
  - `Toolbar` の Zoom In ボタンクリックで `onZoomChange` または `onZoomIn` が呼ばれ、スケール値（例: 100% -> 125% -> 150%）が増加すること。
  - `Toolbar` の Zoom Out ボタンクリックでスケール値が減少すること（最小50%限界値でボタン無効化 `disabled`）。
  - Zoom Reset ボタンクリックで 100% に復帰すること。
  - `ThumbnailGrid` または `ThumbnailCard` に `zoomScale` プロパティが渡された際、CSSスタイル (`transform: scale(...)` またはグリッドカラム指定 `grid-cols-X`) に適切に反映されること。

- **E2Eテストケース (`tests/e2e/pdfEditor.spec.ts`)**:
  - `T1.7: Zoom In / Zoom Out / Reset controls scale thumbnail card preview elements`:
    1. 複数ページPDFをアップロード。
    2. 初期ズーム表示バッジ (`[data-testid="zoom-level-badge"]`) が `100%` であることを確認。
    3. `[data-testid="zoom-in-btn"]` をクリックし、バッジが `125%` に更新され、サムネイルコンテナのDOMスケール/CSSが拡大することを確認。
    4. `[data-testid="zoom-out-btn"]` をクリックし、`75%` に縮小されることを確認。
    5. `[data-testid="zoom-reset-btn"]` をクリックし、`100%` に復元することを確認。
    6. ズーム操作後も、PDFのエクスポート結果（ページ数・解像度・回転角）に影響を与えないこと（表示専用スケールであること）を確認。

### 4.3 ページ回転・削除機能の追加テストケース (Rotation & Deletion)

- **一括回転機能 (Bulk Rotation)**:
  - ツールバーに「全ページ時計回り回転」「全ページ反時計回り回転」が導入された場合、すべてのカードの `data-rotation` および `[data-testid="rotation-badge"]` が一括で +90° / -90° 変化することを検証。
- **回転後の削除・削除後の回転相互作用**:
  - Page 1 を 90° 回転後、Page 2 を削除し、さらに旧 Page 3 (新 Page 2) を 180° 回転させる操作シーケンスにおいて、状態管理のインデックスズレが発生しないことを確認。
- **全クリア (Clear All) 動作**:
  - 「すべてクリア」ボタンクリック時、確認アラート/トーストが表示され、グリッド内の全カードが削除されて初期ドロップゾーン状態に戻ることを確認。

### 4.4 PDF エクスポート・ダウンロード検証の高度化 (PDF Export Download Verification)

- **ダウンロードイベントの確実な捕捉**:
  ```typescript
  const downloadPromise = page.waitForEvent('download');
  await page.locator('[data-testid="export-btn"]').click();
  const download = await downloadPromise;
  ```
- **バイナリ解析ヘルパー (`pdfInspect.ts`) の強化項目**:
  - 提案する拡張API:
    ```typescript
    export interface PdfInspectResult {
      pageCount: number;
      rotations: number[];
      pageSizes: { width: number; height: number }[];
      isValidPdf: boolean;
    }
    ```
  - エクスポートされたPDFの物理ファイルが、90° / 270° 回転時に幅・高さの縦横比（Portrait vs Landscape）が物理的に入れ替わっていることを `pdf-lib` の `getPage(i).getSize()` で検証。
  - カスタムファイル名（ユーザーがファイル名を指定する場合）が `download.suggestedFilename()` と一致することを検証。

---

## 5. テスト実行におけるリスク・課題と対策 (Execution Risks & Mitigations)

| リスク / 課題 | 発生要因 | 影響 | 対策 / 回避策 |
|---|---|---|---|
| **1. `@hello-pangea/dnd` のドラッグフレークネス** | ブラウザの合成マウスイベント処理のタイミング依存 | E2Eテストの並び替え検証が不定期に失敗する | mouse move シーケンス＋キーボード操作 (`Space -> Arrow -> Space`) のフォールバック機構を併用 |
| **2. Playwright ブラウザ未インストール** | CI環境や新規開発環境での初回実行 | `playwright test` 実行時に `Executable doesn't exist` エラー | `package.json` の `postinstall` またはテスト実行手順に `npx playwright install chromium` を明記 |
| **3. ポート衝突による devServer 接続エラー** | ポート `5173` が別プロセスで使用中 | Playwrightが接続タイムアウト (`120s`) でクラッシュ | `vite.config.ts` で `server.strictPort: true` または Playwright の `baseURL` 柔軟化 |
| **4. jsdom での Canvas / ArrayBuffer の制約** | jsdom に Canvas 2D / Blob API の一部が未実装 | `vitest` 実行時に `getContext` エラー発生 | `tests/unit/setup.ts` で `HTMLCanvasElement.prototype.getContext` および `toDataURL`, `Blob.prototype.arrayBuffer` を完全にモック |
| **5. エクスポートダウンロードの非同期タイムアウト** | 大容量PDFや遅延処理 | `waitForEvent('download')` タイムアウト | `export-btn` の `disabled` 解除状態を待機してからダウンロードイベントを開始 |

---

## 6. M8 / M9 テストアーキテクチャの改善提案

1. **カスタムフック / アプリ状態のユニットテスト分離**:
   - `App.tsx` に集中しているページリスト状態 (`pages`)、回転処理 (`handleRotateCW/CCW`)、並び替え (`handleReorder`)、ズーム状態 (`zoomScale`) を `usePdfState.ts` などのカスタムフックにリファクタリングし、`renderHook` を用いた高速ユニットテストを追加する。
2. **ズームコントロール専用テストファイル作成**:
   - `tests/unit/zoomControls.test.tsx` および `tests/e2e/zoom.spec.ts` (または `pdfEditor.spec.ts` 内の Tier 1 シーケンス拡張) を追加し、ズーム機能の独立性を高める。
3. **`pdfInspect.ts` の拡張**:
   - ページ数・回転角度だけでなく、ページのバウンディングボックスサイズ (MediaBox / CropBox) を返却する関数を追加し、回転が画面表示だけでなく出力PDFの幾何構造に反映されていることを保証する。
