import '@testing-library/jest-dom';
import { vi } from 'vitest';

// URL.createObjectURL and URL.revokeObjectURL mocks for jsdom environment
if (typeof window !== 'undefined') {
  if (!window.URL.createObjectURL) {
    window.URL.createObjectURL = vi.fn((_blob: Blob | MediaSource) => {
      return `blob:http://localhost/mock-blob-${Math.random().toString(36).substring(2)}`;
    });
  }
  if (!window.URL.revokeObjectURL) {
    window.URL.revokeObjectURL = vi.fn();
  }
}

// Polyfill Blob/File arrayBuffer for jsdom
if (typeof Blob !== 'undefined' && !Blob.prototype.arrayBuffer) {
  Blob.prototype.arrayBuffer = function () {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as ArrayBuffer);
      reader.onerror = () => reject(reader.error);
      reader.readAsArrayBuffer(this);
    });
  };
}
if (typeof File !== 'undefined' && !File.prototype.arrayBuffer) {
  File.prototype.arrayBuffer = Blob.prototype.arrayBuffer;
}

// HTMLCanvasElement getContext & toDataURL mocks for pdfjs-dist canvas rendering in jsdom
if (typeof HTMLCanvasElement !== 'undefined') {
  HTMLCanvasElement.prototype.getContext = vi.fn().mockImplementation(function (
    this: HTMLCanvasElement,
    contextId: string
  ) {
    if (contextId === '2d') {
      return {
        canvas: this,
        fillRect: vi.fn(),
        clearRect: vi.fn(),
        getImageData: vi.fn((_x, _y, w, h) => ({ data: new Uint8ClampedArray((w || 1) * (h || 1) * 4) })),
        putImageData: vi.fn(),
        createImageData: vi.fn((w, h) => ({ data: new Uint8ClampedArray((w || 1) * (h || 1) * 4) })),
        setTransform: vi.fn(),
        getTransform: vi.fn(() => ({ a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 })),
        resetTransform: vi.fn(),
        transform: vi.fn(),
        drawImage: vi.fn(),
        save: vi.fn(),
        fillText: vi.fn(),
        strokeText: vi.fn(),
        restore: vi.fn(),
        beginPath: vi.fn(),
        moveTo: vi.fn(),
        lineTo: vi.fn(),
        closePath: vi.fn(),
        stroke: vi.fn(),
        translate: vi.fn(),
        scale: vi.fn(),
        rotate: vi.fn(),
        arc: vi.fn(),
        arcTo: vi.fn(),
        ellipse: vi.fn(),
        fill: vi.fn(),
        measureText: vi.fn(() => ({ width: 100, actualBoundingBoxAscent: 10, actualBoundingBoxDescent: 2 })),
        rect: vi.fn(),
        clip: vi.fn(),
        createPattern: vi.fn(() => ({})),
        createLinearGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
        createRadialGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
        isPointInPath: vi.fn(() => false),
        isPointInStroke: vi.fn(() => false),
        setLineDash: vi.fn(),
        getLineDash: vi.fn(() => []),
      };
    }
    return null;
  }) as any;

  HTMLCanvasElement.prototype.toDataURL = vi.fn(
    () => 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
  );
}
