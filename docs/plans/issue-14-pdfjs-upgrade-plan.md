# pdfjs-dist メジャーアップデート（v3 → v6）実装計画

## 1. 概要
本計画は、現在利用している `pdfjs-dist@3.11.174` を最新メジャーバージョン `pdfjs-dist@6.3.289` へアップグレードし、高重大度脆弱性（CVE-2024-4367）の解消、ビルド警告（`eval("require")`）の排除、および描画・メモリパフォーマンスの向上を実現するための技術検証とコード改修を定義するものです。

本プロジェクトの最重要原則である「`dist/index.html` 単一 HTML 出力（`vite-plugin-singlefile`）」と「完全オフライン動作（外部通信ゼロ）」を厳格に維持することを必須要件とします。

---

## 2. ユーザー確認・合意事項 (User Review Required)

> [!IMPORTANT]
> **CMap および Standard Fonts の取り扱い方針**:
> - 外部通信（`fetch()`）によるオフライン制約違反および `file://` プロトコルでの CORS エラーを完全に防止するため、**`cMapUrl` および `standardFontDataUrl` は指定しない（未指定アプローチ）** を基本方針とします。
> - これにより、現行 v3 と同等のオフライン完全性を維持し、HTML ファイルサイズの不要な肥大化（+1.5MB〜2MB）を防ぎます。
> - 特殊な非埋め込み日本語フォント等での文字抜け懸念については、検証フェーズで確認し、必要が生じた場合のみ将来的なカスタム CMapReader によるインライン化を検討します。

---

## 3. 変更計画および影響ファイル

### ① 依存関係の更新
#### [MODIFY] `package.json` / `package-lock.json`
- `pdfjs-dist` を `3.11.174` から `^6.3.289` へ更新
- `npm install` の実行と lockfile の更新

### ② PDF エンジンサービスの適合
#### [MODIFY] `src/services/pdfEngine.ts`
- **Worker 読み込み方式の適合**:
  - v6 での Worker ファイル名・形式（`pdfjs-dist/build/pdf.worker.min.mjs` または `.mjs`）へのインポートパス変更
  - `vite-plugin-singlefile` によるインライン化形式（Data URL / Blob URL）との整合性確保
- **レンダリング API の適合**:
  - `page.render({ canvasContext, viewport })` の呼び出しインターフェースおよび Promise ライフサイクルの検証・調整
  - `page.cleanup()` および `doc.destroy()` の安全な解放処理の維持

### ③ ビルド設定の最適化
#### [MODIFY] `vite.config.ts`
- `pdfjs-dist` v6 で利用されるモダン構文（Top-level await 等）への対応として、ビルドターゲット（`build.target: 'es2022'` 等）が必要か検証し、適切に設定

### ④ テスト環境の適合
#### [MODIFY] `tests/unit/setup.ts`
- Vitest (jsdom) 環境における `pdfjs-dist` v6 の初期化モック調整
  - DOMMatrix、Path2D、Canvas 2D コンテキストモックの適合
  - テスト実行時の `fakeWorker` 動作確認

### ⑤ 仕様書・ドキュメントの同期
#### [MODIFY] `docs/PROJECT.md`
- 使用ライブラリ情報および依存関係のバージョン更新反映

---

## 4. 必須合格基準 (Gate Criteria)

本改修の完了・採用には以下の 3 つの条件をすべて満たす必要があります：

1. **完全オフライン単一 HTML バンドル保証**:
   - `npm run build` により `dist/index.html` が単一ファイルとして正常に出力されること
   - ビルド時に `eval` 等のセキュリティ警告が発生しないこと
   - 生成された HTML をブラウザで直接開き、外部 HTTP 通信ゼロ（オフライン）で動作すること
2. **単体テスト全件 PASS**:
   - `npm test`（Vitest 53件以上）が 100% 合格すること
3. **E2E テスト全件 PASS**:
   - `npx playwright test`（全17件）が 100% 合格すること
   - 特に `Tier 4: T4.1（外部通信ゼロ監査）` および `T4.2（完全オフライン監査）` が確実に合格すること

---

## 5. 検証手順 (Verification Plan)

### 自動テスト
- `npm test`: 全単体テストの実行・パス確認
- `npm run build`: 型チェックおよび単一 HTML 出力の成功確認
- `npx playwright test`: 全 Tier の E2E テスト実行（Chromium / WebKit / Firefox）

### 手動検証
- 生成された `dist/index.html` を `file://` プロトコル（ローカル直接起動）で開き、以下の動作を確認：
  1. PDF ファイルのドラッグ＆ドロップ読み込み
  2. サムネイル画像（Canvas レンダリング）の正常表示
  3. ページの回転（時計回り・反時計回り）
  4. 並び替えと新規 PDF のエクスポート・ダウンロード
