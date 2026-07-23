import React, { useRef } from 'react';
import { Download, Trash2, Loader2, ZoomIn, ZoomOut, RotateCcw, RotateCw } from 'lucide-react';

interface ToolbarProps {
  pageCount: number;
  zoomLevel?: number;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onZoomReset?: () => void;
  onZoomChange?: (zoom: number) => void;
  onRotateAllCW?: () => void;
  onRotateAllCCW?: () => void;
  onAddFiles?: (files: File[]) => void;
  onClearAll: () => void;
  onExport: () => void;
  isExporting?: boolean;
  isProcessing?: boolean;
}

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

      {/* Left controls: Rotate All Left, Rotate All Right, Zoom controls (in order from left) */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          data-testid="rotate-all-ccw-btn"
          onClick={onRotateAllCCW}
          disabled={pageCount === 0 || isProcessing}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 hover:text-indigo-600 text-slate-600 disabled:opacity-50 text-sm font-medium rounded-lg transition-colors cursor-pointer"
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
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 hover:text-indigo-600 text-slate-600 disabled:opacity-50 text-sm font-medium rounded-lg transition-colors cursor-pointer"
          title="すべてのページを右に90度回転"
        >
          <RotateCw className="w-4 h-4" />
          <span>すべて右回転</span>
        </button>

        {/* Zoom controls */}
        <div className="flex items-center gap-2 bg-slate-100 px-2 py-1 rounded-lg border border-slate-200" data-testid="zoom-controls">
          <button
            type="button"
            data-testid="zoom-out-btn"
            onClick={onZoomOut}
            disabled={zoomLevel <= 50 || isProcessing}
            className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-white rounded disabled:opacity-40 transition-colors cursor-pointer"
            title="Zoom Out (-25%)"
          >
            <ZoomOut className="w-4 h-4" />
          </button>

          <input
            type="range"
            data-testid="zoom-slider"
            min={50}
            max={300}
            step={5}
            value={zoomLevel}
            disabled={isProcessing}
            onChange={(e) => onZoomChange && onZoomChange(Number(e.target.value))}
            className="w-24 sm:w-32 h-1.5 bg-slate-300 rounded-lg appearance-none cursor-pointer accent-indigo-600 focus:outline-none"
            title={`Zoom: ${zoomLevel}%`}
          />

          <span data-testid="zoom-level-indicator" className="text-xs font-mono font-bold text-slate-700 w-12 text-center select-none">
            {zoomLevel}%
          </span>

          <button
            type="button"
            data-testid="zoom-in-btn"
            onClick={onZoomIn}
            disabled={zoomLevel >= 300 || isProcessing}
            className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-white rounded disabled:opacity-40 transition-colors cursor-pointer"
            title="Zoom In (+25%)"
          >
            <ZoomIn className="w-4 h-4" />
          </button>

          <button
            type="button"
            data-testid="zoom-reset-btn"
            onClick={onZoomReset}
            disabled={zoomLevel === 100 || isProcessing}
            className="px-2 py-1 text-[11px] font-semibold text-slate-600 hover:text-indigo-600 hover:bg-white rounded disabled:opacity-40 transition-colors border-l border-slate-200/80 ml-0.5 cursor-pointer"
            title="Reset Zoom to 100%"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Actions */}
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
