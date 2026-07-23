# Handoff Report — Explorer 2 (Milestone 1)

## 1. Observation
- **対象ファイルおよび仕様要件**:
  - `PROJECT.md` Lines 7-12: `pdf-lib` は構造操作（作成・コピー・回転・削除・結合・Uint8Array出力）、`pdfjs-dist` はクライアントサイドレンダリング（Canvas / Data URL サムネイル化）に利用。
  - `PROJECT.md` Line 11: 「Bundled `pdfjs` worker asset, zero external HTTP API calls.」
  - `PROJECT.md` Lines 24-28 (`pdfEngine.ts` インターフェース契約):
    ```typescript
    loadPdfDocument(file: File | ArrayBuffer): Promise<{ id: string, name: string, pageCount: number, pages: PdfPageInfo[] }>
    renderPageThumbnail(pdfBytes: Uint8Array, pageIndex: number, scale?: number): Promise<string>
    exportPdf(pages: { pdfBytes: Uint8Array, pageIndex: number, rotation: number }[]): Promise<Uint8Array>
    createDownloadLink(pdfBytes: Uint8Array, filename: string): void
    ```
  - `ORIGINAL_REQUEST.md` R1 & オフライン要件: 外部サーバー通信を発生させない完全オフライン動作。
- **既存の調査成果**:
  - `.agents/explorer_m1_1/analysis.md` Lines 276-288: Viteにおける `pdfjs-dist` ワーカーのインポート構文 `import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.js?url';` の提案。

## 2. Logic Chain
1. **[Observation: PROJECT.md Line 11 & ORIGINAL_REQUEST.md R1]** より、アプリのすべての処理で外部ネットワーク通信が発生してはならない。
2. **`pdfjs-dist` の標準動作**では、`GlobalWorkerOptions.workerSrc` が明示されない場合外部CDN (cdnjs/unpkg) からワーカーJSを非同期取得しようとしてオフライン時に失敗する。
3. **[Observation: Vite アセットインポート機能]** Viteの `?url` クエリ指定 (`import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.js?url'`) を用いることで、開発時 (`vite dev`) も本番ビルド (`vite build`) もローカル node_modules からアセットを出力ディレクトリ (`dist/assets/`) へコピーし、外部通信を完全に遮断できる。
4. **[Observation: PROJECT.md Lines 24-28]** の `pdfEngine.ts` インターフェースを満たすため、`pdf-lib` の `PDFDocument.load()`, `copyPages()`, `setRotation(degrees())`, `save()` を組み合わせてオンメモリ操作を実現する。
5. **Vitest単体テスト**において固定のバイナリPDFアセットファイルをリポジトリに配置するとメンテナンス性が低下するため、`pdf-lib` の `PDFDocument.create()` を用いたオンメモリ動的合成PDF生成ヘルパー (`createSamplePdf`) を提供することで、100%再現可能な高速テストが実現できる。

## 3. Caveats
- `jsdom` 環境では `HTMLCanvasElement.getContext('2d')` および `toDataURL` が標準で動作しないため、`tests/unit/setup.ts` にて Canvas のスタブモック定義が必須となる。
- `pdfjs-dist` のバージョン（例: `3.11.174` vs `4.x`）によりワーカー拡張子が `.js` または `.mjs` に変化するため、`package.json` でバージョンを厳密に固定する必要がある。

## 4. Conclusion
- Vite環境での `pdfjs-dist` オフラインワーカー配信は `import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.js?url';` により完全実現可能。
- `pdfEngine.ts` は `pdf-lib`（操作）と `pdfjs-dist`（描画）を明確に分離した設計で実装すべき。
- Vitest単体テストは `pdf-lib` による動的合成PDF生成 (`createSamplePdf`) と `setup.ts` での Canvas モック化を組み合わせることで、完全オフラインかつアセットファイル非依存のテスト環境が構築できる。

## 5. Verification Method
- **コマンド**:
  - `npx vite build` 実行後、`dist/assets/` に `pdf.worker` ファイルが出力されていることを確認。
  - `npx vitest run` を実行し、合成PDFを使用した `tests/unit/pdfEngine.test.ts` がすべて PASS することを確認。
- **検証ファイル**:
  - `.agents/explorer_m1_2/analysis.md`
  - `src/services/pdfEngine.ts` (実装時)
  - `tests/unit/setup.ts` (実装時)
  - `tests/unit/helpers/createSamplePdf.ts` (実装時)
- **失効条件**:
  - ネットワークオフライン状態（DevTools Offlineモード）で `renderPageThumbnail` 実行時にワーカー通信エラーが発生した場合。
