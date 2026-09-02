# Issue #12 実装計画: ビルド＆ポータブル基盤およびテスト・品質保証基盤パッケージの最新化

ビルド・ポータブル化基盤およびテスト・品質保証基盤の主要パッケージを最新安定版へ段階的に更新し、開発効率、型安全性、およびテストの信頼性を向上させるための実装計画です。

---

## ユーザー確認事項
- **`pdfjs-dist` は対象外**: ユーザー指示に従い、`pdfjs-dist`（`3.11.174`）は今回の更新対象外（現状維持）とします。
- **段階的アップデート**:
  - **フェーズ1**: `typescript` (`7.0.2`), `@testing-library/react` (`16.3.3`)（低リスク）
  - **フェーズ2**: `@playwright/test` (`1.62.1`), `vitest` (`4.1.11`)（テスト基盤）
  - **フェーズ3**: `vite` (`8.x`), `@vitejs/plugin-react`（ビルド基盤・単一HTML互換性検証）
- **単一HTML出力（`dist/index.html`）と完全オフライン動作の保証**: Vite 更新後も `vite-plugin-singlefile` によるインラインバンドルおよびオフライン動作が 100% 維持されることを厳格に検証します。

---

## 変更対象ファイル一覧

| 操作 | ファイルパス | 責務・変更内容 |
|---|---|---|
| **変更** | `package.json` | `typescript`, `@testing-library/react`, `@playwright/test`, `vitest`, `vite`, `@vitejs/plugin-react` 等のバージョン更新 |
| **変更** | `vite.config.ts` | 必要に応じた Vite 最新版向け設定調整（単一HTMLバンドル最適化） |
| **変更** | `vitest.config.ts` | Vitest 最新版向けテスト設定の適合確認・調整 |
| **変更** | `playwright.config.ts` | Playwright 最新版向け設定確認・調整 |
| **変更** | `docs/PROJECT.md` | 使用パッケージバージョンおよびマイルストーン（M12）の同期更新 |

---

## 詳細実装設計

### 1. フェーズ1: 型チェック & テストユーティリティの更新
- `typescript` を `^7.0.2` へ更新
- `@testing-library/react` を `^16.3.3` へ更新
- `npm test` および `npm run build`（型チェック `tsc`）を実行して即時検証

### 2. フェーズ2: テスト基盤の更新（Vitest & Playwright）
- `vitest` を最新版（`^4.1.11` または 互換バージョン）へ更新
- `@playwright/test` を `^1.62.1` へ更新
- `vitest.config.ts` の設定オプション（`jsdom`、`globals`）の動作確認
- 全 53 件の単体テスト（Vitest）を実行し、全件 PASS を確認
- 全 17 件の E2E テスト（Playwright）を実行し、全件 PASS を確認

### 3. フェーズ3: ビルド基盤の更新（Vite & 単一HTMLバンドル検証）
- `vite` および `@vitejs/plugin-react` を最新版へ更新
- `npm run build` を実行し、単一HTMLファイル（`dist/index.html`）が生成されることを確認
- 生成された `dist/index.html` の完全オフライン動作・JS/CSS/Worker インライン化を監査
- E2E オフライン監査テスト（Tier 4）を再実行して完全クライアントサイド実行を保証

---

## 検証計画

### 1. 自動テスト
- `npm test`: 全単体・結合テストスイート（53件）が 100% PASS すること
- `npx playwright test`: 全ブラウザ E2E テストスイート（17件、オフライン監査含む）が 100% PASS すること

### 2. ビルド & ポータブル検証
- `npm run build`: `tsc` 型チェックおよび Vite 単一ファイルバンドル出力が警告・エラーなく完了すること
- `dist/index.html` が単一ファイルとして出力され、外部ネットワーク接続なしで動作すること
