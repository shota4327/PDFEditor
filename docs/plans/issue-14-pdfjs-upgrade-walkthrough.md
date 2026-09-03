# Walkthrough: pdfjs-dist メジャーアップデート（v3 → v6）検証報告

## 1. 概要
本報告は、`pdfjs-dist` を `3.11.174` から最新の `6.3.289` へメジャーアップグレードし、技術検証およびテスト検証を完了した結果をまとめたものです。
高重大度脆弱性（CVE-2024-4367）の解消、ビルド警告（`eval("require")`）の排除を達成しつつ、本プロジェクトの最重要原則である「単一 HTML 出力（`vite-plugin-singlefile`）」および「完全オフライン動作（外部通信ゼロ）」が 100% 成立することを確認しました。

---

## 2. 実施した変更内容

### ① 依存関係の更新
- `package.json` / `package-lock.json`:
  - `pdfjs-dist` を `3.11.174` から `^6.3.289` へ更新
  - `npm audit` にて脆弱性 0 件（`found 0 vulnerabilities`）を達成

### ② PDF レンダリング・リソース解放 API の適合
- `src/services/pdfEngine.ts`:
  - Worker インポートを `pdfjs-dist/build/pdf.worker.min.mjs?url` に更新
  - `page.render({ canvas, canvasContext, viewport })` へ Canvas 要素の明示指定を適合
  - ドキュメント破棄処理を v6 の仕様に合わせ `await pdfDoc.cleanup()` および `await loadingTask.destroy()` に最適化

### ③ ECMAScript 新機能・Stage 3 プロポーザル向けポリフィル整備
- `src/utils/polyfills.ts`（新規作成）:
  - `pdfjs-dist` v6 が要求する以下のメソッドについて、未サポート環境（Node.js / jsdom / 各種ブラウザ）向けのポリフィルを提供：
    - `Map.prototype.getOrInsertComputed` (TC39 Stage 3 Upsert)
    - `Map.prototype.getOrInsert` (TC39 Stage 3 Upsert)
    - `Uint8Array.prototype.toHex` (TC39 Stage 3)
    - `Promise.withResolvers` (ES2024)
  - `src/main.tsx` および `tests/unit/setup.ts` のエントリーポイントで読み込み

### ④ テスト環境の適合
- `tests/unit/setup.ts`:
  - `pdfjs-dist` v6 の jsdom 環境向けに `pdfjsWorker.WorkerMessageHandler` を fakeWorker として登録
  - Canvas 2D レンダリングに必要な `Path2D`、`DOMMatrix`、`ImageData` のモックを追加
- `src/vite-env.d.ts`:
  - `pdf.worker.mjs` / `pdf.worker.min.mjs` の型定義宣言を追加

### ⑤ テストカバレッジの拡充
- `tests/e2e/pdfEditor.spec.ts`:
  - **T4.3**（単一 HTML 完全オフライン検証）を追加：ビルドされた単一成果物 `dist/index.html` を `file://` プロトコルかつブラウザオフラインモードで直接開き、PDF 読み込み・サムネイル Canvas 描画・回転・エクスポートダウンロードが外部通信ゼロで完結することを自動検証

### ⑥ ドキュメントの同期更新
- `docs/PROJECT.md`: M13 マイルストーンの追加、ファイルレイアウト更新
- `docs/TEST_INFRA.md`: Tier 4 への T4.3 テスト仕様の追記

---

## 3. 検証結果

### ① 単体テスト（Vitest）
- コマンド: `npm test -- --run`
- 結果: **8 テストファイル・53 件すべて PASS (100%)**

```
Test Files  8 passed (8)
     Tests  53 passed (53)
  Duration  5.45s
```

### ② プロダクションビルド（TypeScript & Vite）
- コマンド: `npm run build`
- 結果: **型エラーゼロ・セキュリティ警告（eval）ゼロで成功**
- 成果物: `dist/index.html`（約 2,835 kB、完全オフライン単一 HTML）

### ③ E2E 自動テスト（Playwright）
- コマンド: `npm run test:e2e`
- 結果: **全 Tier（Tier 1〜5）18 件すべて PASS (100%)**
  - `T4.1`: 外部 HTTP リクエストゼロ監査（0 件確認） **PASS**
  - `T4.2`: ブラウザオフラインモードでの編集・出力 **PASS**
  - `T4.3`: 単一 HTML（`file://`）完全オフラインでのサムネイル描画・回転・出力 **PASS**

---

## 4. 総括
事前の技術検討どおり、`cMapUrl` を未指定（現行仕様踏襲）とすることで外部通信や CORS エラーを完全に回避し、単一 HTML（`file://`）環境においても高精細なサムネイル描画と高速な PDF 操作が維持できることを実証しました。
脆弱性ゼロ、eval 排除、全テスト PASS を達成しており、安全にマージ可能な状態です。
