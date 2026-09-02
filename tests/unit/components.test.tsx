import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Header from '../../src/components/Header';
import DragOverlay from '../../src/components/DragOverlay';
import DropZone from '../../src/components/DropZone';
import ThumbnailCard from '../../src/components/ThumbnailCard';
import ThumbnailGrid from '../../src/components/ThumbnailGrid';
import Toolbar from '../../src/components/Toolbar';
import Toast from '../../src/components/Toast';
import type { PdfPage } from '../../src/types/pdf';

describe('UI Components', () => {
  describe('Header', () => {
    it('renders header title, open file button, and offline badge', () => {
      render(<Header />);
      expect(screen.getByText('PDFEditor')).toBeInTheDocument();
      expect(screen.getByText('100% Offline Client-Side')).toBeInTheDocument();
      expect(screen.getByTestId('header-open-file-btn')).toBeInTheDocument();
    });

    it('triggers file selection callback when file input changes', () => {
      const handleFilesSelected = vi.fn();
      render(<Header onFilesSelected={handleFilesSelected} />);

      const fileInput = screen.getByTestId('header-file-input');
      const dummyFile = new File(['dummy content'], 'sample.pdf', { type: 'application/pdf' });

      fireEvent.change(fileInput, { target: { files: [dummyFile] } });
      expect(handleFilesSelected).toHaveBeenCalledWith([dummyFile]);
    });
  });

  describe('DragOverlay', () => {
    it('renders overlay when isDragging is true', () => {
      render(<DragOverlay isDragging={true} />);
      expect(screen.getByTestId('global-drag-overlay')).toBeInTheDocument();
      expect(screen.getByText(/ここにPDFファイルをドロップ/i)).toBeInTheDocument();
    });

    it('does not render when isDragging is false', () => {
      const { container } = render(<DragOverlay isDragging={false} />);
      expect(container.firstChild).toBeNull();
    });
  });

  describe('DropZone', () => {
    it('renders upload instructions', () => {
      const handleFilesAdded = vi.fn();
      render(<DropZone onFilesAdded={handleFilesAdded} />);
      expect(screen.getByText(/PDFファイルをドラッグ＆ドロップ/i)).toBeInTheDocument();
    });

    it('handles file drop', () => {
      const handleFilesAdded = vi.fn();
      render(<DropZone onFilesAdded={handleFilesAdded} />);
      const dropzone = screen.getByTestId('dropzone');

      const dummyFile = new File(['dummy content'], 'test.pdf', { type: 'application/pdf' });
      fireEvent.drop(dropzone, {
        dataTransfer: {
          files: [dummyFile],
        },
      });

      expect(handleFilesAdded).toHaveBeenCalledWith([dummyFile]);
    });
  });

  describe('ThumbnailCard', () => {
    const samplePage: PdfPage = {
      id: 'page_1',
      fileId: 'file_1',
      fileName: 'sample.pdf',
      pageIndex: 0,
      originalRotation: 0,
      rotation: 90,
      thumbnailUrl: 'data:image/jpeg;base64,sample',
      pdfBytes: new Uint8Array([1, 2, 3]),
    };

    it('renders page metadata, rotation badge, and action buttons', () => {
      const handleRotate = vi.fn();
      const handleDelete = vi.fn();

      render(
        <ThumbnailCard
          page={samplePage}
          index={0}
          onRotate={handleRotate}
          onDelete={handleDelete}
        />
      );

      expect(screen.getByText('Page 1')).toBeInTheDocument();
      expect(screen.getByText('sample.pdf')).toBeInTheDocument();
      expect(screen.getByText('90°')).toBeInTheDocument();

      const rotateCwBtn = screen.getByTestId('rotate-cw-btn');
      fireEvent.click(rotateCwBtn);
      expect(handleRotate).toHaveBeenCalledWith('page_1', 'cw');

      const rotateCcwBtn = screen.getByTestId('rotate-ccw-btn');
      fireEvent.click(rotateCcwBtn);
      expect(handleRotate).toHaveBeenCalledWith('page_1', 'ccw');

      const deleteBtn = screen.getByTestId('delete-page-btn');
      fireEvent.click(deleteBtn);
      expect(handleDelete).toHaveBeenCalledWith('page_1');
    });

    it('applies custom thumbnailHeight prop when provided', () => {
      render(
        <ThumbnailCard
          page={samplePage}
          index={0}
          onDelete={vi.fn()}
          thumbnailHeight={240}
        />
      );

      const card = screen.getByTestId('thumbnail-card');
      const imgContainer = card.querySelector('div[style*="height"]');
      expect(imgContainer).toHaveStyle({ height: '240px' });
    });
  });

  describe('ThumbnailGrid', () => {
    const samplePages: PdfPage[] = [
      {
        id: 'page_1',
        fileId: 'file_1',
        fileName: 'sample.pdf',
        pageIndex: 0,
        originalRotation: 0,
        rotation: 0,
        thumbnailUrl: 'data:image/jpeg;base64,sample',
        pdfBytes: new Uint8Array([1, 2, 3]),
      },
    ];

    it('renders grid with dynamic column minmax calculation based on zoomLevel', () => {
      render(
        <ThumbnailGrid
          pages={samplePages}
          zoomLevel={150}
          onReorder={vi.fn()}
          onDelete={vi.fn()}
        />
      );

      const grid = screen.getByTestId('thumbnail-grid');
      // Math.round(200 * (150 / 100)) = 300
      expect(grid).toHaveStyle({
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
      });
    });
  });

  describe('Toolbar', () => {
    it('renders rotate all and action buttons', () => {
      const handleAdd = vi.fn();
      const handleClear = vi.fn();
      const handleExport = vi.fn();
      const handleRotateAllCW = vi.fn();
      const handleRotateAllCCW = vi.fn();

      render(
        <Toolbar
          pageCount={5}
          onAddFiles={handleAdd}
          onClearAll={handleClear}
          onExport={handleExport}
          onRotateAllCW={handleRotateAllCW}
          onRotateAllCCW={handleRotateAllCCW}
        />
      );

      expect(screen.getByText('すべて左回転')).toBeInTheDocument();
      expect(screen.getByText('すべて右回転')).toBeInTheDocument();
      expect(screen.getByText('PDFを出力')).toBeInTheDocument();
      expect(screen.getByTestId('page-count')).toHaveTextContent('5');

      const rotateAllCwBtn = screen.getByTestId('rotate-all-cw-btn');
      fireEvent.click(rotateAllCwBtn);
      expect(handleRotateAllCW).toHaveBeenCalledTimes(1);

      const rotateAllCcwBtn = screen.getByTestId('rotate-all-ccw-btn');
      fireEvent.click(rotateAllCcwBtn);
      expect(handleRotateAllCCW).toHaveBeenCalledTimes(1);

      const exportBtn = screen.getByTestId('export-btn');
      fireEvent.click(exportBtn);
      expect(handleExport).toHaveBeenCalledTimes(1);

      const clearBtn = screen.getByTestId('clear-all-btn');
      fireEvent.click(clearBtn);
      expect(handleClear).toHaveBeenCalledTimes(1);
    });

    it('renders zoom controls and handles zoom events and disabled states', () => {
      const handleZoomIn = vi.fn();
      const handleZoomOut = vi.fn();
      const handleZoomReset = vi.fn();

      const { rerender } = render(
        <Toolbar
          pageCount={2}
          zoomLevel={100}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onZoomReset={handleZoomReset}
          onClearAll={vi.fn()}
          onExport={vi.fn()}
        />
      );

      expect(screen.getByTestId('zoom-controls')).toBeInTheDocument();
      expect(screen.getByTestId('zoom-level-indicator')).toHaveTextContent('100%');

      const zoomInBtn = screen.getByTestId('zoom-in-btn');
      const zoomOutBtn = screen.getByTestId('zoom-out-btn');
      const handleZoomChange = vi.fn();
      const zoomResetBtn = screen.getByTestId('zoom-reset-btn');
      const zoomSlider = screen.getByTestId('zoom-slider');

      expect(zoomInBtn).not.toBeDisabled();
      expect(zoomOutBtn).not.toBeDisabled();
      expect(zoomResetBtn).toBeDisabled(); // 100% default is disabled
      expect(zoomSlider).toHaveValue('100');

      fireEvent.click(zoomInBtn);
      expect(handleZoomIn).toHaveBeenCalledTimes(1);

      fireEvent.click(zoomOutBtn);
      expect(handleZoomOut).toHaveBeenCalledTimes(1);

      // Re-render at 200% zoom with onZoomChange
      rerender(
        <Toolbar
          pageCount={2}
          zoomLevel={200}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onZoomReset={handleZoomReset}
          onZoomChange={handleZoomChange}
          onClearAll={vi.fn()}
          onExport={vi.fn()}
        />
      );

      expect(screen.getByTestId('zoom-level-indicator')).toHaveTextContent('200%');
      fireEvent.change(screen.getByTestId('zoom-slider'), { target: { value: '150' } });
      expect(handleZoomChange).toHaveBeenCalledWith(150);
      expect(screen.getByTestId('zoom-in-btn')).toBeDisabled();
      expect(screen.getByTestId('zoom-reset-btn')).not.toBeDisabled();

      fireEvent.click(screen.getByTestId('zoom-reset-btn'));
      expect(handleZoomReset).toHaveBeenCalledTimes(1);

      // Re-render at 50% zoom
      rerender(
        <Toolbar
          pageCount={2}
          zoomLevel={50}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onZoomReset={handleZoomReset}
          onClearAll={vi.fn()}
          onExport={vi.fn()}
        />
      );

      expect(screen.getByTestId('zoom-level-indicator')).toHaveTextContent('50%');
      expect(screen.getByTestId('zoom-out-btn')).toBeDisabled();
    });
  });

  describe('Toast', () => {
    it('renders toast notification message and triggers onDismiss', () => {
      const handleDismiss = vi.fn();
      render(
        <Toast
          toast={{ message: 'テスト通知メッセージ', type: 'success' }}
          onDismiss={handleDismiss}
        />
      );

      expect(screen.getByText('テスト通知メッセージ')).toBeInTheDocument();
      const closeBtn = screen.getByRole('button', { name: /閉じる/i });
      fireEvent.click(closeBtn);
      expect(handleDismiss).toHaveBeenCalledTimes(1);
    });

    it('returns null when toast is null', () => {
      const { container } = render(<Toast toast={null} onDismiss={vi.fn()} />);
      expect(container.firstChild).toBeNull();
    });
  });

  describe('DropZoneErrorBanner', () => {
    it('renders error message and handles dismiss button', async () => {
      const { DropZoneErrorBanner } = await import('../../src/components/DropZoneErrorBanner');
      const handleDismiss = vi.fn();
      render(<DropZoneErrorBanner errorMessage="エラーが発生しました" onErrorDismiss={handleDismiss} />);

      expect(screen.getByText('エラーが発生しました')).toBeInTheDocument();
      const dismissBtn = screen.getByRole('button', { name: /Dismiss/i });
      fireEvent.click(dismissBtn);
      expect(handleDismiss).toHaveBeenCalledTimes(1);
    });
  });

  describe('PageCountBadge', () => {
    it('renders page count text properly', async () => {
      const { PageCountBadge } = await import('../../src/components/PageCountBadge');
      render(<PageCountBadge pageCount={10} />);

      expect(screen.getByTestId('page-count-badge')).toBeInTheDocument();
      expect(screen.getByTestId('page-count')).toHaveTextContent('10');
    });
  });

  describe('ZoomControls', () => {
    it('renders zoom buttons and handles zoom click actions', async () => {
      const { ZoomControls } = await import('../../src/components/ZoomControls');
      const handleZoomIn = vi.fn();
      const handleZoomOut = vi.fn();
      const handleZoomReset = vi.fn();

      render(
        <ZoomControls
          zoomLevel={125}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onZoomReset={handleZoomReset}
        />
      );

      expect(screen.getByTestId('zoom-level-indicator')).toHaveTextContent('125%');
      fireEvent.click(screen.getByTestId('zoom-in-btn'));
      expect(handleZoomIn).toHaveBeenCalledTimes(1);
      fireEvent.click(screen.getByTestId('zoom-out-btn'));
      expect(handleZoomOut).toHaveBeenCalledTimes(1);
      fireEvent.click(screen.getByTestId('zoom-reset-btn'));
      expect(handleZoomReset).toHaveBeenCalledTimes(1);
    });
  });
});

