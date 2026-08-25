import { Loader2 } from 'lucide-react';
import Header from './components/Header';
import DropZone from './components/DropZone';
import Toolbar from './components/Toolbar';
import ThumbnailGrid from './components/ThumbnailGrid';
import Toast from './components/Toast';
import { usePdfPages } from './hooks/usePdfPages';

/**
 * PDFEditor メインアプリケーションコンポーネント
 */
export default function App() {
  const {
    pages,
    zoomLevel,
    isLoading,
    isExporting,
    errorMessage,
    setErrorMessage,
    toast,
    setToast,
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
  } = usePdfPages();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      <Header />

      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* PDF アップロード用ドロップゾーン */}
        <DropZone
          onFilesSelected={handleFilesSelected}
          onFilesAdded={handleFilesSelected}
          errorMessage={errorMessage}
          onErrorDismiss={() => setErrorMessage(null)}
          isProcessing={isLoading}
        />

        {/* 読み込み・処理中インジケータ */}
        {isLoading && (
          <div className="p-8 text-center flex flex-col items-center justify-center space-y-2 bg-white rounded-xl border border-slate-200 shadow-sm">
            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
            <p className="text-sm font-medium text-slate-600">PDFドキュメントを処理中 & サムネイルを生成中...</p>
          </div>
        )}

        {/* ページ一覧 & 操作ツールバー */}
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

        {/* 初期未読み込み時プレースホルダー */}
        {pages.length === 0 && !isLoading && (
          <div className="text-center py-12 px-4 space-y-2 border border-slate-200/60 rounded-xl bg-white/50">
            <p className="text-sm font-semibold text-slate-700">まだページが読み込まれていません</p>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              上のエリアにPDFファイルをドラッグ＆ドロップすると、ページの並び替え、回転、削除、および結合編集が可能です。
            </p>
          </div>
        )}
      </main>

      {/* 操作結果通知トースト */}
      <Toast toast={toast} onDismiss={() => setToast(null)} />
    </div>
  );
}
