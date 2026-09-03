# Issue #2 追加改修（第3フェーズ）：@dnd-kit移行による複数行2Dグリッド並び替え対応 実装計画書

## 1. 概要・背景
現在使用している `@hello-pangea/dnd`（`react-beautiful-dnd` の後継）は1次元リスト（単一の水平または垂直軸）専用に設計されたライブラリであり、カードが2段目以降へ折り返された場合、上下のY軸移動を検知できず1段目の範囲内でしか並び替えが行えない制限があります。
本改修では、複数行・2次元グリッド並び替え（`rectSortingStrategy`）をネイティブサポートするデファクトスタンダードライブラリ **`@dnd-kit`** へ移行し、1段目と2段目以降を自由に行き来できる直感的なドラッグ＆ドロップ並び替えを実現します。

---

## 2. インタビュー（/grill-me）にて確定した仕様

1. **並び替えエンジンの移行**:
   - `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities` を導入。
   - 2次元の複数行折り返しレイアウトに対応する `rectSortingStrategy` を採用。
2. **ドラッグ中の視覚表現（DragOverlay）**:
   - ドラッグ中のカードは `<DragOverlay>` により、わずかな傾き・拡大・影付きでカーソルに滑らかに追従させる。
   - ドラッグ元の位置には半透明のプレースホルダーを残し、他のカードはスロットを空けるように自然にアニメーション移動させる。
3. **誤ドラッグ防止（センサー制約）**:
   - `PointerSensor` に `activationConstraint: { distance: 5 }` を設定し、カード上のボタンクリック（回転・削除等）時に誤ってドラッグが開始されることを防止。
4. **テスト互換性の維持**:
   - `data-testid="thumbnail-card"`, `data-testid="drag-handle"`, `data-testid="delete-page-btn"` 等の属性および `onReorder(startIndex, endIndex)` の契約を完全維持し、全テストの互換性を担保。

---

## 3. 影響範囲および変更予定ファイル

### 3.1 パッケージの追加・整理
- `package.json`:
  - `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities` を追加。
  - 不要となった `@hello-pangea/dnd` をアンインストール。

### 3.2 UI コンポーネント (SRP 原則 & 30〜50行遵守)
- `src/components/ThumbnailGrid.tsx`:
  - `<DragDropContext>` / `<Droppable>` を `@dnd-kit` の `<DndContext>`, `<SortableContext items={...} strategy={rectSortingStrategy}>`, `<DragOverlay>` へ置き換え。
  - `onDragStart`, `onDragEnd` ハンドラを実装し、行をまたぐ並び替えを安全にディスパッチ。
- `src/components/ThumbnailCard.tsx`:
  - `@hello-pangea/dnd` の `Draggable` 依存プロパティ（`innerRef`, `draggableProps`, `dragHandleProps` 等）を廃止し、`@dnd-kit/sortable` の `useSortable({ id: page.id })` を統合（またはラッパーコンポーネント経由で適用）。
  - ドラッグ中スタイル（`isDragging`）および `transform`（`CSS.Transform.toString(transform)`）を適用。

### 3.3 テストコード・ドキュメントの同期
- `tests/unit/components.test.tsx`:
  - `@dnd-kit` 環境下でのレンダリングおよび操作イベントの動作検証。
- `tests/e2e/pdfEditor.spec.ts`:
  - 段をまたぐドラッグ＆ドロップ（2段目以降への移動）の検証ケースを新規追加。
  - 既存の全 E2E シナリオ（全画面ドラッグ、回転、削除、エクスポート等）が PASS することを確認。
- `docs/PROJECT.md`:
  - 並び替えライブラリの記述を `@dnd-kit` へ更新。

---

## 4. 検証計画

### 自動テスト
- `npm test`: 全単体テストスイート（Vitest）を実行し全件 PASS を確認。
- `npm run test:e2e`: Playwright による全 E2E テスト（1段目〜2段目以降へのドラッグ含む）がすべて PASS することを確認。
- `npm run build`: TypeScript 型チェックおよび単一ファイル HTML ビルド（`dist/index.html`）が正常完了することを確認。

### 手動・UI確認
- カードを多数読み込み（またはズームを拡大して2段以上にした状態）、1段目のカードを2段目の任意位置へドラッグして順番が正しく入れ替わることを確認。
- 逆に2段目から1段目へのドラッグも正しく機能することを確認。
- 回転ボタン・削除ボタンのクリック操作が妨げられないことを確認。
