import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useGlobalDragDrop } from '../../src/hooks/useGlobalDragDrop';

/**
 * useGlobalDragDrop カスタムフックの単体テスト
 */
describe('useGlobalDragDrop', () => {
  it('initializes with isDraggingOver as false', () => {
    const { result } = renderHook(() => useGlobalDragDrop());
    expect(result.current.isDraggingOver).toBe(false);
  });

  it('sets isDraggingOver to true on window dragenter with files', () => {
    const { result } = renderHook(() => useGlobalDragDrop());

    const dragEnterEvent = new Event('dragenter') as any;
    dragEnterEvent.dataTransfer = {
      types: ['Files'],
    };

    act(() => {
      window.dispatchEvent(dragEnterEvent);
    });

    expect(result.current.isDraggingOver).toBe(true);
  });

  it('sets isDraggingOver to false on window dragleave', () => {
    const { result } = renderHook(() => useGlobalDragDrop());

    const dragEnterEvent = new Event('dragenter') as any;
    dragEnterEvent.dataTransfer = {
      types: ['Files'],
    };

    act(() => {
      window.dispatchEvent(dragEnterEvent);
    });
    expect(result.current.isDraggingOver).toBe(true);

    const dragLeaveEvent = new Event('dragleave') as any;
    act(() => {
      window.dispatchEvent(dragLeaveEvent);
    });
    expect(result.current.isDraggingOver).toBe(false);
  });

  it('calls onFilesDropped callback on window drop and resets dragging state', () => {
    const onFilesDropped = vi.fn();
    const { result } = renderHook(() => useGlobalDragDrop({ onFilesDropped }));

    const dummyFile = new File(['dummy content'], 'document.pdf', { type: 'application/pdf' });
    const dropEvent = new Event('drop') as any;
    dropEvent.dataTransfer = {
      files: [dummyFile],
    };

    act(() => {
      window.dispatchEvent(dropEvent);
    });

    expect(result.current.isDraggingOver).toBe(false);
    expect(onFilesDropped).toHaveBeenCalledWith([dummyFile]);
  });

  it('does not trigger onFilesDropped when disabled is true', () => {
    const onFilesDropped = vi.fn();
    const { result } = renderHook(() => useGlobalDragDrop({ onFilesDropped, disabled: true }));

    const dummyFile = new File(['dummy content'], 'document.pdf', { type: 'application/pdf' });
    const dropEvent = new Event('drop') as any;
    dropEvent.dataTransfer = {
      files: [dummyFile],
    };

    act(() => {
      window.dispatchEvent(dropEvent);
    });

    expect(result.current.isDraggingOver).toBe(false);
    expect(onFilesDropped).not.toHaveBeenCalled();
  });
});
