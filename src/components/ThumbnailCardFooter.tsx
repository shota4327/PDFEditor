import React from 'react';
import { RotateCcw, RotateCw } from 'lucide-react';

/**
 * サムネイルカードフッターのプロパティ定義
 */
export interface ThumbnailCardFooterProps {
  /** 反時計回り回転クリックハンドラ */
  onRotateCCW: () => void;
  /** 時計回り回転クリックハンドラ */
  onRotateCW: () => void;
}

/**
 * サムネイルカード下部の時計回り・反時計回り回転ボタンを提供するフッター
 */
export const ThumbnailCardFooter: React.FC<ThumbnailCardFooterProps> = ({
  onRotateCCW,
  onRotateCW,
}) => {
  return (
    <div className="bg-white border-t border-slate-100 flex items-stretch divide-x divide-slate-100 h-10">
      <button
        type="button"
        data-testid="rotate-ccw-btn"
        onClick={onRotateCCW}
        onMouseDown={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
        aria-label="Rotate counter-clockwise"
        className="flex-1 flex items-center justify-center gap-1.5 text-xs text-slate-600 font-medium hover:text-indigo-600 hover:bg-slate-50 transition-colors cursor-pointer active:bg-slate-100"
        title="Rotate 90° CCW"
      >
        <RotateCcw className="w-3.5 h-3.5" />
        <span>左回転</span>
      </button>

      <button
        type="button"
        data-testid="rotate-cw-btn"
        onClick={onRotateCW}
        onMouseDown={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
        aria-label="Rotate clockwise"
        className="flex-1 flex items-center justify-center gap-1.5 text-xs text-slate-600 font-medium hover:text-indigo-600 hover:bg-slate-50 transition-colors cursor-pointer active:bg-slate-100"
        title="Rotate 90° CW"
      >
        <RotateCw className="w-3.5 h-3.5" />
        <span>右回転</span>
      </button>
    </div>
  );
};

export default ThumbnailCardFooter;
