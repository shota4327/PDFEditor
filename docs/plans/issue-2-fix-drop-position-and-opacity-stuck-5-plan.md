# Issue #2 追加改修（第5フェーズ）：ドロップ位置不一致および半透明スタック不具合の解消 実装計画書

## 1. 概要・課題
ユーザーからの検証フィードバックにより、以下の2点の不具合が確認されました：
1. **表示とドロップ位置の不一致**: ドラッグ中のプレビュー表示と、マウスを離した後の実際の配置位置が異なる場合がある。また、元のサムネイル表示より外側まで大きくマウスを動かさないと判定されない。
2. **ドロップ後の半透明スタック**: ドロップ終了後、カードが半透明（ドラッグ中表示）のまま戻らなくなることがある。

本改修では、リアルタイム並び替えの確定フローおよび衝突検出アルゴリズムを適正化し、状態同期とアニメーション終了処理を堅牢化することで両不具合を完全に解消します。

---

## 2. インタビュー（/grill-me）にて合意した設計方針

1. **リアルタイム更新の完全確定化（二重並び替えの排除）**:
   - `handleDragEnd` 内での `onReorder` 呼び出しを廃止。ドラッグ中に画面上に表示されていた順序をそのまま最終確定位置とする。
   - 衝突判定アルゴリズムを `closestCenter` に変更。カードを中心点方向へ半分動かした時点でスムーズかつ直感的にスロットが入れ替わるようにする。
   - `onDragCancel` を実装し、ドラッグが中断・キャンセルされた場合は開始前の配列へ安全にロールバックする。
2. **親コンポーネント主導の `isDragging` 制御と即時復帰**:
   - `SortableThumbnailCard` に対し、`ThumbnailGrid` から `isDragging={activeId === page.id}` を明示的に渡し、親の `activeId` と半透明スタイル（`opacity`）を厳密に一元同期。
   - `<DragOverlay dropAnimation={null}>` とし、マウスを離した瞬間に不要な遅延なく即座に通常表示へ復帰させる。

---

## 3. 変更対象コンポーネント

### 3.1 UI コンポーネント (SRP 原則 & 30〜50行遵守)

#### [MODIFY] [ThumbnailGrid.tsx](file:///c:/Git/PDFEditor/src/components/ThumbnailGrid.tsx)
- 衝突判定を `closestCenter` へ更新。
- `initialPages` 参照（ドラッグ開始時のバックアップ）を保持し、`onDragCancel` 時に安全に復元するハンドラを追加。
- `handleDragEnd` では `onReorder` を呼ばず、`activeId` のリセットのみを実行。
- `<DragOverlay dropAnimation={null}>` に設定。
- 各 `SortableThumbnailCard` へ `isDragging={activeId === page.id}` を伝達。

#### [MODIFY] [SortableThumbnailCard.tsx](file:///c:/Git/PDFEditor/src/components/SortableThumbnailCard.tsx)
- props で渡される `isDragging`（または `activeId === page.id`）を最優先して `style.opacity` を制御し、内部フックのスタックによる半透明残留を構造的に不可能にする。

---

### 3.2 テストコード & ドキュメント

#### [MODIFY] [pdfEditor.spec.ts](file:///c:/Git/PDFEditor/tests/e2e/pdfEditor.spec.ts)
- `T1.10: Drag reorder drop position consistency and opacity restoration (Issue #2)` を新規追加。
  - ドラッグ後、画面上の表示位置とドロップ後の最終位置が完全に一致することの検証。
  - ドロップ直後に `thumbnail-card` の `opacity` が 1 （通常表示）に戻り、半透明が残らないことの検証。

#### [MODIFY] [PROJECT.md](file:///c:/Git/PDFEditor/docs/PROJECT.md)
- ドラッグ確定ロジック（リアルタイム同期＋ドロップ即時復帰）の記述を最新化。

---

## 4. 検証計画

### 自動テスト
- `npm test`: 全単体テストスイート（Vitest）を実行し全件 PASS を確認。
- `npm run test:e2e`: 新規 `T1.10` を含む全 23 件の E2E テストがすべて PASS することを確認。
- `npm run build`: TypeScript 型チェックおよび単一ファイル HTML ビルド（`dist/index.html`）が正常完了することを確認。

### 手動・UI確認
- カードを少し動かして隣のカードと入れ替わること、マウスを離した場所に確実にドロップされることを確認。
- ドロップ後、半透明が即座に解除され通常カード表示に戻ることを確認。
