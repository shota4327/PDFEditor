# PDFEditor

ブラウザ上で完全に完結し、外部サーバー通信を行わずにオフラインで動作するモダンな PDF 編集 Web アプリケーションです。

---

## 🌟 主な機能

- **完全クライアントサイド実行 (Offline-First)**:
  - 外部サーバーへの通信は一切発生しません。すべての PDF 結合・ページ回転・削除・サムネイル生成処理がブラウザ内（ローカル）で安全に完結します。
- **複数 PDF の一括読み込み & 結合**:
  - ドラッグ＆ドロップまたはファイル選択ダイアログから複数の PDF を一度に読み込み、シームレスに結合可能。
- **直感的なサムネイルプレビュー & ページ並び替え**:
  - 各ページのサムネイルを視覚的に確認しながら、ドラッグ＆ドロップで自由にページ順序を入れ替え。
- **ページ単位の操作**:
  - 時計回り・反時計回りの 90 度単位回転。
  - 不要なページのワンクリック削除、全ページ一括クリア。
- **プレビュー倍率（ズーム）調整**:
  - 50% 〜 300% までの拡大・縮小・リセットに対応し、大量のページでも快適にプレビュー・編集可能。
- **ワンクリックエクスポート**:
  - 編集した順序・回転を反映した新規 PDF ファイルを生成し、即座にローカルへダウンロード。

---

## 🛠 技術スタック

- **フロントエンド**: React 18, TypeScript, Vite
- **スタイリング**: Tailwind CSS, Lucide Icons, Framer Motion
- **PDF 処理エンジン**:
  - `pdf-lib`: PDF 構造操作（ページ抽出・回転・結合・シリアライズ）
  - `pdfjs-dist`: クライアントサイドでの PDF レンダリング・Canvas サムネイル生成
- **ドラッグ＆ドロップ**: `@hello-pangea/dnd`
- **テストフレームワーク**: Vitest（単体テスト）, Playwright（E2E テスト）
- **バンドル・配布**: `vite-plugin-singlefile`（単一 HTML ファイルへのインライン化）

---

## 🚀 開発・起動手順

### 1. 依存関係のインストール
```bash
npm install
```

### 2. 開発サーバーの起動
```bash
npm run dev
```
起動後、ブラウザで `http://localhost:5173` にアクセスします。

### 3. プロダクションビルド
```bash
npm run build
```
`dist/index.html` に、JS・CSS・Worker アセットがすべて 1 つに統合された完全オフライン動作対応の単一 HTML ファイルが出力されます。

---

## 🧪 テスト実行

### 単体テスト (Vitest)
```bash
npm test
```

### E2E テスト (Playwright)
```bash
npm run test:e2e
```
インタラクティブ UI でテストを実行する場合:
```bash
npm run test:e2e -- --ui
```

---

## 📂 プロジェクト構成

```
PDFEditor/
├── src/
│   ├── components/      # UIコンポーネント (Header, Toolbar, DropZone, ThumbnailGrid等)
│   ├── services/        # PDF処理エンジン (pdfEngine.ts)
│   ├── types/           # 型定義 (pdf.ts)
│   ├── App.tsx          # メインアプリケーションコンポーネント
│   └── main.tsx         # エントリーポイント
├── tests/
│   ├── unit/            # Vitest 単体テスト
│   └── e2e/             # Playwright E2E テスト
├── docs/
│   ├── PROJECT.md       # アーキテクチャ・モジュール設計書
│   ├── TEST_INFRA.md    # テスト設計・セレクタ仕様書
│   └── plans/           # 実装計画および検証記録
├── GEMINI.md            # プロジェクト開発・コーディング原則 (開発ルール)
└── README.md            # 本ドキュメント
```
