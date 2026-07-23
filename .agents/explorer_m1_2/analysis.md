# オフラインPDF処理・レンダリング・Viteバンドル・テスト生成構造解析 (Milestone 1 - Explorer 2)

**作成者:** Explorer 2 (Milestone 1: Project Setup & Architecture)  
**日付:** 2026-07-22  
**対象リポジトリ:** `c:/Users/saito/OneDrive/60  ツール/Git/PDFEditor/`  
**ステータス:** 調査完了 (Analysis Complete)

---

## 1. エグゼクティブサマリー (Executive Summary)

本調査は、PDFEditorプロジェクトにおける**完全オフライン（外部HTTP API / CDN通信ゼロ）動作の保証**および**Vitest単体テストにおける合成（Synthetic）PDF生成戦略**について、技術的検証および詳細な構造設計を行ったものである。

### 主な結果と推奨策:
1. **エンジンの役割分離**:
   - 構造変更（読み込み、ページ複製、回転、削除、結合、Uint8Array書き出し）: **`pdf-lib`**
   - クライアントサイドプレビュー描画（HTML5 Canvas への描画、Data URL画像化）: **`pdfjs-dist`**
2. **`pdfjs-dist` ワーカーのローカルバンドル策 (Vite)**:
   - `import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.js?url'` (または `.mjs?url`) を利用し、Viteのアセットパイプラインでローカルビルド出力に埋め込む。
   - `pdfjsLib.GlobalWorkerOptions.workerSrc` に設定することで、外部CDN（cdnjs/unpkg等）へのネットワークリクエストを100%遮断。
3. **Vitest単体テストでの合成PDF生成**:
   - テスト用固定ファイル（.pdfアセット）の管理を廃止し、`pdf-lib` を用いてオンメモリで動的に多角形・テキスト付き複数ページPDF (`createSamplePdf`) を生成する。
4. **Vitest/jsdom 環境での描画モック**:
   - `jsdom` 環境ではCanvas 2Dコンテキストをモック化 (`tests/unit/setup.ts`) し、Web Workerをフェイクワーカーモードに設定して単体テストを高速かつ安定して実行する。

---

## 2. オフラインPDF処理・描画アーキテクチャ (`pdf-lib` & `pdfjs-dist`)

### 2.1 パイプライン構成とデータの流れ

```
[ PDF File / ArrayBuffer ]
           │
           ├──────────────────────────────┐
           ▼                              ▼
  【 pdf-lib エンジン 】        【 pdfjs-dist エンジン 】
   ・PDFDocument.load()           ・getDocument({ data }).promise
   ・ページオブジェクト制御          ・getPage(pageIndex + 1)
   ・copyPages() / addPage()      ・getViewport({ scale })
   ・setRotation(degrees)         ・canvas.getContext('2d') 描画
   ・save() ──> Uint8Array        ・toDataURL('image/jpeg')
           │                              │
           ▼                              ▼
 [ PDFエクスポート・保存 ]       [ サムネイル Data URL (React UI) ]
```

### 2.2 各ライブラリの採用理由と役割

| ライブラリ | 主な役割 | メモリモデル / 特徴 |
|---|---|---|
| **`pdf-lib`** | PDFのロード、ページ単位の抽出・順序変更・回転・結合・エクスポート | 100% TypeScript/JS純粋実装。DOM非依存。`Uint8Array` / `ArrayBuffer` を直接操作。 |
| **`pdfjs-dist`** | PDFバイナリのベクター描画、HTML5 Canvasへのレンダリング、サムネイル画像生成 | Mozilla製PDFレンダラ。Web Workerを活用して描画スレッドをバックグラウンド化。 |

---

## 3. `pdfjs-dist` ワーカーの Vite ローカルバンドル詳細検証

### 3.1 外部CDN依存の課題
`pdfjs-dist` は標準状態で `GlobalWorkerOptions.workerSrc` が未設定の場合、外部CDN（例: `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/...`）からワーカーJSを取得しようとする。
本アプリは**完全オフライン動作（外部通信ゼロ）**が絶対要件（R1, オフライン要件）であるため、CDN依存は許容されない。

### 3.2 Viteにおけるローカルバンドル解決パターン

Viteの `?url` 明示的アセットインポートを使用する。

```typescript
import * as pdfjsLib from 'pdfjs-dist';

// Viteのアセットローダーを使用してローカルの node_modules からワーカーURLを取得
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.js?url';

if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;
}
```

#### 動作メカニズム:
1. **開発時 (`npm run dev`)**:
   Vite開発サーバーが `/@fs/.../node_modules/pdfjs-dist/build/pdf.worker.min.js` として同タイプ・同バージョンのワーカーファイルをローカルから配信する。
2. **ビルド時 (`npm run build`)**:
   Vite Rollupバンドラが `pdf.worker.min.js` を検出し、`dist/assets/pdf.worker-[hash].js` として静的アセットに出力。コード内の `pdfjsWorker` 変数をビルド後の相対パスに置換する。
3. **バージョンロック**:
   `package.json` にて `pdfjs-dist` を固定バージョン（例: `3.11.174`）で厳密に指定することにより、ライブラリ本体とワーカーのAPI互換性ズレを防止する。

---

## 4. Vitest / jsdom テスト環境における対策

### 4.1 jsdomにおけるCanvasとWeb Workerの制約
Vitest（jsdom環境）では以下の制約が存在する:
1. `HTMLCanvasElement.prototype.getContext('2d')` がデフォルトで未実装（`null` を返す）。
2. Web Worker (`new Worker()`) の実行環境が制限されている。

### 4.2 テスト環境セットアップ (`tests/unit/setup.ts`)

Vitestの単体テストを安定して実行するため、`setup.ts` に以下のモックと設定を記述する。

```typescript
import { vi } from 'vitest';
import '@testing-library/jest-dom';
import * as pdfjsLib from 'pdfjs-dist';

// 1. Vitest/jsdom環境における pdfjs-dist のフェイクワーカー有効化
if (typeof window !== 'undefined') {
  // workerSrc を空文字列またはフェイクワーカーに設定し、シングルスレッド実行させる
  pdfjsLib.GlobalWorkerOptions.workerSrc = '';
}

// 2. HTMLCanvasElement getContext('2d') のスタブ設定
if (typeof HTMLCanvasElement !== 'undefined') {
  HTMLCanvasElement.prototype.getContext = vi.fn().mockImplementation((contextId: string) => {
    if (contextId === '2d') {
      return {
        fillRect: vi.fn(),
        clearRect: vi.fn(),
        getImageData: vi.fn().mockReturnValue({ data: new Uint8Array(4) }),
        putImageData: vi.fn(),
        createImageData: vi.fn().mockReturnValue([]),
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
        measureText: vi.fn().mockReturnValue({ width: 100 }),
      };
    }
    return null;
  }) as any;

  // toDataURL モック
  HTMLCanvasElement.prototype.toDataURL = vi.fn().mockReturnValue(
    'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP...'
  );
}
```

---

## 5. `pdf-lib` による合成（Synthetic）Sample PDFのプログラム生成戦略

### 5.1 なぜ合成PDF生成が必要か
- **リポジトリの軽量化**: 大容量のテスト用バイナリPDFをGitで管理せずに済む。
- **動的パラメータ**: 1ページ、3ページ、回転指定、カスタムサイズなど、テストケースに応じたPDFをコードで即座に生成可能。
- **予測可能性**: テストデータの構造が明確で、回帰テストが容易。

### 5.2 ヘルパー実装設計 (`tests/unit/helpers/createSamplePdf.ts`)

```typescript
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

export interface SamplePdfOptions {
  pageCount?: number;
  title?: string;
  width?: number;
  height?: number;
}

/**
 * pdf-lib を使用して動的に合成PDF（Uint8Array）を生成するテスト用ヘルパー
 */
export async function createSamplePdf(options: SamplePdfOptions = {}): Promise<Uint8Array> {
  const {
    pageCount = 1,
    title = 'Sample Test PDF',
    width = 600,
    height = 800,
  } = options;

  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

  for (let i = 0; i < pageCount; i++) {
    const page = pdfDoc.addPage([width, height]);
    
    // 背景用カラーボックス（ページごとに異なる色）
    const r = ((i * 70) % 255) / 255;
    const g = ((i * 110) % 255) / 255;
    const b = ((i * 150) % 255) / 255;
    
    page.drawRectangle({
      x: 20,
      y: 20,
      width: width - 40,
      height: height - 40,
      color: rgb(r, g, b),
      opacity: 0.15,
    });

    // ページタイトル・番号描画
    page.drawText(`${title} - Page ${i + 1} of ${pageCount}`, {
      x: 40,
      y: height - 60,
      size: 18,
      font,
      color: rgb(0.1, 0.1, 0.1),
    });

    page.drawText(`Page Index: ${i}`, {
      x: 40,
      y: height - 90,
      size: 14,
      font,
      color: rgb(0.3, 0.3, 0.3),
    });
  }

  return await pdfDoc.save();
}
```

### 5.3 単体テスト (`tests/unit/pdfEngine.test.ts`) での活用パターン

#### テストケース 1: `loadPdfDocument` の検証
- 3ページの合成PDFを生成。
- `loadPdfDocument(sampleBytes)` を実行。
- 戻り値の `pageCount` が `3` であること、各ページの `pageIndex` が `0, 1, 2` であることを確認。

#### テストケース 2: `exportPdf` による結合・順序変更・回転の検証
- 2ページの合成PDF A と 1ページの合成PDF B を生成。
- 以下の順序でエクスポート仕様を指定:
  - ページ0: PDF A の pageIndex 1 (回転 90度)
  - ページ1: PDF B の pageIndex 0 (回転 0度)
  - ページ2: PDF A の pageIndex 0 (回転 180度)
- `exportPdf()` を実行し、出力された `Uint8Array` を `PDFDocument.load()` で再読み込み。
- ページ数が `3`、各ページの `getRotation().angle` がそれぞれ `90, 0, 180` であることを検証。

---

## 6. `src/services/pdfEngine.ts` 詳細設計コード仕様

`PROJECT.md` のインターフェース契約に完全準拠した `pdfEngine.ts` の実装仕様 Blueprint を以下に示す。

```typescript
import { PDFDocument, degrees } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.js?url';

// ワーカーのオフラインローカル設定
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;
}

export interface PdfPageInfo {
  id: string;
  fileId: string;
  fileName: string;
  pageIndex: number;
  rotation: number;
  thumbnailUrl: string;
  pdfBytes: Uint8Array;
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

/**
 * PDFファイルまたはArrayBufferをロードし、各ページのメタデータおよびプレビューサムネイルを生成
 */
export async function loadPdfDocument(file: File | ArrayBuffer | Uint8Array): Promise<PdfDocumentData> {
  let arrayBuffer: ArrayBuffer;
  let fileName = 'document.pdf';

  if (file instanceof File) {
    fileName = file.name;
    arrayBuffer = await file.arrayBuffer();
  } else if (file instanceof Uint8Array) {
    arrayBuffer = file.buffer.slice(file.byteOffset, file.byteOffset + file.byteLength);
  } else {
    arrayBuffer = file;
  }

  const pdfBytes = new Uint8Array(arrayBuffer);
  const pdfDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
  const pageCount = pdfDoc.getPageCount();
  const fileId = `file_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

  const pages: PdfPageInfo[] = [];

  for (let i = 0; i < pageCount; i++) {
    const page = pdfDoc.getPage(i);
    const existingRotation = page.getRotation().angle;

    // サムネイル画像の生成 (Data URL)
    let thumbnailUrl = '';
    try {
      thumbnailUrl = await renderPageThumbnail(pdfBytes, i);
    } catch (e) {
      console.warn(`Failed to render thumbnail for page ${i}:`, e);
    }

    pages.push({
      id: `${fileId}_page_${i}_${Date.now()}`,
      fileId,
      fileName,
      pageIndex: i,
      rotation: existingRotation,
      thumbnailUrl,
      pdfBytes,
    });
  }

  return {
    id: fileId,
    name: fileName,
    pageCount,
    pages,
  };
}

/**
 * 指定ページを HTML5 Canvas 上にレンダリングし Data URL (JPEG) として返却
 */
export async function renderPageThumbnail(
  pdfBytes: Uint8Array,
  pageIndex: number,
  scale: number = 0.3
): Promise<string> {
  const loadingTask = pdfjsLib.getDocument({ data: pdfBytes });
  const pdfDoc = await loadingTask.promise;
  const page = await pdfDoc.getPage(pageIndex + 1); // PDF.js は 1-based index

  const unscaledViewport = page.getViewport({ scale: 1.0 });
  const targetWidth = 200;
  const computedScale = scale || (targetWidth / unscaledViewport.width);
  const viewport = page.getViewport({ scale: computedScale });

  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');

  if (!context) {
    throw new Error('Canvas 2D context is not available');
  }

  canvas.width = viewport.width;
  canvas.height = viewport.height;

  await page.render({
    canvasContext: context,
    viewport: viewport,
  }).promise;

  const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
  await pdfDoc.destroy();

  return dataUrl;
}

/**
 * 指定されたページ順・回転度数に従い、新しいPDFを構築して Uint8Array として返却
 */
export async function exportPdf(pages: ExportPageSpec[]): Promise<Uint8Array> {
  const newPdfDoc = await PDFDocument.create();
  const docCache = new Map<Uint8Array, PDFDocument>();

  for (const pageSpec of pages) {
    let sourceDoc = docCache.get(pageSpec.pdfBytes);
    if (!sourceDoc) {
      sourceDoc = await PDFDocument.load(pageSpec.pdfBytes, { ignoreEncryption: true });
      docCache.set(pageSpec.pdfBytes, sourceDoc);
    }

    const [copiedPage] = await newPdfDoc.copyPages(sourceDoc, [pageSpec.pageIndex]);
    const currentAngle = copiedPage.getRotation().angle;
    const finalAngle = (currentAngle + pageSpec.rotation) % 360;
    copiedPage.setRotation(degrees(finalAngle));

    newPdfDoc.addPage(copiedPage);
  }

  return await newPdfDoc.save();
}

/**
 * 生成された Uint8Array からブラウザダウンロードリンクを生成・実行
 */
export function createDownloadLink(pdfBytes: Uint8Array, filename: string): void {
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
```

---

## 7. 検証方法および判定基準 (Verification & Invalidation Criteria)

### 7.1 検証方法 (Verification Steps)
1. **ワーカー非依存性テスト**:
   ネットワークを切断（DevTools ネットワークスロットリングで Offline に設定）した状態で `npm run dev` を起動し、PDF読み込み＆サムネイル表示がエラーなく実行できること。
2. **単体テスト実行**:
   `npm test` を実行し、合成PDF生成ヘルパーを使用した `pdfEngine.test.ts` が全ケース PASS すること。
3. **エクスポート再現性**:
   `exportPdf` で出力した Uint8Array を `loadPdfDocument` で再ロードし、ページ数および回転角度が期待値通りに復帰すること。

### 7.2 失効基準 (Invalidation Conditions)
- Viteビルド出力 `dist/assets/` に `pdf.worker` ファイルが含まれず、DevToolsネットワークタブに `cdnjs` や `unpkg` へのリクエストが記録された場合は構成失効とする。
- `pdfjs-dist` のメジャーバージョン変更に伴い `.mjs` モジュール構造が破綻した場合は、インポート文を見直すこと。
