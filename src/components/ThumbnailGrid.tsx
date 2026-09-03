import React from 'react';
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from '@hello-pangea/dnd';
import ThumbnailCard from './ThumbnailCard';
import type { PdfPageInfo } from '../types/pdf';

/**
 * サムネイルグリッドコンポーネントのプロパティ定義
 */
interface ThumbnailGridProps {
  /** 表示対象のページ情報配列 */
  pages: PdfPageInfo[];
  /** ドラッグ＆ドロップ並び替えコールバック */
  onReorder: (startIndex: number, endIndex: number) => void;
  /** 回転コールバック（方向指定） */
  onRotate?: (pageId: string, direction: 'cw' | 'ccw') => void;
  /** 時計回り回転コールバック */
  onRotateCW?: (pageId: string) => void;
  /** 反時計回り回転コールバック */
  onRotateCCW?: (pageId: string) => void;
  /** ページ削除コールバック */
  onDelete: (pageId: string) => void;
  /** 現在のズーム倍率 */
  zoomLevel?: number;
}

/**
 * 読み込まれた全ページのサムネイルカードをレスポンシブなグリッドで配置し、DND並び替えを提供するコンポーネント
 */
export const ThumbnailGrid: React.FC<ThumbnailGridProps> = ({
  pages,
  onReorder,
  onRotate,
  onRotateCW,
  onRotateCCW,
  onDelete,
  zoomLevel = 100,
}) => {
  const thumbnailHeight = Math.round(283 * (zoomLevel / 100));

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    if (result.destination.index === result.source.index) return;
    onReorder(result.source.index, result.destination.index);
  };

  if (pages.length === 0) {
    return null;
  }

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <Droppable droppableId="pdf-pages-grid" direction="horizontal">
        {(provided, snapshot) => (
          <div
            data-testid="thumbnail-grid"
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`flex flex-wrap gap-5 p-4 min-h-[200px] rounded-xl transition-colors items-start ${
              snapshot.isDraggingOver ? 'bg-indigo-50/40 border border-indigo-200' : ''
            }`}
          >
            {pages.map((page, index) => (
              <Draggable key={page.id} draggableId={page.id} index={index}>
                {(dragProvided, dragSnapshot) => (
                  <ThumbnailCard
                    page={page}
                    displayIndex={index}
                    index={index}
                    onRotate={onRotate}
                    onRotateCW={onRotateCW}
                    onRotateCCW={onRotateCCW}
                    onDelete={onDelete}
                    innerRef={dragProvided.innerRef}
                    draggableProps={dragProvided.draggableProps}
                    dragHandleProps={dragProvided.dragHandleProps}
                    isDragging={dragSnapshot.isDragging}
                    thumbnailHeight={thumbnailHeight}
                    zoomLevel={zoomLevel}
                    totalPages={pages.length}
                  />
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
};

export default ThumbnailGrid;
