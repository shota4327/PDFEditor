import React, { useRef } from 'react';
import { Download, Trash2, Loader2, RotateCcw, RotateCw } from 'lucide-react';
import PageCountBadge from './PageCountBadge';
import ZoomControls from './ZoomControls';

/**
 * ツールバーコンポーネントのプロパティ定義
 */
interface ToolbarProps {
  /** 読み込まれている PDF の総ページ数 */
  pageCount: number;
  /** 現在のサムネイルズーム倍率（50%〜200%） */
  zoomLevel?: number;
  /** ズーム拡大コールバック */
  onZoomIn?: () => void;
  /** ズーム縮小コールバック */
  onZoomOut?: () => void;
  /** ズームリセット（100%）コールバック */
  onZoomReset?: () => void;
  /** ズーム倍率直接変更コールバック */
  onZoomChange?: (zoom: number) => void;
  /** 全ページ時計回り 90 度回転コールバック */
  onRotateAllCW?: () => void;
  /** 全ページ反時計回り 90 度回転コールバック */
  onRotateAllCCW?: () => void;
  /** 追加 PDF ファイル選択コールバック */
  onAddFiles?: (files: File[]) => void;
  /** 全ページクリアコールバック */
  onClearAll: () => void;
  /** PDF エクスポート実行コールバック */
  onExport: () => void;
  /** エクスポート処理中フラグ */
  isExporting?: boolean;
  /** ファイル読み込み・処理中フラグ */
  isProcessing?: boolean;
}

/**
 * ページ数表示、一括回転、ズーム制御、クリア、エクスポート操作を提供するツールバー
 */
export const Toolbar: React.FC<ToolbarProps> = ({
  pageCount,
  zoomLevel = 100,
  onZoomIn,
  onZoomOut,
  onZoomReset,
  onZoomChange,
  onRotateAllCW,
  onRotateAllCCW,
  onAddFiles,
  onClearAll,
  onExport,
  isExporting = false,
  isProcessing = false,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files).filter(
        (file) => file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
      );
      if (onAddFiles) {
        onAddFiles(files);
      }
      e.target.value = '';
    }
  };

  return (
    <div
      data-testid="toolbar"
      className="bg-white border border-slate-200 rounded-xl px-4 py-3 shadow-sm flex flex-wrap items-center justify-between gap-3 sticky top-4 z-40"
    >
      <input
        ref={fileInputRef}
        data-testid="toolbar-file-input"
        type="file"
        accept="application/pdf,.pdf"
        multiple
        className="hidden"
        onChange={handleFileChange}
      />

      {/* 左側コントロール: ページ数バッジ、一括左回転、一括右回転、ズーム制御 */}
      <div className="flex flex-wrap items-center gap-2">
        <PageCountBadge pageCount={pageCount} />

        <button
          type="button"
          data-testid="rotate-all-ccw-btn"
          onClick={onRotateAllCCW}
          disabled={pageCount === 0 || isProcessing}
          className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 hover:text-indigo-600 text-slate-600 disabled:opacity-50 text-sm font-medium rounded-lg transition-colors cursor-pointer"
          title="すべてのページを左に90度回転"
        >
          <RotateCcw className="w-4 h-4" />
          <span>すべて左回転</span>
        </button>

        <button
          type="button"
          data-testid="rotate-all-cw-btn"
          onClick={onRotateAllCW}
          disabled={pageCount === 0 || isProcessing}
          className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 hover:text-indigo-600 text-slate-600 disabled:opacity-50 text-sm font-medium rounded-lg transition-colors cursor-pointer"
          title="すべてのページを右に90度回転"
        >
          <RotateCw className="w-4 h-4" />
          <span>すべて右回転</span>
        </button>

        <ZoomControls
          zoomLevel={zoomLevel}
          onZoomIn={onZoomIn}
          onZoomOut={onZoomOut}
          onZoomReset={onZoomReset}
          onZoomChange={onZoomChange}
          disabled={isProcessing}
        />
      </div>

      {/* 右側アクション: 全クリア、PDFエクスポート */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          data-testid="clear-all-btn"
          onClick={onClearAll}
          disabled={pageCount === 0 || isProcessing || isExporting}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-red-50 hover:text-red-600 text-slate-600 disabled:opacity-50 text-sm font-medium rounded-lg transition-colors cursor-pointer"
          title="すべてのページをクリア"
        >
          <Trash2 className="w-4 h-4" />
          <span>すべてクリア</span>
        </button>

        <button
          type="button"
          data-testid="export-btn"
          onClick={onExport}
          disabled={pageCount === 0 || isProcessing || isExporting}
          className="inline-flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-700 hover:to-sky-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-bold rounded-lg shadow-md hover:shadow-lg transition-all cursor-pointer"
        >
          {isExporting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Download className="w-4 h-4" />
          )}
          <span>PDFを出力</span>
        </button>
      </div>
    </div>
  );
};

export default Toolbar;
