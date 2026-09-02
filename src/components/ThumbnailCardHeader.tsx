import React from 'react';
import { GripVertical, Trash2 } from 'lucide-react';
import type { DraggableProvidedDragHandleProps } from '@hello-pangea/dnd';

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
  /** DND ドラッグハンドルプロパティ */
  dragHandleProps?: DraggableProvidedDragHandleProps | null;
}

/**
 * サムネイルカード上部のドラッグハンドル、ファイル名、削除ボタンを提供するヘッダー
 */
export const ThumbnailCardHeader: React.FC<ThumbnailCardHeaderProps> = ({
  fileName,
  pageId,
  onDelete,
  dragHandleProps,
}) => {
  return (
    <div
      {...dragHandleProps}
      data-testid="drag-handle"
      className="bg-slate-50 border-b border-slate-100 px-3 py-2 flex items-center justify-between gap-1.5 text-xs cursor-grab active:cursor-grabbing select-none"
      title="ドラッグして順序を入れ替え"
    >
      <div className="flex items-center gap-1.5 min-w-0 flex-1">
        <div
          className="text-slate-400 hover:text-slate-600 p-0.5 rounded flex-shrink-0"
          title="ドラッグして順序を入れ替え"
        >
          <GripVertical className="w-4 h-4" />
        </div>
        <p
          data-testid="file-name"
          className="font-semibold text-slate-700 truncate text-[12px] pointer-events-auto"
          title={fileName}
        >
          {fileName}
        </p>
      </div>

      <button
        type="button"
        data-testid="delete-page-btn"
        onClick={() => onDelete(pageId)}
        onMouseDown={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
        aria-label="Delete page"
        className="text-slate-400 hover:text-red-600 hover:bg-red-50 p-1 rounded-md transition-colors flex-shrink-0 cursor-pointer relative z-20"
        title="Delete page"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};

export default ThumbnailCardHeader;
