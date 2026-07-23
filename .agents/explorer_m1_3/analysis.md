# テストインフラ設計・仕様分析レポート (Milestone 1)

## 概要
本レポートは、PDFEditorプロジェクトにおけるテストインフラストラクチャ（Unitテスト: Vitest, E2Eテスト: Playwright）の設計、設定ファイル、ディレクトリ構造、推奨スクリプトおよび詳細なテスト戦略を定義・分析したものです。

本アプリケーションは**クライアントサイド完全オフライン動作**を要件としており、単体テストでは `pdfEngine.ts` のバイナリ・DOM操作ロジックの正確性を高速に検証し、E2Eテストでは実際のブラウザ環境でUI操作、ドラッグ＆ドロップ、PDF出力および**外部ネットワーク通信ゼロ（完全オフライン）**を徹底検証します。

---

## 1. ディレクトリ構造レイアウト

テストコードの整理、保守性、責務の分離を実現するため、以下のディレクトリ構造を推奨します。

```
PDFEditor/
├── package.json
├── vite.config.ts
├── vitest.config.ts
├── playwright.config.ts
├── tests/
│   ├── unit/
│   │   ├── setup.ts                 # Vitest用グローバルモック（Canvas, URL, Worker等）
│   │   ├── helpers/
│   │   │   └── pdfTestHelpers.ts    # テスト用ダミーPDF生成ユーティリティ（pdf-lib使用）
│   │   └── pdfEngine.test.ts        # pdfEngine.ts の単体テストスイート
│   └── e2e/
│       ├── fixtures/
│       │   ├── sample-1page.pdf     # 1ページテスト用PDF
│       │   ├── sample-3pages.pdf    # 3ページテスト用PDF
│       │   └── invalid-file.txt     # 異常系テスト用非PDFファイル
│       ├── helpers/
│       │   ├── pdfInspect.ts        # ダウンロードされたPDFファイルの構造検証用ヘルパー
│       │   └── dragDrop.ts          # Playwright用ドラッグ＆ドロップ操作ユーティリティ
│       └── pdfEditor.spec.ts        # アプリ全体のE2Eテストスイート (Tiers 1〜4)
```

---

## 2. Vitest 設定仕様 (`vitest.config.ts`)

Vitest は Vite と同じ設定・プラグインエコシステムを共有するため、高速かつブラウザライクな `jsdom` 環境で動作させます。

### `vitest.config.ts` 推奨コード
```ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/unit/setup.ts'],
    include: ['tests/unit/**/*.{test,spec}.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'tests/',
        'vite.config.ts',
        'vitest.config.ts',
        'playwright.config.ts',
      ],
    },
  },
});
```

### `tests/unit/setup.ts` （モック＆グローバル定義）
Node/jsdom 環境で不足しているブラウザ API（`URL.createObjectURL`, `HTMLCanvasElement.getContext`, `Worker` など）をセットアップします。

```ts
import '@testing-library/jest-dom';
import { vi } from 'vitest';

// URL.createObjectURL / revokeObjectURL のモック
if (typeof window !== 'undefined') {
  window.URL.createObjectURL = vi.fn((blob: Blob | MediaSource) => {
    return `blob:http://localhost/mock-blob-${Math.random().toString(36).substring(2)}`;
  });
  window.URL.revokeObjectURL = vi.fn();
}

// HTMLCanvasElement context の簡易モック (pdfjs-dist サムネイルレンダリング用)
if (typeof HTMLCanvasElement !== 'undefined') {
  HTMLCanvasElement.prototype.getContext = vi.fn().mockImplementation((contextId: string) => {
    if (contextId === '2d') {
      return {
        fillRect: vi.fn(),
        clearRect: vi.fn(),
        getImageData: vi.fn(() => ({ data: new Uint8ClampedArray(4) })),
        putImageData: vi.fn(),
        createImageData: vi.fn([]),
        setTransform: vi.fn(),
        drawImage: vi.fn(),
        save: vi.fn(),
        fillText: vi.fn(),
        restore: vi.fn(),
        beginPath: vi.fn(),
        moveTo: vi.fn(),
        lineTo: vi.fn(),
        closePath: vi.fn(),
        stroke: vi.fn(),
        translate: vi.fn(),
        scale: vi.fn(),
        rotate: vi.fn(),
        arc: vi.fn(),
        fill: vi.fn(),
        measureText: vi.fn(() => ({ width: 0 })),
        transform: vi.fn(),
        rect: vi.fn(),
        clip: vi.fn(),
      };
    }
    return null;
  }) as any;

  HTMLCanvasElement.prototype.toDataURL = vi.fn(() => 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==');
}
```

---

## 3. Playwright 設定仕様 (`playwright.config.ts`)

Playwright は本物の Chromium / Firefox / WebKit ブラウザ上でアプリを実行し、ユーザー操作とネットワーク完全隔離を自動検証します。

### `playwright.config.ts` 推奨コード
```ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['html', { outputFolder: 'playwright-report', open: 'never' }], ['list']],
  use: {
    baseURL: 'http://localhost:4173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'on-first-retry',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // テスト実行前に Vite の preview サーバーを自動起動
  webServer: {
    command: 'npm run build && npm run preview -- --port 4173',
    port: 4173,
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
```

---

## 4. npm 依存関係およびスクリプト仕様

### 必要な devDependencies (`package.json` へ追加)
```json
{
  "devDependencies": {
    "@playwright/test": "^1.45.0",
    "@testing-library/jest-dom": "^6.4.6",
    "@testing-library/react": "^16.0.0",
    "@testing-library/user-event": "^14.5.2",
    "@types/node": "^20.14.0",
    "@vitejs/plugin-react": "^4.3.0",
    "@vitest/coverage-v8": "^1.6.0",
    "jsdom": "^24.1.0",
    "typescript": "^5.4.5",
    "vite": "^5.2.12",
    "vitest": "^1.6.0"
  }
}
```

### `package.json` 推奨 scripts
```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:all": "npm run test && npm run test:e2e"
  }
}
```

---

## 5. 単体テスト (`tests/unit/pdfEngine.test.ts`) 戦略詳細

`pdfEngine.ts` のインターフェース契約に対する検証項目：

1. **`loadPdfDocument` のテスト**:
   - `pdf-lib` で生成したダミーPDF（1ページ、3ページ）の `Uint8Array` / `File` を読み込み、`id`, `name`, `pageCount`, `pages` メタデータ配列が正しく取得できること。
   - 不正なファイル（テキストデータ、破損バイナリ）を入力した際に適切な例外エラーを発生させること。

2. **`renderPageThumbnail` のテスト**:
   - 有効な PDF バイナリとページインデックスを受け取った際、Canvas 経由で Data URL (`data:image/...`) 文字列を返却すること。

3. **`exportPdf` のテスト**:
   - **結合 (Merge)**: 複数のPDFからのページを指定通りに1つのPDFに結合できること。
   - **回転 (Rotate)**: 各ページに回転角（0, 90, 180, 270度）を設定し、出力されたPDFバイナリのページプロパティが正しく更新されていること。
   - **順序入れ替え (Reorder)**: ページの順番（[2, 0, 1] 等）を入れ替えて出力した際、ページ構成が指定通りになること。
   - **削除 (Delete)**: 指定したページを除外して出力できること。
   - **出力形式検証**: 返却値がヘッダー `%PDF-` で始まる有効な `Uint8Array` であること。

4. **`createDownloadLink` のテスト**:
   - DOM 上にアンカータグを作成し、`href` に Blob URL が設定され、クリックイベントが発火すること。

---

## 6. E2Eテスト (`tests/e2e/pdfEditor.spec.ts`) 戦略詳細 (Tiers 1〜4)

### Tier 1: 機能網羅 (Feature Coverage)
- **ファイル読み込み**: ドロップゾーンへのドラッグ＆ドロップまたはファイル選択ダイアログによる複数PDFの同時ロード。
- **プレビュー表示**: 読み込まれた各ページのサムネイルカードが表示され、総ページ数がカウントされること。
- **ページ回転**: サムネイル上の回転ボタン（時計回り/反時計回り）をクリックすると、サムネイルの見た目が90度回転すること。
- **ページ順序変更**: サムネイルカードをドラッグ＆ドロップして並び順を変更できること。
- **ページ削除**: 削除ボタンをクリックすると、対象のサムネイルが削除され、残りページ数が更新されること。
- **エクスポート＆ダウンロード**: 「PDFを出力 / 保存」ボタンをクリックし、`page.waitForEvent('download')` で `.pdf` ファイルが正しくダウンロードされること。

### Tier 2: 境界値・異常系 (Boundary & Edge Cases)
- 空の初期状態でのエクスポートボタン無効化検証。
- 1ページのみのPDFの編集・エクスポート。
- 非PDFファイル（`.txt`, `.jpg` など）のドラッグ＆ドロップ拒否およびエラーメッセージ表示検証。
- 大容量/複数ファイル（計20ページ以上など）の操作パフォーマンスとメモリクラッシュ防止。

### Tier 3: 複合シナリオ (Cross-Feature Combinations)
- A.pdf (2ページ) と B.pdf (3ページ) をロード -> Aの2ページ目を90度回転 -> Aの1ページ目をBの末尾へ移動 -> Bの2ページ目を削除 -> 結合エクスポート。
- ダウンロードしたPDFを `pdf-lib` でバックエンド検証し、ページ数が4ページかつ指定通りの回転角であることをダブルチェック。

### Tier 4: オフライン＆ネットワーク完全隔離検証 (Network Isolation Audit)
- **外部リクエスト検証**: `page.on('request', request => ...)` を仕込み、`localhost` 以外のドメイン（CDN、外部API、Font、Google Analytics等）へのリクエストが1件も発生しないことをアサート。
- **オフライン動作検証**: アプリ読み込み後、`context.setOffline(true)` を設定した状態で、ファイルのロード・回転・並び替え・エクスポートの一連操作が一切エラーなく動作することを検証。

---

## 7. まとめと検証方法

本インフラ設計により、開発者は `npm run test` でコアロジックを1秒未満で高速検証し、`npm run test:e2e` で本物のブラウザ環境におけるUI操作とオフライン安全性を保証できます。

### 検証コマンド
1. 単体テスト実行: `npm run test`
2. E2Eテスト実行: `npm run test:e2e`
3. 統合検証: `npm run test:all`
