/**
 * PDF ページの回転角度（0, 90, 180, 270度）
 */
export type PageRotation = 0 | 90 | 180 | 270;

/**
 * 個別 PDF ページの情報モデル
 */
export interface PdfPage {
  /** ドラッグ＆ドロップおよびレンダリング用の一意な識別子 */
  id: string;
  /** 元ドキュメントの一意なファイル識別子 */
  fileId: string;
  /** 元ファイルの名称 */
  fileName: string;
  /** 元 PDF 内の 0 始まりのページインデックス */
  pageIndex: number;
  /** 元 PDF メタデータに設定されていた初期回転角度 */
  originalRotation: PageRotation;
  /** ユーザーによって付加された回転角度（度数法） */
  rotation: number;
  /** レンダリングされたサムネイルプレビュー画像の Data URL */
  thumbnailUrl: string;
  /** 元 PDF ドキュメントのバイナリバイト列 */
  pdfBytes: Uint8Array;
}

export type PdfPageInfo = PdfPage;

/**
 * 読み込まれた PDF ドキュメント全体のデータモデル
 */
export interface PdfDocument {
  /** ドキュメント識別子 */
  id: string;
  /** ファイル名 */
  name: string;
  /** 総ページ数 */
  pageCount: number;
  /** ドキュメントに含まれるページ配列 */
  pages: PdfPage[];
}

export type PdfDocumentData = PdfDocument;

/**
 * PDF エクスポート時のページ指定仕様
 */
export interface ExportPageSpec {
  /** 元 PDF のバイナリバイト列 */
  pdfBytes: Uint8Array;
  /** 抽出する元のページインデックス */
  pageIndex: number;
  /** 元 PDF の初期回転角度 */
  originalRotation?: number;
  /** ユーザーによる回転角度 */
  rotation: number;
}
