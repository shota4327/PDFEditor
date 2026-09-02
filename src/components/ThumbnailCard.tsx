import React from 'react';
import type { DraggableProvidedDraggableProps, DraggableProvidedDragHandleProps } from '@hello-pangea/dnd';
import type { PdfPageInfo } from '../types/pdf';
import ThumbnailCardHeader from './ThumbnailCardHeader';
import ThumbnailPreview from './ThumbnailPreview';
import ThumbnailCardFooter from './ThumbnailCardFooter';

/**
 * ページサムネイルカードのプロパティ定義
 */
interface ThumbnailCardProps {
  /** ページ情報 */
  page: PdfPageInfo;
  /** グリッド内インデックス */
  index?: number;
  /** 表示用ページ番号インデックス */
  displayIndex?: number;
  /** 回転コールバック（方向指定） */
  onRotate?: (pageId: string, direction: 'cw' | 'ccw') => void;
  /** 時計回り回転コールバック */
  onRotateCW?: (pageId: string) => void;
  /** 反時計回り回転コールバック */
  onRotateCCW?: (pageId: string) => void;
  /** ページ削除コールバック */
  onDelete: (pageId: string) => void;
  /** DND ドラッグハンドルプロパティ */
  dragHandleProps?: DraggableProvidedDragHandleProps | null;
  /** DND ドラッガブル要素プロパティ */
  draggableProps?: DraggableProvidedDraggableProps;
  /** DND DOM 参照コールバック */
  innerRef?: (element?: HTMLElement | null) => void;
  /** ドラッグ中状態フラグ */
  isDragging?: boolean;
  /** サムネイルエリアの基準高さ（px） */
  thumbnailHeight?: number;
  /** 現在のズーム倍率 */
  zoomLevel?: number;
}

/**
 * 個別 PDF ページのプレビュー表示、回転、削除、ドラッグハンドルを提供するカード
 */
export const ThumbnailCard: React.FC<ThumbnailCardProps> = ({
  page,
  index,
  displayIndex,
  onRotate,
  onRotateCW,
  onRotateCCW,
  onDelete,
  dragHandleProps,
  draggableProps,
  innerRef,
  isDragging = false,
  thumbnailHeight = 283,
  zoomLevel = 100,
}) => {
  const idx = displayIndex !== undefined ? displayIndex : (index !== undefined ? index : 0);
  const normalizedRotation = (((page.rotation % 360) + 360) % 360);

  const handleRotateCWClick = () => {
    if (onRotateCW) {
      onRotateCW(page.id);
    } else if (onRotate) {
      onRotate(page.id, 'cw');
    }
  };

  const handleRotateCCWClick = () => {
    if (onRotateCCW) {
      onRotateCCW(page.id);
    } else if (onRotate) {
      onRotate(page.id, 'ccw');
    }
  };

  return (
    <div
      ref={innerRef}
      {...draggableProps}
      style={{
        ...draggableProps?.style,
      }}
      data-testid="thumbnail-card"
      data-page-id={page.id}
      data-page-index={idx}
      data-file-name={page.fileName}
      data-rotation={normalizedRotation}
      className={`group relative bg-white border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200 flex flex-col select-none ${
        isDragging ? 'shadow-2xl border-indigo-500 ring-2 ring-indigo-400 z-50 opacity-90' : 'border-slate-200'
      }`}
    >
      <ThumbnailCardHeader
        fileName={page.fileName}
        pageId={page.id}
        onDelete={onDelete}
        dragHandleProps={dragHandleProps}
      />

      <ThumbnailPreview
        thumbnailUrl={page.thumbnailUrl}
        rotation={page.rotation}
        displayIndex={idx}
        thumbnailHeight={thumbnailHeight}
        zoomLevel={zoomLevel}
        dragHandleProps={dragHandleProps}
      />

      <ThumbnailCardFooter
        onRotateCCW={handleRotateCCWClick}
        onRotateCW={handleRotateCWClick}
      />
    </div>
  );
};

export default ThumbnailCard;
