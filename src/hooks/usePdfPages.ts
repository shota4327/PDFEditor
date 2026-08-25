import { useState, useCallback } from 'react';
import type { PdfPageInfo, ExportPageSpec } from '../types/pdf';
import { loadPdfDocument, exportPdf, createDownloadLink } from '../services/pdfEngine';

export interface ToastMessage {
  message: string;
  type: 'success' | 'error' | 'info';
}

/**
 * PDF ページの読み込み・回転・並び替え・削除・ズーム・エクスポートの状態を管理するカスタムフック
 */
export function usePdfPages() {
  const [pages, setPages] = useState<PdfPageInfo[]>([]);
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  /**
   * トースト通知を表示（一定時間後に自動消去）
   */
  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast((current) => (current?.message === message ? null : current));
    }, 3500);
  }, []);

  /**
   * ズーム倍率の拡大（最大200%）
   */
  const handleZoomIn = useCallback(() => {
    setZoomLevel((prev) => Math.min(200, prev + 25));
  }, []);

  /**
   * ズーム倍率の縮小（最小50%）
   */
  const handleZoomOut = useCallback(() => {
    setZoomLevel((prev) => Math.max(50, prev - 25));
  }, []);

  /**
   * ズーム倍率を標準（100%）にリセット
   */
  const handleZoomReset = useCallback(() => {
    setZoomLevel(100);
  }, []);

  /**
   * ズーム倍率の直接指定
   */
  const handleZoomChange = useCallback((newZoom: number) => {
    setZoomLevel(Math.min(200, Math.max(50, newZoom)));
  }, []);

  /**
   * 複数 PDF ファイルの選択・ドロップ読み込み
   */
  const handleFilesSelected = useCallback(async (files: File[]) => {
    if (files.length === 0) {
      setErrorMessage('無効なファイル形式です。PDFファイルをアップロードしてください。');
      return;
    }

    setErrorMessage(null);
    setIsLoading(true);

    try {
      const newPagesList: PdfPageInfo[] = [];

      for (const file of files) {
        const docData = await loadPdfDocument(file);
        newPagesList.push(...docData.pages);
      }

      setPages((prevPages) => [...prevPages, ...newPagesList]);
      showToast(`${files.length}件のファイルから${newPagesList.length}ページを読み込みました`, 'success');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'PDFファイルの読み込みに失敗しました。';
      console.error('PDF読み込みエラー:', err);
      setErrorMessage(message);
      showToast('PDFの読み込みに失敗しました', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  /**
   * 特定ページの時計回り 90 度回転
   */
  const handleRotateCW = useCallback((pageId: string) => {
    setPages((prevPages) =>
      prevPages.map((page) => (page.id === pageId ? { ...page, rotation: page.rotation + 90 } : page))
    );
  }, []);

  /**
   * 特定ページの反時計回り 90 度回転
   */
  const handleRotateCCW = useCallback((pageId: string) => {
    setPages((prevPages) =>
      prevPages.map((page) => (page.id === pageId ? { ...page, rotation: page.rotation - 90 } : page))
    );
  }, []);

  /**
   * 全ページの時計回り 90 度回転
   */
  const handleRotateAllCW = useCallback(() => {
    setPages((prevPages) =>
      prevPages.map((page) => ({ ...page, rotation: page.rotation + 90 }))
    );
    showToast('すべてのページを右に回転しました', 'info');
  }, [showToast]);

  /**
   * 全ページの反時計回り 90 度回転
   */
  const handleRotateAllCCW = useCallback(() => {
    setPages((prevPages) =>
      prevPages.map((page) => ({ ...page, rotation: page.rotation - 90 }))
    );
    showToast('すべてのページを左に回転しました', 'info');
  }, [showToast]);

  /**
   * 回転方向（cw / ccw）に応じたページ回転
   */
  const handleRotate = useCallback((pageId: string, direction: 'cw' | 'ccw') => {
    if (direction === 'cw') {
      handleRotateCW(pageId);
    } else {
      handleRotateCCW(pageId);
    }
  }, [handleRotateCW, handleRotateCCW]);

  /**
   * 特定ページの削除
   */
  const handleDelete = useCallback((pageId: string) => {
    setPages((prevPages) => prevPages.filter((page) => page.id !== pageId));
    showToast('ページを削除しました', 'info');
  }, [showToast]);

  /**
   * ページのドラッグ＆ドロップ並び替え
   */
  const handleReorder = useCallback((startIndex: number, endIndex: number) => {
    setPages((prevPages) => {
      const updated = Array.from(prevPages);
      const [movedItem] = updated.splice(startIndex, 1);
      updated.splice(endIndex, 0, movedItem);
      return updated;
    });
  }, []);

  /**
   * 全ページのクリア
   */
  const handleClearAll = useCallback(() => {
    setPages([]);
    setErrorMessage(null);
    showToast('すべてのページをクリアしました', 'info');
  }, [showToast]);

  /**
   * PDF の結合・回転エクスポートとダウンロード保存
   */
  const handleExport = useCallback(async () => {
    if (pages.length === 0) return;

    setIsExporting(true);
    try {
      const exportSpecs: ExportPageSpec[] = pages.map((page) => ({
        pdfBytes: page.pdfBytes,
        pageIndex: page.pageIndex,
        originalRotation: page.originalRotation,
        rotation: page.rotation,
      }));

      const exportedBytes = await exportPdf(exportSpecs);
      const page1FileName = pages[0].fileName;
      const outputFileName = page1FileName.toLowerCase().endsWith('.pdf')
        ? page1FileName
        : `${page1FileName}.pdf`;

      createDownloadLink(exportedBytes, outputFileName);
      showToast('PDFを出力・保存しました', 'success');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'PDFのエクスポート中にエラーが発生しました。';
      console.error('PDFエクスポートエラー:', err);
      setErrorMessage(message);
      showToast('PDFの出力に失敗しました', 'error');
    } finally {
      setIsExporting(false);
    }
  }, [pages, showToast]);

  return {
    pages,
    setPages,
    zoomLevel,
    isLoading,
    isExporting,
    errorMessage,
    setErrorMessage,
    toast,
    setToast,
    showToast,
    handleZoomIn,
    handleZoomOut,
    handleZoomReset,
    handleZoomChange,
    handleFilesSelected,
    handleRotateCW,
    handleRotateCCW,
    handleRotateAllCW,
    handleRotateAllCCW,
    handleRotate,
    handleDelete,
    handleReorder,
    handleClearAll,
    handleExport,
  };
}
