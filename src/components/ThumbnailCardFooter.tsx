import React from 'react';
import { RotateCcw, RotateCw } from 'lucide-react';

/**
 * サムネイルカードフッターのプロパティ定義
 */
export interface ThumbnailCardFooterProps {
  /** 正規化された回転角度（度） */
  rotation?: number;
  /** 反時計回り回転クリックハンドラ */
  onRotateCCW: () => void;
  /** 時計回り回転クリックハンドラ */
  onRotateCW: () => void;
  /** 表示用ページ番号（0始まり） */
  displayIndex?: number;
  /** 総ページ数 */
  totalPages?: number;
}

/**
 * サムネイル下部のフローティングオーバーレイ（回転コントロールおよびページ数）
 */
export const ThumbnailCardFooter: React.FC<ThumbnailCardFooterProps> = ({
  rotation = 0,
  onRotateCCW,
  onRotateCW,
  displayIndex = 0,
  totalPages,
}) => {
  const normalizedRotation = (((rotation % 360) + 360) % 360);
  const pageLabel = totalPages ? `${displayIndex + 1} / ${totalPages}` : `${displayIndex + 1}`;

  return (
    <div className="absolute bottom-2 left-2 right-2 z-20 flex items-center justify-between pointer-events-none select-none">
      {/* 回転コントロールピル（回転量 + CCW + CW） */}
      <div className="pointer-events-auto flex items-center gap-1 bg-slate-300/70 backdrop-blur-md px-2 py-1 rounded-md border border-white/40 shadow-sm text-slate-800">
        <span
          data-testid="rotation-badge"
          className="font-mono text-[11px] font-semibold pr-1"
        >
          {normalizedRotation}°
        </span>
        <button
          type="button"
          data-testid="rotate-ccw-btn"
          onClick={onRotateCCW}
          onMouseDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          aria-label="Rotate counter-clockwise"
          className="p-1 rounded hover:bg-slate-400/50 hover:text-indigo-700 transition-colors cursor-pointer text-slate-700"
          title="反時計回りに90度回転"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          data-testid="rotate-cw-btn"
          onClick={onRotateCW}
          onMouseDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          aria-label="Rotate clockwise"
          className="p-1 rounded hover:bg-slate-400/50 hover:text-indigo-700 transition-colors cursor-pointer text-slate-700"
          title="時計回りに90度回転"
        >
          <RotateCw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* ページ数ピル */}
      <div className="pointer-events-auto bg-slate-300/70 backdrop-blur-md px-2 py-1 rounded-md border border-white/40 shadow-sm">
        <span
          data-testid="page-number"
          className="text-xs font-semibold text-slate-800"
        >
          {pageLabel}
        </span>
      </div>
    </div>
  );
};

export default ThumbnailCardFooter;
