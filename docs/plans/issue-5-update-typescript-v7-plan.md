# 実装計画: TypeScript 7 への更新と動作検証 (Issue #5)

本計画は、PDFEditor の `devDependencies` に含まれる `typescript` をバージョン 7 系へ更新し、型チェック、ビルド、各種テスト（Vitest 単体テスト・Playwright E2E テスト）、および単一ファイル HTML バンドル出力の正常性を検証・反映することを目的とします。

---

## ユーザー確認事項（User Review Required）

> [!NOTE]
> - TypeScript 7.0 は Go 言語へのリライト（Project Corsa）により型チェック速度が大幅に向上しています。
> - 本プロジェクトのビルドスクリプト（`tsc --noEmit` & `vite build`）およびテストスイート（Vitest / Playwright）において、互換性エラーや型エラーが発生しないかを徹底検証します。

---

## 変更内容（Proposed Changes）

### 依存関係 & 設定更新

#### [MODIFY] package.json
- `devDependencies` の `"typescript"` バージョン指定を `^7.0.0` に更新します。

#### [MODIFY] tsconfig.json（必要な場合のみ）
- TypeScript 7.0 で推奨されるコンパイラオプションの非推奨・変更点があれば最小差分で調整します。

---

### ドキュメント更新

#### [MODIFY] docs/PROJECT.md
- 技術スタック記述における TypeScript バージョンの整合性を確認・更新します。

#### [NEW] docs/plans/issue-5-update-typescript-v7-plan.md
- 本実装計画の永続化記録。

---

## 検証手順（Verification Plan）

### 自動テスト & ビルド検証
1. **依存関係のインストール**:
   - `npm install` を実行し、TypeScript 7 が正常に解決・インストールされることを確認。
2. **型チェック & ビルド**:
   - `npm run build` を実行し、`tsc --noEmit` の型チェックおよび `vite-plugin-singlefile` による `dist/index.html` のバンドル生成がエラー・警告なく成功することを確認。
3. **単体テスト**:
   - `npm test` を実行し、Vitest の全テストケースが 100% PASS することを確認。
4. **E2E テスト**:
   - `npm run test:e2e` を実行し、Playwright の全ブラウザテストがすべて PASS することを確認。
