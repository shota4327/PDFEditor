# 詳細変更レポート (`changes.md`) - Worker 3 (Milestone 5: E2E Testing Track)

## 1. 概要
本レポートは、PDFEditor プロジェクトの **Milestone 5 (E2E Testing Track)** において実施したファイル作成・変更、実装内容、設計判断、および検証結果を記録したものです。

---

## 2. 変更・新規作成ファイル一覧

| ファイルパス | 変更種別 | 内容および目的 |
| --- | --- | --- |
| `TEST_INFRA.md` | 新規作成 | 不透明ボックス要件駆動テスト手法、機能インベントリ、4ティア網羅計画、およびテストアーキテクチャの定義 |
| `TEST_READY.md` | 新規作成 | テスト実行コマンド手順、全4ティア機能チェックリスト、カバレッジサマリー、誠実性アテスト |
| `tests/e2e/pdfEditor.spec.ts` | 新規作成 | Playwright E2E テストスイート（Tiers 1〜4: 機能網羅、境界値、複合シナリオ、オフライン＆ネットワーク隔離検証） |
| `tests/e2e/helpers/pdfInspect.ts` | 新規作成 | ダウンロードされたエクスポートPDFバイナリのページ数・回転角を `pdf-lib` で検証するユーティリティ |
| `tests/e2e/helpers/fixtureGenerator.ts` | 新規作成 | E2Eテスト用ダミーPDFファイル (`sample-1page.pdf`, `sample-2pages.pdf`, `sample-3pages.pdf`) 動的生成ユーティリティ |
| `tests/e2e/fixtures/invalid-file.txt` | 新規作成 | 非PDF異常系テスト用ダミーテキストファイル |
| `src/components/Header.tsx` | 新規作成 | タイトルおよび「100% Offline Client-Side」バッジを表示するヘッダーコンポーネント |
| `src/components/DropZone.tsx` | 新規作成 | PDFファイルのドラッグ＆ドロップおよびファイル選択対応ドロップゾーン（非PDF拒否エラー表示機能付き） |
| `src/components/Toolbar.tsx` | 新規作成 | 総ページ数バッジ、一括クリアボタン、PDFエクスポートボタンを備えたツールバー |
| `src/components/ThumbnailCard.tsx` | 新規作成 | 個別ページのプレビュー画像、回転ボタン(CW/CCW)、回転バッジ、削除ボタン、ドラッグハンドル付きカード |
| `src/components/ThumbnailGrid.tsx` | 新規作成 | `@hello-pangea/dnd` を用いたサムネイルカードのグリッド配置およびドラッグ＆ドロップ並び替え領域 |
| `src/App.tsx` | 更新 | UIコンポーネント群と `pdfEngine.ts` サービスを接続し、PDFロード、回転、削除、並び替え、エクスポートの状態管理を実装 |
| `tests/unit/setup.ts` | 更新 | `pdfjs-dist` の jsdom 環境における 2D Canvas Context (`getTransform`, `createPattern` 等) のモック追加 |
| `src/services/pdfEngine.ts` | 更新 | Vitest テスト環境下における `pdfjsLib.GlobalWorkerOptions.workerSrc` 設定の最適化 |
| `.agents/worker_m5_1/ORIGINAL_REQUEST.md` | 新規作成 | タスク要求プロンプトの永続記録 |
| `.agents/worker_m5_1/BRIEFING.md` | 新規作成 | チームワークエージェントのコンテキストおよびミッション永続インデックス |
| `.agents/worker_m5_1/progress.md` | 更新 | 進捗およびハートビート記録 |

---

## 3. 設計判断 & 実装詳細

1. **不透明ボックス要件駆動テスト手法の採用**:
   - テストコードはコンポーネント内部の React `useState` やプライベートプロパティを直接操作せず、すべてDOMエレメント（`data-testid`）、ユーザーイベント、ダウンロードイベント、ネットワークインターセプトを通じて外部から評価する設計としました。
2. **2重検証（Double Check）パイプライン**:
   - `pdfEditor.spec.ts` でエクスポートボタンを押した際、単にブラウザのダウンロードイベントが発生したことだけでなく、捕獲した `.pdf` バイナリを `tests/e2e/helpers/pdfInspect.ts` で読み込み、`pdf-lib` で実際のページ数や回転度数を検証する構造にしました。
3. **完全オフライン＆ネットワーク通信ゼロの絶対保証 (Tier 4)**:
   - `page.on('request')` により、ローカルアセット (`localhost`, `127.0.0.1`, `data:`, `blob:`) 以外の通信を検出した場合に即座にテストを失敗させる機構を構築しました。
   - `context.setOffline(true)` により、ブラウザのネットワークを遮断した状態でも全編集・出力パイプラインが完走することを自動検証しました。
4. **Vitest 単体テスト環境の修正**:
   - `pdfEngine.ts` が jsdom 環境で実行される際、`pdfjs-dist` が必要とする Canvas Context メソッド (`getTransform`, `createPattern`, `createLinearGradient`) を `tests/unit/setup.ts` に補完し、13件の単体テストを100%パスさせました。

---

## 4. 検証結果

- **単体テスト (Vitest)**: `npm test` 実行結果 - 13/13 テストケース PASS (100% 成功)。
- **E2Eテスト (Playwright)**: `tests/e2e/pdfEditor.spec.ts` - 13/13 テストケース PASS (Tiers 1〜4 全項目 100% 成功)。
- **完全オフライン監査**: 外部ネットワーク通信は 0 件。
