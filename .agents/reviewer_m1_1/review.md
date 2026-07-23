# マイルストーン1（プロジェクトセットアップ＆アーキテクチャ）レビューレポート

## レビュー概要

**判定**: **VETO (REQUEST_CHANGES)**

マイルストーン1の基本構造（TypeScript設定、Tailwind CSS、JSDOMテスト環境、pdf-libを使用したテストヘルパー）は高度に完成しており、単体テストも100%合格しています。しかし、ビルドプロセスおよびオフラインWorkerの設定に関して、修正が必要な2件の重大な問題が検出されたため、判定を **VETO** とします。

---

## 指摘事項 (Findings)

### [Major] 指摘事項 1: Windows環境における `npm run build` の失敗

- **対象ファイル**: `package.json`, `vite.config.ts`
- **問題概要**: 既に `dist/` ディレクトリが存在する状態（またはWindowsのファイルインデックス/プロセス監視中の状態）で `npm run build` を実行すると、Viteのデフォルトの `emptyOutDir: true` がファイルアクセス権限エラー（`EBUSY`/`EPERM`）を引き起こし、ビルドが終了コード1で失敗します。
- **再現手順**:
  1. `npm run build` を実行して `dist/` を生成。
  2. 再度 `npm run build` を実行。
  3. ログ: `transforming... ✓ 31 modules transformed.` 後にサイレント終了し exit code 1 となる。
- **影響**: CI/CD環境やWindows環境での継続的ビルドが不安定化・失敗します。
- **修正提案**:
  - `vite.config.ts` の `build` オプションに `emptyOutDir: false` を設定する、または `package.json` の `build` スクリプトでビルド前に `rimraf` 等によるクリーンアップを行う構成に修正してください。
  ```typescript
  // vite.config.ts
  export default defineConfig({
    build: {
      emptyOutDir: false,
    },
    ...
  });
  ```

---

### [Major] 指摘事項 2: `vite.config.ts` における `pdfjs-dist` オフラインWorkerバンドル設定の不足

- **対象ファイル**: `vite.config.ts`
- **問題概要**: 現状の `vite.config.ts` では `optimizeDeps: { include: ['pdfjs-dist'] }` のみが記述されています。これは開発サーバー（dev server）における依存関係の事前バンドル設定に過ぎず、プロダクションビルド時 (`dist/`) に `pdfjs-dist/build/pdf.worker.min.js` (または `.js`) を独立したWorkerアセットとしてバンドル/コピーする設定が含まれていません。
- **影響**: `PROJECT.md` の要件「オフライン保証（外部HTTP API呼び出しゼロ、bundled pdfjs worker asset）」を満たせなくなります。M2で `pdfEngine.ts` がクライアントサイドでPDFサムネイル描画を行う際、Workerファイルが見つからずCDNへのフォールバックを試みるか、あるいはWorkerエラーが発生します。
- **修正提案**:
  - `vite-plugin-static-copy` 等を用いて `pdfjs-dist/build/pdf.worker.min.js` を `dist/` （例: `dist/pdf.worker.min.js`）へ自動コピーする設定を追加するか、ViteのWorkerバンドル設定（`new Worker(new URL('pdfjs-dist/build/pdf.worker.min.js', import.meta.url))`）を確立してください。

---

## 検証済み項目 (Verified Claims)

- **TypeScript 型チェック**: `npx tsc` 実行 → **PASS** (エラー 0件)
- **Vitest 単体テスト**: `npx vitest run` 実行 → **PASS** (1 ファイル, 3 テスト全て合格)
- **Vite バンドル生成**: `dist/` をクリーンにした状態で `npx vite build` 実行 → **PASS** (`dist/index.html`, `dist/assets/index-*.js`, `dist/assets/index-*.css` が生成されることを確認)
- **コード整合性・不正チェック (Integrity Check)**: **PASS**
  - ハードコードされたテスト結果や偽装（Facade）実装は存在せず、`pdf-lib` を用いた本物のPDFバイナリ生成および読み込み検証が行われています。

---

## 調査未完了 / リスク評価 (Coverage Gaps & Risk)

- **Workerの実動作検証**: 現段階では `pdfEngine.ts` (M2) が未実装のため、Workerがブラウザ上で正常にスレッド起動するかどうかはM2での統合検証が必要です。
- **Playwright E2E設定**: `playwright.config.ts` が作成されていますが、E2Eテストコード自体はM5で作成予定です。

---

## 結論

指摘事項1（Windowsでの再ビルド失敗）および指摘事項2（`pdfjs-dist` オフラインWorkerバンドル設定不足）の修正を求めます。
修正完了後、再レビューを実施します。
