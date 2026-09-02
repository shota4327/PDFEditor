import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useToast } from '../../src/hooks/useToast';

describe('useToast カスタムフック', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('初期状態では toast が null であること', () => {
    const { result } = renderHook(() => useToast());
    expect(result.current.toast).toBeNull();
  });

  it('showToast を呼び出すとトーストメッセージが設定されること', () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.showToast('処理が完了しました', 'success');
    });

    expect(result.current.toast).toEqual({
      message: '処理が完了しました',
      type: 'success',
    });
  });

  it('3.5秒経過後にトーストが自動消去されること', () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.showToast('一時的な通知', 'info');
    });

    expect(result.current.toast).not.toBeNull();

    act(() => {
      vi.advanceTimersByTime(3500);
    });

    expect(result.current.toast).toBeNull();
  });
});
