import React, { useState, useRef } from 'react';
import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragOverEvent,
  DragOverlay,
  closestCenter,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import SortableThumbnailCard from './SortableThumbnailCard';
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
 * 読み込まれた全ページのサムネイルカードをレスポンシブなグリッドで配置し、異なる縦横比混在でも崩れないリアルタイム並び替えを提供するコンポーネント
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
  const [activeId, setActiveId] = useState<string | null>(null);
  const initialPagesRef = useRef<PdfPageInfo[] | null>(null);
  const thumbnailHeight = Math.round(283 * (zoomLevel / 100));

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    initialPagesRef.current = [...pages];
    setActiveId(String(event.active.id));
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = pages.findIndex((p) => p.id === active.id);
    const newIndex = pages.findIndex((p) => p.id === over.id);

    if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
      onReorder(oldIndex, newIndex);
    }
  };

  const handleDragEnd = () => {
    // リアルタイム並び替え済みのDOM位置をそのまま確定とし、二重並び替えを排除
    setActiveId(null);
    initialPagesRef.current = null;
  };

  const handleDragCancel = () => {
    // ドラッグ中断時、開始前の初期順序に安全にロールバック
    if (initialPagesRef.current) {
      const initOrder = initialPagesRef.current;
      initOrder.forEach((page, targetIdx) => {
        const currentIdx = pages.findIndex((p) => p.id === page.id);
        if (currentIdx !== -1 && currentIdx !== targetIdx) {
          onReorder(currentIdx, targetIdx);
        }
      });
    }
    setActiveId(null);
    initialPagesRef.current = null;
  };

  if (pages.length === 0) {
    return null;
  }

  const activePage = activeId ? pages.find((p) => p.id === activeId) : null;
  const activeIndex = activePage ? pages.indexOf(activePage) : -1;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <SortableContext items={pages.map((p) => p.id)} strategy={() => null}>
        <div
          data-testid="thumbnail-grid"
          className="flex flex-wrap gap-5 p-4 min-h-[200px] rounded-xl transition-colors items-start"
        >
          {pages.map((page, index) => (
            <SortableThumbnailCard
              key={page.id}
              page={page}
              displayIndex={index}
              index={index}
              isDragging={activeId === page.id}
              onRotate={onRotate}
              onRotateCW={onRotateCW}
              onRotateCCW={onRotateCCW}
              onDelete={onDelete}
              thumbnailHeight={thumbnailHeight}
              zoomLevel={zoomLevel}
              totalPages={pages.length}
            />
          ))}
        </div>
      </SortableContext>

      <DragOverlay dropAnimation={null}>
        {activePage && activeIndex !== -1 ? (
          <div className="rotate-2 scale-105 shadow-2xl pointer-events-none">
            <ThumbnailCard
              page={activePage}
              displayIndex={activeIndex}
              index={activeIndex}
              onDelete={onDelete}
              thumbnailHeight={thumbnailHeight}
              zoomLevel={zoomLevel}
              totalPages={pages.length}
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};

export default ThumbnailGrid;
