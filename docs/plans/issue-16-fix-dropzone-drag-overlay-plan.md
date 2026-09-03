# Issue #16 実装計画: 初期画面DropZoneでのドロップ時にオーバーレイが残留する不具合の修正

## 概要・問題の背景
初期画面（未読み込み状態）の中央に表示されている `DropZone` エリア内でPDFファイルをドロップした際、[DropZone.tsx](file:///c:/Git/PDFEditor/src/components/DropZone.tsx) 内の `handleDrop` で `e.stopPropagation()` が実行されるため、イベントが `window` へバブリングしません。
これにより、全画面のドラッグ状態およびオーバーレイ表示を管理している [useGlobalDragDrop.ts](file:///c:/Git/PDFEditor/src/hooks/useGlobalDragDrop.ts) の `drop` リスナーが発火せず、ドラッグ中フラグ（`isDraggingOver`）が `true` のまま残留し、全画面オーバーレイ（[DragOverlay.tsx](file:///c:/Git/PDFEditor/src/components/DragOverlay.tsx)）が表示され続けて操作不能となる不具合が発生しています。

## ユーザー確認・合意済み事項 (/grill-me にて決定)
1. **D&D処理の全画面ハンドラーへの一本化**:
   - ドラッグ＆ドロップ処理およびオーバーレイの表示/消去は [`useGlobalDragDrop`](file:///c:/Git/PDFEditor/src/hooks/useGlobalDragDrop.ts) に一元化します。
   - [`DropZone`](file:///c:/Git/PDFEditor/src/components/DropZone.tsx) からはローカルのドラッグイベントハンドラー（`handleDragOver`, `handleDragLeave`, `handleDrop`）とイベント遮断（`e.stopPropagation()`）を削除します。
2. **DropZone のビジュアル・責務**:
   - 全画面ドラッグ中は全画面オーバーレイ（[`DragOverlay`](file:///c:/Git/PDFEditor/src/components/DragOverlay.tsx)）が表示されるため、`DropZone` 内部でのドラッグ中ハイライト状態（`isDragging`）は不要とし、スタイルを固定・シンプル化します。
   - `DropZone` は「クリックによるファイル選択（`<input type="file">` 連携）」と「初期画面における案内表示」の責務に集中させます（単一責任の原則）。
3. **Issue 駆動開発**:
   - GitHub Issue [#16](https://github.com/shota4327/PDFEditor/issues/16) を起票し、ブランチ `fix/issue-16-dropzone-drag-overlay` を作成して進行します。

---

## 変更対象ファイル一覧

| 操作 | ファイルパス | 責務・変更内容 |
|---|---|---|
| **変更** | `src/components/DropZone.tsx` | 不要なローカルD&Dハンドラー（`handleDragOver`, `handleDragLeave`, `handleDrop`）および `isDragging` 状態を削除し、イベントバブリングを妨げないように整理 |
| **変更** | `tests/unit/components.test.tsx` | `DropZone` 単体テストの更新（ファイル入力による選択イベントの検証） |
| **変更** | `tests/e2e/pdfEditor.spec.ts` | Tier 5 に「T5.3: 初期画面のDropZoneエリアへの直接ドロップ時にオーバーレイが閉じ、PDFが読み込まれること」のE2Eテストを追加 |
| **新規作成** | `docs/plans/issue-16-fix-dropzone-drag-overlay-plan.md` | 本実装計画書（永続記録） |
| **新規作成** | `docs/plans/issue-16-fix-dropzone-drag-overlay-walkthrough.md` | 検証報告書（実装後に作成） |

---

## 詳細実装設計

### 1. `src/components/DropZone.tsx` の改修
- `useState(false)` による `isDragging` 状態および以下のハンドラーを削除:
  - `handleDragOver`: `e.preventDefault()`, `e.stopPropagation()`, `setIsDragging(true)`
  - `handleDragLeave`: `e.preventDefault()`, `e.stopPropagation()`, `setIsDragging(false)`
  - `handleDrop`: `e.preventDefault()`, `e.stopPropagation()`, `handleFiles(files)`
- コンポーネントルート要素から `onDragOver`, `onDragLeave`, `onDrop` を削除。
- `isDragging` に依存していた className の三項演算子を固定スタイル（通常時のダッシュ枠線）に変更。
- これにより、`DropZone` 上でファイルがドロップされた場合も自然に `window` レベルの `drop` イベントハンドラー（`useGlobalDragDrop`）へ到達し、オーバーレイが確実に解除されファイルが読み込まれる。

### 2. 単体テストの改修 (`tests/unit/components.test.tsx`)
- `DropZone` のテストケースを整理:
  - アップロード案内のレンダリング検証
  - ファイル入力（`<input type="file">`）によるファイル選択コールバック呼び出しの検証

### 3. E2E テストの拡充 (`tests/e2e/pdfEditor.spec.ts`)
- Tier 5 (Header Controls & Full-Window Drag-and-Drop) にテストケース `T5.3` を追加:
  - 初期画面を表示
  - `window` に `dragenter` イベントを発火し、`DragOverlay` が表示されることを確認
  - `data-testid="dropzone"` 要素に対して `drop` イベント（PDFファイル付き）をディスパッチ
  - `DragOverlay` が画面から消去（非表示）されることを確認
  - サムネイルカードが正常にレンダリングされることを確認

---

## 検証計画

### 1. 自動テスト
- `npm test`: 全単体テストスイート（Vitest）がすべて PASS すること
- `npx playwright test`: 全 E2E テストスイート（Playwright）がすべて PASS すること

### 2. ビルド & 静的検証
- `npm run build`: TypeScript型チェックおよび Vite 単一ファイルバンドル生成がエラー・警告なく完了すること
