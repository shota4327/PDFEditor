import React from 'react';
import { FileText } from 'lucide-react';
import type { DraggableProvidedDragHandleProps } from '@hello-pangea/dnd';

/**
 * サムネイルプレビュー領域のプロパティ定義
 */
export interface ThumbnailPreviewProps {
  /** サムネイル画像の Data URL */
  thumbnailUrl?: string;
  /** 現在の回転角度（度数法） */
  rotation: number;
  /** 表示用ページ番号インデックス（0始まり） */
  displayIndex: number;
  /** カード横幅（px） */
  width: number;
  /** カード高さ（px） */
  height: number;
  /** 90度または270度回転フラグ */
  isRotated90: boolean;
  /** 画像ロード時のアスペクト比通知コールバック */
  onAspectRatioChange?: (ratio: number) => void;
  /** DND ドラッグハンドルプロパティ */
  dragHandleProps?: DraggableProvidedDragHandleProps | null;
}

/**
 * PDF ページのサムネイル画像を余白ゼロで完全密着描画するプレビュー領域
 */
export const ThumbnailPreview: React.FC<ThumbnailPreviewProps> = ({
  thumbnailUrl,
  rotation,
  displayIndex,
  width,
  height,
  isRotated90,
  onAspectRatioChange,
  dragHandleProps,
}) => {
  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { naturalWidth, naturalHeight } = e.currentTarget;
    if (naturalWidth > 0 && naturalHeight > 0) {
      onAspectRatioChange?.(naturalWidth / naturalHeight);
    }
  };

  return (
    <div
      {...dragHandleProps}
      data-testid="drag-handle"
      className="w-full h-full relative flex items-center justify-center overflow-hidden cursor-grab active:cursor-grabbing select-none bg-white"
      title="ドラッグして順序を入れ替え"
    >
      {thumbnailUrl ? (
        <div
          className="flex items-center justify-center transition-transform duration-300 ease-in-out pointer-events-none"
          style={{
            width: isRotated90 ? `${height}px` : `${width}px`,
            height: isRotated90 ? `${width}px` : `${height}px`,
            transform: `rotate(${rotation}deg)`,
          }}
        >
          <img
            data-testid="thumbnail-img"
            src={thumbnailUrl}
            alt={`Page ${displayIndex + 1}`}
            onLoad={handleImageLoad}
            className="w-full h-full object-fill bg-white pointer-events-none select-none"
          />
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center text-slate-400 gap-1 pointer-events-none">
          <FileText className="w-10 h-10 stroke-[1.5]" />
          <span className="text-xs">No Preview</span>
        </div>
      )}
    </div>
  );
};

export default ThumbnailPreview;
