import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useZoom } from '../../src/hooks/useZoom';

describe('useZoom カスタムフック', () => {
  it('初期ズーム倍率が 100% に設定されること', () => {
    const { result } = renderHook(() => useZoom());
    expect(result.current.zoomLevel).toBe(100);
  });

  it('handleZoomIn でズーム倍率が +25% され、上限 200% を超えないこと', () => {
    const { result } = renderHook(() => useZoom(175));

    act(() => {
      result.current.handleZoomIn();
    });
    expect(result.current.zoomLevel).toBe(200);

    // 上限 200% でそれ以上増加しないこと
    act(() => {
      result.current.handleZoomIn();
    });
    expect(result.current.zoomLevel).toBe(200);
  });

  it('handleZoomOut でズーム倍率が -25% され、下限 50% を下回らないこと', () => {
    const { result } = renderHook(() => useZoom(75));

    act(() => {
      result.current.handleZoomOut();
    });
    expect(result.current.zoomLevel).toBe(50);

    // 下限 50% でそれ以上減少しないこと
    act(() => {
      result.current.handleZoomOut();
    });
    expect(result.current.zoomLevel).toBe(50);
  });

  it('handleZoomReset で 100% にリセットされること', () => {
    const { result } = renderHook(() => useZoom(150));

    act(() => {
      result.current.handleZoomReset();
    });
    expect(result.current.zoomLevel).toBe(100);
  });

  it('handleZoomChange で指定値に設定され、50%〜200% の範囲内に収まること', () => {
    const { result } = renderHook(() => useZoom());

    act(() => {
      result.current.handleZoomChange(125);
    });
    expect(result.current.zoomLevel).toBe(125);

    // 範囲外（超過）
    act(() => {
      result.current.handleZoomChange(250);
    });
    expect(result.current.zoomLevel).toBe(200);

    // 範囲外（未満）
    act(() => {
      result.current.handleZoomChange(30);
    });
    expect(result.current.zoomLevel).toBe(50);
  });
});
