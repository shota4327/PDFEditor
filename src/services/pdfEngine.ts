import '../utils/polyfills';
import { PDFDocument, degrees } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import type { PdfDocumentData, PdfPageInfo, ExportPageSpec, PageRotation } from '../types/pdf';
import { OfflineBinaryDataFactory } from '../utils/jbig2Wasm';

// Vite のローカルアセット取り込みを使用して pdfjs-dist の workerSrc を設定
if (typeof window !== 'undefined') {
  if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'test') {
    // Node / Vitest jsdom 環境では fake worker 用に空文字を設定
    pdfjsLib.GlobalWorkerOptions.workerSrc = '';
  } else {
    // ブラウザ / Vite 環境（単一HTML時は Data URL、開発時はアセットURL）
    pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;
  }
}

/**
 * File, ArrayBuffer, または Uint8Array から PDF ドキュメントを読み込みます。
 * ドキュメントメタデータ、ページ数、初期回転角度を取得し、各ページのサムネイルプレビューを生成します。
 *
 * @param file 読み込み対象の PDF ファイルまたはバイナリデータ
 * @returns 読み込まれた PDF ドキュメントデータ
 */
export async function loadPdfDocument(file: File | ArrayBuffer | Uint8Array): Promise<PdfDocumentData> {
  let pdfBytes: Uint8Array;
  let fileName = 'document.pdf';

  if (typeof File !== 'undefined' && file instanceof File) {
    fileName = file.name;
    const arrayBuffer = await file.arrayBuffer();
    pdfBytes = new Uint8Array(arrayBuffer);
  } else if (file instanceof Uint8Array) {
    pdfBytes = file;
  } else if (file instanceof ArrayBuffer) {
    pdfBytes = new Uint8Array(file);
  } else {
    throw new Error('サポートされていないファイル形式です。有効な PDF データを指定してください。');
  }

  const pdfDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
  const pageCount = pdfDoc.getPageCount();
  const fileId = `file_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

  const pages: PdfPageInfo[] = [];

  for (let i = 0; i < pageCount; i++) {
    const page = pdfDoc.getPage(i);
    const rawRotation = page.getRotation().angle;
    const normalizedOriginalRotation = (((rawRotation % 360) + 360) % 360) as PageRotation;

    let thumbnailUrl = '';
    try {
      thumbnailUrl = await renderPageThumbnail(pdfBytes, i);
    } catch (e) {
      console.warn(`ページ ${i + 1} (${fileName}) のサムネイル生成に失敗しました:`, e);
    }

    pages.push({
      id: `${fileId}_page_${i}_${Math.random().toString(36).substring(2, 7)}`,
      fileId,
      fileName,
      pageIndex: i,
      originalRotation: normalizedOriginalRotation,
      rotation: 0,
      thumbnailUrl,
      pdfBytes,
    });
  }

  return {
    id: fileId,
    name: fileName,
    pageCount,
    pages,
  };
}

/**
 * 特定の PDF ページを HTML5 Canvas にレンダリングし、JPEG Data URL を生成します。
 *
 * @param pdfBytes PDF ドキュメントのバイナリバイト列
 * @param pageIndex レンダリングするページインデックス（0始まり）
 * @param scale レンダリング倍率（省略時は横幅1200pxを基準に自動計算）
 * @returns レンダリングされた画像の Data URL
 */
export async function renderPageThumbnail(
  pdfBytes: Uint8Array,
  pageIndex: number,
  scale?: number
): Promise<string> {
  const loadingTask = pdfjsLib.getDocument({
    data: pdfBytes.slice(),
    useWorkerFetch: false,
    BinaryDataFactory: OfflineBinaryDataFactory,
    wasmUrl: 'wasm/',
  });
  const pdfDoc = await loadingTask.promise;

  try {
    const page = await pdfDoc.getPage(pageIndex + 1); // pdfjs は 1 始まり

    try {
      const unscaledViewport = page.getViewport({ scale: 1.0 });
      const targetWidth = 1200;
      const computedScale = scale !== undefined ? scale : (targetWidth / (unscaledViewport.width || 1));
      const viewport = page.getViewport({ scale: computedScale });

      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');

      if (!context) {
        throw new Error('Canvas 2D コンテキストが利用できません');
      }

      canvas.width = Math.max(1, Math.floor(viewport.width));
      canvas.height = Math.max(1, Math.floor(viewport.height));

      // Canvas を白色（用紙の背景色）で初期化
      context.fillStyle = '#ffffff';
      context.fillRect(0, 0, canvas.width, canvas.height);

      const renderContext = {
        canvas: canvas,
        canvasContext: context,
        viewport: viewport,
      };

      await page.render(renderContext).promise;
      return canvas.toDataURL('image/jpeg', 0.95);
    } finally {
      page.cleanup();
    }
  } finally {
    await pdfDoc.cleanup();
    await loadingTask.destroy();
  }
}

/**
 * 順序付けられたページ指定リストに基づいて新規 PDF を生成・結合し、Uint8Array を返却します。
 * 複数ドキュメントからのページ結合、並び替え、削除、回転角度が反映されます。
 *
 * @param pages エクスポート対象のページ仕様配列
 * @returns 生成された新規 PDF のバイナリバイト列
 */
export async function exportPdf(pages: ExportPageSpec[]): Promise<Uint8Array> {
  const newPdfDoc = await PDFDocument.create();
  const docCache = new Map<Uint8Array, PDFDocument>();

  for (const pageSpec of pages) {
    let sourceDoc = docCache.get(pageSpec.pdfBytes);
    if (!sourceDoc) {
      sourceDoc = await PDFDocument.load(pageSpec.pdfBytes, { ignoreEncryption: true });
      docCache.set(pageSpec.pdfBytes, sourceDoc);
    }

    const [copiedPage] = await newPdfDoc.copyPages(sourceDoc, [pageSpec.pageIndex]);
    const originalRot = pageSpec.originalRotation ?? 0;
    const userRot = pageSpec.rotation ?? 0;
    const totalRotation = (((originalRot + userRot) % 360 + 360) % 360);
    copiedPage.setRotation(degrees(totalRotation));

    newPdfDoc.addPage(copiedPage);
  }

  return await newPdfDoc.save();
}

/**
 * メモリ上の Blob URL を作成し、ブラウザのダウンロードを発行して即座に URL を解放します。
 *
 * @param pdfBytes 保存対象の PDF バイト列
 * @param filename ダウンロードファイル名
 */
export function createDownloadLink(pdfBytes: Uint8Array, filename: string): void {
  const buffer = pdfBytes.buffer.slice(pdfBytes.byteOffset, pdfBytes.byteOffset + pdfBytes.byteLength) as ArrayBuffer;
  const blob = new Blob([buffer], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
