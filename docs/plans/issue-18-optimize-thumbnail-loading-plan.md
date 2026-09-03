# Issue #18 実装計画: サムネイル生成時のドキュメント多重ロード・破棄の解消と性能改善

## 概要・問題の背景
現在、[`loadPdfDocument`](file:///c:/Git/PDFEditor/src/services/pdfEngine.ts) 内でページ数分のループ処理を実行する際、各ページごとに [`renderPageThumbnail(pdfBytes, i)`](file:///c:/Git/PDFEditor/src/services/pdfEngine.ts) を呼び出しています。
`renderPageThumbnail` の内部では、呼び出されるたびに `pdfjsLib.getDocument(...)` によるドキュメント全体のロード・バイナリ解析が行われ、1ページのサムネイル描画が完了した直後に `loadingTask.destroy()` でドキュメントが破棄されています。

この結果、N ページのドキュメントを読み込む際に **N 回のドキュメント多重解析および Worker プロセスの生成・破棄が連続して発生** しており、読み込み処理の遅延や不要なメモリ・CPU負荷の原因となっていました。

## ユーザー確認・合意済み事項 (/grill-me にて決定)
1. **読み込み済みドキュメント用描画関数の新設**:
   - 既にパース済みの `pdfjsLib.PDFDocumentProxy` を受け取って特定ページを HTML5 Canvas に描画する関数 `renderPageThumbnailFromDoc(pdfDoc, pageIndex, scale)` を新設します。
2. **`loadPdfDocument` のドキュメント取得・破棄の一元化**:
   - `loadPdfDocument` 側で `pdfjsLib.getDocument` をドキュメント全体に対して **1度だけロード** します。
   - ループ内では `renderPageThumbnailFromDoc` を呼び出して各ページのサムネイルを生成します。
   - 処理完了後、`finally` ブロックで `pdfDoc.cleanup()` および `loadingTask.destroy()` を **1度だけ確実に実行** してリソースを解放します。
3. **既存の単体関数 `renderPageThumbnail` の互換性維持**:
   - 外部・単体テスト向けの `renderPageThumbnail(pdfBytes, pageIndex, scale)` は、ドキュメント取得後に `renderPageThumbnailFromDoc` を呼び出して自身でクリーンアップを行う薄いラッパーとして残し、後方互換性を100%維持します。
4. **Issue 駆動開発**:
   - GitHub Issue [#18](https://github.com/shota4327/PDFEditor/issues/18) を起票し、ブランチ `fix/issue-18-optimize-thumbnail-loading` で作業を進めます。

---

## 変更対象ファイル一覧

| 操作 | ファイルパス | 責務・変更内容 |
|---|---|---|
| **変更** | `src/services/pdfEngine.ts` | `renderPageThumbnailFromDoc` の新設、`renderPageThumbnail` のラッパー化、`loadPdfDocument` のドキュメントロード・破棄の1回集約 |
| **変更** | `tests/unit/pdfEngine.test.ts` | `renderPageThumbnailFromDoc` の単体テスト追加および既存テストの継続動作検証 |
| **変更** | `docs/PROJECT.md` | `pdfEngine.ts` の関数仕様およびパフォーマンス設計の同期更新 |
| **新規作成** | `docs/plans/issue-18-optimize-thumbnail-loading-plan.md` | 本実装計画書（永続記録） |
| **新規作成** | `docs/plans/issue-18-optimize-thumbnail-loading-walkthrough.md` | 検証報告書（実装後に作成） |

---

## 詳細実装設計

### 1. `src/services/pdfEngine.ts`
- `renderPageThumbnailFromDoc(pdfDoc: pdfjsLib.PDFDocumentProxy, pageIndex: number, scale?: number): Promise<string>`
  - `page = await pdfDoc.getPage(pageIndex + 1)`
  - Canvas を生成して背景を白で初期化し、ページをレンダリングして `canvas.toDataURL('image/jpeg', 0.95)` を返却
  - `finally { page.cleanup(); }` でページ単位のリソースを確実に解放
- `renderPageThumbnail(pdfBytes: Uint8Array, pageIndex: number, scale?: number): Promise<string>`
  - `loadingTask = pdfjsLib.getDocument(...)`
  - `const pdfDoc = await loadingTask.promise;`
  - `try { return await renderPageThumbnailFromDoc(pdfDoc, pageIndex, scale); }`
  - `finally { await pdfDoc.cleanup(); await loadingTask.destroy(); }`
- `loadPdfDocument(file: File | ArrayBuffer | Uint8Array): Promise<PdfDocumentData>`
  - 既存の `pdf-lib` でのメタデータ取得に加え、`pdfjsLib.getDocument` を呼び出して `pdfjsDoc = await loadingTask.promise` を取得
  - `try` ブロック内で `for (let i = 0; i < pageCount; i++)` を回し、`renderPageThumbnailFromDoc(pdfjsDoc, i)` を実行
  - `finally` ブロックで `await pdfjsDoc.cleanup(); await loadingTask.destroy();` を実行（多重破棄の解消）

### 2. 単体テスト (`tests/unit/pdfEngine.test.ts`)
- `renderPageThumbnailFromDoc` を単体テスト。事前にロードした `PDFDocumentProxy` を渡して正しくサムネイルが返ることを確認。

---

## 検証計画

### 1. 自動テスト
- `npm test`: 全単体テストスイート（Vitest）がすべて PASS すること
- `npx playwright test`: 全 E2E テストスイート（Playwright）がすべて PASS すること

### 2. ビルド & 静的検証
- `npm run build`: TypeScript型チェックおよび Vite 単一ファイルバンドル出力が警告・エラーなく完了すること
