import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { motion } from 'framer-motion';
import ThumbnailCard, { ThumbnailCardProps } from './ThumbnailCard';

/**
 * @dnd-kit の Sortable 機能と Framer Motion レイアウトアニメーションを付与したカードコンポーネント
 */
export const SortableThumbnailCard: React.FC<ThumbnailCardProps> = (props) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    isDragging: hookIsDragging,
  } = useSortable({ id: props.page.id });

  const effectiveIsDragging = props.isDragging !== undefined ? props.isDragging : hookIsDragging;

  return (
    <motion.div
      layout
      transition={{
        layout: { duration: 0.2, ease: 'easeOut' },
      }}
      ref={setNodeRef}
      style={{
        opacity: effectiveIsDragging ? 0.25 : 1,
        touchAction: 'none',
      }}
      className="flex-shrink-0"
    >
      <ThumbnailCard
        {...props}
        isDragging={effectiveIsDragging}
        dragHandleProps={{
          ...attributes,
          ...listeners,
          tabIndex: 0,
        }}
      />
    </motion.div>
  );
};

export default SortableThumbnailCard;
