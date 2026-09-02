import React, { useRef, useState, useEffect } from 'react';
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
  /** 基準となるサムネイル高さ（px） */
  thumbnailHeight?: number;
  /** ズーム倍率 */
  zoomLevel?: number;
  /** DND ドラッグハンドルプロパティ */
  dragHandleProps?: DraggableProvidedDragHandleProps | null;
}

/**
 * PDF ページのサムネイル画像描画、回転スタイル適用、ページ番号/角度バッジを表示する領域
 */
export const ThumbnailPreview: React.FC<ThumbnailPreviewProps> = ({
  thumbnailUrl,
  rotation,
  displayIndex,
  thumbnailHeight = 283,
  zoomLevel = 100,
  dragHandleProps,
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

  const normalizedRotation = (((rotation % 360) + 360) % 360);
  const isRotated90 = normalizedRotation === 90 || normalizedRotation === 270;
  const padding = 12;

  const rawHeight = containerSize.height > 0 ? containerSize.height : thumbnailHeight;
  const rawWidth = containerSize.width > 0 ? containerSize.width : Math.round(200 * (zoomLevel / 100));

  const effectiveHeight = Math.max(1, rawHeight - padding);
  const effectiveWidth = Math.max(1, rawWidth - padding);

  return (
    <div
      ref={previewRef}
      {...dragHandleProps}
      className="relative w-full bg-slate-200/70 p-1.5 flex items-center justify-center overflow-hidden transition-[height] duration-200 cursor-grab active:cursor-grabbing select-none"
      style={{ height: `${thumbnailHeight}px` }}
      title="ドラッグして順序を入れ替え"
    >
      {/* ページ番号バッジ（左上） */}
      <div className="absolute top-2 left-2 z-10 pointer-events-none">
        <span
          data-testid="page-number"
          className="font-semibold text-white bg-slate-900/45 backdrop-blur-md px-2 py-0.5 rounded text-[11px] shadow-sm"
        >
          Page {displayIndex + 1}
        </span>
      </div>

      {thumbnailUrl ? (
        <div className="w-full h-full flex items-center justify-center pointer-events-none">
          <div
            className="flex items-center justify-center transition-transform duration-300 ease-in-out"
            style={{
              width: isRotated90 ? `${effectiveHeight}px` : '100%',
              height: isRotated90 ? `${effectiveWidth}px` : '100%',
              maxWidth: isRotated90 ? `${effectiveHeight}px` : `${effectiveWidth}px`,
              maxHeight: isRotated90 ? `${effectiveWidth}px` : `${effectiveHeight}px`,
              transform: `rotate(${rotation}deg)`,
            }}
          >
            <img
              data-testid="thumbnail-img"
              src={thumbnailUrl}
              alt={`Page ${displayIndex + 1}`}
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

      {/* 回転角度バッジ（右下） */}
      <div className="absolute bottom-2 right-2 z-10 pointer-events-none">
        <span
          data-testid="rotation-badge"
          className="bg-slate-900/80 text-white text-[10px] px-1.5 py-0.5 rounded font-mono shadow backdrop-blur"
        >
          {normalizedRotation}°
        </span>
      </div>
    </div>
  );
};

export default ThumbnailPreview;
