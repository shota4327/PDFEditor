import { useState, useCallback } from 'react';

/**
 * ズーム倍率管理カスタムフック
 *
 * 50%〜200% の範囲での拡大・縮小・リセット・直接変更機能を提供します。
 */
export function useZoom(initialZoom: number = 100) {
  const [zoomLevel, setZoomLevel] = useState<number>(initialZoom);

  /**
   * ズーム倍率の拡大（最大200%）
   */
  const handleZoomIn = useCallback(() => {
    setZoomLevel((prev) => Math.min(200, prev + 25));
  }, []);

  /**
   * ズーム倍率の縮小（最小50%）
   */
  const handleZoomOut = useCallback(() => {
    setZoomLevel((prev) => Math.max(50, prev - 25));
  }, []);

  /**
   * ズーム倍率を標準（100%）にリセット
   */
  const handleZoomReset = useCallback(() => {
    setZoomLevel(100);
  }, []);

  /**
   * ズーム倍率の直接指定
   */
  const handleZoomChange = useCallback((newZoom: number) => {
    setZoomLevel(Math.min(200, Math.max(50, newZoom)));
  }, []);

  return {
    zoomLevel,
    setZoomLevel,
    handleZoomIn,
    handleZoomOut,
    handleZoomReset,
    handleZoomChange,
  };
}

export default useZoom;
