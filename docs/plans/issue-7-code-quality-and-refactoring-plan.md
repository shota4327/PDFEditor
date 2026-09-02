# 実装計画: GEMINI.md開発原則に基づく全体リファクタリングと品質改善 (Issue #7)

本計画は、`GEMINI.md` に定められた設計原則（単一責任の原則、コンポーネント行数目安 30〜50行、メモリリーク防止・リソース破棄の徹底、日本語コメント規約、仕様書同期）に基づき、コードベース全体の構造改善と品質強化を実施することを目的とします。

---

## ユーザー確認事項（User Review Required）

> [!NOTE]
> - 外部仕様や UI の見た目、操作性、E2E テストセレクタ（`data-testid` 属性等）は 100% 互換性を維持します。
> - 大規模コンポーネントを責務ごとに小さく分割（30〜50行目安）し、保守性と可読性を向上させます。
> - `pdfjs-dist` の `page.cleanup()` 呼び出しを追加し、メモリリーク防止を徹底します。

---

## 変更内容（Proposed Changes）

### 1. カスタムフックのモジュール分離

#### [NEW] `src/hooks/useZoom.ts`
- ズーム倍率（50%〜200%）、拡大、縮小、リセット、直接変更ロジックを独立管理。

#### [NEW] `src/hooks/useToast.ts`
- トースト通知状態管理および自動消去タイマーのクリーンアップ処理を独立管理。

#### [MODIFY] `src/hooks/usePdfPages.ts`
- `useZoom` と `useToast` を内包し、PDF 読み込み・回転・並び替え・エクスポートに責務を集中（約60行前後にスリム化）。

---

### 2. UI コンポーネントの分割とスリム化（30〜50行目安）

#### [NEW] `src/components/ZoomControls.tsx`
- ズーム拡大・縮小ボタン、スライダー、インジケータ、リセットボタンを担当。

#### [NEW] `src/components/PageCountBadge.tsx`
- 読み込み総ページ数バッジ表示を担当。

#### [MODIFY] `src/components/Toolbar.tsx`
- `ZoomControls`、`PageCountBadge` を組み合わせ、全体ツールバー構造のみを簡潔に定義（約45行）。

#### [NEW] `src/components/ThumbnailCardHeader.tsx`
- カード上部のドラッグハンドル、ファイル名、削除ボタンを担当。

#### [NEW] `src/components/ThumbnailPreview.tsx`
- Canvas サムネイルプレビュー描画、回転スタイル適用、ResizeObserver 監視、ページ番号/角度バッジを担当。

#### [NEW] `src/components/ThumbnailCardFooter.tsx`
- カード下部の時計回り・反時計回り回転ボタンを担当。

#### [MODIFY] `src/components/ThumbnailCard.tsx`
- ヘッダー、プレビュー、フッターを合成する純粋なコンテナコンポーネントとして定義（約50行）。

#### [NEW] `src/components/DropZoneErrorBanner.tsx`
- エラーメッセージ通知バナーを担当。

#### [MODIFY] `src/components/DropZone.tsx`
- ファイルドロップゾーンロジックと描画を担当（約50行）。

---

### 3. リソース管理・メモリリーク防止の強化

#### [MODIFY] `src/services/pdfEngine.ts`
- `renderPageThumbnail` の `finally` 節において、`page.cleanup()` を確実に呼び出して `pdfjs` ページリソースを破棄。
- `createDownloadLink` において `new Blob([pdfBytes], { type: 'application/pdf' })` を使用し、安全なバイナリ生成を実施。

---

### 4. 単体テスト & 仕様書ドキュメント更新

#### [NEW] `tests/unit/useZoom.test.ts`
- ズーム操作（拡大、縮小、境界値 50%/200%、リセット、直接指定）の単体テスト。

#### [NEW] `tests/unit/useToast.test.ts`
- トースト表示、自動消去タイマーの単体テスト。

#### [MODIFY] `tests/unit/components.test.tsx`
- 分割された新規コンポーネント（`ZoomControls`、`PageCountBadge`、`ThumbnailPreview` 等）の単体テストを追加。

#### [MODIFY] `docs/PROJECT.md`
- コンポーネント構成、フック設計、マイルストーン M9（GEMINI.md原則に基づく全体リファクタリング）を同期反映。

---

## 検証手順（Verification Plan）

### 自動テスト & ビルド検証
1. **型チェック**: `npx tsc`（エラー 0 件）
2. **単体テスト**: `npm test`（Vitest 全テストスイート 100% PASS）
3. **E2E テスト**: `npm run test:e2e`（Playwright 全 15 テスト 100% PASS）
4. **プロダクションビルド**: `npm run build`（`dist/index.html` の正常出力）
