import React, { useRef, useState, useEffect } from 'react';
import { RotateCw, RotateCcw, Trash2, GripVertical, FileText } from 'lucide-react';
import type { PdfPageInfo } from '../types/pdf';

interface ThumbnailCardProps {
  page: PdfPageInfo;
  index?: number;
  displayIndex?: number;
  onRotate?: (pageId: string, direction: 'cw' | 'ccw') => void;
  onRotateCW?: (pageId: string) => void;
  onRotateCCW?: (pageId: string) => void;
  onDelete: (pageId: string) => void;
  dragHandleProps?: any;
  draggableProps?: any;
  innerRef?: (element?: HTMLElement | null) => void;
  isDragging?: boolean;
  thumbnailHeight?: number;
  zoomLevel?: number;
}

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
  const previewRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });

  useEffect(() => {
    if (!previewRef.current || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect) {
          setContainerSize({
            width: Math.round(entry.contentRect.width),
            height: Math.round(entry.contentRect.height),
          });
        }
      }
    });

    observer.observe(previewRef.current);
    return () => observer.disconnect();
  }, []);

  const idx = displayIndex !== undefined ? displayIndex : (index !== undefined ? index : 0);
  const normalizedRotation = (((page.rotation % 360) + 360) % 360);
  const isRotated90 = normalizedRotation === 90 || normalizedRotation === 270;
  const padding = 12;

  const rawHeight = containerSize.height > 0 ? containerSize.height : thumbnailHeight;
  const rawWidth = containerSize.width > 0 ? containerSize.width : Math.round(200 * (zoomLevel / 100));

  const effectiveHeight = Math.max(1, rawHeight - padding);
  const effectiveWidth = Math.max(1, rawWidth - padding);

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
      {/* Top control bar: Entire bar is drag handle except delete button */}
      <div
        {...dragHandleProps}
        data-testid="drag-handle"
        className="bg-slate-50 border-b border-slate-100 px-3 py-2 flex items-center justify-between gap-1.5 text-xs cursor-grab active:cursor-grabbing select-none"
        title="ドラッグして順序を入れ替え"
      >
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          <div className="text-slate-400 hover:text-slate-600 p-0.5 rounded flex-shrink-0" title="ドラッグして順序を入れ替え">
            <GripVertical className="w-4 h-4" />
          </div>
          <p
            data-testid="file-name"
            className="font-semibold text-slate-700 truncate text-[12px] pointer-events-auto"
            title={page.fileName}
          >
            {page.fileName}
          </p>
        </div>

        <button
          type="button"
          data-testid="delete-page-btn"
          onClick={() => onDelete(page.id)}
          onMouseDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          aria-label="Delete page"
          className="text-slate-400 hover:text-red-600 hover:bg-red-50 p-1 rounded-md transition-colors flex-shrink-0 cursor-pointer relative z-20"
          title="Delete page"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Thumbnail area with visual rotation & drag initiation */}
      <div
        ref={previewRef}
        {...dragHandleProps}
        className="relative w-full bg-slate-200/70 p-1.5 flex items-center justify-center overflow-hidden transition-[height] duration-200 cursor-grab active:cursor-grabbing select-none"
        style={{ height: `${thumbnailHeight}px` }}
        title="ドラッグして順序を入れ替え"
      >
        {/* Page badge overlay top-left */}
        <div className="absolute top-2 left-2 z-10 pointer-events-none">
          <span
            data-testid="page-number"
            className="font-semibold text-white bg-slate-900/45 backdrop-blur-md px-2 py-0.5 rounded text-[11px] shadow-sm"
          >
            Page {idx + 1}
          </span>
        </div>

        {page.thumbnailUrl ? (
          <div className="w-full h-full flex items-center justify-center pointer-events-none">
            <div
              className="flex items-center justify-center transition-transform duration-300 ease-in-out"
              style={{
                width: isRotated90 ? `${effectiveHeight}px` : '100%',
                height: isRotated90 ? `${effectiveWidth}px` : '100%',
                maxWidth: isRotated90 ? `${effectiveHeight}px` : `${effectiveWidth}px`,
                maxHeight: isRotated90 ? `${effectiveWidth}px` : `${effectiveHeight}px`,
                transform: `rotate(${page.rotation}deg)`,
              }}
            >
              <img
                data-testid="thumbnail-img"
                src={page.thumbnailUrl}
                alt={`Page ${idx + 1}`}
                className="max-w-full max-h-full w-auto h-auto object-contain rounded-sm shadow-md shadow-slate-900/15 ring-1 ring-slate-900/10 bg-white"
              />
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-slate-400 gap-1 pointer-events-none">
            <FileText className="w-10 h-10 stroke-[1.5]" />
            <span className="text-xs">No Preview</span>
          </div>
        )}

        {/* Rotation badge overlay bottom-right */}
        <div className="absolute bottom-2 right-2 z-10 pointer-events-none">
          <span
            data-testid="rotation-badge"
            className="bg-slate-900/80 text-white text-[10px] px-1.5 py-0.5 rounded font-mono shadow backdrop-blur"
          >
            {normalizedRotation}°
          </span>
        </div>
      </div>

      {/* Footer controls: Full container width 50%/50% click targets */}
      <div className="bg-white border-t border-slate-100 flex items-stretch divide-x divide-slate-100 h-10">
        <button
          type="button"
          data-testid="rotate-ccw-btn"
          onClick={handleRotateCCWClick}
          onMouseDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          aria-label="Rotate counter-clockwise"
          className="flex-1 flex items-center justify-center gap-1.5 text-xs text-slate-600 font-medium hover:text-indigo-600 hover:bg-slate-50 transition-colors cursor-pointer active:bg-slate-100"
          title="Rotate 90° CCW"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>左回転</span>
        </button>

        <button
          type="button"
          data-testid="rotate-cw-btn"
          onClick={handleRotateCWClick}
          onMouseDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          aria-label="Rotate clockwise"
          className="flex-1 flex items-center justify-center gap-1.5 text-xs text-slate-600 font-medium hover:text-indigo-600 hover:bg-slate-50 transition-colors cursor-pointer active:bg-slate-100"
          title="Rotate 90° CW"
        >
          <RotateCw className="w-3.5 h-3.5" />
          <span>右回転</span>
        </button>
      </div>
    </div>
  );
};

export default ThumbnailCard;
