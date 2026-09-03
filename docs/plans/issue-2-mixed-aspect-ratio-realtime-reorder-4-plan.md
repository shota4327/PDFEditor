# Issue #2 追加改修（第4フェーズ）：縦横比混在（A4縦・横）時のリアルタイム並び替え＆Framer Motionアニメーション 実装計画書

## 1. 概要・課題
A4縦（幅約200px）とA4横（幅約400px）など異なる縦横比・サイズのカードが混在している環境において、`@dnd-kit` のデフォルト `rectSortingStrategy` が「全要素が同一サイズ」という前提で移動距離（`translate3d`）を算出するため、縦横比の異なるカードの前後にドラッグした際にカード同士の重なりや折り返し位置のズレ（表示崩れ）が発生します。

本改修では、`rectSortingStrategy` による画一的な座標移動計算を廃止し、**`onDragOver` によるリアルタイムDOM並び替え** と **Framer Motion（`layout` アニメーション）** を組み合わせることで、異なる縦横比が混在しても崩れることなく、カードが新しい位置へ滑らかにスライドする直感的な操作感を実現します。

---

## 2. インタビュー（/grill-me）にて合意した設計方針

1. **リアルタイム並び替え方式（`onDragOver`）**:
   - `SortableContext` の `strategy` を `() => null` に設定し、画一的なサイズ前提の `transform` 計算を無効化。
   - ドラッグ中にカーソルが他のカード上を通過した瞬間（`onDragOver`）、配列インデックスを即座に更新し、CSS Flexbox の自然な折り返しフローにカード配置を委ねる。
2. **Framer Motion による滑らかなレイアウト移動（`layout`）**:
   - すでに導入済みの `framer-motion` を活用し、各カードを `<motion.div layout>` でラップ。
   - DOMの順序入れ替えが発生した際、ブラウザのFlexboxレイアウトに基づき、各カード（A4縦・A4横問わず）が現在の位置から新位置へスムーズにスライド移動（FLIPアニメーション）する。
3. **DragOverlay と視覚的整合性**:
   - ドラッグ中の要素はカーソル追従の `DragOverlay` が担当し、グリッド内の元スロットは半透明（`opacity: 0.3`）でリアルタイムに挿入先を示し続ける。

---

## 3. 変更対象コンポーネント

### 3.1 UI コンポーネント (SRP 原則 & 30〜50行遵守)

#### [MODIFY] [ThumbnailGrid.tsx](file:///c:/Git/PDFEditor/src/components/ThumbnailGrid.tsx)
- `SortableContext` の `strategy` を `() => null` に変更。
- `handleDragOver` ハンドラを追加し、`active.id !== over.id` 時にリアルタイムで `onReorder(oldIndex, newIndex)` を実行。
- `handleDragEnd` は `activeId` のリセットに特化。

#### [MODIFY] [SortableThumbnailCard.tsx](file:///c:/Git/PDFEditor/src/components/SortableThumbnailCard.tsx)
- `framer-motion` の `motion.div` を導入し、`layout` アトリビュートを付与。
- ドラッグされていないカードに対する不要な `transform` 上書きを解除し、Framer Motion の自然なレイアウトトランジション（Spring / Tween）を適用。

---

### 3.2 テストコード & ドキュメント

#### [MODIFY] [pdfEditor.spec.ts](file:///c:/Git/PDFEditor/tests/e2e/pdfEditor.spec.ts)
- `T1.9: Mixed aspect ratio (Portrait & Landscape) drag & drop reordering without visual breaking` を追加。
- A4縦とA4横（90度回転）の混在カード間でのドラッグ＆ドロップを行い、DOM順序が正常に更新され、表示崩れが発生しないことを検証。

#### [MODIFY] [PROJECT.md](file:///c:/Git/PDFEditor/docs/PROJECT.md)
- 並び替えアニメーションエンジン（Framer Motion layout + @dnd-kit onDragOver）の仕様を追記。

---

## 4. 検証計画

### 自動テスト
- `npm test`: 全単体テストスイート（Vitest）を実行し全件 PASS を確認。
- `npm run test:e2e`: 新規 `T1.9` を含む全 22 件の E2E テストがすべて PASS することを確認。
- `npm run build`: TypeScript 型チェックおよび単一ファイル HTML ビルド（`dist/index.html`）が正常完了することを確認。

### 手動・UI確認
- 縦カードと横カードが交互に並ぶ状態で、横カードの前に縦カードをドラッグ、あるいは縦カードの前に横カードをドラッグした際に、カードが重ならずに滑らかにスロットが空き、自然に配置されることを確認。
