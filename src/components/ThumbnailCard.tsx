import React, { useState } from 'react';
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
  /** ドキュメントの総ページ数 */
  totalPages?: number;
}

/**
 * 個別 PDF ページのプレビュー表示、回転、削除、ドラッグ操作を提供するカード
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
  totalPages,
}) => {
  const idx = displayIndex !== undefined ? displayIndex : (index !== undefined ? index : 0);
  const normalizedRotation = (((page.rotation % 360) + 360) % 360);
  const isRotated90 = normalizedRotation === 90 || normalizedRotation === 270;
  const [aspectRatio, setAspectRatio] = useState<number>(0.7071);

  const cardWidth = Math.round(
    isRotated90 ? thumbnailHeight / aspectRatio : thumbnailHeight * aspectRatio
  );
  const cardHeight = thumbnailHeight;

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
        width: `${cardWidth}px`,
        height: `${cardHeight}px`,
        ...draggableProps?.style,
      }}
      data-testid="thumbnail-card"
      data-page-id={page.id}
      data-page-index={idx}
      data-file-name={page.fileName}
      data-rotation={normalizedRotation}
      className={`group relative bg-white border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200 select-none flex-shrink-0 ${
        isDragging ? 'shadow-2xl border-indigo-500 ring-2 ring-indigo-400 z-50 opacity-90' : 'border-slate-200'
      }`}
    >
      <ThumbnailCardHeader
        fileName={page.fileName}
        pageId={page.id}
        onDelete={onDelete}
      />

      <ThumbnailPreview
        thumbnailUrl={page.thumbnailUrl}
        rotation={page.rotation}
        displayIndex={idx}
        width={cardWidth}
        height={cardHeight}
        isRotated90={isRotated90}
        onAspectRatioChange={setAspectRatio}
        dragHandleProps={dragHandleProps}
      />

      <ThumbnailCardFooter
        rotation={page.rotation}
        onRotateCCW={handleRotateCCWClick}
        onRotateCW={handleRotateCWClick}
        displayIndex={idx}
        totalPages={totalPages}
      />
    </div>
  );
};

export default ThumbnailCard;
