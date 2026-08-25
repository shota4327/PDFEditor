import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePdfPages } from '../../src/hooks/usePdfPages';
import * as pdfEngine from '../../src/services/pdfEngine';
import type { PdfPageInfo } from '../../src/types/pdf';

// pdfEngine モジュールのスパイ・モック
vi.mock('../../src/services/pdfEngine', () => ({
  loadPdfDocument: vi.fn(),
  exportPdf: vi.fn(),
  createDownloadLink: vi.fn(),
  renderPageThumbnail: vi.fn(),
}));

describe('usePdfPages カスタムフック', () => {
  const samplePage1: PdfPageInfo = {
    id: 'page_1',
    fileId: 'file_1',
    fileName: 'doc1.pdf',
    pageIndex: 0,
    originalRotation: 0,
    rotation: 0,
    thumbnailUrl: 'data:image/jpeg;base64,test1',
    pdfBytes: new Uint8Array([1, 2, 3]),
  };

  const samplePage2: PdfPageInfo = {
    id: 'page_2',
    fileId: 'file_1',
    fileName: 'doc1.pdf',
    pageIndex: 1,
    originalRotation: 0,
    rotation: 0,
    thumbnailUrl: 'data:image/jpeg;base64,test2',
    pdfBytes: new Uint8Array([1, 2, 3]),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('初期状態が正しく設定されていること', () => {
    const { result } = renderHook(() => usePdfPages());

    expect(result.current.pages).toEqual([]);
    expect(result.current.zoomLevel).toBe(100);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isExporting).toBe(false);
    expect(result.current.errorMessage).toBeNull();
    expect(result.current.toast).toBeNull();
  });

  it('ズーム操作（拡大・縮小・リセット・直接指定・上下限）が正常に機能すること', () => {
    const { result } = renderHook(() => usePdfPages());

    // ズームイン: 100 -> 125 -> 150 -> 175 -> 200 -> 上限200で停止
    act(() => {
      result.current.handleZoomIn();
    });
    expect(result.current.zoomLevel).toBe(125);

    act(() => {
      result.current.handleZoomIn();
      result.current.handleZoomIn();
      result.current.handleZoomIn();
      result.current.handleZoomIn(); // 上限突破試行
    });
    expect(result.current.zoomLevel).toBe(200);

    // ズームリセット: 200 -> 100
    act(() => {
      result.current.handleZoomReset();
    });
    expect(result.current.zoomLevel).toBe(100);

    // ズームアウト: 100 -> 75 -> 50 -> 下限50で停止
    act(() => {
      result.current.handleZoomOut();
      result.current.handleZoomOut();
      result.current.handleZoomOut(); // 下限突破試行
    });
    expect(result.current.zoomLevel).toBe(50);

    // 直接指定
    act(() => {
      result.current.handleZoomChange(150);
    });
    expect(result.current.zoomLevel).toBe(150);
  });

  it('個別ページの回転（CW / CCW）が正しく反映されること', () => {
    const { result } = renderHook(() => usePdfPages());

    act(() => {
      result.current.setPages([samplePage1, samplePage2]);
    });

    // Page 1 を時計回りに回転
    act(() => {
      result.current.handleRotateCW('page_1');
    });
    expect(result.current.pages[0].rotation).toBe(90);
    expect(result.current.pages[1].rotation).toBe(0);

    // Page 1 を反時計回りに回転
    act(() => {
      result.current.handleRotateCCW('page_1');
    });
    expect(result.current.pages[0].rotation).toBe(0);
  });

  it('全ページの回転（一括 CW / CCW）が正しく反映されること', () => {
    const { result } = renderHook(() => usePdfPages());

    act(() => {
      result.current.setPages([samplePage1, samplePage2]);
    });

    act(() => {
      result.current.handleRotateAllCW();
    });
    expect(result.current.pages[0].rotation).toBe(90);
    expect(result.current.pages[1].rotation).toBe(90);

    act(() => {
      result.current.handleRotateAllCCW();
    });
    expect(result.current.pages[0].rotation).toBe(0);
    expect(result.current.pages[1].rotation).toBe(0);
  });

  it('ページの削除および並び替えが正しく動作すること', () => {
    const { result } = renderHook(() => usePdfPages());

    act(() => {
      result.current.setPages([samplePage1, samplePage2]);
    });

    // 並び替え: [Page 1, Page 2] -> [Page 2, Page 1]
    act(() => {
      result.current.handleReorder(0, 1);
    });
    expect(result.current.pages[0].id).toBe('page_2');
    expect(result.current.pages[1].id).toBe('page_1');

    // 削除: Page 1 を削除
    act(() => {
      result.current.handleDelete('page_1');
    });
    expect(result.current.pages.length).toBe(1);
    expect(result.current.pages[0].id).toBe('page_2');

    // 全クリア
    act(() => {
      result.current.handleClearAll();
    });
    expect(result.current.pages).toEqual([]);
  });

  it('PDF ファイルの読み込み処理が正常に実行されること', async () => {
    const dummyFile = new File(['%PDF-1.4...'], 'test.pdf', { type: 'application/pdf' });
    vi.mocked(pdfEngine.loadPdfDocument).mockResolvedValue({
      id: 'file_test',
      name: 'test.pdf',
      pageCount: 2,
      pages: [samplePage1, samplePage2],
    });

    const { result } = renderHook(() => usePdfPages());

    await act(async () => {
      await result.current.handleFilesSelected([dummyFile]);
    });

    expect(pdfEngine.loadPdfDocument).toHaveBeenCalledWith(dummyFile);
    expect(result.current.pages.length).toBe(2);
    expect(result.current.toast?.type).toBe('success');
  });

  it('PDF のエクスポート処理が正常に実行されること', async () => {
    const dummyExportBytes = new Uint8Array([5, 6, 7]);
    vi.mocked(pdfEngine.exportPdf).mockResolvedValue(dummyExportBytes);

    const { result } = renderHook(() => usePdfPages());

    act(() => {
      result.current.setPages([samplePage1]);
    });

    await act(async () => {
      await result.current.handleExport();
    });

    expect(pdfEngine.exportPdf).toHaveBeenCalled();
    expect(pdfEngine.createDownloadLink).toHaveBeenCalledWith(dummyExportBytes, 'doc1.pdf');
    expect(result.current.toast?.type).toBe('success');
  });
});
