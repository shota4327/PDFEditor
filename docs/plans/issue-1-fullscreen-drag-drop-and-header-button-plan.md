# Issue #1 実装計画: 全画面ドラッグ＆ドロップ対応とヘッダー内ファイル読み込みボタン追加

Issue #1（ドラッグ＆ドロップ可能エリアを画面全体に / タイトルバー内ファイル読み込みボタン / 読み込み後ドロップゾーン非表示 / 編集エリアの画面幅拡大）に対応するための詳細な実装計画です。

## ユーザー確認事項
- 全画面へのファイルドラッグ時に、半透明のオーバーレイ（「ここにドロップしてPDFを追加」）を表示して視覚的なフィードバックを提供します。
- タイトルバー（Header）の右側に「ファイルを開く」ボタンを新設し、常時利用可能にします。
- 起動直後は画面中央にドロップゾーンのみを表示し、ファイル読み込み後はドロップゾーンを非表示にしてツールバーとサムネイルグリッドを画面幅いっぱいに表示します。

## 変更対象ファイル一覧

| 操作 | ファイルパス | 責務・変更内容 |
|---|---|---|
| **新規作成** | `src/components/DragOverlay.tsx` | 全画面ドラッグ時に表示する半透明オーバーレイUIコンポーネント |
| **新規作成** | `src/hooks/useGlobalDragDrop.ts` | ウィンドウ全体の dragenter / dragleave / dragover / drop イベントを監視・管理するカスタムフック |
| **変更** | `src/components/Header.tsx` | タイトルバー右側にファイル選択ボタン（`data-testid="header-open-file-btn"`）および隠し file input を追加 |
| **変更** | `src/App.tsx` | 全画面 D&D フックの適用、起動直後と読み込み後の表示切り替え、メインコンテナの画面幅拡大（`max-w-6xl` 撤廃） |
| **変更** | `src/components/DropZone.tsx` | 起動直後のドロップゾーン表示の最適化 |
| **変更** | `tests/unit/components.test.tsx` | Header、DragOverlay、DropZone の新規・更新単体テストを追加 |
| **変更** | `tests/e2e/pdfEditor.spec.ts` | ヘッダーからのファイル選択、全画面 D&D、読み込み後のUI表示遷移のE2Eテストを追加 |
| **変更** | `docs/PROJECT.md` | UI仕様・コンポーネント構成の同期更新 |

---

## 詳細実装設計

### 1. 全画面ドラッグ＆ドロップ管理 (`src/hooks/useGlobalDragDrop.ts` & `src/components/DragOverlay.tsx`)
- **`useGlobalDragDrop`**:
  - `dragenter` / `dragleave` / `dragover` / `drop` を `window` レベルでリッスン。
  - ドラッグカウンター（`dragCounterRef`）を用いて、子要素への出入りによる誤った `isDraggingOver` のちらつきを防止。
  - ファイルがドロップされたら `e.dataTransfer.files` から PDF をフィルタリングし、コールバック関数に渡す。
  - クリーンアップ関数でイベントリスナーを確実に解除（メモリリーク防止）。
- **`DragOverlay`**:
  - `isDragging` が true のとき、画面全体に `fixed inset-0 z-50 bg-indigo-950/60 backdrop-blur-sm` のオーバーレイを表示。
  - 中央にアニメーション付きのアイコンと「ここにPDFファイルをドロップして追加」メッセージを表示。

### 2. ヘッダー内のファイル読み込みボタン (`src/components/Header.tsx`)
- Props に `onFilesSelected?: (files: File[]) => void` と `isProcessing?: boolean` を追加。
- 隠し `<input type="file" accept="application/pdf,.pdf" multiple data-testid="header-file-input" />` を配置。
- 「ファイルを開く」（`FilePlus` アイコン）ボタン（`data-testid="header-open-file-btn"`）を右側（オフラインバッジの隣）に配置。

### 3. メイン画面レイアウトの更新 (`src/App.tsx`)
- `useGlobalDragDrop` を統合し、全画面でのドラッグを検知。
- メインエリアのコンテナクラスを `max-w-6xl w-full mx-auto` から `w-full px-4 sm:px-6 py-4 space-y-4` に変更し、画面幅を最大限に活用。
- 状態に応じた表示の切り替え:
  - **起動直後（`pages.length === 0 && !isLoading`）**: 中央に `DropZone` のみを表示。
  - **読み込み後（`pages.length > 0`）**: `DropZone` を非表示にし、`Toolbar` と画面幅いっぱいの `ThumbnailGrid` を表示。
  - **読み込み中（`isLoading`）**: ローディングスピナーを表示。

### 4. 単体テストおよび E2E テストの拡充
- **単体テスト (`tests/unit/components.test.tsx`)**:
  - `Header`: ファイル選択ボタンのクリックとファイル選択発火の検証。
  - `DragOverlay`: 表示状態と非表示状態のレンダリング検証。
  - `useGlobalDragDrop`: window イベント監視とコールバック呼び出しの検証。
- **E2E テスト (`tests/e2e/pdfEditor.spec.ts`)**:
  - ヘッダーの「ファイルを開く」ボタンから複数PDFが正常に読み込めること。
  - ページ読み込み完了後にドロップゾーンが非表示となり、編集エリアが全幅で表示されること。
  - 全画面へのドラッグ＆ドロップ動作の検証。

---

## 検証計画

### 1. 自動テスト
- `npm test`: 全単体・結合テストスイートが PASS すること
- `npx playwright test`: 全 E2E テストスイートが PASS すること

### 2. ビルド & 静的検証
- `npm run build`: TypeScript 型チェックおよび Vite 単一ファイルバンドル（`dist/index.html`）が正常に生成されること
