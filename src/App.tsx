import { Loader2 } from 'lucide-react';
import Header from './components/Header';
import DropZone from './components/DropZone';
import Toolbar from './components/Toolbar';
import ThumbnailGrid from './components/ThumbnailGrid';
import Toast from './components/Toast';
import DragOverlay from './components/DragOverlay';
import DropZoneErrorBanner from './components/DropZoneErrorBanner';
import { usePdfPages } from './hooks/usePdfPages';
import { useGlobalDragDrop } from './hooks/useGlobalDragDrop';

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

  const { isDraggingOver } = useGlobalDragDrop({
    onFilesDropped: handleFilesSelected,
    disabled: isLoading,
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      <Header
        onFilesSelected={handleFilesSelected}
        isProcessing={isLoading}
      />

      {/* 全画面ドラッグオーバーレイ */}
      <DragOverlay isDragging={isDraggingOver} />

      <main className="flex-1 w-full px-4 sm:px-6 py-4 space-y-4">
        {/* エラーメッセージバナー（ページ読み込み後など） */}
        {errorMessage && (
          <DropZoneErrorBanner
            errorMessage={errorMessage}
            onErrorDismiss={() => setErrorMessage(null)}
          />
        )}

        {/* 読み込み・処理中インジケータ */}
        {isLoading && (
          <div className="p-8 text-center flex flex-col items-center justify-center space-y-2 bg-white rounded-xl border border-slate-200 shadow-sm">
            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
            <p className="text-sm font-medium text-slate-600">PDFドキュメントを処理中 & サムネイルを生成中...</p>
          </div>
        )}

        {/* 初期未読み込み時: 中央ドロップゾーンのみ表示 */}
        {pages.length === 0 && !isLoading && (
          <div className="max-w-3xl mx-auto py-8">
            <DropZone
              onFilesSelected={handleFilesSelected}
              onFilesAdded={handleFilesSelected}
              errorMessage={null}
              onErrorDismiss={() => setErrorMessage(null)}
              isProcessing={isLoading}
            />
          </div>
        )}

        {/* ページ一覧 & 操作ツールバー（ファイル読み込み後） */}
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
      </main>

      {/* 操作結果通知トースト */}
      <Toast toast={toast} onDismiss={() => setToast(null)} />
    </div>
  );
}
