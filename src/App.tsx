import { useState } from 'react';
import Header from './components/Header';
import DropZone from './components/DropZone';
import Toolbar from './components/Toolbar';
import ThumbnailGrid from './components/ThumbnailGrid';
import { loadPdfDocument, exportPdf, createDownloadLink } from './services/pdfEngine';
import type { PdfPageInfo, ExportPageSpec } from './types/pdf';
import { Loader2, CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export default function App() {
  const [pages, setPages] = useState<PdfPageInfo[]>([]);
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const handleZoomIn = () => setZoomLevel((prev) => Math.min(300, prev + 25));
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(50, prev - 25));
  const handleZoomReset = () => setZoomLevel(100);
  const handleZoomChange = (newZoom: number) => setZoomLevel(Math.min(300, Math.max(50, newZoom)));

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast((current) => (current?.message === message ? null : current));
    }, 3500);
  };

  const handleFilesSelected = async (files: File[]) => {
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
    } catch (err: any) {
      console.error('Error loading PDF document:', err);
      setErrorMessage(err.message || 'PDFファイルの読み込みに失敗しました。有効なPDFファイルであることを確認してください。');
      showToast('PDFの読み込みに失敗しました', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRotateCW = (pageId: string) => {
    setPages((prevPages) =>
      prevPages.map((page) => {
        if (page.id === pageId) {
          return { ...page, rotation: page.rotation + 90 };
        }
        return page;
      })
    );
  };

  const handleRotateCCW = (pageId: string) => {
    setPages((prevPages) =>
      prevPages.map((page) => {
        if (page.id === pageId) {
          return { ...page, rotation: page.rotation - 90 };
        }
        return page;
      })
    );
  };

  const handleRotateAllCW = () => {
    setPages((prevPages) =>
      prevPages.map((page) => ({
        ...page,
        rotation: page.rotation + 90,
      }))
    );
    showToast('すべてのページを右に回転しました', 'info');
  };

  const handleRotateAllCCW = () => {
    setPages((prevPages) =>
      prevPages.map((page) => ({
        ...page,
        rotation: page.rotation - 90,
      }))
    );
    showToast('すべてのページを左に回転しました', 'info');
  };

  const handleRotate = (pageId: string, direction: 'cw' | 'ccw') => {
    if (direction === 'cw') {
      handleRotateCW(pageId);
    } else {
      handleRotateCCW(pageId);
    }
  };

  const handleDelete = (pageId: string) => {
    setPages((prevPages) => prevPages.filter((page) => page.id !== pageId));
    showToast('ページを削除しました', 'info');
  };

  const handleReorder = (startIndex: number, endIndex: number) => {
    setPages((prevPages) => {
      const updated = Array.from(prevPages);
      const [movedItem] = updated.splice(startIndex, 1);
      updated.splice(endIndex, 0, movedItem);
      return updated;
    });
  };

  const handleClearAll = () => {
    setPages([]);
    setErrorMessage(null);
    showToast('すべてのページをクリアしました', 'info');
  };

  const handleExport = async () => {
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
    } catch (err: any) {
      console.error('Failed to export PDF:', err);
      setErrorMessage(err.message || 'PDFのエクスポート中にエラーが発生しました。');
      showToast('PDFの出力に失敗しました', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      <Header />

      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 space-y-6">
        <DropZone
          onFilesSelected={handleFilesSelected}
          onFilesAdded={handleFilesSelected}
          errorMessage={errorMessage}
          onErrorDismiss={() => setErrorMessage(null)}
          isProcessing={isLoading}
        />

        {isLoading && (
          <div className="p-8 text-center flex flex-col items-center justify-center space-y-2 bg-white rounded-xl border border-slate-200 shadow-sm">
            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
            <p className="text-sm font-medium text-slate-600">PDFドキュメントを処理中 & サムネイルを生成中...</p>
          </div>
        )}

        {pages.length > 0 && (
          <div className="space-y-4">
            <Toolbar
              pageCount={pages.length}
              zoomLevel={zoomLevel}
              onZoomIn={handleZoomIn}
              onZoomOut={handleZoomOut}
              onZoomReset={handleZoomReset}
              onZoomChange={handleZoomChange}
              onRotateAllCW={handleRotateAllCW}
              onRotateAllCCW={handleRotateAllCCW}
              onAddFiles={handleFilesSelected}
              onExport={handleExport}
              onClearAll={handleClearAll}
              isExporting={isExporting}
              isProcessing={isLoading}
            />

            <ThumbnailGrid
              pages={pages}
              zoomLevel={zoomLevel}
              onReorder={handleReorder}
              onRotate={handleRotate}
              onRotateCW={handleRotateCW}
              onRotateCCW={handleRotateCCW}
              onDelete={handleDelete}
            />
          </div>
        )}

        {pages.length === 0 && !isLoading && (
          <div className="text-center py-12 px-4 space-y-2 border border-slate-200/60 rounded-xl bg-white/50">
            <p className="text-sm font-semibold text-slate-700">まだページが読み込まれていません</p>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              上のエリアにPDFファイルをドラッグ＆ドロップすると、ページの並び替え、回転、削除、および結合編集が可能です。
            </p>
          </div>
        )}
      </main>

      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border text-sm font-medium transition-all ${
            toast.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : toast.type === 'error'
              ? 'bg-red-50 border-red-200 text-red-800'
              : 'bg-indigo-50 border-indigo-200 text-indigo-800'
          }`}
        >
          {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
          {toast.type === 'error' && <AlertCircle className="w-5 h-5 text-red-600" />}
          {toast.type === 'info' && <Info className="w-5 h-5 text-indigo-600" />}
          <span>{toast.message}</span>
          <button
            onClick={() => setToast(null)}
            className="text-slate-400 hover:text-slate-600 p-0.5"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
