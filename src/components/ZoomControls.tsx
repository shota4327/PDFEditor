import React from 'react';
import { ZoomIn, ZoomOut } from 'lucide-react';

/**
 * ズームコントロールコンポーネントのプロパティ定義
 */
export interface ZoomControlsProps {
  /** 現在のズーム倍率（50%〜200%） */
  zoomLevel: number;
  /** ズーム拡大コールバック */
  onZoomIn?: () => void;
  /** ズーム縮小コールバック */
  onZoomOut?: () => void;
  /** ズームリセット（100%）コールバック */
  onZoomReset?: () => void;
  /** ズーム倍率直接変更コールバック */
  onZoomChange?: (zoom: number) => void;
  /** 処理中フラグ（無効化制御用） */
  disabled?: boolean;
}

/**
 * ズーム拡大・縮小ボタン、スライダー、倍率表示、リセットボタンを提供するコントロール
 */
export const ZoomControls: React.FC<ZoomControlsProps> = ({
  zoomLevel,
  onZoomIn,
  onZoomOut,
  onZoomReset,
  onZoomChange,
  disabled = false,
}) => {
  return (
    <div
      className="flex items-center gap-2 bg-slate-100 px-2 py-1 rounded-lg border border-slate-200"
      data-testid="zoom-controls"
    >
      <button
        type="button"
        data-testid="zoom-out-btn"
        onClick={onZoomOut}
        disabled={disabled || zoomLevel <= 50}
        className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-white rounded disabled:opacity-40 transition-colors cursor-pointer"
        title="Zoom Out (-25%)"
      >
        <ZoomOut className="w-4 h-4" />
      </button>

      <input
        type="range"
        data-testid="zoom-slider"
        min={50}
        max={200}
        step={5}
        value={zoomLevel}
        disabled={disabled}
        onChange={(e) => onZoomChange && onZoomChange(Number(e.target.value))}
        className="w-24 sm:w-28 h-1.5 bg-slate-300 rounded-lg appearance-none cursor-pointer accent-indigo-600 focus:outline-none"
        title={`Zoom: ${zoomLevel}%`}
      />

      <span
        data-testid="zoom-level-indicator"
        className="text-xs font-mono font-bold text-slate-700 w-12 text-center select-none"
      >
        {zoomLevel}%
      </span>

      <button
        type="button"
        data-testid="zoom-in-btn"
        onClick={onZoomIn}
        disabled={disabled || zoomLevel >= 200}
        className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-white rounded disabled:opacity-40 transition-colors cursor-pointer"
        title="Zoom In (+25%)"
      >
        <ZoomIn className="w-4 h-4" />
      </button>

      <button
        type="button"
        data-testid="zoom-reset-btn"
        onClick={onZoomReset}
        disabled={disabled || zoomLevel === 100}
        className="px-2 py-1 text-[11px] font-semibold text-slate-600 hover:text-indigo-600 hover:bg-white rounded disabled:opacity-40 transition-colors border-l border-slate-200/80 ml-0.5 cursor-pointer"
        title="Reset Zoom to 100%"
      >
        Reset
      </button>
    </div>
  );
};

export default ZoomControls;
