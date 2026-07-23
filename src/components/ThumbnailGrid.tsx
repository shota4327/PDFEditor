import React from 'react';
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from '@hello-pangea/dnd';
import ThumbnailCard from './ThumbnailCard';
import type { PdfPageInfo } from '../types/pdf';

interface ThumbnailGridProps {
  pages: PdfPageInfo[];
  onReorder: (startIndex: number, endIndex: number) => void;
  onRotate?: (pageId: string, direction: 'cw' | 'ccw') => void;
  onRotateCW?: (pageId: string) => void;
  onRotateCCW?: (pageId: string) => void;
  onDelete: (pageId: string) => void;
  zoomLevel?: number;
}

export const ThumbnailGrid: React.FC<ThumbnailGridProps> = ({
  pages,
  onReorder,
  onRotate,
  onRotateCW,
  onRotateCCW,
  onDelete,
  zoomLevel = 100,
}) => {
  const cardMinWidth = Math.round(200 * (zoomLevel / 100));
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
            style={{
              display: 'grid',
              gridTemplateColumns: `repeat(auto-fill, minmax(${cardMinWidth}px, 1fr))`,
            }}
            className={`gap-4 p-2 min-h-[200px] rounded-xl transition-colors ${
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
