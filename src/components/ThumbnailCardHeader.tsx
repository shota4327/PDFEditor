import React from 'react';
import { Trash2 } from 'lucide-react';

/**
 * サムネイルカードヘッダーのプロパティ定義
 */
export interface ThumbnailCardHeaderProps {
  /** ファイル名 */
  fileName: string;
  /** ページID */
  pageId: string;
  /** ページ削除コールバック */
  onDelete: (pageId: string) => void;
}

/**
 * サムネイル上部のフローティングオーバーレイ（タイトルおよび削除ボタン）
 */
export const ThumbnailCardHeader: React.FC<ThumbnailCardHeaderProps> = ({
  fileName,
  pageId,
  onDelete,
}) => {
  return (
    <div className="absolute top-2 left-2 right-2 z-20 flex items-center justify-between gap-1.5 pointer-events-none select-none">
      {/* ファイル名ピル */}
      <div
        data-testid="file-name"
        className="pointer-events-auto font-medium text-slate-700 bg-white/75 backdrop-blur-md px-2.5 py-1 rounded-md border border-white/60 shadow-sm text-xs truncate max-w-[calc(100%-40px)]"
        title={fileName}
      >
        {fileName}
      </div>

      {/* ページ削除ボタンピル */}
      <button
        type="button"
        data-testid="delete-page-btn"
        onClick={() => onDelete(pageId)}
        onMouseDown={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
        aria-label="Delete page"
        className="pointer-events-auto text-slate-600 hover:text-red-600 hover:bg-red-50/80 bg-white/75 backdrop-blur-md p-1.5 rounded-md border border-white/60 shadow-sm transition-colors cursor-pointer flex-shrink-0"
        title="ページを削除"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};

export default ThumbnailCardHeader;
