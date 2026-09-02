# プロジェクト仕様書: PDFEditor (完全オフライン対応 PDF 編集 Web アプリケーション)

## アーキテクチャ概要
ブラウザ上で完全に完結するシングルページ Web アプリケーション (SPA) です。
- **フロントエンドフレームワーク**: React 18 + TypeScript + Vite
- **スタイリング & UI**: Tailwind CSS + Lucide Icons + Framer Motion
- **PDF 処理エンジン**:
  - `pdf-lib`: PDF 構造操作（新規 PDF 作成、ページのコピー・抽出、回転、削除、結合、Uint8Array へのシリアライズ）
  - `pdfjs-dist`: クライアントサイドでの PDF レンダリング（PDF ページを HTML5 Canvas / JPEG Data URL サムネイル画像へ変換）
- **ドラッグ＆ドロップ**: `@hello-pangea/dnd` によるグリッド内ページの直感的な順序入れ替え、および複数ファイルの一括ドロップ読み込み
- **完全オフライン保証**: バンドルされた `pdfjs` Worker アセットを使用し、外部 HTTP API 通信ゼロで動作

---

## 開発マイルストーン
| # | マイルストーン名 | スコープ・内容 | 依存関係 | ステータス |
|---|---|---|---|---|
| M1 | プロジェクトセットアップ & 基盤構築 | Vite + React + TS 環境構築、Tailwind CSS、Vitest、Playwright テスト基盤 | なし | 完了 (DONE) |
| M2 | PDF 処理エンジンの実装 | `pdf-lib` と `pdfjs-dist` をラップしたサービスモジュール（読み込み、サムネイル描画、回転、削除、結合、エクスポート） | M1 | 完了 (DONE) |
| M3 | UI & ドラッグ＆ドロップ実装 | ヘッダー、ファイルドロップゾーン、サムネイルグリッド、並び替え、回転・削除コントロール | M1 | 完了 (DONE) |
| M4 | 統合 & ダウンロードパイプライン | React 状態管理統合、エクスポート機能、完全オフラインバンドル検証 | M2, M3 | 完了 (DONE) |
| M5 | E2E 自動テスト構築 | Tier 1〜4 を網羅する Playwright 自動テストスイートおよびテスト仕様書の作成 | M1 | 完了 (DONE) |
| M6 | E2E 検証 & 整合性監査 | E2E テストの実行、ストレステスト、データ漏洩・完全オフライン監査 | M4, M5 | 完了 (DONE) |
| M7 | ズーム機能 & UI/UX 強化 | プレビューサムネイルの拡大縮小（50%〜300%）、グリッド重なりバグ修正、単一 HTML バンドル最適化 | M3, M4 | 完了 (DONE) |
| M8 | TypeScript 7 移行 & 高速化 | TypeScript 7.0 への更新、tsconfig 互換性調整、型チェック/ビルド/テストの検証 | M1 | 完了 (DONE) |
| M9 | 全体リファクタリング & 品質改善 | GEMINI.md 原則に基づくコンポーネント・フック分割（30〜50行）、page.cleanup 徹底、単体テスト拡充 | M1〜M8 | 完了 (DONE) |
| M10 | 全画面D&D & ヘッダー操作 (Issue #1) | 全画面ドラッグ＆ドロップ（オーバーレイ表示）、ヘッダー内ファイル読み込みボタン、読み込み後ドロップゾーン非表示、画面全幅編集エリア | M1〜M9 | 完了 (DONE) |
| M11 | ヘッダーレイアウト微調整 (Issue #10) | タイトル横アイコンの廃止、タイトル文字の一回り拡大、右端オフライン保証バッジ削除 | M1〜M10 | 完了 (DONE) |
| M12 | ビルド＆テスト基盤最新化 (Issue #12) | TypeScript 7.0.2, Testing Library 16.3.3, Playwright 1.62.1, Vitest 4.1.11, Vite 8.2.2 への更新と単一HTML高速ビルド（950ms）検証 | M1〜M11 | 完了 (DONE) |

---

## インターフェース契約 (Interface Contracts)

### `pdfEngine.ts` サービスモジュール
```typescript
/**
 * ファイルまたはバイト配列から PDF を読み込み、メタデータとサムネイルプレビューを生成
 */
function loadPdfDocument(file: File | ArrayBuffer | Uint8Array): Promise<PdfDocumentData>;

/**
 * 特定の PDF ページを HTML5 Canvas に描画し、JPEG Data URL を生成
 */
function renderPageThumbnail(pdfBytes: Uint8Array, pageIndex: number, scale?: number): Promise<string>;

/**
 * 指定されたページ順序・回転角度に基づき新規 PDF を結合・構築し、Uint8Array を返却
 */
function exportPdf(pages: ExportPageSpec[]): Promise<Uint8Array>;

/**
 * 生成された PDF バイト列から Blob を作成し、ブラウザのダウンロードを発行
 */
function createDownloadLink(pdfBytes: Uint8Array, filename: string): void;
```

---

## ファイルレイアウト
```
PDFEditor/
├── package.json              # プロジェクト定義・スクリプト・依存ライブラリ
├── vite.config.ts            # Vite バンドラおよび単一HTML出力プラグイン設定
├── tailwind.config.js        # Tailwind CSS スタイル設定
├── postcss.config.js         # PostCSS プラグイン設定
├── tsconfig.json             # アプリケーション向け TypeScript 設定
├── tsconfig.node.json        # ツール・設定ファイル向け TypeScript 設定
├── index.html                # HTML エントリーポイント
├── .gitignore                # Git 管理対象外設定
├── GEMINI.md                 # プロジェクト開発・コーディング原則 (開発ルール)
├── src/
│   ├── main.tsx              # React アプリケーション起動エントリー
│   ├── App.tsx               # メインアプリケーションコンポーネント
│   ├── types/
│   │   └── pdf.ts            # PDF 関連の型定義インターフェース
│   ├── services/
│   │   └── pdfEngine.ts      # PDF 処理・レンダリングサービス
│   ├── hooks/
│   │   ├── usePdfPages.ts    # PDF ページ状態管理・結合操作
│   │   ├── useZoom.ts        # サムネイルズーム制御フック
│   │   ├── useToast.ts       # トースト通知・自動消去フック
│   │   └── useGlobalDragDrop.ts # 全画面ドラッグ＆ドロップ監視フック
│   ├── components/
│   │   ├── Header.tsx        # アプリケーションヘッダー（ファイル選択ボタン内蔵）
│   │   ├── DragOverlay.tsx   # 全画面ドラッグオーバーレイ
│   │   ├── LoadingOverlay.tsx # 全画面ローディングオーバーレイ
│   │   ├── DropZone.tsx      # ファイルドロップゾーン
│   │   ├── DropZoneErrorBanner.tsx # エラー表示バナー
│   │   ├── ThumbnailGrid.tsx # サムネイルグリッド（DND対応）
│   │   ├── ThumbnailCard.tsx # 各ページサムネイルカードコンテナ
│   │   ├── ThumbnailCardHeader.tsx # カードヘッダー（ドラッグ・削除）
│   │   ├── ThumbnailPreview.tsx    # サムネイル画像・回転プレビュー
│   │   ├── ThumbnailCardFooter.tsx # カードフッター（個別回転ボタン）
│   │   ├── Toolbar.tsx       # 操作ツールバー（ズーム、削除、出力）
│   │   ├── PageCountBadge.tsx # 総ページ数バッジ
│   │   ├── ZoomControls.tsx  # ズーム操作コントロール
│   │   └── Toast.tsx         # 操作通知トースト
│   └── index.css             # グローバルスタイル
├── tests/
│   ├── unit/                 # Vitest 単体テストスイート
│   │   ├── setup.ts          # テスト初期化モック設定
│   │   ├── pdfEngine.test.ts # エンジン単体テスト
│   │   ├── pdfHelpers.test.ts# ヘルパー単体テスト
│   │   ├── components.test.tsx # UI コンポーネント単体テスト
│   │   ├── useZoom.test.ts   # ズームフック単体テスト
│   │   ├── useToast.test.ts  # トーストフック単体テスト
│   │   └── generateFixtures.test.ts # テスト用 PDF 生成テスト
│   └── e2e/                  # Playwright E2E テストスイート
│       ├── fixtures/         # テスト用サンプル PDF ファイル
│       ├── helpers/          # テスト補助モジュール（PDF検証等）
│       └── pdfEditor.spec.ts # 4層 E2E 総合テスト
├── docs/
│   ├── PROJECT.md            # 本設計仕様書
│   ├── TEST_INFRA.md         # テスト設計・セレクタ仕様書
│   └── plans/                # 実装計画および検証記録
├── GEMINI.md                 # プロジェクト開発・コーディング原則 (開発ルール)
└── README.md                 # プロジェクト概要・利用手順
```
