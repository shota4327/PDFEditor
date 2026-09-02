import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * 全画面ドラッグ＆ドロップ用フックのオプション定義
 */
interface UseGlobalDragDropOptions {
  /** ファイルがドロップされた時のコールバック */
  onFilesDropped?: (files: File[]) => void;
  /** 処理中フラグ（true のときはドロップを無視） */
  disabled?: boolean;
}

/**
 * ウィンドウ全体へのファイルドラッグ＆ドロップイベントを監視するカスタムフック
 */
export function useGlobalDragDrop({
  onFilesDropped,
  disabled = false,
}: UseGlobalDragDropOptions = {}) {
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const dragCounterRef = useRef(0);

  const handleDragEnter = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      if (disabled) return;

      // ファイルドラッグかどうか判定
      if (e.dataTransfer && e.dataTransfer.types.includes('Files')) {
        dragCounterRef.current += 1;
        if (dragCounterRef.current === 1) {
          setIsDraggingOver(true);
        }
      }
    },
    [disabled]
  );

  const handleDragLeave = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      if (disabled) return;

      dragCounterRef.current = Math.max(0, dragCounterRef.current - 1);
      if (dragCounterRef.current === 0) {
        setIsDraggingOver(false);
      }
    },
    [disabled]
  );

  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'copy';
    }
  }, []);

  const handleDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      dragCounterRef.current = 0;
      setIsDraggingOver(false);

      if (disabled) return;

      if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        const files = Array.from(e.dataTransfer.files).filter(
          (file) => file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
        );
        if (files.length > 0 && onFilesDropped) {
          onFilesDropped(files);
        }
      }
    },
    [disabled, onFilesDropped]
  );

  useEffect(() => {
    window.addEventListener('dragenter', handleDragEnter);
    window.addEventListener('dragleave', handleDragLeave);
    window.addEventListener('dragover', handleDragOver);
    window.addEventListener('drop', handleDrop);

    return () => {
      window.removeEventListener('dragenter', handleDragEnter);
      window.removeEventListener('dragleave', handleDragLeave);
      window.removeEventListener('dragover', handleDragOver);
      window.removeEventListener('drop', handleDrop);
    };
  }, [handleDragEnter, handleDragLeave, handleDragOver, handleDrop]);

  return { isDraggingOver };
}

export default useGlobalDragDrop;
