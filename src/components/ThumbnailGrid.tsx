import React, { useState } from 'react';
import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverEvent,
  DragOverlay,
  pointerWithin,
  rectIntersection,
  CollisionDetection,
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
 * ポインター位置を最優先し、未検知時は矩形交差で判定する2Dグリッド向け衝突検出
 */
const customCollisionDetection: CollisionDetection = (args) => {
  const pointerCollisions = pointerWithin(args);
  if (pointerCollisions.length > 0) {
    return pointerCollisions;
  }
  return rectIntersection(args);
};

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

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    if (!over || active.id === over.id) return;

    const oldIndex = pages.findIndex((p) => p.id === active.id);
    const newIndex = pages.findIndex((p) => p.id === over.id);

    if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
      onReorder(oldIndex, newIndex);
    }
  };

  if (pages.length === 0) {
    return null;
  }

  const activePage = activeId ? pages.find((p) => p.id === activeId) : null;
  const activeIndex = activePage ? pages.indexOf(activePage) : -1;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={customCollisionDetection}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
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

      <DragOverlay dropAnimation={{ duration: 150, easing: 'ease' }}>
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
