import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import ThumbnailCard, { ThumbnailCardProps } from './ThumbnailCard';

/**
 * @dnd-kit の Sortable 機能を付与したページサムネイルカードコンポーネント
 */
export const SortableThumbnailCard: React.FC<ThumbnailCardProps> = (props) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: props.page.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
    zIndex: isDragging ? 0 : undefined,
    touchAction: 'none',
  };

  return (
    <ThumbnailCard
      {...props}
      innerRef={setNodeRef}
      style={style}
      isDragging={isDragging}
      dragHandleProps={{
        ...attributes,
        ...listeners,
        tabIndex: 0,
      }}
    />
  );
};

export default SortableThumbnailCard;
