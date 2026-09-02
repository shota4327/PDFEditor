# Issue #10 実装計画: ヘッダーレイアウトの微調整

Issue #10（タイトル横アイコンの廃止、タイトル文字の一回り拡大、右端オフラインバッジの削除）に対応するための実装計画です。

## ユーザー確認事項
- タイトル左側のグラデーションアイコンを削除し、タイトルテキスト「PDFEditor」を一回り大きく（`text-lg sm:text-xl`）表示します。
- サブテキスト「オフライン完結型PDF編集ツール」（`text-xs text-slate-400`）はタイトルの横に併記維持します。
- タイトルバー右端の「100% Offline Client-Side」バッジを削除し、「ファイルを開く」ボタンのみをすっきりと配置します。

## 変更対象ファイル一覧

| 操作 | ファイルパス | 責務・変更内容 |
|---|---|---|
| **変更** | `src/components/Header.tsx` | アイコン・オフラインバッジの削除、タイトルフォントサイズの拡大、不要インポートの整理 |
| **変更** | `tests/unit/components.test.tsx` | Header 単体テストのアサーション更新（バッジ削除の反映） |
| **変更** | `docs/PROJECT.md` | ヘッダーコンポーネント説明の更新 |

---

## 詳細実装設計

### 1. Header コンポーネントの修正 (`src/components/Header.tsx`)
- 不要になった `FileText`, `ShieldCheck` のインポートを削除。
- アイコンコンテナ（`<div className="w-7 h-7 rounded-lg bg-gradient-to-br ...">...</div>`）を削除。
- `h1` のクラスを `text-base font-bold tracking-tight text-white` から `text-lg sm:text-xl font-bold tracking-tight text-white` に変更。
- 右端のオフライン保証バッジ（`<div className="flex items-center gap-1.5 ...">...</div>`）を削除し、`<button data-testid="header-open-file-btn">` のみを配置。

### 2. 単体テストの更新 (`tests/unit/components.test.tsx`)
- `renders header title, open file button, and offline badge` テストケースを更新し、バッジの検証を削除、タイトルの存在およびファイル選択ボタンの存在・動作を検証。

---

## 検証計画

### 1. 自動テスト
- `npm test`: 全単体・結合テストスイートが PASS すること
- `npx playwright test`: 全 E2E テストスイートが PASS すること

### 2. ビルド & 静的検証
- `npm run build`: TypeScript 型チェックおよび単一 HTML バンドル出力（`dist/index.html`）がエラーなく完了すること
